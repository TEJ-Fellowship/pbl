const { getModelsFromRequest } = require('../utils/modelFactory');
const { getCache, setCache, deleteCachePattern } = require('../utils/redis');
const { Op } = require('sequelize');
const { NODE_ENV } = require('../utils/config');
const { retryQuery } = require('../utils/queryRetry');

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

    // Get models bound to req.db (from dbRouter middleware - uses read replica for GET)
    const { Product, Category, Inventory } = getModelsFromRequest(req);

    // Get products (read operation) - now uses read replica via req.db
    const { count, rows: products } = await retryQuery(async () => {
      return await Product.findAndCountAll({
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
        distinct: true,
        transaction: null,
        subQuery: false,
      });
    });

    // Convert Sequelize instances to plain objects for caching
    const productsData = products.map(p => p.toJSON ? p.toJSON() : p);
    
    const result = {
      success: true,
      products: productsData,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count,
        pages: Math.ceil(count / limitNum)
      }
    };

    // Cache for 30 minutes
    const cacheSuccess = await setCache(cacheKey, result, 1800);
    if (NODE_ENV === 'development' && cacheSuccess) {
      console.log(`✅ Cached products list: ${products.length} products`);
    }

    res.json({
      success: true,
      products,
      pagination: result.pagination,
      fromCache: false
    });
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

    // Get models bound to req.db (from dbRouter middleware - uses read replica for GET)
    const { Product, Category, Inventory } = getModelsFromRequest(req);

    // Get product (read operation) - now uses read replica via req.db
    const product = await retryQuery(async () => {
      return await Product.findByPk(id, {
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
        ],
        transaction: null,
      });
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Cache for 1 hour
    const cacheSuccess = await setCache(cacheKey, product.toJSON(), 3600);
    if (NODE_ENV === 'development' && cacheSuccess) {
      console.log(`✅ Cached product: ${product.id} - ${product.title}`);
    }

    res.json({
      success: true,
      product,
      fromCache: false
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

    // Get models bound to req.db (from dbRouter middleware - uses read replica for GET)
    const { Product, Category, Inventory } = getModelsFromRequest(req);

    // Find category first
    const category = await retryQuery(async () => {
      return await Category.findOne({
        where: { slug: categorySlug },
        transaction: null,
      });
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Get products - now uses read replica via req.db
    const { count, rows: products } = await retryQuery(async () => {
      return await Product.findAndCountAll({
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
        distinct: true,
        transaction: null,
        subQuery: false,
      });
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

    // Get models bound to req.db (from dbRouter middleware - uses read replica for GET)
    const { Category } = getModelsFromRequest(req);

    // Get categories - now uses read replica via req.db
    const categories = await retryQuery(async () => {
      return await Category.findAll({
        order: [['name', 'ASC']],
        transaction: null,
      });
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

