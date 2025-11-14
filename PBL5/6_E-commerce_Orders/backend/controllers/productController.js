const { Product, Category, Inventory } = require('../models');
const { getCache, setCache, deleteCachePattern } = require('../utils/redis');
const { Op } = require('sequelize');

/**
 * Get all products with pagination and filters
 */
const getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      minPrice,
      maxPrice,
      search,
      sortBy = 'created_at',
      order = 'DESC'
    } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    // Build cache key
    const cacheKey = `products:page:${pageNum}:limit:${limitNum}:category:${category || 'all'}:minPrice:${minPrice || 'all'}:maxPrice:${maxPrice || 'all'}:search:${search || 'none'}:sort:${sortBy}:order:${order}`;

    // Try cache first
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        fromCache: true,
        ...cached
      });
    }

    // Build where clause
    const where = {};
    if (category) {
      where.category_id = category;
    }
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = parseFloat(minPrice);
      if (maxPrice) where.price[Op.lte] = parseFloat(maxPrice);
    }
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Get products from replica (read operation)
    const { count, rows: products } = await Product.findAndCountAll({
      where,
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        },
        {
          model: Inventory,
          as: 'inventory',
          attributes: ['quantity', 'reserved_quantity']
        }
      ],
      limit: limitNum,
      offset,
      order: [[sortBy, order.toUpperCase()]],
      distinct: true
    });

    const result = {
      success: true,
      products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count,
        pages: Math.ceil(count / limitNum)
      }
    };

    // Cache for 30 minutes
    await setCache(cacheKey, result, 1800);

    res.json(result);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    });
  }
};

/**
 * Get single product by ID
 */
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    // Try cache first
    const cacheKey = `product:${id}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        fromCache: true,
        product: cached
      });
    }

    // Get from replica (read operation)
    const product = await Product.findByPk(id, {
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        },
        {
          model: Inventory,
          as: 'inventory',
          attributes: ['quantity', 'reserved_quantity', 'low_stock_threshold']
        }
      ]
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Cache for 1 hour
    await setCache(cacheKey, product.toJSON(), 3600);

    res.json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: error.message
    });
  }
};

/**
 * Get products by category
 */
const getProductsByCategory = async (req, res) => {
  try {
    const { categorySlug } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    // Find category first
    const category = await Category.findOne({
      where: { slug: categorySlug }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Get products
    const { count, rows: products } = await Product.findAndCountAll({
      where: { category_id: category.id },
      include: [
        {
          model: Inventory,
          as: 'inventory',
          attributes: ['quantity', 'reserved_quantity']
        }
      ],
      limit: limitNum,
      offset,
      order: [['created_at', 'DESC']],
      distinct: true
    });

    res.json({
      success: true,
      category,
      products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count,
        pages: Math.ceil(count / limitNum)
      }
    });
  } catch (error) {
    console.error('Get products by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    });
  }
};

/**
 * Get all categories
 */
const getCategories = async (req, res) => {
  try {
    // Try cache first
    const cacheKey = 'categories:all';
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        fromCache: true,
        categories: cached
      });
    }

    const categories = await Category.findAll({
      order: [['name', 'ASC']]
    });

    // Cache for 1 hour
    await setCache(cacheKey, categories.map(c => c.toJSON()), 3600);

    res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
};

module.exports = {
  getProducts,
  getProductById,
  getProductsByCategory,
  getCategories
};

