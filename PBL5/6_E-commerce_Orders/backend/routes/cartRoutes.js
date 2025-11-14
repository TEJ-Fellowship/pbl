const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const sessionIdMiddleware = require('../middleware/sessionId');
const { dbRouter } = require('../middleware/dbRouter');

// All cart routes require session ID
router.use(sessionIdMiddleware);

router.get('/', dbRouter, cartController.getCartItems);
router.post('/add', dbRouter, cartController.addItemToCart);
router.put('/update', dbRouter, cartController.updateCartItemQuantity);
router.delete('/remove/:productId', dbRouter, cartController.removeItemFromCart);
router.delete('/clear', dbRouter, cartController.clearCartItems);

module.exports = router;

