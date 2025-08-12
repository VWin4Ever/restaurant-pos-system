const express = require('express');
const { PrismaClient } = require('@prisma/client');
const dayjs = require('dayjs');
const { requirePermission } = require('../middleware/permissions');

const router = express.Router();
const prisma = new PrismaClient();

// Helper function to get date range
const getDateRange = (range = 'today', startDate, endDate) => {
  let start, end;
  const now = dayjs();
  
  if (startDate && endDate) {
    // Validate custom date inputs
    const startDateObj = dayjs(startDate);
    const endDateObj = dayjs(endDate);
    
    if (!startDateObj.isValid() || !endDateObj.isValid()) {
      throw new Error('Invalid date format provided');
    }
    
    if (startDateObj.isAfter(endDateObj)) {
      throw new Error('Start date cannot be after end date');
    }
    
    if (endDateObj.isAfter(now)) {
      throw new Error('End date cannot be in the future');
    }
    
    start = startDateObj.startOf('day');
    end = endDateObj.endOf('day');
  } else {
    switch (range) {
      case 'today':
        start = now.startOf('day');
        end = now.endOf('day');
        break;
      case 'yesterday':
        start = now.subtract(1, 'day').startOf('day');
        end = now.subtract(1, 'day').endOf('day');
        break;
      case 'week':
        start = now.startOf('week');
        end = now.endOf('week');
        break;
      case 'lastWeek':
        start = now.subtract(1, 'week').startOf('week');
        end = now.subtract(1, 'week').endOf('week');
        break;
      case 'month':
        start = now.startOf('month');
        end = now.endOf('month');
        break;
      case 'lastMonth':
        start = now.subtract(1, 'month').startOf('month');
        end = now.subtract(1, 'month').endOf('month');
        break;
      case 'year':
        start = now.startOf('year');
        end = now.endOf('year');
        break;
      default:
        start = now.startOf('day');
        end = now.endOf('day');
    }
  }
  
  return { start, end };
};

// Get dashboard summary with date range
router.get('/dashboard', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    // Sales for the period
    const periodSales = await prisma.order.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: start.toDate(),
          lte: end.toDate()
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

// Sales Reports Routes
// Sales Summary
router.get('/sales/summary', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const orders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: start.toDate(),
          lte: end.toDate()
        }
      },
      include: {
        orderItems: true
      }
    });

    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);
    const totalOrders = orders.length;
    const totalItems = orders.reduce((sum, order) => 
      sum + order.orderItems.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    );
    const averageOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Daily sales trend
    const dailySales = {};
    orders.forEach(order => {
      const date = dayjs(order.createdAt).format('YYYY-MM-DD');
      if (!dailySales[date]) {
        dailySales[date] = { date, revenue: 0 };
      }
      dailySales[date].revenue += parseFloat(order.total);
    });

    res.json({
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        totalItems,
        averageOrder,
        dailySales: Object.values(dailySales)
      }
    });
  } catch (error) {
    console.error('Daily summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get daily summary'
    });
  }
});

// Sales by Category
router.get('/sales/category-sales', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          status: 'COMPLETED',
          createdAt: {
            gte: start.toDate(),
            lte: end.toDate()
          }
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

    const categorySales = {};
    orderItems.forEach(item => {
      const categoryName = item.product.category.name;
      if (!categorySales[categoryName]) {
        categorySales[categoryName] = { name: categoryName, revenue: 0, quantity: 0 };
      }
      categorySales[categoryName].revenue += parseFloat(item.subtotal);
      categorySales[categoryName].quantity += item.quantity;
    });

    res.json({
      success: true,
      data: {
        categorySales: Object.values(categorySales)
      }
    });
  } catch (error) {
    console.error('Category sales error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get category sales'
    });
  }
});

// Sales by Item
router.get('/sales/item-sales', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          status: 'COMPLETED',
          createdAt: {
            gte: start.toDate(),
            lte: end.toDate()
          }
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

    const itemSales = {};
    orderItems.forEach(item => {
      const productId = item.productId;
      if (!itemSales[productId]) {
        itemSales[productId] = {
          id: productId,
          name: item.product.name,
          category: item.product.category.name,
          quantity: 0,
          revenue: 0,
          averagePrice: 0
        };
      }
      itemSales[productId].quantity += item.quantity;
      itemSales[productId].revenue += parseFloat(item.subtotal);
    });

    // Calculate average price
    Object.values(itemSales).forEach(item => {
      item.averagePrice = item.quantity > 0 ? item.revenue / item.quantity : 0;
    });

    // Get top items for chart
    const topItems = Object.values(itemSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    res.json({
      success: true,
      data: {
        items: Object.values(itemSales),
        topItems
      }
    });
  } catch (error) {
    console.error('Item sales error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get item sales'
    });
  }
});

// Sales by Table
router.get('/sales/table-sales', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const orders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: start.toDate(),
          lte: end.toDate()
        }
      },
      include: {
        table: true
      }
    });

    const tableSales = {};
    orders.forEach(order => {
      const tableId = order.tableId;
      if (!tableSales[tableId]) {
        tableSales[tableId] = {
          id: tableId,
          number: order.table.number,
          orderCount: 0,
          revenue: 0,
          averageOrder: 0
        };
      }
      tableSales[tableId].orderCount += 1;
      tableSales[tableId].revenue += parseFloat(order.total);
    });

    // Calculate average order and utilization
    Object.values(tableSales).forEach(table => {
      table.averageOrder = table.orderCount > 0 ? table.revenue / table.orderCount : 0;
      table.utilization = Math.round((table.orderCount / 24) * 100); // Assuming 24 hours
    });

    res.json({
      success: true,
      data: {
        tableSales: Object.values(tableSales),
        tableDetails: Object.values(tableSales)
      }
    });
  } catch (error) {
    console.error('Table sales error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get table sales'
    });
  }
});

// Hourly Sales Report
router.get('/sales/hourly-sales', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const orders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: start.toDate(),
          lte: end.toDate()
        }
      }
    });

    const hourlySales = {};
    for (let i = 0; i < 24; i++) {
      hourlySales[i] = { hour: i, revenue: 0 };
    }

    orders.forEach(order => {
      const hour = dayjs(order.createdAt).hour();
      hourlySales[hour].revenue += parseFloat(order.total);
    });

    const hourlyData = Object.values(hourlySales);
    const totalRevenue = hourlyData.reduce((sum, hour) => sum + hour.revenue, 0);
    const averageHourly = totalRevenue / 24;
    const peakHour = hourlyData.reduce((max, hour) => hour.revenue > max.revenue ? hour : max);
    const slowHour = hourlyData.reduce((min, hour) => hour.revenue < min.revenue ? hour : min);

    res.json({
      success: true,
      data: {
        hourlySales: hourlyData,
        peakHours: {
          peak: `${peakHour.hour}:00`,
          average: averageHourly,
          slow: `${slowHour.hour}:00`
        }
      }
    });
  } catch (error) {
    console.error('Hourly sales error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get hourly sales'
    });
  }
});

// Discount Report
router.get('/sales/discount-report', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const orders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        discount: {
          gt: 0
        },
        createdAt: {
          gte: start.toDate(),
          lte: end.toDate()
        }
      },
      include: {
        user: {
          select: {
            name: true
          }
        }
      }
    });

    const totalDiscounts = orders.length;
    const totalAmount = orders.reduce((sum, order) => sum + parseFloat(order.discount), 0);
    const averageDiscount = totalDiscounts > 0 ? totalAmount / totalDiscounts : 0;
    const staffCount = new Set(orders.map(order => order.userId)).size;

    const discountDetails = orders.map(order => ({
      id: order.id,
      orderNumber: order.id,
      staffName: order.user.name,
      amount: parseFloat(order.discount),
      reason: 'Discount applied', // Default reason since discountReason field doesn't exist
      date: order.createdAt
    }));

    res.json({
      success: true,
      data: {
        discountSummary: {
          totalDiscounts,
          totalAmount,
          averageDiscount,
          staffCount
        },
        discountDetails
      }
    });
  } catch (error) {
    console.error('Discount report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get discount report'
    });
  }
});

// Cancelled Sales Report
router.get('/sales/cancelled-sales', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const cancelledOrders = await prisma.order.findMany({
      where: {
        status: 'CANCELLED',
        createdAt: {
          gte: start.toDate(),
          lte: end.toDate()
        }
      },
      include: {
        table: true,
        user: {
          select: {
            name: true
          }
        }
      }
    });

    const totalCancelled = cancelledOrders.length;
    const lostRevenue = cancelledOrders.reduce((sum, order) => sum + parseFloat(order.total), 0);
    const staffCount = new Set(cancelledOrders.map(order => order.userId)).size;

    // Calculate cancellation rate
    const totalOrders = await prisma.order.count({
      where: {
        createdAt: {
          gte: start.toDate(),
          lte: end.toDate()
        }
      }
    });
    const cancellationRate = totalOrders > 0 ? (totalCancelled / totalOrders) * 100 : 0;

    const cancelledDetails = cancelledOrders.map(order => ({
      id: order.id,
      orderNumber: order.id,
      tableNumber: order.table.number,
      staffName: order.user.name,
      amount: parseFloat(order.total),
      reason: 'Order cancelled', // Default reason since cancelReason field doesn't exist
      date: order.createdAt
    }));

    res.json({
      success: true,
      data: {
        cancelledSummary: {
          totalCancelled,
          lostRevenue,
          cancellationRate,
          staffCount
        },
        cancelledDetails
      }
    });
  } catch (error) {
    console.error('Cancelled sales error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cancelled sales report'
    });
  }
});

// Sales Trends Report
router.get('/sales/sales-trends', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const orders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: start.toDate(),
          lte: end.toDate()
        }
      },
      include: {
        orderItems: true
      }
    });

    // Daily trends
    const dailyTrends = {};
    orders.forEach(order => {
      const date = dayjs(order.createdAt).format('YYYY-MM-DD');
      if (!dailyTrends[date]) {
        dailyTrends[date] = { date, revenue: 0, orders: 0, items: 0 };
      }
      dailyTrends[date].revenue += parseFloat(order.total);
      dailyTrends[date].orders += 1;
      dailyTrends[date].items += order.orderItems.reduce((sum, item) => sum + item.quantity, 0);
    });

    // Weekly trends
    const weeklyTrends = {};
    orders.forEach(order => {
      const week = dayjs(order.createdAt).format('YYYY-[W]WW');
      if (!weeklyTrends[week]) {
        weeklyTrends[week] = { week, revenue: 0, orders: 0, items: 0 };
      }
      weeklyTrends[week].revenue += parseFloat(order.total);
      weeklyTrends[week].orders += 1;
      weeklyTrends[week].items += order.orderItems.reduce((sum, item) => sum + item.quantity, 0);
    });

    // Monthly trends
    const monthlyTrends = {};
    orders.forEach(order => {
      const month = dayjs(order.createdAt).format('YYYY-MM');
      if (!monthlyTrends[month]) {
        monthlyTrends[month] = { month, revenue: 0, orders: 0, items: 0 };
      }
      monthlyTrends[month].revenue += parseFloat(order.total);
      monthlyTrends[month].orders += 1;
      monthlyTrends[month].items += order.orderItems.reduce((sum, item) => sum + item.quantity, 0);
    });

    // Growth analysis
    const dailyArray = Object.values(dailyTrends).sort((a, b) => a.date.localeCompare(b.date));
    const weeklyArray = Object.values(weeklyTrends).sort((a, b) => a.week.localeCompare(b.week));
    const monthlyArray = Object.values(monthlyTrends).sort((a, b) => a.month.localeCompare(b.month));

    const growthAnalysis = {
      dailyGrowth: dailyArray.length > 1 ? 
        ((dailyArray[dailyArray.length - 1].revenue - dailyArray[0].revenue) / dailyArray[0].revenue) * 100 : 0,
      weeklyGrowth: weeklyArray.length > 1 ? 
        ((weeklyArray[weeklyArray.length - 1].revenue - weeklyArray[0].revenue) / weeklyArray[0].revenue) * 100 : 0,
      monthlyGrowth: monthlyArray.length > 1 ? 
        ((monthlyArray[monthlyArray.length - 1].revenue - monthlyArray[0].revenue) / monthlyArray[0].revenue) * 100 : 0
    };

    res.json({
      success: true,
      data: {
        dailyTrends: dailyArray,
        weeklyTrends: weeklyArray,
        monthlyTrends: monthlyArray,
        growthAnalysis
      }
    });
  } catch (error) {
    console.error('Sales trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sales trends report'
    });
  }
});

// Legacy sales route for backward compatibility
router.get('/sales', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range = 'today' } = req.query;
    const { start, end } = getDateRange(range, null, null);

    const orders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: start.toDate(),
          lte: end.toDate()
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
router.get('/top-products', requirePermission('reports.view'), async (req, res) => {
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

// Financial Reports Routes
// End of Day Report (Z Report)
router.get('/financial/end-of-day', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const orders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: start.toDate(),
          lte: end.toDate()
        }
      },
      include: {
        orderItems: true
      }
    });

    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);
    const totalOrders = orders.length;
    const totalItems = orders.reduce((sum, order) => 
      sum + order.orderItems.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    );
    const totalDiscounts = orders.reduce((sum, order) => sum + parseFloat(order.discount || 0), 0);
    const netRevenue = totalRevenue - totalDiscounts;

    // Payment method breakdown
    const paymentMethods = {};
    orders.forEach(order => {
      const method = order.paymentMethod || 'Unknown';
      if (!paymentMethods[method]) {
        paymentMethods[method] = { method, amount: 0, count: 0 };
      }
      paymentMethods[method].amount += parseFloat(order.total);
      paymentMethods[method].count += 1;
    });

    res.json({
      success: true,
      data: {
        zReportSummary: {
          grossSales: totalRevenue,
          totalOrders,
          totalItems,
          totalDiscounts,
          netSales: netRevenue,
          taxCollected: orders.reduce((sum, order) => sum + parseFloat(order.tax || 0), 0)
        },
        zReportDetails: [
          {
            id: 1,
            category: 'Food & Beverages',
            quantity: totalItems,
            grossSales: totalRevenue,
            tax: orders.reduce((sum, order) => sum + parseFloat(order.tax || 0), 0),
            netSales: netRevenue,
            discounts: totalDiscounts
          }
        ],
        paymentMethods: Object.values(paymentMethods),
        date: start.format('YYYY-MM-DD')
      }
    });
  } catch (error) {
    console.error('End of day report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get end of day report'
    });
  }
});

// Tax Summary Report
router.get('/financial/tax-summary', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const orders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: start.toDate(),
          lte: end.toDate()
        }
      }
    });

    const totalTax = orders.reduce((sum, order) => sum + parseFloat(order.tax || 0), 0);
    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);
    const taxRate = totalRevenue > 0 ? (totalTax / totalRevenue) * 100 : 0;

    res.json({
      success: true,
      data: {
        taxSummary: {
          totalTax,
          totalRevenue,
          taxRate,
          taxableSales: totalRevenue,
          totalOrders: orders.length,
          period: `${start.format('YYYY-MM-DD')} to ${end.format('YYYY-MM-DD')}`
        }
      }
    });
  } catch (error) {
    console.error('Tax summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tax summary'
    });
  }
});

// Profit Report
router.get('/financial/profit-report', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          status: 'COMPLETED',
          createdAt: {
            gte: start.toDate(),
            lte: end.toDate()
          }
        }
      },
      include: {
        product: true
      }
    });

    let totalRevenue = 0;
    let totalCost = 0;

    orderItems.forEach(item => {
      const revenue = parseFloat(item.subtotal);
      // Since costPrice is not available, we'll estimate cost as 60% of revenue for demonstration
      const estimatedCost = revenue * 0.6;
      totalRevenue += revenue;
      totalCost += estimatedCost;
    });

    const grossProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    res.json({
      success: true,
      data: {
        profitSummary: {
          revenue: totalRevenue,
          costOfGoods: totalCost,
          grossProfit,
          profitMargin,
          period: `${start.format('YYYY-MM-DD')} to ${end.format('YYYY-MM-DD')}`
        }
      }
    });
  } catch (error) {
    console.error('Profit report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profit report'
    });
  }
});

// Payment Summary
router.get('/financial/payment-summary', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const orders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: start.toDate(),
          lte: end.toDate()
        }
      }
    });

    const paymentMethods = {};
    orders.forEach(order => {
      const method = order.paymentMethod || 'Unknown';
      if (!paymentMethods[method]) {
        paymentMethods[method] = { method, amount: 0, count: 0 };
      }
      paymentMethods[method].amount += parseFloat(order.total);
      paymentMethods[method].count += 1;
    });

    const totalAmount = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);

    res.json({
      success: true,
      data: {
        paymentSummary: {
          cashPayments: paymentMethods['CASH']?.amount || 0,
          cardPayments: paymentMethods['CARD']?.amount || 0,
          digitalPayments: paymentMethods['DIGITAL']?.amount || 0,
          totalRevenue: totalAmount,
          period: `${start.format('YYYY-MM-DD')} to ${end.format('YYYY-MM-DD')}`
        },
        paymentChart: Object.values(paymentMethods).map(method => ({
          name: method.method,
          value: method.amount
        })),
        paymentDetails: orders.map(order => ({
          id: order.id,
          orderNumber: order.orderNumber,
          date: order.createdAt,
          method: order.paymentMethod || 'Unknown',
          amount: parseFloat(order.total),
          status: order.status,
          cashier: 'Cashier' // This would need to be fetched from user data
        }))
      }
    });
  } catch (error) {
    console.error('Payment summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment summary'
    });
  }
});

// Export Routes for each report type
// Sales Reports Export
router.get('/sales/:reportType/export', requirePermission('reports.view'), async (req, res) => {
  try {
    const { reportType } = req.params;
    const { range, startDate, endDate, format = 'csv' } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    // For now, return a simple CSV export
    const csvContent = `Report: ${reportType}\nDate Range: ${start.format('YYYY-MM-DD')} to ${end.format('YYYY-MM-DD')}\nGenerated: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}\n\n`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${reportType}-${range}-${dayjs().format('YYYY-MM-DD')}.csv`);
    res.send(csvContent);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export report'
    });
  }
});

// Staff Reports Export
router.get('/staff/:reportType/export', requirePermission('reports.view'), async (req, res) => {
  try {
    const { reportType } = req.params;
    const { range, startDate, endDate, format = 'csv' } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const csvContent = `Report: ${reportType}\nDate Range: ${start.format('YYYY-MM-DD')} to ${end.format('YYYY-MM-DD')}\nGenerated: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}\n\n`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${reportType}-${range}-${dayjs().format('YYYY-MM-DD')}.csv`);
    res.send(csvContent);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export report'
    });
  }
});

// Inventory Reports Export
router.get('/inventory/:reportType/export', requirePermission('reports.view'), async (req, res) => {
  try {
    const { reportType } = req.params;
    const { range, startDate, endDate, format = 'csv' } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const csvContent = `Report: ${reportType}\nDate Range: ${start.format('YYYY-MM-DD')} to ${end.format('YYYY-MM-DD')}\nGenerated: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}\n\n`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${reportType}-${range}-${dayjs().format('YYYY-MM-DD')}.csv`);
    res.send(csvContent);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export report'
    });
  }
});

// Financial Reports Export
router.get('/financial/:reportType/export', requirePermission('reports.view'), async (req, res) => {
  try {
    const { reportType } = req.params;
    const { range, startDate, endDate, format = 'csv' } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const csvContent = `Report: ${reportType}\nDate Range: ${start.format('YYYY-MM-DD')} to ${end.format('YYYY-MM-DD')}\nGenerated: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}\n\n`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${reportType}-${range}-${dayjs().format('YYYY-MM-DD')}.csv`);
    res.send(csvContent);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export report'
    });
  }
});

// Summary Reports Export
router.get('/summary/:reportType/export', requirePermission('reports.view'), async (req, res) => {
  try {
    const { reportType } = req.params;
    const { range, startDate, endDate, format = 'csv' } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const csvContent = `Report: ${reportType}\nDate Range: ${start.format('YYYY-MM-DD')} to ${end.format('YYYY-MM-DD')}\nGenerated: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}\n\n`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${reportType}-${range}-${dayjs().format('YYYY-MM-DD')}.csv`);
    res.send(csvContent);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export report'
    });
  }
});

// Operational Reports Routes
// Table Performance Report
router.get('/operational/table-performance', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const orders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: start.toDate(),
          lte: end.toDate()
        }
      },
      include: {
        table: true
      }
    });

    const tables = await prisma.table.findMany({
      where: { isActive: true }
    });

    const tablePerformance = {};
    tables.forEach(table => {
      tablePerformance[table.id] = {
        id: table.id,
        number: table.number,
        orderCount: 0,
        revenue: 0,
        utilization: 0,
        averageTurnTime: 0,
        status: table.status
      };
    });

    orders.forEach(order => {
      const tableId = order.tableId;
      if (tablePerformance[tableId]) {
        tablePerformance[tableId].orderCount += 1;
        tablePerformance[tableId].revenue += parseFloat(order.total);
      }
    });

    // Calculate utilization and average turn time
    const totalHours = (end.diff(start, 'hour') + 1);
    Object.values(tablePerformance).forEach(table => {
      table.utilization = Math.round((table.orderCount / totalHours) * 100);
      table.averageTurnTime = table.orderCount > 0 ? Math.round(totalHours / table.orderCount) : 0;
    });

    const tableSummary = {
      totalTables: tables.length,
      averageUtilization: Math.round(
        Object.values(tablePerformance).reduce((sum, table) => sum + table.utilization, 0) / tables.length
      ),
      averageRevenuePerTable: Object.values(tablePerformance).reduce((sum, table) => sum + table.revenue, 0) / tables.length,
      averageTurnTime: Math.round(
        Object.values(tablePerformance).reduce((sum, table) => sum + table.averageTurnTime, 0) / tables.length
      )
    };

    res.json({
      success: true,
      data: {
        tableSummary,
        tablePerformance: Object.values(tablePerformance),
        tableDetails: Object.values(tablePerformance)
      }
    });
  } catch (error) {
    console.error('Table performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get table performance report'
    });
  }
});

// Peak Hours Analysis
router.get('/operational/peak-hours', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const orders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: start.toDate(),
          lte: end.toDate()
        }
      }
    });

    const hourlyData = {};
    for (let i = 0; i < 24; i++) {
      hourlyData[i] = { hour: i, revenue: 0, orders: 0 };
    }

    orders.forEach(order => {
      const hour = dayjs(order.createdAt).hour();
      hourlyData[hour].revenue += parseFloat(order.total);
      hourlyData[hour].orders += 1;
    });

    const hourlyArray = Object.values(hourlyData);
    const peakHour = hourlyArray.reduce((max, hour) => hour.revenue > max.revenue ? hour : max);
    const peakSummary = {
      peakHours: `${peakHour.hour}:00`,
      peakRevenue: peakHour.revenue,
      peakOrders: peakHour.orders
    };

    // Day of week analysis
    const dayOfWeekData = {};
    orders.forEach(order => {
      const day = dayjs(order.createdAt).format('dddd');
      if (!dayOfWeekData[day]) {
        dayOfWeekData[day] = { day, revenue: 0, orders: 0 };
      }
      dayOfWeekData[day].revenue += parseFloat(order.total);
      dayOfWeekData[day].orders += 1;
    });

    res.json({
      success: true,
      data: {
        peakSummary,
        hourlyData: hourlyArray,
        dayOfWeekData: Object.values(dayOfWeekData)
      }
    });
  } catch (error) {
    console.error('Peak hours error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get peak hours report'
    });
  }
});

// Service Efficiency Report
router.get('/operational/service-efficiency', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const orders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: start.toDate(),
          lte: end.toDate()
        }
      }
    });

    const totalHours = (end.diff(start, 'hour') + 1);
    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);
    const totalOrders = orders.length;

    const efficiencyMetrics = {
      averageOrderTime: Math.round(totalHours / totalOrders),
      ordersPerHour: Math.round(totalOrders / totalHours),
      revenuePerHour: totalRevenue / totalHours,
      efficiencyScore: Math.round((totalOrders / totalHours) * 100)
    };

    // Efficiency trends (daily)
    const efficiencyTrends = {};
    orders.forEach(order => {
      const date = dayjs(order.createdAt).format('YYYY-MM-DD');
      if (!efficiencyTrends[date]) {
        efficiencyTrends[date] = { date, orderTime: 0, efficiency: 0, orders: 0 };
      }
      efficiencyTrends[date].orders += 1;
    });

    Object.values(efficiencyTrends).forEach(day => {
      day.orderTime = Math.round(24 / day.orders);
      day.efficiency = Math.round((day.orders / 24) * 100);
    });

    res.json({
      success: true,
      data: {
        efficiencyMetrics,
        efficiencyTrends: Object.values(efficiencyTrends)
      }
    });
  } catch (error) {
    console.error('Service efficiency error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get service efficiency report'
    });
  }
});

// Capacity Planning Report
router.get('/operational/capacity-planning', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const tables = await prisma.table.findMany({
      where: { isActive: true }
    });

    const orders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: start.toDate(),
          lte: end.toDate()
        }
      }
    });

    const totalSeats = tables.reduce((sum, table) => sum + table.capacity, 0);
    const totalHours = (end.diff(start, 'hour') + 1);
    const totalOrders = orders.length;
    const currentUtilization = Math.round((totalOrders / (totalSeats * totalHours)) * 100);

    const capacityMetrics = {
      optimalCapacity: totalSeats,
      currentUtilization,
      growthPotential: Math.max(0, 100 - currentUtilization)
    };

    const capacityRecommendations = [
      {
        icon: '🪑',
        title: 'Optimize Table Layout',
        description: 'Consider rearranging tables to maximize seating capacity during peak hours.',
        impact: 'Potential 15-20% increase in capacity utilization'
      },
      {
        icon: '⏰',
        title: 'Extend Peak Hour Operations',
        description: 'Increase staff during identified peak hours to handle more orders.',
        impact: 'Potential 25-30% increase in revenue during peak times'
      },
      {
        icon: '📊',
        title: 'Implement Reservation System',
        description: 'Better manage table allocation and reduce wait times.',
        impact: 'Potential 10-15% improvement in customer satisfaction'
      }
    ];

    res.json({
      success: true,
      data: {
        capacityMetrics,
        capacityRecommendations
      }
    });
  } catch (error) {
    console.error('Capacity planning error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get capacity planning report'
    });
  }
});

// Operational Metrics Report
router.get('/operational/operational-metrics', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const orders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: start.toDate(),
          lte: end.toDate()
        }
      }
    });

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);
    const totalHours = (end.diff(start, 'hour') + 1);

    const kpis = {
      customerSatisfaction: 85, // Placeholder - would need customer feedback system
      tableTurnoverRate: Math.round(totalOrders / totalHours),
      staffProductivity: Math.round((totalOrders / totalHours) * 100),
      operationalEfficiency: Math.round((totalRevenue / totalHours) * 100)
    };

    // Metrics comparison (current vs previous period)
    const previousStart = start.subtract(end.diff(start, 'day'), 'day');
    const previousEnd = end.subtract(end.diff(start, 'day'), 'day');

    const previousOrders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: previousStart.toDate(),
          lte: previousEnd.toDate()
        }
      }
    });

    const previousRevenue = previousOrders.reduce((sum, order) => sum + parseFloat(order.total), 0);
    const previousOrdersCount = previousOrders.length;

    const metricsComparison = [
      {
        metric: 'Revenue',
        current: totalRevenue,
        previous: previousRevenue
      },
      {
        metric: 'Orders',
        current: totalOrders,
        previous: previousOrdersCount
      },
      {
        metric: 'Avg Order Value',
        current: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        previous: previousOrdersCount > 0 ? previousRevenue / previousOrdersCount : 0
      }
    ];

    res.json({
      success: true,
      data: {
        kpis,
        metricsComparison
      }
    });
  } catch (error) {
    console.error('Operational metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get operational metrics report'
    });
  }
});

// Operational Reports Export
router.get('/operational/:reportType/export', requirePermission('reports.view'), async (req, res) => {
  try {
    const { reportType } = req.params;
    const { range, startDate, endDate, format = 'csv' } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const csvContent = `Operational Report: ${reportType}\nDate Range: ${start.format('YYYY-MM-DD')} to ${end.format('YYYY-MM-DD')}\nGenerated: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}\n\n`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=operational-${reportType}-${range}-${dayjs().format('YYYY-MM-DD')}.csv`);
    res.send(csvContent);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export report'
    });
  }
});

// Legacy export route for backward compatibility
router.get('/export', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range = 'today' } = req.query;
    const { start, end } = getDateRange(range, null, null);

    const orders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: start.toDate(),
          lte: end.toDate()
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
router.get('/order-stats', requirePermission('reports.view'), async (req, res) => {
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

// Inventory Reports Routes
// Current Stock Report
router.get('/inventory/current-stock', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const stock = await prisma.stock.findMany({
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

    const totalItems = stock.length;
    const totalValue = stock.reduce((sum, item) => sum + (item.quantity * parseFloat(item.product.price)), 0);
    const lowStockItems = stock.filter(item => item.quantity <= item.minStock).length;

    res.json({
      success: true,
      data: {
        stock,
        stockSummary: {
          totalItems,
          totalValue,
          lowStockItems,
          inStock: stock.filter(item => item.quantity > 0).length,
          lowStock: lowStockItems
        },
        stockDetails: stock.map(item => ({
          id: item.id,
          name: item.product.name,
          category: item.product.category.name,
          quantity: item.quantity,
          minStock: item.minStock,
          unitPrice: parseFloat(item.product.price),
          totalValue: item.quantity * parseFloat(item.product.price),
          status: item.quantity === 0 ? 'Out of Stock' : 
                  item.quantity <= item.minStock ? 'Low Stock' : 'In Stock'
        }))
      }
    });
  } catch (error) {
    console.error('Current stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get current stock report'
    });
  }
});

// Low Stock Alert
router.get('/inventory/low-stock-alert', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const lowStockItems = await prisma.stock.findMany({
      where: {
        quantity: {
          lte: prisma.stock.fields.minStock
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
      data: {
        lowStockItems,
        alertCount: lowStockItems.length,
        alertSummary: {
          criticalItems: lowStockItems.filter(item => item.quantity === 0).length,
          lowStockItems: lowStockItems.filter(item => item.quantity > 0 && item.quantity <= item.minStock).length,
          totalAlerts: lowStockItems.length,
          potentialLoss: lowStockItems.reduce((sum, item) => sum + (parseFloat(item.product.price) * item.quantity), 0)
        },
        alertDetails: lowStockItems.map(item => ({
          id: item.id,
          name: item.product.name,
          category: item.product.category.name,
          currentStock: item.quantity,
          minStock: item.minStock,
          deficit: Math.max(0, item.minStock - item.quantity),
          lastUpdated: item.updatedAt,
          alertLevel: item.quantity === 0 ? 'Critical' : 'Low Stock'
        }))
      }
    });
  } catch (error) {
    console.error('Low stock alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get low stock alert'
    });
  }
});

// Stock In/Out Report
router.get('/inventory/stock-in-out', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    // This would need a StockLog model in the database
    // For now, we'll return a placeholder
    res.json({
      success: true,
      data: {
        message: 'Stock log tracking not implemented yet',
        stockLogs: []
      }
    });
  } catch (error) {
    console.error('Stock in/out error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get stock in/out report'
    });
  }
});

// Stock Wastage/Adjustment
router.get('/inventory/stock-wastage', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    // This would need a StockAdjustment model in the database
    // For now, we'll return a placeholder
    res.json({
      success: true,
      data: {
        message: 'Stock adjustment tracking not implemented yet',
        adjustments: []
      }
    });
  } catch (error) {
    console.error('Stock wastage error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get stock wastage report'
    });
  }
});

// Stock Value Report
router.get('/inventory/stock-value', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const stock = await prisma.stock.findMany({
      include: {
        product: {
          include: {
            category: true
          }
        }
      }
    });

    const stockValue = stock.reduce((sum, item) => sum + (item.quantity * parseFloat(item.product.price)), 0);
    const categoryValues = {};

    stock.forEach(item => {
      const categoryName = item.product.category.name;
      if (!categoryValues[categoryName]) {
        categoryValues[categoryName] = { name: categoryName, value: 0, items: 0 };
      }
      categoryValues[categoryName].value += item.quantity * parseFloat(item.product.price);
      categoryValues[categoryName].items += 1;
    });

    res.json({
      success: true,
      data: {
        totalValue: stockValue,
        categoryValues: Object.values(categoryValues),
        stockItems: stock.length
      }
    });
  } catch (error) {
    console.error('Stock value error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get stock value report'
    });
  }
});

// Legacy stock route for backward compatibility
router.get('/stock', requirePermission('stock.read'), async (req, res) => {
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

// Get cashier dashboard data
router.get('/cashier-dashboard', requirePermission('reports.view'), async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get cashier's orders today
    const myOrdersToday = await prisma.order.count({
      where: {
        userId: userId,
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    // Get cashier's sales today
    const mySalesToday = await prisma.order.aggregate({
      where: {
        userId: userId,
        status: 'COMPLETED',
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      },
      _sum: {
        total: true
      }
    });

    // Get pending orders (all orders, not just cashier's)
    const pendingOrders = await prisma.order.count({
      where: {
        status: 'PENDING'
      }
    });

    // Get available tables
    const availableTables = await prisma.table.count({
      where: {
        status: 'AVAILABLE',
        isActive: true
      }
    });

    res.json({
      success: true,
      data: {
        myOrdersToday,
        mySalesToday: mySalesToday._sum.total || 0,
        pendingOrders,
        availableTables
      }
    });
  } catch (error) {
    console.error('Get cashier dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cashier dashboard data'
    });
  }
});

// Staff Reports Routes
// Sales by Cashier
router.get('/staff/sales-by-cashier', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const orders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: start.toDate(),
          lte: end.toDate()
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true
          }
        }
      }
    });

    const cashierSales = {};
    orders.forEach(order => {
      const userId = order.userId;
      if (!cashierSales[userId]) {
        cashierSales[userId] = {
          user: order.user,
          orderCount: 0,
          totalSales: 0,
          averageOrder: 0
        };
      }
      cashierSales[userId].orderCount += 1;
      cashierSales[userId].totalSales += parseFloat(order.total);
    });

    // Calculate average order
    Object.values(cashierSales).forEach(cashier => {
      cashier.averageOrder = cashier.orderCount > 0 ? cashier.totalSales / cashier.orderCount : 0;
    });

    res.json({
      success: true,
      data: {
        cashierPerformance: Object.values(cashierSales)
      }
    });
  } catch (error) {
    console.error('Sales by cashier error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sales by cashier'
    });
  }
});

// Cancelled Orders by Staff
router.get('/staff/cancelled-orders', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const cancelledOrders = await prisma.order.findMany({
      where: {
        status: 'CANCELLED',
        createdAt: {
          gte: start.toDate(),
          lte: end.toDate()
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true
          }
        }
      }
    });

    const staffCancellations = {};
    cancelledOrders.forEach(order => {
      const userId = order.userId;
      if (!staffCancellations[userId]) {
        staffCancellations[userId] = {
          user: order.user,
          cancelledCount: 0,
          totalAmount: 0,
          averageAmount: 0
        };
      }
      staffCancellations[userId].cancelledCount += 1;
      staffCancellations[userId].totalAmount += parseFloat(order.total);
    });

    // Calculate average amount
    Object.values(staffCancellations).forEach(staff => {
      staff.averageAmount = staff.cancelledCount > 0 ? staff.totalAmount / staff.cancelledCount : 0;
    });

    res.json({
      success: true,
      data: {
        staffCancellations: Object.values(staffCancellations)
      }
    });
  } catch (error) {
    console.error('Cancelled orders by staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cancelled orders by staff'
    });
  }
});

// Cancelled Orders by Staff (alternative route name for frontend compatibility)
router.get('/staff/cancelled-by-staff', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const cancelledOrders = await prisma.order.findMany({
      where: {
        status: 'CANCELLED',
        createdAt: {
          gte: start.toDate(),
          lte: end.toDate()
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true
          }
        }
      }
    });

    const staffCancellations = {};
    cancelledOrders.forEach(order => {
      const userId = order.userId;
      if (!staffCancellations[userId]) {
        staffCancellations[userId] = {
          user: order.user,
          cancelledCount: 0,
          totalAmount: 0,
          averageAmount: 0
        };
      }
      staffCancellations[userId].cancelledCount += 1;
      staffCancellations[userId].totalAmount += parseFloat(order.total);
    });

    // Calculate average amount
    Object.values(staffCancellations).forEach(staff => {
      staff.averageAmount = staff.cancelledCount > 0 ? staff.totalAmount / staff.cancelledCount : 0;
    });

    res.json({
      success: true,
      data: {
        staffCancellations: Object.values(staffCancellations)
      }
    });
  } catch (error) {
    console.error('Cancelled orders by staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cancelled orders by staff'
    });
  }
});

// Discounts Given by Staff
router.get('/staff/discounts-given', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const orders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        discount: {
          gt: 0
        },
        createdAt: {
          gte: start.toDate(),
          lte: end.toDate()
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true
          }
        }
      }
    });

    const staffDiscounts = {};
    orders.forEach(order => {
      const userId = order.userId;
      if (!staffDiscounts[userId]) {
        staffDiscounts[userId] = {
          user: order.user,
          discountCount: 0,
          totalDiscount: 0,
          averageDiscount: 0
        };
      }
      staffDiscounts[userId].discountCount += 1;
      staffDiscounts[userId].totalDiscount += parseFloat(order.discount);
    });

    // Calculate average discount
    Object.values(staffDiscounts).forEach(staff => {
      staff.averageDiscount = staff.discountCount > 0 ? staff.totalDiscount / staff.discountCount : 0;
    });

    res.json({
      success: true,
      data: {
        staffDiscounts: Object.values(staffDiscounts)
      }
    });
  } catch (error) {
    console.error('Discounts given by staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get discounts given by staff'
    });
  }
});

// Discounts Given by Staff (alternative route name for frontend compatibility)
router.get('/staff/discounts-by-staff', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const orders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        discount: {
          gt: 0
        },
        createdAt: {
          gte: start.toDate(),
          lte: end.toDate()
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true
          }
        }
      }
    });

    const staffDiscounts = {};
    orders.forEach(order => {
      const userId = order.userId;
      if (!staffDiscounts[userId]) {
        staffDiscounts[userId] = {
          user: order.user,
          discountCount: 0,
          totalDiscount: 0,
          averageDiscount: 0
        };
      }
      staffDiscounts[userId].discountCount += 1;
      staffDiscounts[userId].totalDiscount += parseFloat(order.discount);
    });

    // Calculate average discount
    Object.values(staffDiscounts).forEach(staff => {
      staff.averageDiscount = staff.discountCount > 0 ? staff.totalDiscount / staff.discountCount : 0;
    });

    res.json({
      success: true,
      data: {
        staffDiscounts: Object.values(staffDiscounts)
      }
    });
  } catch (error) {
    console.error('Discounts given by staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get discounts given by staff'
    });
  }
});

// Login/Shift Report (if supported)
router.get('/staff/login-shift', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    // This would need a Shift model in the database
    // For now, we'll return a placeholder
    res.json({
      success: true,
      data: {
        message: 'Shift tracking not implemented yet',
        shifts: []
      }
    });
  } catch (error) {
    console.error('Login/shift report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get login/shift report'
    });
  }
});

// Legacy cashier performance route for backward compatibility
router.get('/cashier-performance', requirePermission('reports.view'), async (req, res) => {
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

// Summary Reports Routes
// Weekly/Monthly Sales Summary
router.get('/summary/weekly-monthly', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const orders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: start.toDate(),
          lte: end.toDate()
        }
      },
      include: {
        orderItems: true
      }
    });

    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);
    const totalOrders = orders.length;
    const totalItems = orders.reduce((sum, order) => 
      sum + order.orderItems.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    );
    const averageOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Sales trend by period
    const salesTrend = {};
    orders.forEach(order => {
      const period = range === 'week' ? 
        dayjs(order.createdAt).format('YYYY-[W]WW') : 
        dayjs(order.createdAt).format('YYYY-MM');
      
      if (!salesTrend[period]) {
        salesTrend[period] = { period, revenue: 0, orders: 0 };
      }
      salesTrend[period].revenue += parseFloat(order.total);
      salesTrend[period].orders += 1;
    });

    res.json({
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        totalItems,
        averageOrder,
        salesTrend: Object.values(salesTrend)
      }
    });
  } catch (error) {
    console.error('Weekly/monthly summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get weekly/monthly summary'
    });
  }
});

// Top 10 Items Sold
router.get('/summary/top-items', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          status: 'COMPLETED',
          createdAt: {
            gte: start.toDate(),
            lte: end.toDate()
          }
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

    const itemSales = {};
    orderItems.forEach(item => {
      const productId = item.productId;
      if (!itemSales[productId]) {
        itemSales[productId] = {
          id: productId,
          name: item.product.name,
          category: item.product.category.name,
          quantity: 0,
          revenue: 0
        };
      }
      itemSales[productId].quantity += item.quantity;
      itemSales[productId].revenue += parseFloat(item.subtotal);
    });

    const topItems = Object.values(itemSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    res.json({
      success: true,
      data: {
        topItems
      }
    });
  } catch (error) {
    console.error('Top items error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get top items'
    });
  }
});

// Slow-Moving Items
router.get('/summary/slow-moving', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          status: 'COMPLETED',
          createdAt: {
            gte: start.toDate(),
            lte: end.toDate()
          }
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

    const itemSales = {};
    orderItems.forEach(item => {
      const productId = item.productId;
      if (!itemSales[productId]) {
        itemSales[productId] = {
          id: productId,
          name: item.product.name,
          category: item.product.category.name,
          quantity: 0,
          revenue: 0
        };
      }
      itemSales[productId].quantity += item.quantity;
      itemSales[productId].revenue += parseFloat(item.subtotal);
    });

    const slowMovingItems = Object.values(itemSales)
      .sort((a, b) => a.quantity - b.quantity)
      .slice(0, 10);

    res.json({
      success: true,
      data: {
        slowMovingItems
      }
    });
  } catch (error) {
    console.error('Slow moving items error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get slow moving items'
    });
  }
});

// Total Orders vs Revenue
router.get('/summary/orders-vs-revenue', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const orders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: start.toDate(),
          lte: end.toDate()
        }
      },
      include: {
        orderItems: true
      }
    });

    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);
    const totalOrders = orders.length;
    const totalItems = orders.reduce((sum, order) => 
      sum + order.orderItems.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    );
    const averageOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const averageItemsPerOrder = totalOrders > 0 ? totalItems / totalOrders : 0;

    // Daily breakdown
    const dailyData = {};
    orders.forEach(order => {
      const date = dayjs(order.createdAt).format('YYYY-MM-DD');
      if (!dailyData[date]) {
        dailyData[date] = { date, orders: 0, revenue: 0, items: 0 };
      }
      dailyData[date].orders += 1;
      dailyData[date].revenue += parseFloat(order.total);
      dailyData[date].items += order.orderItems.reduce((sum, item) => sum + item.quantity, 0);
    });

    res.json({
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        totalItems,
        averageOrder,
        averageItemsPerOrder,
        dailyData: Object.values(dailyData)
      }
    });
  } catch (error) {
    console.error('Orders vs revenue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get orders vs revenue data'
    });
  }
});

// Total Orders vs Revenue (alternative route name for frontend compatibility)
router.get('/summary/orders-revenue', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const orders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: start.toDate(),
          lte: end.toDate()
        }
      },
      include: {
        orderItems: true
      }
    });

    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);
    const totalOrders = orders.length;
    const totalItems = orders.reduce((sum, order) => 
      sum + order.orderItems.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    );
    const averageOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const averageItemsPerOrder = totalOrders > 0 ? totalItems / totalOrders : 0;

    // Daily breakdown
    const dailyData = {};
    orders.forEach(order => {
      const date = dayjs(order.createdAt).format('YYYY-MM-DD');
      if (!dailyData[date]) {
        dailyData[date] = { date, orders: 0, revenue: 0, items: 0 };
      }
      dailyData[date].orders += 1;
      dailyData[date].revenue += parseFloat(order.total);
      dailyData[date].items += order.orderItems.reduce((sum, item) => sum + item.quantity, 0);
    });

    res.json({
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        totalItems,
        averageOrder,
        averageItemsPerOrder,
        dailyData: Object.values(dailyData)
      }
    });
  } catch (error) {
    console.error('Orders vs revenue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get orders vs revenue data'
    });
  }
});

// Simplified Sales Routes
// Menu Performance Report
router.get('/sales/menu-performance', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const orders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: start.toDate(),
          lte: end.toDate()
        }
      },
      include: {
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

    const itemSales = {};
    orders.forEach(order => {
      order.orderItems.forEach(item => {
        const productId = item.productId;
        if (!itemSales[productId]) {
          itemSales[productId] = {
            id: productId,
            name: item.product.name,
            category: item.product.category.name,
            quantity: 0,
            revenue: 0,
            averagePrice: 0
          };
        }
        itemSales[productId].quantity += item.quantity;
        itemSales[productId].revenue += parseFloat(item.price) * item.quantity;
      });
    });

    // Calculate average price
    Object.values(itemSales).forEach(item => {
      item.averagePrice = item.quantity > 0 ? item.revenue / item.quantity : 0;
    });

    // Sort by revenue
    const sortedItems = Object.values(itemSales).sort((a, b) => b.revenue - a.revenue);
    const topItems = sortedItems.slice(0, 10);

    res.json({
      success: true,
      data: {
        items: sortedItems,
        topItems: topItems.map(item => ({
          name: item.name,
          revenue: item.revenue
        }))
      }
    });
  } catch (error) {
    console.error('Menu performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get menu performance report'
    });
  }
});

// Peak Hours Report
router.get('/sales/peak-hours', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const orders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: start.toDate(),
          lte: end.toDate()
        }
      }
    });

    const hourlyData = {};
    for (let i = 0; i < 24; i++) {
      hourlyData[i] = { hour: i, revenue: 0, orders: 0 };
    }

    orders.forEach(order => {
      const hour = dayjs(order.createdAt).hour();
      hourlyData[hour].revenue += parseFloat(order.total);
      hourlyData[hour].orders += 1;
    });

    const hourlyArray = Object.values(hourlyData);
    const peakHour = hourlyArray.reduce((max, hour) => hour.revenue > max.revenue ? hour : max);
    const slowHour = hourlyArray.reduce((min, hour) => hour.revenue < min.revenue ? hour : min);
    const averageRevenue = hourlyArray.reduce((sum, hour) => sum + hour.revenue, 0) / 24;

    const peakHours = {
      peak: `${peakHour.hour}:00`,
      slow: `${slowHour.hour}:00`,
      average: averageRevenue
    };

    res.json({
      success: true,
      data: {
        peakHours,
        hourlySales: hourlyArray
      }
    });
  } catch (error) {
    console.error('Peak hours error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get peak hours report'
    });
  }
});

// Table Performance Report
router.get('/sales/table-performance', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const orders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: start.toDate(),
          lte: end.toDate()
        }
      },
      include: {
        table: true
      }
    });

    const tableSales = {};
    const tables = await prisma.table.findMany({ where: { isActive: true } });

    tables.forEach(table => {
      tableSales[table.id] = {
        id: table.id,
        number: table.number,
        orderCount: 0,
        revenue: 0,
        averageOrder: 0,
        utilization: 0
      };
    });

    orders.forEach(order => {
      const tableId = order.tableId;
      if (tableSales[tableId]) {
        tableSales[tableId].orderCount += 1;
        tableSales[tableId].revenue += parseFloat(order.total);
      }
    });

    // Calculate averages and utilization
    const totalHours = (end.diff(start, 'hour') + 1);
    Object.values(tableSales).forEach(table => {
      table.averageOrder = table.orderCount > 0 ? table.revenue / table.orderCount : 0;
      table.utilization = Math.round((table.orderCount / totalHours) * 100);
    });

    res.json({
      success: true,
      data: {
        tableSales: Object.values(tableSales).map(table => ({
          tableNumber: table.number,
          revenue: table.revenue
        })),
        tableDetails: Object.values(tableSales)
      }
    });
  } catch (error) {
    console.error('Table performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get table performance report'
    });
  }
});

// Discounts Report
router.get('/sales/discounts', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const orders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        discount: {
          gt: 0
        },
        createdAt: {
          gte: start.toDate(),
          lte: end.toDate()
        }
      },
      include: {
        user: {
          select: {
            name: true
          }
        }
      }
    });

    const totalDiscounts = orders.length;
    const totalAmount = orders.reduce((sum, order) => sum + parseFloat(order.discount), 0);
    const averageDiscount = totalDiscounts > 0 ? totalAmount / totalDiscounts : 0;
    const staffCount = new Set(orders.map(order => order.userId)).size;

    const discountSummary = {
      totalDiscounts,
      totalAmount,
      averageDiscount,
      staffCount
    };

    const discountDetails = orders.map(order => ({
      id: order.id,
      orderNumber: order.id,
      staffName: order.user.name,
      amount: parseFloat(order.discount),
      reason: 'Discount applied',
      date: order.createdAt
    }));

    res.json({
      success: true,
      data: {
        discountSummary,
        discountDetails
      }
    });
  } catch (error) {
    console.error('Discounts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get discounts report'
    });
  }
});

// Staff Reports Routes
router.get('/staff/performance', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    // Get staff performance data
    const staffPerformance = await prisma.order.groupBy({
      by: ['userId'],
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: start.toDate(),
          lte: end.toDate()
        }
      },
      _sum: {
        total: true
      },
      _count: true
    });

    // Get all users in one query for better performance
    const userIds = staffPerformance.map(staff => staff.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, role: true }
    });
    
    const userMap = new Map(users.map(user => [user.id, user]));
    
    const staffDetails = staffPerformance.map((staff) => {
      const user = userMap.get(staff.userId);
      
      return {
        id: staff.userId,
        name: user?.name || 'Unknown',
        role: user?.role || 'N/A',
        orders: staff._count,
        sales: staff._sum.total || 0,
        performance: Math.round((staff._sum.total || 0) / staff._count * 100) / 100
      };
    });

    const totalStaff = staffDetails.length;
    const totalOrders = staffDetails.reduce((sum, staff) => sum + staff.orders, 0);
    const totalSales = staffDetails.reduce((sum, staff) => sum + staff.sales, 0);
    const averagePerformance = totalStaff > 0 ? totalSales / totalStaff : 0;

    res.json({
      success: true,
      data: {
        performanceSummary: {
          totalStaff,
          totalOrders,
          totalSales,
          averagePerformance: Math.round(averagePerformance * 100) / 100
        },
        staffPerformance: staffDetails.map(staff => ({
          name: staff.name,
          sales: staff.sales
        })),
        staffDetails
      }
    });
  } catch (error) {
    console.error('Staff performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get staff performance report'
    });
  }
});

router.get('/staff/activity', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    // Get staff activity data
    const staffActivity = await prisma.order.groupBy({
      by: ['userId'],
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: start.toDate(),
          lte: end.toDate()
        }
      },
      _count: true
    });

    // Get all users in one query for better performance
    const userIds = staffActivity.map(staff => staff.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true }
    });
    
    const userMap = new Map(users.map(user => [user.id, user]));
    
    const staffDetails = staffActivity.map((staff) => {
      const user = userMap.get(staff.userId);
      
      return {
        name: user?.name || 'Unknown',
        orders: staff._count
      };
    });

    const activeStaff = staffDetails.length;
    const ordersToday = staffDetails.reduce((sum, staff) => sum + staff.orders, 0);
    const avgResponseTime = 5; // Mock data

    res.json({
      success: true,
      data: {
        activitySummary: {
          activeStaff,
          ordersToday,
          avgResponseTime
        },
        staffActivity: staffDetails
      }
    });
  } catch (error) {
    console.error('Staff activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get staff activity report'
    });
  }
});

router.get('/staff/sales', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    // Get staff sales data
    const staffSales = await prisma.order.groupBy({
      by: ['userId'],
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: start.toDate(),
          lte: end.toDate()
        }
      },
      _sum: {
        total: true
      },
      _count: true
    });

    const staffDetails = await Promise.all(
      staffSales.map(async (staff) => {
        const user = await prisma.user.findUnique({
          where: { id: staff.userId },
          select: { name: true }
        });
        
        return {
          name: user?.name || 'Unknown',
          sales: staff._sum.total || 0
        };
      })
    );

    const totalSales = staffDetails.reduce((sum, staff) => sum + staff.sales, 0);
    const topPerformer = staffDetails.length > 0 ? 
      staffDetails.reduce((max, staff) => staff.sales > max.sales ? staff : max).name : 'N/A';
    const averageSale = staffDetails.length > 0 ? totalSales / staffDetails.length : 0;
    const targetMet = 85; // Mock data

    res.json({
      success: true,
      data: {
        salesSummary: {
          totalSales,
          topPerformer,
          averageSale,
          targetMet
        },
        staffSales: staffDetails
      }
    });
  } catch (error) {
    console.error('Staff sales error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get staff sales report'
    });
  }
});

router.get('/staff/hours', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    // Mock staff hours data
    const staffHours = [
      { name: 'John Doe', hours: 8 },
      { name: 'Jane Smith', hours: 7.5 },
      { name: 'Mike Johnson', hours: 6 }
    ];

    const totalHours = staffHours.reduce((sum, staff) => sum + staff.hours, 0);
    const staffOnDuty = staffHours.length;
    const averageShift = totalHours / staffOnDuty;

    res.json({
      success: true,
      data: {
        hoursSummary: {
          totalHours,
          staffOnDuty,
          averageShift: Math.round(averageShift * 10) / 10
        },
        staffHours
      }
    });
  } catch (error) {
    console.error('Staff hours error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get staff hours report'
    });
  }
});

// Inventory Reports Routes
router.get('/inventory/stock-levels', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    // Get stock levels data
    const stockItems = await prisma.stock.findMany({
      include: {
        product: {
          select: {
            name: true,
            category: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    const stockDetails = stockItems.map(item => ({
      id: item.id,
      name: item.product.name,
      category: item.product.category.name,
      quantity: item.quantity,
      minLevel: item.minStock || 10,
      value: item.quantity * (item.product.price || 0)
    }));

    const totalItems = stockDetails.length;
    const inStock = stockDetails.filter(item => item.quantity > 0).length;
    const lowStock = stockDetails.filter(item => item.quantity <= item.minStock).length;
    const totalValue = stockDetails.reduce((sum, item) => sum + item.value, 0);

    const stockLevels = stockDetails.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = 0;
      }
      acc[item.category] += item.quantity;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        stockSummary: {
          totalItems,
          inStock,
          lowStock,
          totalValue
        },
        stockLevels: Object.entries(stockLevels).map(([category, quantity]) => ({
          category,
          quantity
        })),
        stockDetails
      }
    });
  } catch (error) {
    console.error('Stock levels error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get stock levels report'
    });
  }
});

router.get('/inventory/wastage', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    // Mock wastage data
    const wastageByCategory = [
      { name: 'Vegetables', wastage: 15 },
      { name: 'Meat', wastage: 8 },
      { name: 'Dairy', wastage: 12 },
      { name: 'Grains', wastage: 5 }
    ];

    const wastageDetails = [
      { id: 1, name: 'Tomatoes', category: 'Vegetables', wastagePercentage: 20, lostValue: 45.50, reason: 'Spoilage' },
      { id: 2, name: 'Chicken Breast', category: 'Meat', wastagePercentage: 10, lostValue: 32.00, reason: 'Expired' }
    ];

    const totalWastage = wastageByCategory.reduce((sum, item) => sum + item.wastage, 0);
    const lostValue = wastageDetails.reduce((sum, item) => sum + item.lostValue, 0);
    const itemsWasted = wastageDetails.length;
    const averageWastage = totalWastage / wastageByCategory.length;

    res.json({
      success: true,
      data: {
        wastageSummary: {
          totalWastage,
          lostValue,
          itemsWasted,
          averageWastage: Math.round(averageWastage * 10) / 10
        },
        wastageByCategory,
        wastageDetails
      }
    });
  } catch (error) {
    console.error('Wastage error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get wastage report'
    });
  }
});

router.get('/inventory/movements', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    // Mock movements data
    const movements = [
      { date: '2024-01-01', stockIn: 50, stockOut: 30 },
      { date: '2024-01-02', stockIn: 40, stockOut: 35 },
      { date: '2024-01-03', stockIn: 60, stockOut: 45 }
    ];

    const stockIn = movements.reduce((sum, day) => sum + day.stockIn, 0);
    const stockOut = movements.reduce((sum, day) => sum + day.stockOut, 0);
    const netMovement = stockIn - stockOut;

    res.json({
      success: true,
      data: {
        movementsSummary: {
          stockIn,
          stockOut,
          netMovement
        },
        movements
      }
    });
  } catch (error) {
    console.error('Movements error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get movements report'
    });
  }
});

router.get('/inventory/alerts', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    // Get low stock alerts
    const lowStockItems = await prisma.stock.findMany({
      where: {
        quantity: {
          lte: 10
        }
      },
      include: {
        product: {
          select: {
            name: true,
            category: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    const alerts = lowStockItems.map(item => ({
      id: item.id,
      itemName: item.product.name,
      type: 'Low Stock',
      currentLevel: item.quantity,
      threshold: item.minStock || 10,
      expiryDate: null,
      priority: item.quantity <= 5 ? 'High' : item.quantity <= 8 ? 'Medium' : 'Low'
    }));

    const lowStock = alerts.filter(alert => alert.priority === 'High').length;
    const expiringSoon = 0; // Mock data
    const totalAlerts = alerts.length;

    res.json({
      success: true,
      data: {
        alertsSummary: {
          lowStock,
          expiringSoon,
          totalAlerts
        },
        alerts
      }
    });
  } catch (error) {
    console.error('Alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get alerts report'
    });
  }
});

// Financial Reports Routes
router.get('/financial/profit', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    // Get profit data
    const orders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: start.toDate(),
          lte: end.toDate()
        }
      }
    });

    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);
    const totalCosts = totalRevenue * 0.6; // Mock cost calculation
    const netProfit = totalRevenue - totalCosts;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    const profitChart = [
      { date: '2024-01-01', revenue: 1200, costs: 720, profit: 480 },
      { date: '2024-01-02', revenue: 1500, costs: 900, profit: 600 },
      { date: '2024-01-03', revenue: 1100, costs: 660, profit: 440 }
    ];

    res.json({
      success: true,
      data: {
        profitSummary: {
          totalRevenue,
          totalCosts,
          netProfit,
          profitMargin: Math.round(profitMargin * 100) / 100
        },
        profitChart
      }
    });
  } catch (error) {
    console.error('Profit error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profit report'
    });
  }
});

router.get('/financial/tax', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    // Mock tax data
    const taxChart = [
      { name: 'Sales Tax', amount: 450 },
      { name: 'VAT', amount: 320 },
      { name: 'Other Taxes', amount: 180 }
    ];

    const totalTax = taxChart.reduce((sum, tax) => sum + tax.amount, 0);
    const taxableAmount = 9500; // Mock data
    const taxRate = 10; // Mock data

    res.json({
      success: true,
      data: {
        taxSummary: {
          totalTax,
          taxableAmount,
          taxRate
        },
        taxChart
      }
    });
  } catch (error) {
    console.error('Tax error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tax report'
    });
  }
});

router.get('/financial/payments', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    // Mock payment data
    const paymentChart = [
      { method: 'Card', amount: 2500 },
      { method: 'Cash', amount: 1800 },
      { method: 'Digital', amount: 1200 }
    ];

    const cardPayments = paymentChart.find(p => p.method === 'Card')?.amount || 0;
    const cashPayments = paymentChart.find(p => p.method === 'Cash')?.amount || 0;
    const digitalPayments = paymentChart.find(p => p.method === 'Digital')?.amount || 0;
    const totalPayments = cardPayments + cashPayments + digitalPayments;

    res.json({
      success: true,
      data: {
        paymentSummary: {
          cardPayments,
          cashPayments,
          digitalPayments,
          totalPayments
        },
        paymentChart
      }
    });
  } catch (error) {
    console.error('Payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payments report'
    });
  }
});

router.get('/financial/end-of-day', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    // Get end of day data
    const orders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: start.toDate(),
          lte: end.toDate()
        }
      }
    });

    const dailyRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);
    const ordersToday = orders.length;
    const averageOrderValue = ordersToday > 0 ? dailyRevenue / ordersToday : 0;
    const closingTime = '22:00'; // Mock data

    const endOfDayDetails = [
      { category: 'Food', amount: dailyRevenue * 0.7, count: ordersToday * 0.8, percentage: 70 },
      { category: 'Beverages', amount: dailyRevenue * 0.2, count: ordersToday * 0.9, percentage: 20 },
      { category: 'Desserts', amount: dailyRevenue * 0.1, count: ordersToday * 0.3, percentage: 10 }
    ];

    res.json({
      success: true,
      data: {
        endOfDaySummary: {
          dailyRevenue,
          ordersToday,
          averageOrderValue: Math.round(averageOrderValue * 100) / 100,
          closingTime
        },
        endOfDayDetails
      }
    });
  } catch (error) {
    console.error('End of day error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get end of day report'
    });
  }
});

module.exports = router; 