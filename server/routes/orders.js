const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const dayjs = require('dayjs');

const router = express.Router();
const prisma = new PrismaClient();

// Helper function to get business settings
const getBusinessSettings = async () => {
  const settingsRecord = await prisma.settings.findUnique({
    where: { category: 'business' }
  });
  
  // Default business settings if none exist
  const defaultBusinessSettings = {
    restaurantName: 'Restaurant POS',
    address: '123 Main Street, City, State 12345',
    phone: '+1 (555) 123-4567',
    email: 'info@restaurant.com',
    taxRate: 8.5,
    currency: 'USD',
    timezone: 'America/New_York'
  };
  
  // Parse the JSON data from database if it exists
  if (settingsRecord?.data) {
    try {
      return JSON.parse(settingsRecord.data);
    } catch (error) {
      console.error('Failed to parse business settings:', error);
      return defaultBusinessSettings;
    }
  }
  
  return defaultBusinessSettings;
};

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
    
    // Role-based filtering: Cashiers can only see their own orders
    if (req.user.role === 'CASHIER') {
      where.userId = req.user.id;
    }
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        // Set to start of day (00:00:00) in UTC
        const startDateTime = new Date(startDate + 'T00:00:00.000Z');
        where.createdAt.gte = startDateTime;
      }
      if (endDate) {
        // Set to end of day (23:59:59.999) in UTC
        const endDateTime = new Date(endDate + 'T23:59:59.999Z');
        where.createdAt.lte = endDateTime;
      }
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


    const errors = validationResult(req);
    if (!errors.isEmpty()) {
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

      // Check stock for products that need stock tracking
      if (product.needStock) {
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

    // Get business settings for tax calculation and snapshot
    const businessSettings = await getBusinessSettings();
    const taxRate = businessSettings.taxRate || 8.5;
    const tax = (subtotal * taxRate) / 100;
    const total = subtotal + tax - discount;

    // Create order with transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create order with business snapshot
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
          businessSnapshot: JSON.stringify(businessSettings), // Convert to JSON string
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
      await tx.table.update({
        where: { id: tableId },
        data: { status: 'OCCUPIED' }
      });

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

    // Get updated table for WebSocket notification
    const updatedTable = await prisma.table.findUnique({
      where: { id: tableId }
    });

    // Send WebSocket notification
    if (global.wss) {
      global.wss.sendTableUpdate(updatedTable);
      global.wss.sendOrderUpdate({ type: 'order_created', order: completeOrder });
    }

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



// Update order status and process payment
router.patch('/:id/pay', [
  body('currency').optional().isIn(['USD', 'Riel']).withMessage('Invalid currency'),
  body('splitBill').optional().isBoolean().withMessage('Split bill must be boolean'),
  body('splitAmounts').optional().isArray().withMessage('Split amounts must be array'),
  body('mixedPayments').optional().isBoolean().withMessage('Mixed payments must be boolean'),
  body('paymentMethods').optional().custom((value) => {
    if (value === null || value === undefined) return true;
    if (Array.isArray(value)) return true;
    throw new Error('Payment methods must be an array');
  }),
  body('nestedPayments').optional().isBoolean().withMessage('Nested payments must be boolean'),
  body('mixedCurrency').optional().isBoolean().withMessage('Mixed currency must be boolean'),
  body('splitMixedCurrency').optional().isBoolean().withMessage('Split mixed currency must be boolean')
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

    const { currency = 'USD', splitBill = false, splitAmounts = [], mixedPayments = false, paymentMethods = [], nestedPayments = false, mixedCurrency = false, splitMixedCurrency = false } = req.body;
    
    // Ensure paymentMethods is always an array
    const safePaymentMethods = Array.isArray(paymentMethods) ? paymentMethods : [];
    
    // Check if any split has mixed payments (nested payments)
    const hasNestedPayments = splitBill && splitAmounts.some(split => split.mixedPayments);
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
      // Determine primary payment method
      let primaryPaymentMethod = 'CASH';
      if (mixedPayments && safePaymentMethods.length > 0) {
        primaryPaymentMethod = safePaymentMethods[0].method;
      } else if (safePaymentMethods.length > 0) {
        primaryPaymentMethod = safePaymentMethods[0].method;
      }

      // Update order status
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'COMPLETED',
          paymentMethod: primaryPaymentMethod,
          currency: currency,
          splitBill: splitBill,
          splitAmounts: splitBill ? JSON.stringify(splitAmounts) : null,
          mixedPayments: mixedPayments,
          paymentMethods: mixedPayments ? JSON.stringify(safePaymentMethods) : null,
          nestedPayments: hasNestedPayments,
          mixedCurrency: mixedCurrency,
          splitMixedCurrency: splitBill && splitAmounts.some(split => split.mixedCurrency)
        }
      });

      // Deduct stock for products that need stock tracking
      for (const item of order.orderItems) {
        if (item.product.needStock && item.product.stock) {
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

    // Send WebSocket notification
    if (global.wss) {
      global.wss.sendOrderUpdate({ type: 'order_updated', orderId });
    }

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

    // Send WebSocket notification
    if (global.wss) {
      global.wss.sendOrderUpdate({ type: 'order_updated', orderId });
    }

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

      // Check stock for products that need stock tracking
      if (product.needStock) {
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

    // Use original business snapshot for tax calculation to maintain historical accuracy
    let businessSnapshot = existingOrder.businessSnapshot;
    
    // Parse business snapshot if it's a string
    if (businessSnapshot && typeof businessSnapshot === 'string') {
      try {
        businessSnapshot = JSON.parse(businessSnapshot);
      } catch (error) {
        console.error('Failed to parse business snapshot:', error);
        businessSnapshot = await getBusinessSettings();
      }
    } else if (!businessSnapshot) {
      businessSnapshot = await getBusinessSettings();
    }
    
    const taxRate = businessSnapshot.taxRate || 8.5;
    const tax = (subtotal * taxRate) / 100;
    const total = subtotal + tax - discount;

    // Update order with transaction
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Delete existing order items
      await tx.orderItem.deleteMany({
        where: { orderId }
      });

      // Update order (preserve business snapshot if it exists, otherwise create one)
      const updateData = {
        subtotal,
        tax,
        discount,
        total,
        customerNote
      };
      
      // If no business snapshot exists, create one for historical accuracy
      if (!existingOrder.businessSnapshot) {
        updateData.businessSnapshot = await getBusinessSettings();
      }
      
      const order = await tx.order.update({
        where: { id: orderId },
        data: updateData
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

// Change order table assignment
router.patch('/:id/table', [
  body('tableId').isInt().withMessage('Table ID is required')
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
    const { tableId } = req.body;

    // Check if order exists and is pending
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { table: true }
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
        message: 'Only pending orders can have their table changed'
      });
    }

    // Check if new table exists and is available
    const newTable = await prisma.table.findUnique({
      where: { id: tableId }
    });

    if (!newTable) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }

    if (newTable.maintenance) {
      return res.status(400).json({
        success: false,
        message: 'Cannot assign order to a table that is out of service'
      });
    }

    if (newTable.status !== 'AVAILABLE' && newTable.status !== 'RESERVED') {
      return res.status(400).json({
        success: false,
        message: `Table ${newTable.number} is not available. Current status: ${newTable.status}`
      });
    }

    // Check if the new table already has an active order
    const existingOrderOnNewTable = await prisma.order.findFirst({
      where: {
        tableId: tableId,
        status: 'PENDING'
      }
    });

    if (existingOrderOnNewTable && existingOrderOnNewTable.id !== orderId) {
      return res.status(400).json({
        success: false,
        message: `Table ${newTable.number} already has an active order`
      });
    }

    // Update order table assignment and table statuses
    await prisma.$transaction(async (tx) => {
      // Update order table assignment
      await tx.order.update({
        where: { id: orderId },
        data: { tableId: tableId }
      });

      // Set old table to available
      await tx.table.update({
        where: { id: existingOrder.tableId },
        data: { status: 'AVAILABLE' }
      });

      // Set new table to occupied
      await tx.table.update({
        where: { id: tableId },
        data: { status: 'OCCUPIED' }
      });
    });

    // Fetch updated order with new table
    const updatedOrder = await prisma.order.findUnique({
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

    // Send WebSocket notifications
    if (global.wss) {
      // Get updated tables for notifications
      const [oldTable, newTable] = await Promise.all([
        prisma.table.findUnique({ where: { id: existingOrder.tableId } }),
        prisma.table.findUnique({ where: { id: tableId } })
      ]);
      
      global.wss.sendTableUpdate(oldTable);
      global.wss.sendTableUpdate(newTable);
      global.wss.sendOrderUpdate({ type: 'order_updated', order: updatedOrder });
    }

    res.json({
      success: true,
      message: 'Table assignment updated successfully',
      data: updatedOrder
    });
  } catch (error) {
    console.error('Change order table error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change order table'
    });
  }
});

module.exports = router; 