const { Order, OrderItem, Product, Inventory, Payment } = require("../models");
const {
  getCart,
  clearCart,
  reserveInventory,
  releaseInventory,
  syncInventoryToCache,
  getCachedInventory,
  redisClient,
} = require("../utils/redis");
const { getPrimary } = require("../utils/db");
const { v4: uuidv4 } = require("uuid");
const { Sequelize } = require("sequelize");
const { publishPaymentRequest } = require("../utils/kafka");

/**
 * Create order from cart (checkout)
 */
const createOrder = async (req, res) => {
  const transaction = await getPrimary().transaction();
  let transactionCommitted = false;

  try {
    const { sessionId } = req;
    const { shippingAddress, paymentMethod = "simulated" } = req.body;

    if (!shippingAddress) {
      return res.status(400).json({
        success: false,
        message: "Shipping address is required",
      });
    }

    // Get cart
    const cart = await getCart(sessionId);
    if (!cart || Object.keys(cart).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    const productIds = Object.keys(cart);

    // Get products and verify availability
    const products = await Product.findAll({
      where: { id: productIds },
      include: [
        {
          model: Inventory,
          as: "inventory",
          attributes: ["id", "quantity", "reserved_quantity"],
        },
      ],
      transaction,
    });

    // Verify stock and calculate total
    let totalAmount = 0;
    const orderItemsData = [];

    for (const product of products) {
      const cartItem = cart[product.id];
      if (!cartItem) continue;

      const available =
        (product.inventory?.quantity || 0) -
        (product.inventory?.reserved_quantity || 0);
      if (available < cartItem.quantity) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.title}. Available: ${available}, Requested: ${cartItem.quantity}`,
        });
      }

      const subtotal = cartItem.quantity * cartItem.price;
      totalAmount += subtotal;

      orderItemsData.push({
        product_id: product.id,
        quantity: cartItem.quantity,
        price_at_purchase: cartItem.price,
        subtotal,
      });
    }

    // Sync inventory to Redis cache before reservation (if not already cached)
    // This ensures inventory is available in Redis for atomic reservation
    for (const product of products) {
      const cartItem = cart[product.id];
      if (!cartItem) continue;

      // Check if inventory is already cached in Redis
      const cachedInventory = await getCachedInventory(product.id);

      // Calculate available quantity from database
      const available =
        (product.inventory?.quantity || 0) -
        (product.inventory?.reserved_quantity || 0);

      // Always sync to ensure we have the latest value from database
      // This is safe because the Lua script will handle concurrent reservations atomically
      const syncSuccess = await syncInventoryToCache(product.id, available);

      if (!syncSuccess) {
        console.error(
          `Failed to sync inventory to cache for product ${product.id}`
        );
        await transaction.rollback();
        return res.status(500).json({
          success: false,
          message: `Failed to sync inventory cache for ${product.title}. Please try again.`,
        });
      }

      console.log(
        `Synced inventory for product ${product.id}: ${available} available`
      );
    }

    // Reserve inventory in Redis (atomic operation)
    const orderId = uuidv4();
    for (const product of products) {
      const cartItem = cart[product.id];
      if (!cartItem) continue;

      // Ensure quantity is a number
      const quantityToReserve = parseInt(cartItem.quantity, 10);
      if (isNaN(quantityToReserve) || quantityToReserve <= 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Invalid quantity for ${product.title}: ${cartItem.quantity}`,
        });
      }

      console.log(
        `Attempting to reserve ${quantityToReserve} units of product ${product.id} for order ${orderId}`
      );

      const reserveResult = await reserveInventory(
        product.id,
        quantityToReserve,
        orderId
      );

      console.log(
        `Reservation result for product ${product.id}:`,
        JSON.stringify(reserveResult)
      );

      if (!reserveResult.success) {
        // Release any already reserved inventory
        for (const p of products) {
          if (p.id !== product.id) {
            await releaseInventory(p.id, cart[p.id]?.quantity || 0, orderId);
          }
        }
        await transaction.rollback();

        // Provide more detailed error messages
        let errorMessage = "Failed to reserve inventory";
        if (reserveResult.error === "INSUFFICIENT_STOCK") {
          errorMessage = `Insufficient stock for ${product.title}. Available: ${reserveResult.available}, Requested: ${quantityToReserve}`;
        } else if (reserveResult.error === "INVENTORY_NOT_CACHED") {
          errorMessage = `Inventory cache error for ${product.title}. Please try again.`;
        } else if (reserveResult.error === "UNKNOWN_RESULT_FORMAT") {
          errorMessage = `Inventory reservation error for ${product.title}. Unexpected result format. Please try again.`;
          console.error("Unexpected reservation result:", reserveResult.result);
        } else {
          errorMessage = `Failed to reserve inventory for ${product.title}: ${
            reserveResult.error || "Unknown error"
          }`;
        }

        return res.status(400).json({
          success: false,
          message: errorMessage,
        });
      }

      console.log(
        `Successfully reserved ${quantityToReserve} units of product ${product.id}`
      );
    }

    // Create order in database
    const order = await Order.create(
      {
        id: orderId,
        session_id: sessionId,
        total_amount: totalAmount,
        status: "pending",
        shipping_address: shippingAddress,
        payment_status: "pending",
        payment_method: paymentMethod,
      },
      { transaction }
    );

    // Create order items
    const orderItems = await OrderItem.bulkCreate(
      orderItemsData.map((item) => ({
        order_id: orderId,
        product_id: item.product_id,
        quantity: item.quantity,
        price_at_purchase: item.price_at_purchase,
      })),
      { transaction }
    );

    // Update inventory in database (decrement reserved_quantity will be handled by sync)
    for (const product of products) {
      const cartItem = cart[product.id];
      if (!cartItem) continue;

      await Inventory.update(
        {
          reserved_quantity: Sequelize.literal(
            `reserved_quantity + ${cartItem.quantity}`
          ),
          quantity: Sequelize.literal(`quantity - ${cartItem.quantity}`),
        },
        {
          where: { product_id: product.id },
          transaction,
        }
      );
    }

    // Create payment record with pending status
    const correlationId = uuidv4();
    await Payment.create(
      {
        order_id: orderId,
        amount: totalAmount,
        payment_method: paymentMethod,
        status: "pending",
        transaction_id: null,
      },
      { transaction }
    );

    // Commit transaction before publishing to Kafka
    await transaction.commit();
    transactionCommitted = true;

    // Store payment status in Redis for quick access
    // ioredis uses hmset for multiple fields (or hset with object in newer versions)
    await redisClient.hmset(
      `payment:${correlationId}`,
      "status",
      "pending",
      "orderId",
      orderId,
      "amount",
      totalAmount.toString(),
      "paymentMethod",
      paymentMethod,
      "createdAt",
      new Date().toISOString()
    );

    // Set TTL for payment status (24 hours)
    await redisClient.expire(`payment:${correlationId}`, 86400);

    // Publish payment request to Kafka (async, non-blocking)
    // Use fire-and-forget pattern with retry mechanism for 1K users
    publishPaymentRequest({
      correlationId,
      orderId,
      userId: sessionId, // Using sessionId as userId for guest orders
      sessionId,
      amount: totalAmount,
      paymentMethod,
      shippingAddress,
    }).catch(async (kafkaError) => {
      // If Kafka publish fails, handle asynchronously without blocking response
      console.error("❌ Failed to publish payment to Kafka:", kafkaError);

      // Update payment status to failed in background
      try {
        await Payment.update(
          {
            status: "failed",
            failure_reason: "Failed to queue payment for processing",
          },
          {
            where: { order_id: orderId },
          }
        );

        // Release inventory in background
        for (const product of products) {
          const cartItem = cart[product.id];
          if (cartItem) {
            await releaseInventory(product.id, cartItem.quantity, orderId);
            await Inventory.update(
              {
                reserved_quantity: Sequelize.literal(
                  `reserved_quantity - ${cartItem.quantity}`
                ),
                quantity: Sequelize.literal(`quantity + ${cartItem.quantity}`),
              },
              {
                where: { product_id: product.id },
              }
            );
          }
        }

        // Update order status
        await order.update({
          status: "cancelled",
          payment_status: "failed",
          cancelled_at: new Date(),
        });
      } catch (updateError) {
        console.error(
          "❌ Error updating order after Kafka failure:",
          updateError
        );
      }
    });

    // Return 202 Accepted immediately - payment is being processed asynchronously
    // This ensures fast response for 1K users
    res.status(202).json({
      success: true,
      message: "Order created, payment processing",
      order: {
        id: order.id,
        total_amount: order.total_amount,
        status: order.status,
        payment_status: "pending",
        items: orderItems.length,
      },
      payment: {
        correlationId,
        status: "pending",
      },
    });
  } catch (error) {
    // Only rollback if transaction hasn't been committed yet
    if (!transactionCommitted) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error("Error rolling back transaction:", rollbackError);
      }
    }
    console.error("Create order error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create order",
      error: error.message,
    });
  }
};

/**
 * Get payment status by correlation ID
 */
const getPaymentStatus = async (req, res) => {
  try {
    const { correlationId } = req.params;
    const { sessionId } = req;

    // Get payment status from Redis
    const paymentStatus = await redisClient.hgetall(`payment:${correlationId}`);

    if (!paymentStatus || Object.keys(paymentStatus).length === 0) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // Verify order belongs to session (optional security check)
    if (paymentStatus.orderId) {
      const order = await Order.findByPk(paymentStatus.orderId, {
        attributes: ["id", "session_id"],
      });

      if (order && order.session_id !== sessionId) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }
    }

    res.json({
      success: true,
      payment: {
        correlationId,
        ...paymentStatus,
      },
    });
  } catch (error) {
    console.error("Get payment status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment status",
      error: error.message,
    });
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
          as: "items",
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["id", "title", "image_url", "thumbnail_url"],
            },
          ],
        },
        {
          model: Payment,
          as: "payment",
          attributes: [
            "id",
            "amount",
            "status",
            "transaction_id",
            "processed_at",
          ],
        },
      ],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Verify session matches (for guest orders)
    if (order.session_id !== sessionId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Get order error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order",
      error: error.message,
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
          as: "items",
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["id", "title", "thumbnail_url"],
            },
          ],
        },
      ],
      limit: limitNum,
      offset,
      order: [["created_at", "DESC"]],
      distinct: true,
    });

    res.json({
      success: true,
      orders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count,
        pages: Math.ceil(count / limitNum),
      },
    });
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message,
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
          as: "items",
          include: [
            {
              model: Product,
              as: "product",
            },
          ],
        },
      ],
      transaction,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Verify session
    if (order.session_id !== sessionId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Check if order can be cancelled
    if (["shipped", "delivered"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel order that has been shipped",
      });
    }

    if (order.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Order is already cancelled",
      });
    }

    // Release inventory
    for (const item of order.items) {
      await releaseInventory(item.product_id, item.quantity, order.id);

      // Update database inventory
      await Inventory.update(
        {
          reserved_quantity: Sequelize.literal(
            `reserved_quantity - ${item.quantity}`
          ),
          quantity: Sequelize.literal(`quantity + ${item.quantity}`),
        },
        {
          where: { product_id: item.product_id },
          transaction,
        }
      );
    }

    // Update order status
    await order.update(
      {
        status: "cancelled",
        cancelled_at: new Date(),
      },
      { transaction }
    );

    // Update payment status if exists
    if (order.payment_status === "succeeded") {
      await Payment.update(
        { status: "refunded" },
        { where: { order_id: order.id }, transaction }
      );
    }

    await transaction.commit();

    res.json({
      success: true,
      message: "Order cancelled successfully",
      order: {
        id: order.id,
        status: order.status,
      },
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Cancel order error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel order",
      error: error.message,
    });
  }
};

module.exports = {
  createOrder,
  getOrderById,
  getMyOrders,
  cancelOrder,
  getPaymentStatus,
};
