const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const dayjs = require('dayjs');

const router = express.Router();
const prisma = new PrismaClient();

// Generate order number
const generateOrderNumber = () => {
  const date = dayjs().format('YYYYMMDD');
  const time = dayjs().format('HHmmss');
  return `ORD-${date}-${time}`;
};

// Get all orders (with filters)
router.get('/', async (req, res) => {
  try {
    const { 
      status, 
      tableId, 
      userId, 
      startDate, 
      endDate, 
      page = 1, 
      limit = 20 
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build where clause
    const where = {};
    if (status) where.status = status;
    if (tableId && !isNaN(parseInt(tableId))) where.tableId = parseInt(tableId);
    if (userId && !isNaN(parseInt(userId))) where.userId = parseInt(userId);
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }
    if (req.query.search && req.query.search.trim() !== "") {
      where.orderNumber = { contains: req.query.search.trim() };
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        table: true,
        user: {
          select: {
            id: true,
            name: true,
            username: true
          }
        },
        orderItems: {
          include: {
            product: {
              include: {
                category: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit)
    });

    console.log('Orders from database:', orders);

    const total = await prisma.order.count({ where });

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get orders'
    });
  }
});

// Get order by ID
router.get('/:id', async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        table: true,
        user: {
          select: {
            id: true,
            name: true,
            username: true
          }
        },
        orderItems: {
          include: {
            product: {
              include: {
                category: true
              }
            }
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get order'
    });
  }
});

// Create new order
router.post('/', [
  body('tableId').isInt().withMessage('Table ID is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.productId').isInt().withMessage('Product ID is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('customerNote').optional().isString(),
  body('discount').optional().isFloat({ min: 0 })
], async (req, res) => {
  try {
    console.log('Order creation request:', {
      body: req.body,
      user: req.user,
      headers: req.headers
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { tableId, items, customerNote, discount = 0 } = req.body;

    // Check if table is available
    const table = await prisma.table.findUnique({
      where: { id: tableId }
    });

    if (!table || (table.status !== 'AVAILABLE' && table.status !== 'RESERVED')) {
      return res.status(400).json({
        success: false,
        message: `Table is not available. Current status: ${table?.status || 'NOT_FOUND'}`
      });
    }

    // Validate items and check stock for drinks
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: { stock: true }
      });

      if (!product || !product.isActive) {
        return res.status(400).json({
          success: false,
          message: `Product ${item.productId} not found or inactive`
        });
      }

      // Check stock for drinks
      if (product.isDrink) {
        if (!product.stock || product.stock.quantity < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for ${product.name}. Available: ${product.stock?.quantity || 0}`
          });
        }
      }

      const itemSubtotal = product.price * item.quantity;
      subtotal += itemSubtotal;

      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
        subtotal: itemSubtotal
      });
    }

    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax - discount;

    // Create order with transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          tableId,
          userId: req.user.id,
          subtotal,
          tax,
          discount,
          total,
          customerNote,
          status: 'PENDING' // Explicitly set status
        }
      });
      


      // Create order items
      await tx.orderItem.createMany({
        data: orderItems.map(item => ({
          ...item,
          orderId: newOrder.id
        }))
      });

      // Update table status
      const updatedTable = await tx.table.update({
        where: { id: tableId },
        data: { status: 'OCCUPIED' }
      });

      // Send WebSocket notification
      if (global.wss) {
        global.wss.sendTableUpdate(updatedTable);
      }

      return newOrder;
    });

    // Fetch the complete order with items for response
    const completeOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        table: true,
        user: {
          select: {
            id: true,
            name: true,
            username: true
          }
        },
        orderItems: {
          include: {
            product: {
              include: {
                category: true
              }
            }
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: completeOrder
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order'
    });
  }
});

// Update order status to PREPARING
router.patch('/:id/prepare', async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);

    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Only pending orders can be prepared. Current status: ${order.status}`
      });
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'PREPARING' }
    });

    res.json({
      success: true,
      message: 'Order status updated to preparing'
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status'
    });
  }
});

// Update order status to READY
router.patch('/:id/ready', async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);

    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.status !== 'PREPARING') {
      return res.status(400).json({
        success: false,
        message: 'Only preparing orders can be marked as ready'
      });
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'READY' }
    });

    res.json({
      success: true,
      message: 'Order status updated to ready'
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status'
    });
  }
});

// Update order status and process payment
router.patch('/:id/pay', [
  body('paymentMethod').isIn(['CASH', 'CARD']).withMessage('Payment method is required')
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

    const { paymentMethod } = req.body;
    const orderId = parseInt(req.params.id);

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            product: {
              include: { stock: true }
            }
          }
        },
        table: true
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.status === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Order is already completed'
      });
    }

    // Process payment and update stock
    await prisma.$transaction(async (tx) => {
      // Update order status
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'COMPLETED',
          paymentMethod
        }
      });

      // Deduct stock for drinks
      for (const item of order.orderItems) {
        if (item.product.isDrink && item.product.stock) {
          const newQuantity = item.product.stock.quantity - item.quantity;
          
          await tx.stock.update({
            where: { id: item.product.stock.id },
            data: { quantity: newQuantity }
          });

          // Log stock deduction
          await tx.stockLog.create({
            data: {
              stockId: item.product.stock.id,
              userId: req.user.id,
              type: 'REMOVE',
              quantity: item.quantity,
              note: `Order #${order.orderNumber} payment`
            }
          });
        }
      }

      // Update table status
      await tx.table.update({
        where: { id: order.tableId },
        data: { status: 'AVAILABLE' }
      });
    });

    res.json({
      success: true,
      message: 'Payment processed successfully',
      data: { orderId }
    });
  } catch (error) {
    console.error('Process payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process payment'
    });
  }
});

// Cancel order
router.patch('/:id/cancel', async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { table: true }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.status === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed order'
      });
    }

    await prisma.$transaction(async (tx) => {
      // Update order status
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' }
      });

      // Update table status
      await tx.table.update({
        where: { id: order.tableId },
        data: { status: 'AVAILABLE' }
      });
    });

    res.json({
      success: true,
      message: 'Order cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order'
    });
  }
});

// Update order
router.put('/:id', [
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.productId').isInt().withMessage('Product ID is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('customerNote').optional().isString(),
  body('discount').optional().isFloat({ min: 0 })
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

    const orderId = parseInt(req.params.id);
    const { items, customerNote, discount = 0 } = req.body;

    // Check if order exists and is pending
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            product: {
              include: { stock: true }
            }
          }
        }
      }
    });

    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (existingOrder.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Only pending orders can be updated'
      });
    }

    // Validate items and check stock for drinks
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: { stock: true }
      });

      if (!product || !product.isActive) {
        return res.status(400).json({
          success: false,
          message: `Product ${item.productId} not found or inactive`
        });
      }

      // Check stock for drinks
      if (product.isDrink) {
        const currentStock = product.stock?.quantity || 0;
        const currentOrderQuantity = existingOrder.orderItems
          .filter(oi => oi.productId === item.productId)
          .reduce((sum, oi) => sum + oi.quantity, 0);
        
        const availableStock = currentStock + currentOrderQuantity;
        
        if (availableStock < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for ${product.name}. Available: ${availableStock}`
          });
        }
      }

      const itemSubtotal = product.price * item.quantity;
      subtotal += itemSubtotal;

      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
        subtotal: itemSubtotal
      });
    }

    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax - discount;

    // Update order with transaction
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Delete existing order items
      await tx.orderItem.deleteMany({
        where: { orderId }
      });

      // Update order
      const order = await tx.order.update({
        where: { id: orderId },
        data: {
          subtotal,
          tax,
          discount,
          total,
          customerNote
        }
      });

      // Create new order items
      await tx.orderItem.createMany({
        data: orderItems.map(item => ({
          ...item,
          orderId
        }))
      });

      return order;
    });

    // Fetch the complete updated order with items for response
    const completeUpdatedOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        table: true,
        user: {
          select: {
            id: true,
            name: true,
            username: true
          }
        },
        orderItems: {
          include: {
            product: {
              include: {
                category: true
              }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Order updated successfully',
      data: completeUpdatedOrder
    });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order'
    });
  }
});

module.exports = router; 