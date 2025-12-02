const express = require('express');
const router = express.Router();
const productRoutes = require('./productRoutes');
const cartRoutes = require('./cartRoutes');
const orderRoutes = require('./orderRoutes');
const healthRoutes = require('./healthRoutes');

// Health check routes (no rate limiting - needed for load balancer health checks)
router.use('/health', healthRoutes);

// API routes (rate limiting applied per route)
router.use('/products', productRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);

module.exports = router;

