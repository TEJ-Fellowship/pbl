const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { dbRouter } = require('../middleware/dbRouter');
const { readLimiter } = require('../middleware/rateLimiter');

// All routes use read replicas (GET requests) with lenient rate limiting
router.get('/', readLimiter, dbRouter, productController.getProducts);
router.get('/categories', readLimiter, dbRouter, productController.getCategories);
router.get('/category/:categorySlug', readLimiter, dbRouter, productController.getProductsByCategory);
router.get('/:id', readLimiter, dbRouter, productController.getProductById);

module.exports = router;

