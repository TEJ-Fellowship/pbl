const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const sessionIdMiddleware = require('../middleware/sessionId');
const { dbRouter } = require('../middleware/dbRouter');
const { writeLimiter, readLimiter } = require('../middleware/rateLimiter');

// All cart routes require session ID
router.use(sessionIdMiddleware);

// Read operations - lenient rate limiting
router.get('/', readLimiter, dbRouter, cartController.getCartItems);

// Write operations - strict rate limiting
router.post('/add', writeLimiter, dbRouter, cartController.addItemToCart);
router.put('/update', writeLimiter, dbRouter, cartController.updateCartItemQuantity);
router.delete('/remove/:productId', writeLimiter, dbRouter, cartController.removeItemFromCart);
router.delete('/clear', writeLimiter, dbRouter, cartController.clearCartItems);

module.exports = router;

