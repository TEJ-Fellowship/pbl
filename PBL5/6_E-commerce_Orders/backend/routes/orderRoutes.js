const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const sessionIdMiddleware = require('../middleware/sessionId');
const { dbRouter, forceWritePrimary } = require('../middleware/dbRouter');
const { writeLimiter, readLimiter, pollingLimiter } = require('../middleware/rateLimiter');

// All order routes require session ID
router.use(sessionIdMiddleware);

// Write operations use primary, read operations use replicas
router.post('/checkout', writeLimiter, forceWritePrimary, orderController.createOrder);
router.get('/my-orders', readLimiter, dbRouter, orderController.getMyOrders);
router.get('/:id', readLimiter, dbRouter, orderController.getOrderById);
router.put('/:id/cancel', writeLimiter, forceWritePrimary, orderController.cancelOrder);
// Payment status polling - very strict rate limiting
router.get('/payment-status/:correlationId', pollingLimiter, dbRouter, orderController.getPaymentStatus);

module.exports = router;

