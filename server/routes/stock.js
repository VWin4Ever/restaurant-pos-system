const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Get all stock items
router.get('/', async (req, res) => {
  try {
    const { lowStock, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (lowStock === 'true') {
      where.quantity = {
        lte: prisma.stock.fields.minStock
      };
    }

    // Only show stock for products that need stock tracking
    where.product = {
      needStock: true
    };

    const stock = await prisma.stock.findMany({
      where,
      include: {
        product: {
          include: {
            category: true
          }
        }
      },
      orderBy: {
        product: {
          name: 'asc'
        }
      },
      skip,
      take: parseInt(limit)
    });

    const total = await prisma.stock.count({ where });

    res.json({
      success: true,
      data: stock,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get stock'
    });
  }
});

// Get stock by product ID
router.get('/product/:productId', async (req, res) => {
  try {
    const productId = parseInt(req.params.productId);

    const stock = await prisma.stock.findUnique({
      where: { productId },
      include: {
        product: {
          include: {
            category: true
          }
        },
        stockLogs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true
              }
            }
          }
        }
      }
    });

    if (!stock) {
      return res.status(404).json({
        success: false,
        message: 'Stock not found'
      });
    }

    res.json({
      success: true,
      data: stock
    });
  } catch (error) {
    console.error('Get stock by product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get stock'
    });
  }
});

// Add stock
router.post('/add', [
  body('productId').isInt().withMessage('Product ID is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('note').optional().isString()
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

    const { productId, quantity, note } = req.body;

    // Check if product exists and is a drink
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { stock: true }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (!product.needStock) {
      return res.status(400).json({
        success: false,
        message: 'Stock can only be managed for products that need stock tracking'
      });
    }

    // Update stock with transaction
    const updatedStock = await prisma.$transaction(async (tx) => {
      let stock;
      
      if (product.stock) {
        // Update existing stock
        stock = await tx.stock.update({
          where: { id: product.stock.id },
          data: {
            quantity: {
              increment: quantity
            }
          },
          include: {
            product: {
              include: {
                category: true
              }
            }
          }
        });
      } else {
        // Create new stock record
        stock = await tx.stock.create({
          data: {
            productId,
            quantity,
            minStock: 10
          },
          include: {
            product: {
              include: {
                category: true
              }
            }
          }
        });
      }

      // Log stock addition
      await tx.stockLog.create({
        data: {
          stockId: stock.id,
          userId: req.user.id,
          type: 'ADD',
          quantity,
          note: note || 'Stock added'
        }
      });

      return stock;
    });

    res.json({
      success: true,
      message: 'Stock added successfully',
      data: updatedStock
    });
  } catch (error) {
    console.error('Add stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add stock'
    });
  }
});

// Adjust stock (add/remove/adjust)
router.post('/:id/adjust', [
  body('quantity').isInt().withMessage('Quantity must be a number'),
  body('note').optional().isString(),
  body('type').isIn(['ADD', 'REMOVE', 'ADJUST']).withMessage('Type must be ADD, REMOVE, or ADJUST')
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

    const { quantity, note, type } = req.body;
    const stockId = parseInt(req.params.id);

    const stock = await prisma.stock.findUnique({
      where: { id: stockId },
      include: {
        product: true
      }
    });

    if (!stock) {
      return res.status(404).json({
        success: false,
        message: 'Stock not found'
      });
    }

    let newQuantity = stock.quantity;
    let logQuantity = Math.abs(quantity);

    // Calculate new quantity based on type
    switch (type) {
      case 'ADD':
        newQuantity += quantity;
        break;
      case 'REMOVE':
        newQuantity -= quantity;
        if (newQuantity < 0) newQuantity = 0;
        break;
      case 'ADJUST':
        newQuantity = quantity;
        break;
    }

    // Update stock with transaction
    const updatedStock = await prisma.$transaction(async (tx) => {
      const updated = await tx.stock.update({
        where: { id: stockId },
        data: { quantity: newQuantity },
        include: {
          product: {
            include: {
              category: true
            }
          }
        }
      });

      // Log stock adjustment
      await tx.stockLog.create({
        data: {
          stockId,
          userId: req.user.id,
          type,
          quantity: logQuantity,
          note: note || `${type === 'ADD' ? 'Stock added' : type === 'REMOVE' ? 'Stock removed' : 'Stock adjusted'}`
        }
      });

      return updated;
    });

    res.json({
      success: true,
      message: 'Stock adjusted successfully',
      data: updatedStock
    });
  } catch (error) {
    console.error('Adjust stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to adjust stock'
    });
  }
});

// Update stock quantity
router.patch('/:id/quantity', [
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a non-negative number'),
  body('note').optional().isString()
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

    const { quantity, note } = req.body;
    const stockId = parseInt(req.params.id);

    const stock = await prisma.stock.findUnique({
      where: { id: stockId },
      include: {
        product: true
      }
    });

    if (!stock) {
      return res.status(404).json({
        success: false,
        message: 'Stock not found'
      });
    }

    const oldQuantity = stock.quantity;
    const difference = quantity - oldQuantity;

    // Update stock with transaction
    const updatedStock = await prisma.$transaction(async (tx) => {
      const updated = await tx.stock.update({
        where: { id: stockId },
        data: { quantity },
        include: {
          product: {
            include: {
              category: true
            }
          }
        }
      });

      // Log stock adjustment
      await tx.stockLog.create({
        data: {
          stockId,
          userId: req.user.id,
          type: difference > 0 ? 'ADD' : 'REMOVE',
          quantity: Math.abs(difference),
          note: note || `Stock adjusted from ${oldQuantity} to ${quantity}`
        }
      });

      return updated;
    });

    res.json({
      success: true,
      message: 'Stock updated successfully',
      data: updatedStock
    });
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update stock'
    });
  }
});

// Update minimum stock threshold
router.patch('/:id/min-stock', [
  body('minStock').isInt({ min: 0 }).withMessage('Minimum stock must be a non-negative number')
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

    const { minStock } = req.body;
    const stockId = parseInt(req.params.id);

    const stock = await prisma.stock.update({
      where: { id: stockId },
      data: { minStock },
      include: {
        product: {
          include: {
            category: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Minimum stock threshold updated successfully',
      data: stock
    });
  } catch (error) {
    console.error('Update min stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update minimum stock threshold'
    });
  }
});

// Get stock logs
router.get('/logs', async (req, res) => {
  try {
    const { 
      stockId, 
      type, 
      startDate, 
      endDate, 
      page = 1, 
      limit = 20 
    } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (stockId) where.stockId = parseInt(stockId);
    if (type) where.type = type;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Only show logs for products that need stock tracking
    where.stock = {
      product: {
        needStock: true
      }
    };

    const logs = await prisma.stockLog.findMany({
      where,
      include: {
        stock: {
          include: {
            product: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            username: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit)
    });

    const total = await prisma.stockLog.count({ where });

    res.json({
      success: true,
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get stock logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get stock logs'
    });
  }
});

// Get low stock alerts
router.get('/alerts/low-stock', async (req, res) => {
  try {
    const lowStockItems = await prisma.stock.findMany({
      where: {
        quantity: {
          lte: prisma.stock.fields.minStock
        },
        product: {
          needStock: true
        }
      },
      include: {
        product: {
          include: {
            category: true
          }
        }
      },
      orderBy: {
        quantity: 'asc'
      }
    });

    res.json({
      success: true,
      data: lowStockItems,
      count: lowStockItems.length
    });
  } catch (error) {
    console.error('Get low stock alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get low stock alerts'
    });
  }
});

module.exports = router; 