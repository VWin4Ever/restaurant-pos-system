const express = require('express');
const { PrismaClient } = require('@prisma/client');
const dayjs = require('dayjs');

const router = express.Router();
const prisma = new PrismaClient();

// Get dashboard summary with date range
router.get('/dashboard', async (req, res) => {
  try {
    const { range = 'today' } = req.query;
    
    let startDate, endDate;
    const now = dayjs();
    
    switch (range) {
      case 'today':
        startDate = now.startOf('day');
        endDate = now.endOf('day');
        break;
      case 'week':
        startDate = now.startOf('week');
        endDate = now.endOf('week');
        break;
      case 'month':
        startDate = now.startOf('month');
        endDate = now.endOf('month');
        break;
      case 'year':
        startDate = now.startOf('year');
        endDate = now.endOf('year');
        break;
      default:
        startDate = now.startOf('day');
        endDate = now.endOf('day');
    }

    // Sales for the period
    const periodSales = await prisma.order.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: startDate.toDate(),
          lte: endDate.toDate()
        }
      },
      _sum: {
        total: true
      },
      _count: true
    });

    // Average order value
    const averageOrder = periodSales._count > 0 
      ? (periodSales._sum.total || 0) / periodSales._count 
      : 0;

    // Pending orders count
    const pendingOrders = await prisma.order.count({
      where: {
        status: 'PENDING'
      }
    });

    // Available tables count
    const availableTables = await prisma.table.count({
      where: {
        status: 'AVAILABLE',
        isActive: true
      }
    });

    res.json({
      success: true,
      data: {
        todaySales: {
          total: periodSales._sum.total || 0,
          count: periodSales._count
        },
        averageOrder,
        pendingOrders,
        availableTables
      }
    });
  } catch (error) {
    console.error('Get dashboard summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard summary'
    });
  }
});

// Get sales data with date range
router.get('/sales', async (req, res) => {
  try {
    const { range = 'today' } = req.query;
    
    let startDate, endDate;
    const now = dayjs();
    
    switch (range) {
      case 'today':
        startDate = now.startOf('day');
        endDate = now.endOf('day');
        break;
      case 'week':
        startDate = now.startOf('week');
        endDate = now.endOf('week');
        break;
      case 'month':
        startDate = now.startOf('month');
        endDate = now.endOf('month');
        break;
      case 'year':
        startDate = now.startOf('year');
        endDate = now.endOf('year');
        break;
      default:
        startDate = now.startOf('day');
        endDate = now.endOf('day');
    }

    const orders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: startDate.toDate(),
          lte: endDate.toDate()
        }
      },
      include: {
        table: true,
        user: {
          select: {
            id: true,
            name: true
          }
        },
        orderItems: {
          include: {
            product: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Group by date for chart
    const salesByDate = {};
    orders.forEach(order => {
      const date = dayjs(order.createdAt).format('YYYY-MM-DD');
      if (!salesByDate[date]) {
        salesByDate[date] = {
          date,
          total: 0,
          orders: 0,
          average: 0
        };
      }
      salesByDate[date].total += parseFloat(order.total);
      salesByDate[date].orders += 1;
    });

    // Calculate averages
    Object.values(salesByDate).forEach(day => {
      day.average = day.orders > 0 ? day.total / day.orders : 0;
    });

    res.json({
      success: true,
      data: Object.values(salesByDate)
    });
  } catch (error) {
    console.error('Get sales data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sales data'
    });
  }
});

// Get top products with date range
router.get('/top-products', async (req, res) => {
  try {
    const { range = 'today' } = req.query;
    
    let startDate, endDate;
    const now = dayjs();
    
    switch (range) {
      case 'today':
        startDate = now.startOf('day');
        endDate = now.endOf('day');
        break;
      case 'week':
        startDate = now.startOf('week');
        endDate = now.endOf('week');
        break;
      case 'month':
        startDate = now.startOf('month');
        endDate = now.endOf('month');
        break;
      case 'year':
        startDate = now.startOf('year');
        endDate = now.endOf('year');
        break;
      default:
        startDate = now.startOf('day');
        endDate = now.endOf('day');
    }

    const where = {
      order: {
        status: 'COMPLETED',
        createdAt: {
          gte: startDate.toDate(),
          lte: endDate.toDate()
        }
      }
    };

    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      where,
      _sum: {
        quantity: true,
        subtotal: true
      },
      orderBy: {
        _sum: {
          quantity: 'desc'
        }
      },
      take: 10
    });

    // Get product details
    const productsWithDetails = await Promise.all(
      topProducts.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          include: {
            category: true
          }
        });

        return {
          id: product.id,
          name: product.name,
          category: product.category.name,
          quantity: item._sum.quantity,
          revenue: item._sum.subtotal
        };
      })
    );

    res.json({
      success: true,
      data: productsWithDetails
    });
  } catch (error) {
    console.error('Get top products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get top products'
    });
  }
});

// Export sales report as CSV
router.get('/export', async (req, res) => {
  try {
    const { range = 'today' } = req.query;
    
    let startDate, endDate;
    const now = dayjs();
    
    switch (range) {
      case 'today':
        startDate = now.startOf('day');
        endDate = now.endOf('day');
        break;
      case 'week':
        startDate = now.startOf('week');
        endDate = now.endOf('week');
        break;
      case 'month':
        startDate = now.startOf('month');
        endDate = now.endOf('month');
        break;
      case 'year':
        startDate = now.startOf('year');
        endDate = now.endOf('year');
        break;
      default:
        startDate = now.startOf('day');
        endDate = now.endOf('day');
    }

    const orders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: startDate.toDate(),
          lte: endDate.toDate()
        }
      },
      include: {
        table: true,
        user: {
          select: {
            name: true
          }
        },
        orderItems: {
          include: {
            product: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Generate CSV content
    const csvHeader = 'Order ID,Date,Table,Items,Total,Payment Method,Cashier\n';
    const csvRows = orders.map(order => {
      const itemCount = order.orderItems.reduce((sum, item) => sum + item.quantity, 0);
      return `${order.id},${dayjs(order.createdAt).format('YYYY-MM-DD HH:mm')},${order.table.number},${itemCount},${order.total},${order.paymentMethod},${order.user.name}`;
    }).join('\n');

    const csvContent = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=sales-report-${range}-${dayjs().format('YYYY-MM-DD')}.csv`);
    res.send(csvContent);
  } catch (error) {
    console.error('Export sales report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export sales report'
    });
  }
});

// Get order statistics
router.get('/order-stats', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const stats = await prisma.order.groupBy({
      by: ['status'],
      where,
      _count: true,
      _sum: {
        total: true
      }
    });

    const totalOrders = await prisma.order.count({ where });
    const totalRevenue = await prisma.order.aggregate({
      where: { ...where, status: 'COMPLETED' },
      _sum: { total: true }
    });

    res.json({
      success: true,
      data: {
        byStatus: stats,
        totalOrders,
        totalRevenue: totalRevenue._sum.total || 0
      }
    });
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get order statistics'
    });
  }
});

// Get stock report
router.get('/stock', async (req, res) => {
  try {
    const { lowStock, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (lowStock === 'true') {
      where.quantity = {
        lte: prisma.stock.fields.minStock
      };
    }

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
        quantity: 'asc'
      },
      skip,
      take: parseInt(limit)
    });

    const total = await prisma.stock.count({ where });

    // Calculate stock value
    const stockValue = stock.reduce((total, item) => {
      return total + (item.quantity * parseFloat(item.product.price));
    }, 0);

    res.json({
      success: true,
      data: stock,
      summary: {
        totalItems: total,
        totalValue: stockValue,
        lowStockItems: stock.filter(item => item.quantity <= item.minStock).length
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get stock report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get stock report'
    });
  }
});

// Get cashier performance
router.get('/cashier-performance', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where = {
      status: 'COMPLETED'
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const performance = await prisma.order.groupBy({
      by: ['userId'],
      where,
      _count: true,
      _sum: {
        total: true
      }
    });

    // Get user details
    const performanceWithDetails = await Promise.all(
      performance.map(async (item) => {
        const user = await prisma.user.findUnique({
          where: { id: item.userId },
          select: {
            id: true,
            name: true,
            username: true,
            role: true
          }
        });

        return {
          user,
          orderCount: item._count,
          totalSales: item._sum.total
        };
      })
    );

    res.json({
      success: true,
      data: performanceWithDetails
    });
  } catch (error) {
    console.error('Get cashier performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cashier performance'
    });
  }
});

module.exports = router; 