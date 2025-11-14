const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { dbRouter } = require('../middleware/dbRouter');

// All routes use read replicas (GET requests)
router.get('/', dbRouter, productController.getProducts);
router.get('/categories', dbRouter, productController.getCategories);
router.get('/category/:categorySlug', dbRouter, productController.getProductsByCategory);
router.get('/:id', dbRouter, productController.getProductById);

module.exports = router;

