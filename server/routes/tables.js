const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requirePermission } = require('../middleware/permissions');

const router = express.Router();
const prisma = new PrismaClient();

// Get all tables
router.get('/', async (req, res) => {
  try {
    const tables = await prisma.table.findMany({
      where: { isActive: true },
      orderBy: { number: 'asc' }
    });

    res.json({
      success: true,
      data: tables
    });
  } catch (error) {
    console.error('Get tables error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tables'
    });
  }
});

// Get table by ID
router.get('/:id', async (req, res) => {
  try {
    const table = await prisma.table.findUnique({
      where: { id: parseInt(req.params.id) }
    });

    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }

    res.json({
      success: true,
      data: table
    });
  } catch (error) {
    console.error('Get table error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get table'
    });
  }
});

// Update table status (for admin only)
router.patch('/:id/status', requirePermission('tables.update'), async (req, res) => {
  try {
    const { status } = req.body;
    const tableId = parseInt(req.params.id);

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    if (!['AVAILABLE', 'OCCUPIED', 'RESERVED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    // Check if there's an active order for this table
    const activeOrder = await prisma.order.findFirst({
      where: {
        tableId: tableId,
        status: {
          in: ['PENDING']
        }
      }
    });

    // Prevent setting table to AVAILABLE if there's an active order
    if (status === 'AVAILABLE' && activeOrder) {
      return res.status(400).json({
        success: false,
        message: `Cannot set table to AVAILABLE. There is an active order (${activeOrder.orderNumber}) for this table. Please complete or cancel the order first.`
      });
    }

    // Prevent setting table to OCCUPIED or RESERVED if it's already occupied by an active order
    if ((status === 'OCCUPIED' || status === 'RESERVED') && activeOrder) {
      return res.status(400).json({
        success: false,
        message: `Table is already occupied by order ${activeOrder.orderNumber}. Please complete or cancel the existing order first.`
      });
    }

    const table = await prisma.table.update({
      where: { id: tableId },
      data: { status }
    });

    // Send WebSocket notification
    if (global.wss) {
      global.wss.sendTableUpdate(table);
    }

    res.json({
      success: true,
      message: 'Table status updated successfully',
      data: table
    });
  } catch (error) {
    console.error('Update table status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update table status'
    });
  }
});

// Create a new table (Admin only)
router.post('/', requirePermission('tables.create'), async (req, res) => {
  try {
    const { number, capacity, group } = req.body;
    if (!number || !capacity) {
      return res.status(400).json({
        success: false,
        message: 'Table number and capacity are required'
      });
    }
    const table = await prisma.table.create({
      data: {
        number: parseInt(number),
        capacity: parseInt(capacity),
        group: group || 'General',
        status: 'AVAILABLE',
        isActive: true
      }
    });

    // Send WebSocket notification
    if (global.wss) {
      global.wss.sendTablesRefresh();
    }

    res.json({
      success: true,
      message: 'Table created successfully',
      data: table
    });
  } catch (error) {
    console.error('Create table error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create table'
    });
  }
});

// Update a table (number/capacity/group) (Admin only)
router.put('/:id', requirePermission('tables.edit'), async (req, res) => {
  try {
    const tableId = parseInt(req.params.id);
    const { number, capacity, group } = req.body;
    if (!number || !capacity) {
      return res.status(400).json({
        success: false,
        message: 'Table number and capacity are required'
      });
    }
    const table = await prisma.table.update({
      where: { id: tableId },
      data: {
        number: parseInt(number),
        capacity: parseInt(capacity),
        group: group || 'General'
      }
    });

    // Send WebSocket notification
    if (global.wss) {
      global.wss.sendTableUpdate(table);
    }

    res.json({
      success: true,
      message: 'Table updated successfully',
      data: table
    });
  } catch (error) {
    console.error('Update table error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update table'
    });
  }
});

// Soft delete a table (set isActive to false) (Admin only)
router.delete('/:id', requirePermission('tables.delete'), async (req, res) => {
  try {
    const tableId = parseInt(req.params.id);
    await prisma.table.update({
      where: { id: tableId },
      data: { isActive: false }
    });

    // Send WebSocket notification
    if (global.wss) {
      global.wss.sendTablesRefresh();
    }

    res.json({
      success: true,
      message: 'Table deleted successfully'
    });
  } catch (error) {
    console.error('Delete table error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete table'
    });
  }
});

// Get table history and statistics
router.get('/:id/history', async (req, res) => {
  try {
    const tableId = parseInt(req.params.id);
    const orders = await prisma.order.findMany({
      where: { tableId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Statistics
    const totalOrders = await prisma.order.count({ where: { tableId } });
    const totalRevenue = await prisma.order.aggregate({
      where: { tableId, status: 'COMPLETED' },
      _sum: { total: true }
    });
    const avgOrderValue = await prisma.order.aggregate({
      where: { tableId, status: 'COMPLETED' },
      _avg: { total: true }
    });
    // Today
    const today = new Date();
    today.setHours(0,0,0,0);
    const ordersToday = await prisma.order.count({
      where: {
        tableId,
        createdAt: { gte: today }
      }
    });
    const revenueToday = await prisma.order.aggregate({
      where: {
        tableId,
        status: 'COMPLETED',
        createdAt: { gte: today }
      },
      _sum: { total: true }
    });

    res.json({
      success: true,
      data: {
        orders,
        stats: {
          totalOrders,
          totalRevenue: totalRevenue._sum.total || 0,
          avgOrderValue: avgOrderValue._avg.total || 0,
          ordersToday,
          revenueToday: revenueToday._sum.total || 0
        }
      }
    });
  } catch (error) {
    console.error('Get table history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get table history'
    });
  }
});

module.exports = router; 