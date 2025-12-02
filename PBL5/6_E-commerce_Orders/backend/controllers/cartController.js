const { getCart, addToCart, updateCartItem, removeFromCart, clearCart, getCachedInventory, syncInventoryToCache } = require('../utils/redis');
const { getModelsFromRequest } = require('../utils/modelFactory');
const { getPrimary } = require('../utils/db');
const { retryQuery } = require('../utils/queryRetry');

/**
 * Get user's cart
 */
const getCartItems = async (req, res) => {
  try {
    const { sessionId } = req;
    const cart = await getCart(sessionId);

    if (!cart || Object.keys(cart).length === 0) {
      return res.json({
        success: true,
        cart: {},
        items: [],
        total: 0,
        itemCount: 0
      });
    }

    // Get models bound to req.db (for GET requests, uses read replica)
    const { Product, Inventory } = getModelsFromRequest(req);

    // Get product details for items in cart - uses read replica
    const productIds = Object.keys(cart);
    const products = await retryQuery(async () => {
      return await Product.findAll({
        where: { id: productIds },
        include: [
          {
            model: Inventory,
            as: 'inventory',
            attributes: ['quantity', 'reserved_quantity']
          }
        ]
      });
    }, { dbType: req.dbType || 'replica1' }); // Pass dbType for circuit breaker

    const items = [];
    let total = 0;
    let itemCount = 0;

    for (const product of products) {
      const cartItem = cart[product.id];
      if (cartItem) {
        const subtotal = cartItem.quantity * cartItem.price;
        items.push({
          productId: product.id,
          product: {
            id: product.id,
            title: product.title,
            price: product.price,
            image: product.thumbnail_url || product.image_url,
            stock: (product.inventory?.quantity || 0) - (product.inventory?.reserved_quantity || 0)
          },
          quantity: cartItem.quantity,
          price: cartItem.price,
          subtotal
        });
        total += subtotal;
        itemCount += cartItem.quantity;
      }
    }

    res.json({
      success: true,
      cart,
      items,
      total: parseFloat(total.toFixed(2)),
      itemCount
    });
  } catch (error) {
    console.error('Get cart error:', error);
    // Return empty cart on error rather than failing completely
    const statusCode = error.name?.includes('Timeout') || error.message?.includes('timeout') ? 504 : 500;
    if (statusCode === 504) {
      // For timeout errors, return empty cart to allow user to continue
      return res.json({
        success: true,
        cart: {},
        items: [],
        total: 0,
        itemCount: 0,
        warning: 'Cart data temporarily unavailable'
      });
    }
    res.status(statusCode).json({
      success: false,
      message: 'Failed to fetch cart',
      error: error.message
    });
  }
};

/**
 * Add item to cart
 */
const addItemToCart = async (req, res) => {
  try {
    const { sessionId } = req;
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    const qty = parseInt(quantity, 10);
    if (qty < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1'
      });
    }

    // Get models bound to req.db (for POST requests, uses primary, but we can read from replica)
    // For product lookup, we'll use read replica via getReadReplica
    const { getReadReplica } = require('../utils/db');
    const { getModels } = require('../utils/modelFactory');
    const readModels = getModels(getReadReplica());

    // Parallelize: Get product and check cached inventory simultaneously
    const [product, cachedInventory] = await Promise.all([
      retryQuery(async () => {
        return await readModels.Product.findByPk(productId, {
          include: [
            {
              model: readModels.Inventory,
              as: 'inventory',
              attributes: ['quantity', 'reserved_quantity']
            }
          ]
        });
      }, { dbType: 'replica1' }), // Pass dbType for circuit breaker
      getCachedInventory(productId) // Try Redis cache first
    ]);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check availability - use cached inventory if available, otherwise use DB
    let available;
    if (cachedInventory !== null) {
      // Use cached inventory (faster)
      available = cachedInventory;
    } else {
      // Fallback to DB inventory
      available = (product.inventory?.quantity || 0) - (product.inventory?.reserved_quantity || 0);
      // Cache it for next time
      if (product.inventory) {
        syncInventoryToCache(productId, available).catch(() => {
          // Ignore cache sync errors
        });
      }
    }

    if (available < qty) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Available: ${available}`
      });
    }

    // Add to cart (now has fallback, so should always succeed)
    const success = await addToCart(sessionId, productId, qty, {
      title: product.title,
      price: product.price,
      thumbnail_url: product.thumbnail_url,
      image_url: product.image_url
    });

    // With fallback mechanism, this should rarely fail
    if (!success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to add item to cart. Please try again.',
        error: 'CART_ERROR'
      });
    }

    res.json({
      success: true,
      message: 'Item added to cart',
      productId,
      quantity: qty
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    const statusCode = error.name?.includes('Timeout') || error.message?.includes('timeout') ? 504 : 500;
    res.status(statusCode).json({
      success: false,
      message: 'Failed to add item to cart',
      error: error.message,
      ...(statusCode === 504 && { retry: true })
    });
  }
};

/**
 * Update cart item quantity
 */
const updateCartItemQuantity = async (req, res) => {
  try {
    const { sessionId } = req;
    const { productId, quantity } = req.body;

    if (!productId || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Product ID and quantity are required'
      });
    }

    const qty = parseInt(quantity, 10);
    if (qty < 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity cannot be negative'
      });
    }

    if (qty === 0) {
      // Remove item
      await removeFromCart(sessionId, productId);
      return res.json({
        success: true,
        message: 'Item removed from cart',
        productId
      });
    }

    // Get models bound to read replica for product lookup
    const { getReadReplica } = require('../utils/db');
    const { getModels } = require('../utils/modelFactory');
    const readModels = getModels(getReadReplica());

    // Parallelize: Get product and check cached inventory
    const [product, cachedInventory] = await Promise.all([
      retryQuery(async () => {
        return await readModels.Product.findByPk(productId, {
          include: [
            {
              model: readModels.Inventory,
              as: 'inventory',
              attributes: ['quantity', 'reserved_quantity']
            }
          ]
        });
      }, { dbType: 'replica1' }), // Pass dbType for circuit breaker
      getCachedInventory(productId)
    ]);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check availability - use cached inventory if available
    let available;
    if (cachedInventory !== null) {
      available = cachedInventory;
    } else {
      available = (product.inventory?.quantity || 0) - (product.inventory?.reserved_quantity || 0);
      // Cache it for next time
      if (product.inventory) {
        syncInventoryToCache(productId, available).catch(() => {
          // Ignore cache sync errors
        });
      }
    }

    if (available < qty) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Available: ${available}`
      });
    }

    // Update cart
    await updateCartItem(sessionId, productId, qty);

    res.json({
      success: true,
      message: 'Cart item updated',
      productId,
      quantity: qty
    });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update cart item',
      error: error.message
    });
  }
};

/**
 * Remove item from cart
 */
const removeItemFromCart = async (req, res) => {
  try {
    const { sessionId } = req;
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    await removeFromCart(sessionId, productId);

    res.json({
      success: true,
      message: 'Item removed from cart',
      productId
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove item from cart',
      error: error.message
    });
  }
};

/**
 * Clear entire cart
 */
const clearCartItems = async (req, res) => {
  try {
    const { sessionId } = req;
    await clearCart(sessionId);

    res.json({
      success: true,
      message: 'Cart cleared'
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cart',
      error: error.message
    });
  }
};

module.exports = {
  getCartItems,
  addItemToCart,
  updateCartItemQuantity,
  removeItemFromCart,
  clearCartItems
};

