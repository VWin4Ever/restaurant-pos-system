const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { requirePermission } = require('../middleware/permissions');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Product ID sequence tracking
const SEQUENCE_FILE = path.join(__dirname, '../data/product_sequence.json');

// Initialize sequence file if it doesn't exist
function initializeSequence() {
  if (!fs.existsSync(SEQUENCE_FILE)) {
    const dir = path.dirname(SEQUENCE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(SEQUENCE_FILE, JSON.stringify({ nextId: 1 }));
  }
}

// Get next sequence number
function getNextSequenceNumber() {
  initializeSequence();
  const data = JSON.parse(fs.readFileSync(SEQUENCE_FILE, 'utf8'));
  const nextId = data.nextId;
  data.nextId = nextId + 1;
  fs.writeFileSync(SEQUENCE_FILE, JSON.stringify(data));
  return nextId;
}

const router = express.Router();
const prisma = new PrismaClient();

// Helper function to generate next product ID
async function generateNextProductId() {
  try {
    // Use sequence tracking for guaranteed unique IDs
    const sequenceNumber = getNextSequenceNumber();
    return `PROD${String(sequenceNumber).padStart(4, '0')}`;
  } catch (error) {
    console.error('Error generating product ID:', error);
    // Fallback to timestamp-based ID
    return `PROD${Date.now().toString().slice(-4)}`;
  }
}

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

// Get all products (no pagination for local filtering)
router.get('/', requirePermission('products.read'), async (req, res) => {
  try {
    // Fetch all products for local filtering with orderItems count
    const products = await prisma.product.findMany({
      include: {
        category: true,
        _count: {
          select: {
            orderItems: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get products'
    });
  }
});

// Get product statistics
router.get('/stats', requirePermission('products.read'), async (req, res) => {
  try {
    const [total, active, inactive, needStock, noStock] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.product.count({ where: { isActive: false } }),
      prisma.product.count({ where: { needStock: true } }),
      prisma.product.count({ where: { needStock: false } })
    ]);

    res.json({
      total,
      active,
      inactive,
      needStock,
      noStock
    });
  } catch (error) {
    console.error('Get product stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get product statistics'
    });
  }
});

// Get product by ID
router.get('/:id', requirePermission('products.read'), async (req, res) => {
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
    const { name, price, costPrice, categoryId, needStock, description } = req.body;
    let imageUrl = null;

    // Handle uploaded file
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    // Basic validation
    if (!name || !price || !costPrice || !categoryId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, price, costPrice, and categoryId are required'
      });
    }

    // Convert string values to appropriate types
    const parsedPrice = parseFloat(price);
    const parsedCostPrice = parseFloat(costPrice);
    const parsedCategoryId = parseInt(categoryId);
    // FIX: Properly parse boolean from FormData string
    const parsedNeedStock = needStock === 'true' || needStock === true;

    if (isNaN(parsedPrice) || isNaN(parsedCostPrice) || isNaN(parsedCategoryId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid numeric values for price, costPrice, or categoryId'
      });
    }

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: parsedCategoryId }
    });

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Generate unique product ID
    const productId = await generateNextProductId();
    
    // Create product with stock record for drinks
    const product = await prisma.$transaction(async (tx) => {
      // Create the product
      const newProduct = await tx.product.create({
        data: {
          productId,
          name,
          price: parsedPrice,
          costPrice: parsedCostPrice,
          categoryId: parsedCategoryId,
          needStock: parsedNeedStock,
          description,
          imageUrl
        }
      });

      // Create stock record for products that need stock tracking
      if (parsedNeedStock) {
        await tx.stock.create({
          data: {
            productId: newProduct.id,
            quantity: 0,
            minStock: 10
          }
        });
      }

      return newProduct;
    });

    // Get product with relations
    const productWithRelations = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        category: true,
        stock: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: productWithRelations
    });
  } catch (error) {
    console.error('Create product error:', error);
    console.error('Error stack:', error.stack);
    
    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      if (error.meta?.target?.includes('name')) {
        return res.status(400).json({
          success: false,
          message: `Product with name "${req.body.name}" already exists. Please choose a different name.`
        });
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: error.message
    });
  }
});

// Toggle product active status
router.patch('/:id', requirePermission('products.update'), [
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
router.put('/:id', requirePermission('products.update'), upload.single('image'), [
  body('name').notEmpty().withMessage('Product name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('categoryId').notEmpty().withMessage('Category ID is required'),
  body('needStock').optional(),
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

    const { name, price, costPrice, categoryId, needStock, description } = req.body;
    const productId = parseInt(req.params.id);
    let imageUrl = null;
    
    // FIX: Properly parse boolean from FormData string
    const parsedNeedStock = needStock === 'true' || needStock === true;

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

    // FIX: Handle stock record creation/deletion when needStock changes
    const product = await prisma.$transaction(async (tx) => {
      // Update the product
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: {
          name,
          price,
          costPrice: parseFloat(costPrice),
          categoryId: parseInt(categoryId),
          needStock: parsedNeedStock,
          description,
          imageUrl
        },
        include: {
          category: true,
          stock: true
        }
      });

      // If needStock changed from false to true, create stock record
      if (parsedNeedStock && !existingProduct.needStock && !updatedProduct.stock) {
        await tx.stock.create({
          data: {
            productId: updatedProduct.id,
            quantity: 0,
            minStock: 10
          }
        });
      }

      // If needStock changed from true to false, delete stock record
      if (!parsedNeedStock && existingProduct.needStock && updatedProduct.stock) {
        // Delete stock logs first
        await tx.stockLog.deleteMany({
          where: { stockId: updatedProduct.stock.id }
        });
        // Then delete stock
        await tx.stock.delete({
          where: { id: updatedProduct.stock.id }
        });
      }

      // Return updated product with relations
      return tx.product.findUnique({
        where: { id: productId },
        include: {
          category: true,
          stock: true
        }
      });
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
        orderItems: true,
        stock: {
          include: {
            stockLogs: true
          }
        }
      }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if product has orders
    if (product.orderItems.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete product "${product.name}" because it has ${product.orderItems.length} order(s). Please deactivate the product instead.`
      });
    }

    // FIX: Delete in correct order: stockLogs -> stock -> product
    await prisma.$transaction(async (tx) => {
      // Delete stock logs first if they exist
      if (product.stock && product.stock.stockLogs && product.stock.stockLogs.length > 0) {
        await tx.stockLog.deleteMany({
          where: { stockId: product.stock.id }
        });
      }

      // Then delete stock record if it exists
      if (product.stock) {
        await tx.stock.delete({
          where: { id: product.stock.id }
        });
      }

      // Finally delete the product
      await tx.product.delete({
        where: { id: productId }
      });
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
router.get('/export/csv', requirePermission('products.read'), async (req, res) => {
  try {
    const { categoryId, needStock, status } = req.query;
    
    const where = {};
    
    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }
    
    if (categoryId) where.categoryId = parseInt(categoryId);
    if (needStock !== undefined) where.needStock = needStock === 'true';

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true
      },
      orderBy: { name: 'asc' }
    });

    // Create CSV content
    const csvHeader = 'ID,Name,Description,Price,Cost Price,Category,Need Stock,Status,Image URL,Created At\n';
    const csvRows = products.map(product => {
      const imageUrl = product.imageUrl || '';
      return [
        product.productId,
        `"${product.name}"`,
        `"${product.description || ''}"`,
        product.price,
        product.costPrice,
        `"${product.category.name}"`,
        product.needStock ? 'Yes' : 'No',
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
router.post('/import/csv', requirePermission('products.create'), async (req, res) => {
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

          // Generate product ID
          const productId = await generateNextProductId();
          
          // Create product
          const newProduct = await tx.product.create({
            data: {
              productId,
              name: product.name,
              description: product.description || '',
              price: parseFloat(product.price),
              categoryId: parseInt(product.categoryId),
              needStock: product.needStock === 'true' || product.needStock === true,
              imageUrl: product.imageUrl || null
            }
          });

          // Create stock record for products that need stock tracking
          if (product.needStock === 'true' || product.needStock === true) {
            await tx.stock.create({
              data: {
                productId: newProduct.id,
                quantity: 0,
                minStock: 10
              }
            });
          }

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