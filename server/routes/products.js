const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { requirePermission } = require('../middleware/permissions');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Products route is working!' });
});

// Get all products with advanced filtering and sorting
router.get('/', requirePermission('products.view'), async (req, res) => {
  try {
    const { 
      categoryId, 
      isDrink, 
      search, 
      page = 1, 
      limit = 20,
      sortBy = 'name',
      sortOrder = 'asc',
      minPrice,
      maxPrice,
      status
    } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    
    // Status filter
    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }
    
    // Category filter
    if (categoryId) where.categoryId = parseInt(categoryId);
    
    // Drink/Food filter
    if (isDrink !== undefined) where.isDrink = isDrink === 'true';
    
    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // Price range filter
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    // Validate sort parameters
    const allowedSortFields = ['name', 'price', 'createdAt', 'categoryId'];
    const allowedSortOrders = ['asc', 'desc'];
    
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'name';
    const validSortOrder = allowedSortOrders.includes(sortOrder.toLowerCase()) ? sortOrder.toLowerCase() : 'asc';

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true
      },
      orderBy: { [validSortBy]: validSortOrder },
      skip,
      take: parseInt(limit)
    });

    const total = await prisma.product.count({ where });

    res.json({
      success: true,
      data: products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get products'
    });
  }
});

// Get product by ID
router.get('/:id', requirePermission('products.view'), async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        category: true
      }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get product'
    });
  }
});

// Create new product
router.post('/', requirePermission('products.create'), upload.single('image'), async (req, res) => {
  try {
    console.log('Received product data:', req.body);
    console.log('Received file:', req.file);

    const { name, price, categoryId, isDrink, description } = req.body;
    let imageUrl = null;

    // Handle uploaded file
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    // Basic validation
    if (!name || !price || !categoryId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, price, and categoryId are required'
      });
    }

    // Check if category exists
    console.log('Looking for category with ID:', parseInt(categoryId));
    const category = await prisma.category.findUnique({
      where: { id: parseInt(categoryId) }
    });
    console.log('Found category:', category);

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Create product
    console.log('Creating product with data:', {
      name,
      price,
      categoryId: parseInt(categoryId),
      isDrink: Boolean(isDrink),
      description,
      imageUrl
    });
    
    const product = await prisma.product.create({
      data: {
        name,
        price,
        categoryId: parseInt(categoryId),
        isDrink: Boolean(isDrink),
        description,
        imageUrl
      }
    });
    
    console.log('Product created successfully:', product);

    // Get product with relations
    const productWithRelations = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        category: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: productWithRelations
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product'
    });
  }
});

// Toggle product active status
router.patch('/:id', requirePermission('products.edit'), [
  body('isActive').isBoolean().withMessage('isActive must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { isActive } = req.body;
    const productId = parseInt(req.params.id);

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data: { isActive },
      include: {
        category: true
      }
    });

    res.json({
      success: true,
      message: `Product ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: product
    });
  } catch (error) {
    console.error('Toggle product status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product status'
    });
  }
});

// Update product
router.put('/:id', requirePermission('products.edit'), upload.single('image'), [
  body('name').notEmpty().withMessage('Product name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('categoryId').notEmpty().withMessage('Category ID is required'),
  body('isDrink').optional(),
  body('description').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { name, price, categoryId, isDrink, description } = req.body;
    const productId = parseInt(req.params.id);
    let imageUrl = null;

    // Handle uploaded file
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: parseInt(categoryId) }
    });

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category not found'
      });
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        name,
        price,
        categoryId: parseInt(categoryId),
        isDrink: Boolean(isDrink),
        description,
        imageUrl
      },
      include: {
        category: true
      }
    });

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product'
    });
  }
});

// Delete product (hard delete)
router.delete('/:id', requirePermission('products.delete'), async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    console.log('Attempting to delete product with ID:', productId);

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        orderItems: true
      }
    });

    if (!product) {
      console.log('Product not found with ID:', productId);
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    console.log('Found product to delete:', product.name);
    console.log('Product has', product.orderItems.length, 'order items');

    // Check if product has orders
    if (product.orderItems.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete product "${product.name}" because it has ${product.orderItems.length} order(s). Please deactivate the product instead.`
      });
    }

    // Perform hard delete
    await prisma.product.delete({
      where: { id: productId }
    });

    console.log('Product deleted successfully:', productId);

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product'
    });
  }
});

// Export products to CSV
router.get('/export/csv', requirePermission('products.export'), async (req, res) => {
  try {
    const { categoryId, isDrink, status } = req.query;
    
    const where = {};
    
    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }
    
    if (categoryId) where.categoryId = parseInt(categoryId);
    if (isDrink !== undefined) where.isDrink = isDrink === 'true';

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true
      },
      orderBy: { name: 'asc' }
    });

    // Create CSV content
    const csvHeader = 'ID,Name,Description,Price,Category,Type,Status,Image URL,Created At\n';
    const csvRows = products.map(product => {
      const imageUrl = product.imageUrl || '';
      return [
        product.id,
        `"${product.name}"`,
        `"${product.description || ''}"`,
        product.price,
        `"${product.category.name}"`,
        product.isDrink ? 'Drink' : 'Food',
        product.isActive ? 'Active' : 'Inactive',
        `"${imageUrl}"`,
        product.createdAt.toISOString().split('T')[0]
      ].join(',');
    }).join('\n');

    const csvContent = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="products.csv"');
    res.send(csvContent);
  } catch (error) {
    console.error('Export products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export products'
    });
  }
});

// Import products from CSV
router.post('/import/csv', requirePermission('products.import'), async (req, res) => {
  try {
    const { products } = req.body;
    
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No products data provided'
      });
    }

    const results = await prisma.$transaction(async (tx) => {
      const imported = [];
      const errors = [];

      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        
        try {
          // Validate required fields
          if (!product.name || !product.price || !product.categoryId) {
            errors.push(`Row ${i + 1}: Missing required fields (name, price, categoryId)`);
            continue;
          }

          // Check if category exists
          const category = await tx.category.findUnique({
            where: { id: parseInt(product.categoryId) }
          });

          if (!category) {
            errors.push(`Row ${i + 1}: Category with ID ${product.categoryId} not found`);
            continue;
          }

          // Create product
          const newProduct = await tx.product.create({
            data: {
              name: product.name,
              description: product.description || '',
              price: parseFloat(product.price),
              categoryId: parseInt(product.categoryId),
              isDrink: product.isDrink === 'true' || product.isDrink === true,
              imageUrl: product.imageUrl || null
            }
          });

          imported.push(newProduct);
        } catch (error) {
          errors.push(`Row ${i + 1}: ${error.message}`);
        }
      }

      return { imported, errors };
    });

    res.json({
      success: true,
      message: `Import completed. ${results.imported.length} products imported successfully.`,
      data: {
        imported: results.imported.length,
        errors: results.errors
      }
    });
  } catch (error) {
    console.error('Import products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to import products'
    });
  }
});

module.exports = router; 