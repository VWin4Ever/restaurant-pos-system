const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Get all products with advanced filtering and sorting
router.get('/', async (req, res) => {
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
router.get('/:id', async (req, res) => {
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
router.post('/', [
  body('name').notEmpty().withMessage('Product name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('categoryId').isInt().withMessage('Category ID is required'),
  body('isDrink').isBoolean().withMessage('isDrink must be a boolean'),
  body('description').optional().isString(),
  body('imageUrl').optional().isURL().withMessage('Image URL must be a valid URL')
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

    const { name, price, categoryId, isDrink, description, imageUrl } = req.body;

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        name,
        price,
        categoryId,
        isDrink,
        description,
        imageUrl
      }
    });

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
router.patch('/:id', [
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
router.put('/:id', [
  body('name').notEmpty().withMessage('Product name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('categoryId').isInt().withMessage('Category ID is required'),
  body('description').optional().isString(),
  body('imageUrl').optional().isURL().withMessage('Image URL must be a valid URL')
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

    const { name, price, categoryId, description, imageUrl } = req.body;
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

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
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
        categoryId,
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

// Delete product (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const productId = parseInt(req.params.id);

    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    await prisma.product.update({
      where: { id: productId },
      data: { isActive: false }
    });

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
router.get('/export/csv', async (req, res) => {
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
router.post('/import/csv', async (req, res) => {
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