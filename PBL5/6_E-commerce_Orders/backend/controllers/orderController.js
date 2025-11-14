const { Order, OrderItem, Product, Inventory, Payment } = require('../models');
const { getCart, clearCart } = require('../utils/redis');
const { reserveInventory, releaseInventory } = require('../utils/redis');
const { getPrimary } = require('../utils/db');
const { v4: uuidv4 } = require('uuid');
const { Sequelize } = require('sequelize');

/**
 * Create order from cart (checkout)
 */
const createOrder = async (req, res) => {
  const transaction = await getPrimary().transaction();
  
  try {
    const { sessionId } = req;
    const { shippingAddress, paymentMethod = 'simulated' } = req.body;

    if (!shippingAddress) {
      return res.status(400).json({
        success: false,
        message: 'Shipping address is required'
      });
    }

    // Get cart
    const cart = await getCart(sessionId);
    if (!cart || Object.keys(cart).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    const productIds = Object.keys(cart);
    
    // Get products and verify availability
    const products = await Product.findAll({
      where: { id: productIds },
      include: [
        {
          model: Inventory,
          as: 'inventory',
          attributes: ['id', 'quantity', 'reserved_quantity']
        }
      ],
      transaction
    });

    // Verify stock and calculate total
    let totalAmount = 0;
    const orderItemsData = [];

    for (const product of products) {
      const cartItem = cart[product.id];
      if (!cartItem) continue;

      const available = (product.inventory?.quantity || 0) - (product.inventory?.reserved_quantity || 0);
      if (available < cartItem.quantity) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.title}. Available: ${available}, Requested: ${cartItem.quantity}`
        });
      }

      const subtotal = cartItem.quantity * cartItem.price;
      totalAmount += subtotal;

      orderItemsData.push({
        product_id: product.id,
        quantity: cartItem.quantity,
        price_at_purchase: cartItem.price,
        subtotal
      });
    }

    // Reserve inventory in Redis (atomic operation)
    const orderId = uuidv4();
    for (const product of products) {
      const cartItem = cart[product.id];
      if (!cartItem) continue;

      const reserveResult = await reserveInventory(
        product.id,
        cartItem.quantity,
        orderId
      );

      if (!reserveResult.success) {
        // Release any already reserved inventory
        for (const p of products) {
          if (p.id !== product.id) {
            await releaseInventory(p.id, cart[p.id]?.quantity || 0, orderId);
          }
        }
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: reserveResult.error === 'INSUFFICIENT_STOCK' 
            ? `Insufficient stock for ${product.title}. Available: ${reserveResult.available}`
            : 'Failed to reserve inventory'
        });
      }
    }

    // Create order in database
    const order = await Order.create({
      id: orderId,
      session_id: sessionId,
      total_amount: totalAmount,
      status: 'pending',
      shipping_address: shippingAddress,
      payment_status: 'pending',
      payment_method: paymentMethod
    }, { transaction });

    // Create order items
    const orderItems = await OrderItem.bulkCreate(
      orderItemsData.map(item => ({
        order_id: orderId,
        product_id: item.product_id,
        quantity: item.quantity,
        price_at_purchase: item.price_at_purchase
      })),
      { transaction }
    );

    // Update inventory in database (decrement reserved_quantity will be handled by sync)
    for (const product of products) {
      const cartItem = cart[product.id];
      if (!cartItem) continue;

      await Inventory.update(
        {
          reserved_quantity: Sequelize.literal(`reserved_quantity + ${cartItem.quantity}`),
          quantity: Sequelize.literal(`quantity - ${cartItem.quantity}`)
        },
        {
          where: { product_id: product.id },
          transaction
        }
      );
    }

    // Process payment (simulated)
    const paymentResult = await processPayment(orderId, totalAmount, paymentMethod);

    if (paymentResult.success) {
      // Update order status
      await order.update({
        status: 'confirmed',
        payment_status: 'succeeded',
        payment_id: paymentResult.transactionId,
        confirmed_at: new Date()
      }, { transaction });

      // Clear cart
      await clearCart(sessionId);
    } else {
      // Payment failed - release inventory
      for (const product of products) {
        const cartItem = cart[product.id];
        if (cartItem) {
          await releaseInventory(product.id, cartItem.quantity, orderId);
          // Rollback inventory in database
          await Inventory.update(
            {
              reserved_quantity: Sequelize.literal(`reserved_quantity - ${cartItem.quantity}`),
              quantity: Sequelize.literal(`quantity + ${cartItem.quantity}`)
            },
            {
              where: { product_id: product.id },
              transaction
            }
          );
        }
      }

      await order.update({
        status: 'cancelled',
        payment_status: 'failed',
        cancelled_at: new Date()
      }, { transaction });

      await transaction.commit();

      return res.status(400).json({
        success: false,
        message: 'Payment failed',
        orderId: order.id
      });
    }

    // Create payment record
    await Payment.create({
      order_id: orderId,
      amount: totalAmount,
      payment_method: paymentMethod,
      status: 'succeeded',
      transaction_id: paymentResult.transactionId,
      processed_at: new Date()
    }, { transaction });

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: {
        id: order.id,
        total_amount: order.total_amount,
        status: order.status,
        payment_status: order.payment_status,
        items: orderItems.length
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
};

/**
 * Simulated payment processing
 */
const processPayment = async (orderId, amount, paymentMethod) => {
  // Simulate payment processing
  // In production, this would call Stripe, PayPal, etc.
  
  // Simulate 95% success rate
  const success = Math.random() > 0.05;
  
  if (success) {
    return {
      success: true,
      transactionId: `txn_${uuidv4()}`,
      amount
    };
  } else {
    return {
      success: false,
      error: 'Payment declined'
    };
  }
};

/**
 * Get order by ID
 */
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const { sessionId } = req;

    const order = await Order.findByPk(id, {
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'title', 'image_url', 'thumbnail_url']
            }
          ]
        },
        {
          model: Payment,
          as: 'payment',
          attributes: ['id', 'amount', 'status', 'transaction_id', 'processed_at']
        }
      ]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Verify session matches (for guest orders)
    if (order.session_id !== sessionId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: error.message
    });
  }
};

/**
 * Get user's orders (by session)
 */
const getMyOrders = async (req, res) => {
  try {
    const { sessionId } = req;
    const { page = 1, limit = 20, status } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    const where = { session_id: sessionId };
    if (status) {
      where.status = status;
    }

    const { count, rows: orders } = await Order.findAndCountAll({
      where,
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'title', 'thumbnail_url']
            }
          ]
        }
      ],
      limit: limitNum,
      offset,
      order: [['created_at', 'DESC']],
      distinct: true
    });

    res.json({
      success: true,
      orders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count,
        pages: Math.ceil(count / limitNum)
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
};

/**
 * Cancel order (if not shipped)
 */
const cancelOrder = async (req, res) => {
  const transaction = await getPrimary().transaction();
  
  try {
    const { id } = req.params;
    const { sessionId } = req;

    const order = await Order.findByPk(id, {
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product'
            }
          ]
        }
      ],
      transaction
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Verify session
    if (order.session_id !== sessionId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if order can be cancelled
    if (['shipped', 'delivered'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel order that has been shipped'
      });
    }

    if (order.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Order is already cancelled'
      });
    }

    // Release inventory
    for (const item of order.items) {
      await releaseInventory(item.product_id, item.quantity, order.id);
      
      // Update database inventory
      await Inventory.update(
        {
          reserved_quantity: Sequelize.literal(`reserved_quantity - ${item.quantity}`),
          quantity: Sequelize.literal(`quantity + ${item.quantity}`)
        },
        {
          where: { product_id: item.product_id },
          transaction
        }
      );
    }

    // Update order status
    await order.update({
      status: 'cancelled',
      cancelled_at: new Date()
    }, { transaction });

    // Update payment status if exists
    if (order.payment_status === 'succeeded') {
      await Payment.update(
        { status: 'refunded' },
        { where: { order_id: order.id }, transaction }
      );
    }

    await transaction.commit();

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      order: {
        id: order.id,
        status: order.status
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order',
      error: error.message
    });
  }
};

module.exports = {
  createOrder,
  getOrderById,
  getMyOrders,
  cancelOrder
};

