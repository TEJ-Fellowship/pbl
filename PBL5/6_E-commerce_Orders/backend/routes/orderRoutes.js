const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const sessionIdMiddleware = require('../middleware/sessionId');
const { dbRouter, forceWritePrimary } = require('../middleware/dbRouter');

// All order routes require session ID
router.use(sessionIdMiddleware);

// Write operations use primary, read operations use replicas
router.post('/checkout', forceWritePrimary, orderController.createOrder);
router.get('/my-orders', dbRouter, orderController.getMyOrders);
router.get('/:id', dbRouter, orderController.getOrderById);
router.put('/:id/cancel', forceWritePrimary, orderController.cancelOrder);

module.exports = router;

