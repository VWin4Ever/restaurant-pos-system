const express = require('express');
const { PrismaClient } = require('@prisma/client');
const dayjs = require('dayjs');
const { requirePermission } = require('../middleware/permissions');

const router = express.Router();
const prisma = new PrismaClient();

// Helper function for realistic cost price calculations
const getRealisticCostPrice = (product) => {
  // Use actual cost price if available
  if (product.costPrice && parseFloat(product.costPrice) > 0) {
    return parseFloat(product.costPrice);
  }
  
  // Category-based realistic estimates based on restaurant industry standards
  const categoryEstimates = {
    'Beverages': 0.25,    // 25% cost (drinks have high margins)
    'Coffee': 0.20,       // 20% cost (coffee has very high margins)
    'Tea': 0.15,          // 15% cost (tea has extremely high margins)
    'Food': 0.40,         // 40% cost (food has moderate margins)
    'Appetizers': 0.35,   // 35% cost (appetizers have good margins)
    'Main Course': 0.45,  // 45% cost (main courses have lower margins)
    'Desserts': 0.35,     // 35% cost (desserts have good margins)
    'Salads': 0.50,       // 50% cost (salads have lower margins due to freshness)
    'Soups': 0.30,        // 30% cost (soups have good margins)
    'Sandwiches': 0.42,   // 42% cost (sandwiches have moderate margins)
    'Pizza': 0.38,        // 38% cost (pizza has good margins)
    'Pasta': 0.35,        // 35% cost (pasta has good margins)
    'Seafood': 0.55,      // 55% cost (seafood has lower margins)
    'Meat': 0.50,         // 50% cost (meat has lower margins)
    'Vegetarian': 0.45,   // 45% cost (vegetarian has moderate margins)
    'Kids Menu': 0.40,    // 40% cost (kids menu has moderate margins)
    'Specials': 0.45      // 45% cost (specials have moderate margins)
  };
  
  const categoryName = product.category?.name || 'Food';
  const estimate = categoryEstimates[categoryName] || 0.40; // Default to 40% for unknown categories
  
  return parseFloat(product.price) * estimate;
};

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
      const categoryName = item.product.category?.name || 'Unknown';
      if (!categorySales[categoryName]) {
        categorySales[categoryName] = { name: categoryName, revenue: 0, quantity: 0 };
      }
      
      // Ensure proper number conversion and validation
      const subtotal = parseFloat(item.subtotal) || 0;
      const quantity = parseInt(item.quantity) || 0;
      
      categorySales[categoryName].revenue += subtotal;
      categorySales[categoryName].quantity += quantity;
    });

    const categorySalesArray = Object.values(categorySales)
      .filter(item => item.revenue > 0 || item.quantity > 0) // Filter out empty categories
      .sort((a, b) => b.revenue - a.revenue)
      .map(item => ({
        name: item.name,
        revenue: parseFloat(item.revenue.toFixed(2)), // Ensure proper decimal formatting
        quantity: parseInt(item.quantity)
      }));

    console.log('Category sales response:', JSON.stringify({
      success: true,
      data: {
        categorySales: categorySalesArray
      }
    }, null, 2));
    
    res.json({
      success: true,
      data: {
        categorySales: categorySalesArray
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

// Comparative Analysis Report
router.get('/comparative/period-analysis', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate, compareWith } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    // Calculate comparison period
    let compareStart, compareEnd;
    const periodLength = end.diff(start, 'day');
    
    if (compareWith === 'previous_period') {
      compareEnd = start.subtract(1, 'day');
      compareStart = compareEnd.subtract(periodLength, 'day');
    } else if (compareWith === 'same_period_last_year') {
      compareStart = start.subtract(1, 'year');
      compareEnd = end.subtract(1, 'year');
    } else {
      // Default to previous period
      compareEnd = start.subtract(1, 'day');
      compareStart = compareEnd.subtract(periodLength, 'day');
    }

    // Get current period data
    const currentOrders = await prisma.order.findMany({
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

    // Get comparison period data
    const comparisonOrders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: compareStart.toDate(),
          lte: compareEnd.toDate()
        }
      },
      include: {
        orderItems: true
      }
    });

    // Calculate metrics for both periods
    const calculateMetrics = (orders) => {
      const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);
      const totalOrders = orders.length;
      const totalItems = orders.reduce((sum, order) => 
        sum + order.orderItems.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
      );
      const averageOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      
      return { totalRevenue, totalOrders, totalItems, averageOrder };
    };

    const currentMetrics = calculateMetrics(currentOrders);
    const comparisonMetrics = calculateMetrics(comparisonOrders);

    // Calculate growth percentages
    const calculateGrowth = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const growthAnalysis = {
      revenueGrowth: calculateGrowth(currentMetrics.totalRevenue, comparisonMetrics.totalRevenue),
      ordersGrowth: calculateGrowth(currentMetrics.totalOrders, comparisonMetrics.totalOrders),
      itemsGrowth: calculateGrowth(currentMetrics.totalItems, comparisonMetrics.totalItems),
      averageOrderGrowth: calculateGrowth(currentMetrics.averageOrder, comparisonMetrics.averageOrder)
    };

    // Add context and benchmarks to growth metrics
    const getGrowthContext = (value, metric) => {
      const thresholds = {
        revenue: { excellent: 25, good: 15, moderate: 5, poor: -5 },
        orders: { excellent: 20, good: 10, moderate: 3, poor: -3 },
        items: { excellent: 20, good: 10, moderate: 3, poor: -3 },
        averageOrder: { excellent: 15, good: 8, moderate: 2, poor: -2 }
      };
      
      const t = thresholds[metric] || thresholds.revenue;
      if (value >= t.excellent) return { level: 'excellent', color: 'green', icon: '🚀' };
      if (value >= t.good) return { level: 'good', color: 'blue', icon: '📈' };
      if (value >= t.moderate) return { level: 'moderate', color: 'yellow', icon: '📊' };
      if (value >= t.poor) return { level: 'poor', color: 'orange', icon: '⚠️' };
      return { level: 'critical', color: 'red', icon: '🔻' };
    };

    const growthWithContext = {
      revenue: {
        ...growthAnalysis,
        revenueGrowth: growthAnalysis.revenueGrowth,
        context: getGrowthContext(growthAnalysis.revenueGrowth, 'revenue')
      },
      orders: {
        growth: growthAnalysis.ordersGrowth,
        context: getGrowthContext(growthAnalysis.ordersGrowth, 'orders')
      },
      items: {
        growth: growthAnalysis.itemsGrowth,
        context: getGrowthContext(growthAnalysis.itemsGrowth, 'items')
      },
      averageOrder: {
        growth: growthAnalysis.averageOrderGrowth,
        context: getGrowthContext(growthAnalysis.averageOrderGrowth, 'averageOrder')
      }
    };

    res.json({
      success: true,
      data: {
        currentPeriod: {
          ...currentMetrics,
          period: `${start.format('YYYY-MM-DD')} to ${end.format('YYYY-MM-DD')}`
        },
        comparisonPeriod: {
          ...comparisonMetrics,
          period: `${compareStart.format('YYYY-MM-DD')} to ${compareEnd.format('YYYY-MM-DD')}`
        },
        growthAnalysis,
        growthWithContext,
        comparisonType: compareWith || 'previous_period'
      }
    });
  } catch (error) {
    console.error('Period analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get period analysis'
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

// Enhanced Profit Report with Real Data and Category Analysis
router.get('/financial/profit', requirePermission('reports.view'), async (req, res) => {
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

    let totalRevenue = 0;
    let totalCost = 0;
    const categoryAnalysis = {};

    orderItems.forEach(item => {
      const revenue = parseFloat(item.subtotal);
      const costPrice = getRealisticCostPrice(item.product);
      const actualCost = costPrice * item.quantity;
      const profit = revenue - actualCost;
      
      totalRevenue += revenue;
      totalCost += actualCost;

      // Category analysis
      const categoryName = item.product.category?.name || 'Unknown';
      if (!categoryAnalysis[categoryName]) {
        categoryAnalysis[categoryName] = {
          category: categoryName,
          revenue: 0,
          cost: 0,
          profit: 0,
          quantity: 0,
          margin: 0
        };
      }
      
      categoryAnalysis[categoryName].revenue += revenue;
      categoryAnalysis[categoryName].cost += actualCost;
      categoryAnalysis[categoryName].profit += profit;
      categoryAnalysis[categoryName].quantity += item.quantity;
    });

    // Calculate margins for each category
    Object.values(categoryAnalysis).forEach(cat => {
      cat.margin = cat.revenue > 0 ? (cat.profit / cat.revenue) * 100 : 0;
    });

    const grossProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    // Generate profit trend chart (daily breakdown)
    const dailyData = {};
    const daysDiff = end.diff(start, 'day');
    
    for (let i = 0; i <= daysDiff; i++) {
      const currentDate = start.add(i, 'day');
      const dateKey = currentDate.format('YYYY-MM-DD');
      dailyData[dateKey] = { date: dateKey, revenue: 0, costs: 0, profit: 0 };
    }

    // Aggregate daily data
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

    orders.forEach(order => {
      const orderDate = dayjs(order.createdAt).format('YYYY-MM-DD');
      if (dailyData[orderDate]) {
        const orderRevenue = parseFloat(order.total);
        let orderCost = 0;
        
        order.orderItems.forEach(item => {
          const costPrice = getRealisticCostPrice(item.product);
          orderCost += costPrice * item.quantity;
        });
        
        dailyData[orderDate].revenue += orderRevenue;
        dailyData[orderDate].costs += orderCost;
        dailyData[orderDate].profit += (orderRevenue - orderCost);
      }
    });

    const profitChart = Object.values(dailyData).sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({
      success: true,
      data: {
        profitSummary: {
          totalRevenue,
          totalCosts: totalCost,
          netProfit: grossProfit,
          profitMargin: Math.round(profitMargin * 100) / 100,
          period: `${start.format('YYYY-MM-DD')} to ${end.format('YYYY-MM-DD')}`
        },
        categoryAnalysis: Object.values(categoryAnalysis),
        profitChart
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

    // Calculate utilization and average turn time with realistic business hours
    const BUSINESS_HOURS_PER_DAY = 12; // 12 hours operation (e.g., 10 AM - 10 PM)
    const totalBusinessHours = Math.ceil(end.diff(start, 'day')) * BUSINESS_HOURS_PER_DAY;
    
    Object.values(tablePerformance).forEach(table => {
      // More realistic utilization calculation
      table.utilization = Math.min(100, Math.round((table.orderCount / Math.max(1, totalBusinessHours / 24)) * 100));
      table.averageTurnTime = table.orderCount > 0 ? Math.round(totalBusinessHours / table.orderCount) : 0;
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
    // Fetch all stock items and filter in application layer
    // Prisma doesn't support comparing two fields (quantity <= minStock) in a where clause
    const allStock = await prisma.stock.findMany({
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

    // Filter for low stock items (quantity <= minStock)
    const lowStockItems = allStock.filter(item => item.quantity <= item.minStock);

    // Transform to expected format with simplified structure for dashboard
    const alertsFormatted = lowStockItems.map(item => ({
      id: item.id,
      productName: item.product.name,
      category: item.product.category.name,
      currentStock: item.quantity,
      minStock: item.minStock,
      deficit: Math.max(0, item.minStock - item.quantity),
      lastUpdated: item.updatedAt,
      alertLevel: item.quantity === 0 ? 'Critical' : 'Low Stock'
    }));

    res.json({
      success: true,
      data: alertsFormatted,
      alertSummary: {
        criticalItems: lowStockItems.filter(item => item.quantity === 0).length,
        lowStockItems: lowStockItems.filter(item => item.quantity > 0 && item.quantity <= item.minStock).length,
        totalAlerts: lowStockItems.length,
        potentialLoss: lowStockItems.reduce((sum, item) => sum + (parseFloat(item.product.price) * item.quantity), 0)
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

// Get cashier-specific sales data
router.get('/cashier-sales', requirePermission('reports.view'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    // Get cashier's sales for the period
    const sales = await prisma.order.findMany({
      where: {
        userId: userId,
        status: 'COMPLETED',
        createdAt: {
          gte: start.toDate(),
          lte: end.toDate()
        }
      },
      select: {
        total: true,
        createdAt: true
      },
      orderBy: { createdAt: 'asc' }
    });

    // Group by date for chart data
    const salesByDate = {};
    sales.forEach(order => {
      const date = order.createdAt.toISOString().split('T')[0];
      if (!salesByDate[date]) {
        salesByDate[date] = { date, revenue: 0, orders: 0 };
      }
      salesByDate[date].revenue += parseFloat(order.total);
      salesByDate[date].orders += 1;
    });

    const chartData = Object.values(salesByDate);

    res.json({
      success: true,
      data: chartData
    });
  } catch (error) {
    console.error('Get cashier sales error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cashier sales data'
    });
  }
});

// Get cashier-specific top products
router.get('/cashier-top-products', requirePermission('reports.view'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { range, startDate, endDate, limit = 5 } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          userId: userId,
          status: 'COMPLETED',
          createdAt: {
            gte: start.toDate(),
            lte: end.toDate()
          }
        }
      },
      _sum: {
        quantity: true,
        subtotal: true
      },
      orderBy: {
        _sum: {
          quantity: 'desc'
        }
      },
      take: parseInt(limit)
    });

    // Get product details
    const productIds = topProducts.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, category: { select: { name: true } } }
    });

    const result = topProducts.map(item => {
      const product = products.find(p => p.id === item.productId);
      return {
        productId: item.productId,
        productName: product?.name || 'Unknown Product',
        category: product?.category?.name || 'Unknown',
        quantity: item._sum.quantity || 0,
        revenue: item._sum.subtotal || 0
      };
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get cashier top products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cashier top products data'
    });
  }
});

// Get cashier-specific sales summary
router.get('/cashier-summary', requirePermission('reports.view'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    // Get cashier's sales for the period
    const sales = await prisma.order.aggregate({
      where: {
        userId: userId,
        status: 'COMPLETED',
        createdAt: {
          gte: start.toDate(),
          lte: end.toDate()
        }
      },
      _sum: {
        total: true,
        subtotal: true,
        tax: true,
        discount: true
      },
      _count: true
    });

    // Get total items sold
    const totalItems = await prisma.orderItem.aggregate({
      where: {
        order: {
          userId: userId,
          status: 'COMPLETED',
          createdAt: {
            gte: start.toDate(),
            lte: end.toDate()
          }
        }
      },
      _sum: {
        quantity: true
      }
    });

    // Get order count by status
    const statusCounts = await prisma.order.groupBy({
      by: ['status'],
      where: {
        userId: userId,
        createdAt: {
          gte: start.toDate(),
          lte: end.toDate()
        }
      },
      _count: true
    });

    const statusBreakdown = statusCounts.reduce((acc, item) => {
      acc[item.status.toLowerCase()] = item._count;
      return acc;
    }, {});

    // Get daily sales for trend chart
    const dailyOrders = await prisma.order.findMany({
      where: {
        userId: userId,
        status: 'COMPLETED',
        createdAt: {
          gte: start.toDate(),
          lte: end.toDate()
        }
      },
      select: {
        total: true,
        createdAt: true
      },
      orderBy: { createdAt: 'asc' }
    });

    // Group by date for trend chart
    const dailySalesData = {};
    dailyOrders.forEach(order => {
      const date = order.createdAt.toISOString().split('T')[0];
      if (!dailySalesData[date]) {
        dailySalesData[date] = { date, revenue: 0, orders: 0 };
      }
      dailySalesData[date].revenue += parseFloat(order.total);
      dailySalesData[date].orders += 1;
    });

    const dailySales = Object.values(dailySalesData).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    res.json({
      success: true,
      data: {
        totalRevenue: sales._sum.total || 0,
        totalOrders: sales._count,
        totalItems: totalItems._sum.quantity || 0,
        averageOrder: sales._count > 0 ? (sales._sum.total || 0) / sales._count : 0,
        averageOrderValue: sales._count > 0 ? (sales._sum.total || 0) / sales._count : 0,
        totalTax: sales._sum.tax || 0,
        totalDiscount: sales._sum.discount || 0,
        statusBreakdown,
        dailySales
      }
    });
  } catch (error) {
    console.error('Get cashier summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cashier summary data'
    });
  }
});

// Get cashier-specific menu performance
router.get('/cashier-menu-performance', requirePermission('reports.view'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const menuPerformance = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          userId: userId,
          status: 'COMPLETED',
          createdAt: {
            gte: start.toDate(),
            lte: end.toDate()
          }
        }
      },
      _sum: {
        quantity: true,
        subtotal: true
      },
      _avg: {
        price: true
      },
      orderBy: {
        _sum: {
          quantity: 'desc'
        }
      }
    });

    // Get product details
    const productIds = menuPerformance.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { category: { select: { name: true } } }
    });

    const result = menuPerformance.map(item => {
      const product = products.find(p => p.id === item.productId);
      return {
        productId: item.productId,
        productName: product?.name || 'Unknown Product',
        category: product?.category?.name || 'Unknown',
        quantitySold: item._sum.quantity || 0,
        revenue: item._sum.subtotal || 0,
        averagePrice: item._avg.price || 0,
        price: product?.price || 0
      };
    });

    res.json({
      success: true,
      data: {
        topItems: result.slice(0, 10).map(item => ({
          name: item.productName,
          revenue: item.revenue,
          quantity: item.quantitySold
        })),
        items: result
      }
    });
  } catch (error) {
    console.error('Get cashier menu performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cashier menu performance data'
    });
  }
});

// Get cashier-specific category sales
router.get('/cashier-category-sales', requirePermission('reports.view'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const orderItems = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          userId: userId,
          status: 'COMPLETED',
          createdAt: {
            gte: start.toDate(),
            lte: end.toDate()
          }
        }
      },
      _sum: {
        quantity: true,
        subtotal: true
      }
    });

    // Get product categories
    const productIds = orderItems.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { category: { select: { name: true } } }
    });

    // Group by category
    const categoryData = {};
    orderItems.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      const categoryName = product?.category?.name || 'Unknown';
      
      if (!categoryData[categoryName]) {
        categoryData[categoryName] = {
          category: categoryName,
          revenue: 0,
          quantity: 0,
          orderCount: 0
        };
      }
      
      // Ensure proper number conversion and validation
      const subtotal = parseFloat(item._sum.subtotal) || 0;
      const quantity = parseInt(item._sum.quantity) || 0;
      
      categoryData[categoryName].revenue += subtotal;
      categoryData[categoryName].quantity += quantity;
      categoryData[categoryName].orderCount += 1;
    });

    const categorySalesArray = Object.values(categoryData)
      .filter(item => item.revenue > 0 || item.quantity > 0) // Filter out empty categories
      .sort((a, b) => b.revenue - a.revenue)
      .map(item => ({
        name: item.category,
        revenue: parseFloat(item.revenue.toFixed(2)), // Ensure proper decimal formatting
        quantity: parseInt(item.quantity),
        orderCount: parseInt(item.orderCount)
      }));

    console.log('Cashier category sales response:', JSON.stringify({
      success: true,
      data: {
        categorySales: categorySalesArray
      }
    }, null, 2));
    
    res.json({
      success: true,
      data: {
        categorySales: categorySalesArray
      }
    });
  } catch (error) {
    console.error('Get cashier category sales error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cashier category sales data'
    });
  }
});

// Get cashier-specific peak hours
router.get('/cashier-peak-hours', requirePermission('reports.view'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    // Get orders with their creation times
    const orders = await prisma.order.findMany({
      where: {
        userId: userId,
        status: 'COMPLETED',
        createdAt: {
          gte: start.toDate(),
          lte: end.toDate()
        }
      },
      select: {
        total: true,
        createdAt: true
      }
    });

    // Group by hour
    const hourlyData = {};
    orders.forEach(order => {
      const hour = new Date(order.createdAt).getHours();
      const hourKey = `${hour.toString().padStart(2, '0')}:00`;
      
      if (!hourlyData[hourKey]) {
        hourlyData[hourKey] = {
          hour: hourKey,
          revenue: 0,
          orders: 0
        };
      }
      
      hourlyData[hourKey].revenue += parseFloat(order.total);
      hourlyData[hourKey].orders += 1;
    });

    // Fill in missing hours with zero data
    for (let i = 0; i < 24; i++) {
      const hourKey = `${i.toString().padStart(2, '0')}:00`;
      if (!hourlyData[hourKey]) {
        hourlyData[hourKey] = {
          hour: hourKey,
          revenue: 0,
          orders: 0
        };
      }
    }

    const hourlySales = Object.values(hourlyData).sort((a, b) => 
      parseInt(a.hour.split(':')[0]) - parseInt(b.hour.split(':')[0])
    );

    // Find peak and slow hours
    const sortedByRevenue = hourlySales.sort((a, b) => b.revenue - a.revenue);
    const peakHour = sortedByRevenue.length > 0 ? sortedByRevenue[0].hour : 'N/A';
    const slowHour = sortedByRevenue.length > 0 ? sortedByRevenue[sortedByRevenue.length - 1].hour : 'N/A';
    const averageRevenue = hourlySales.reduce((sum, hour) => sum + hour.revenue, 0) / 24;

    res.json({
      success: true,
      data: {
        peakHours: {
          peak: peakHour,
          slow: slowHour,
          average: averageRevenue
        },
        hourlySales
      }
    });
  } catch (error) {
    console.error('Get cashier peak hours error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cashier peak hours data'
    });
  }
});

// Get cashier-specific activity
router.get('/cashier-activity', requirePermission('reports.view'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    // Get cashier's orders for the period
    const orders = await prisma.order.findMany({
      where: {
        userId: userId,
        createdAt: {
          gte: start.toDate(),
          lte: end.toDate()
        }
      },
      include: {
        table: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate activity metrics
    const totalOrders = orders.length;
    const completedOrders = orders.filter(order => order.status === 'COMPLETED').length;
    const pendingOrders = orders.filter(order => order.status === 'PENDING').length;
    const cancelledOrders = orders.filter(order => order.status === 'CANCELLED').length;
    
    const totalRevenue = orders
      .filter(order => order.status === 'COMPLETED')
      .reduce((sum, order) => sum + parseFloat(order.total), 0);

    const averageOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0;

    res.json({
      success: true,
      data: {
        totalOrders,
        completedOrders,
        pendingOrders,
        cancelledOrders,
        totalRevenue,
        averageOrderValue,
        recentOrders: orders.slice(0, 10).map(order => ({
          id: order.id,
          orderNumber: order.orderNumber,
          tableName: order.table.name,
          total: order.total,
          status: order.status,
          createdAt: order.createdAt
        }))
      }
    });
  } catch (error) {
    console.error('Get cashier activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cashier activity data'
    });
  }
});

// Get cashier-specific discounts
router.get('/cashier-discounts', requirePermission('reports.view'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    // Get cashier's orders with discounts
    const orders = await prisma.order.findMany({
      where: {
        userId: userId,
        status: 'COMPLETED',
        createdAt: {
          gte: start.toDate(),
          lte: end.toDate()
        },
        discount: {
          gt: 0.00
        }
      },
      select: {
        id: true,
        orderNumber: true,
        total: true,
        discount: true,
        subtotal: true,
        createdAt: true,
        table: {
          select: { number: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate discount summary
    const totalDiscountAmount = orders.reduce((sum, order) => sum + parseFloat(order.discount), 0);
    const totalOrdersWithDiscounts = orders.length;
    const averageDiscount = totalOrdersWithDiscounts > 0 ? totalDiscountAmount / totalOrdersWithDiscounts : 0;
    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);
    const discountPercentage = totalRevenue > 0 ? (totalDiscountAmount / totalRevenue) * 100 : 0;

    // Group discounts by amount ranges
    const discountRanges = {
      '0-5%': 0,
      '5-10%': 0,
      '10-15%': 0,
      '15%+': 0
    };

    orders.forEach(order => {
      const subtotal = parseFloat(order.subtotal) || 0;
      const discount = parseFloat(order.discount) || 0;
      const discountPercent = subtotal > 0 ? (discount / subtotal) * 100 : 0;
      
      if (discountPercent < 5) discountRanges['0-5%']++;
      else if (discountPercent < 10) discountRanges['5-10%']++;
      else if (discountPercent < 15) discountRanges['10-15%']++;
      else discountRanges['15%+']++;
    });

    const discountChart = Object.entries(discountRanges).map(([range, count]) => ({
      range,
      count,
      percentage: totalOrdersWithDiscounts > 0 ? (count / totalOrdersWithDiscounts) * 100 : 0
    }));

    const responseData = {
      success: true,
      data: {
        discountSummary: {
          totalDiscounts: totalOrdersWithDiscounts, // Count of orders with discounts
          totalAmount: totalDiscountAmount, // Total discount amount
          averageDiscount,
          staffCount: 1 // For cashier, it's always 1
        },
        discountChart,
        discountDetails: orders.slice(0, 10).map(order => {
          const subtotal = parseFloat(order.subtotal) || 0;
          const discount = parseFloat(order.discount) || 0;
          return {
            id: order.id,
            orderNumber: order.orderNumber,
            staffName: req.user.name, // Cashier's name
            amount: discount,
            reason: 'Discount applied',
            date: order.createdAt
          };
        })
      }
    };
    
    console.log('Cashier discounts response:', JSON.stringify(responseData, null, 2));
    res.json(responseData);
  } catch (error) {
    console.error('Get cashier discounts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cashier discounts data'
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

    // Get staff performance data with optimized query
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
        total: true,
        discount: true
      },
      _count: true,
      _avg: {
        total: true
      },
      orderBy: {
        _sum: {
          total: 'desc'
        }
      }
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


router.get('/financial/tax', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    // Get tax rate from settings
    const settings = await prisma.settings.findFirst();
    const taxRate = settings?.taxRate || 8.5; // Default to 8.5% if not set

    const orders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: start.toDate(),
          lte: end.toDate()
        }
      }
    });

    let totalRevenue = 0;
    let totalTax = 0;
    let taxableAmount = 0;

    orders.forEach(order => {
      const orderTotal = parseFloat(order.total);
      const orderTax = parseFloat(order.tax || 0);
      const orderSubtotal = parseFloat(order.subtotal || (orderTotal - orderTax));
      
      totalRevenue += orderTotal;
      totalTax += orderTax;
      taxableAmount += orderSubtotal;
    });

    // Calculate actual tax rate from data
    const actualTaxRate = taxableAmount > 0 ? (totalTax / taxableAmount) * 100 : taxRate;

    // Tax breakdown by category
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

    const categoryTaxBreakdown = {};
    orderItems.forEach(item => {
      const categoryName = item.product.category?.name || 'Unknown';
      const itemSubtotal = parseFloat(item.subtotal);
      const itemTax = itemSubtotal * (taxRate / 100);
      
      if (!categoryTaxBreakdown[categoryName]) {
        categoryTaxBreakdown[categoryName] = {
          category: categoryName,
          taxableAmount: 0,
          taxAmount: 0,
          percentage: 0
        };
      }
      
      categoryTaxBreakdown[categoryName].taxableAmount += itemSubtotal;
      categoryTaxBreakdown[categoryName].taxAmount += itemTax;
    });

    // Calculate percentage of total tax for each category
    Object.values(categoryTaxBreakdown).forEach(cat => {
      cat.percentage = totalTax > 0 ? (cat.taxAmount / totalTax) * 100 : 0;
    });

    const taxChart = Object.values(categoryTaxBreakdown);

    res.json({
      success: true,
      data: {
        taxSummary: {
          totalRevenue,
          taxableAmount,
          totalTax,
          taxRate: Math.round(actualTaxRate * 100) / 100,
          configuredTaxRate: taxRate
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

    const orders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: start.toDate(),
          lte: end.toDate()
        }
      }
    });

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

    // Calculate totals
    const cardPayments = paymentMethods['CARD']?.amount || 0;
    const cashPayments = paymentMethods['CASH']?.amount || 0;
    const digitalPayments = paymentMethods['DIGITAL']?.amount || 0;
    const totalPayments = Object.values(paymentMethods).reduce((sum, pm) => sum + pm.amount, 0);

    // Format for chart
    const paymentChart = Object.values(paymentMethods).map(pm => ({
      method: pm.method,
      amount: pm.amount,
      count: pm.count,
      percentage: totalPayments > 0 ? (pm.amount / totalPayments) * 100 : 0
    }));

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

    // Get end of day data with order items
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

    const dailyRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);
    const ordersToday = orders.length;
    const averageOrderValue = ordersToday > 0 ? dailyRevenue / ordersToday : 0;
    
    // Calculate actual closing time from last order
    const lastOrder = orders.length > 0 ? 
      orders.reduce((latest, order) => 
        new Date(order.createdAt) > new Date(latest.createdAt) ? order : latest
      ) : null;
    
    const closingTime = lastOrder ? 
      dayjs(lastOrder.createdAt).format('HH:mm') : 
      'No orders';

    // Real category analysis
    const categoryAnalysis = {};
    let totalItems = 0;

    orders.forEach(order => {
      order.orderItems.forEach(item => {
        const categoryName = item.product.category?.name || 'Unknown';
        const itemAmount = parseFloat(item.subtotal);
        
        if (!categoryAnalysis[categoryName]) {
          categoryAnalysis[categoryName] = {
            category: categoryName,
            amount: 0,
            count: 0,
            percentage: 0
          };
        }
        
        categoryAnalysis[categoryName].amount += itemAmount;
        categoryAnalysis[categoryName].count += item.quantity;
        totalItems += item.quantity;
      });
    });

    // Calculate percentages
    Object.values(categoryAnalysis).forEach(cat => {
      cat.percentage = dailyRevenue > 0 ? (cat.amount / dailyRevenue) * 100 : 0;
    });

    const endOfDayDetails = Object.values(categoryAnalysis);

    res.json({
      success: true,
      data: {
        endOfDaySummary: {
          dailyRevenue,
          ordersToday,
          averageOrderValue: Math.round(averageOrderValue * 100) / 100,
          closingTime,
          totalItems
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

// Enhanced Sales Report with Advanced Filtering
router.get('/sales/enhanced', requirePermission('reports.view'), async (req, res) => {
  try {
    const { 
      range, 
      startDate, 
      endDate, 
      staffId, 
      paymentMethod, 
      tableId, 
      categoryId,
      minAmount,
      maxAmount
    } = req.query;
    
    const { start, end } = getDateRange(range, startDate, endDate);

    // Build enhanced where clause
    const where = {
      status: 'COMPLETED',
      createdAt: {
        gte: start.toDate(),
        lte: end.toDate()
      }
    };

    // Add optional filters
    if (staffId) where.userId = parseInt(staffId);
    if (paymentMethod) where.paymentMethod = paymentMethod;
    if (tableId) where.tableId = parseInt(tableId);
    if (minAmount || maxAmount) {
      where.total = {};
      if (minAmount) where.total.gte = parseFloat(minAmount);
      if (maxAmount) where.total.lte = parseFloat(maxAmount);
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, username: true }
        },
        table: {
          select: { id: true, number: true }
        },
        orderItems: {
          include: {
            product: {
              include: {
                category: {
                  select: { id: true, name: true }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Filter orders by category if specified
    let filteredOrders = orders;
    if (categoryId) {
      filteredOrders = orders.filter(order => 
        order.orderItems.some(item => item.product.categoryId === parseInt(categoryId))
      );
    }

    // Calculate enhanced metrics
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + parseFloat(order.total), 0);
    const totalOrders = filteredOrders.length;
    const totalItems = filteredOrders.reduce((sum, order) => 
      sum + order.orderItems.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    );
    const averageOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Staff performance breakdown
    const staffPerformance = {};
    filteredOrders.forEach(order => {
      const staffId = order.userId;
      if (!staffPerformance[staffId]) {
        staffPerformance[staffId] = {
          user: order.user,
          orders: 0,
          revenue: 0,
          items: 0
        };
      }
      staffPerformance[staffId].orders += 1;
      staffPerformance[staffId].revenue += parseFloat(order.total);
      staffPerformance[staffId].items += order.orderItems.reduce((sum, item) => sum + item.quantity, 0);
    });

    // Payment method breakdown
    const paymentBreakdown = {};
    filteredOrders.forEach(order => {
      const method = order.paymentMethod || 'Unknown';
      if (!paymentBreakdown[method]) {
        paymentBreakdown[method] = { method, count: 0, amount: 0 };
      }
      paymentBreakdown[method].count += 1;
      paymentBreakdown[method].amount += parseFloat(order.total);
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          totalOrders,
          totalItems,
          averageOrder
        },
        staffPerformance: Object.values(staffPerformance),
        paymentBreakdown: Object.values(paymentBreakdown),
        orders: filteredOrders,
        appliedFilters: {
          dateRange: `${start.format('YYYY-MM-DD')} to ${end.format('YYYY-MM-DD')}`,
          staffId: staffId || 'All',
          paymentMethod: paymentMethod || 'All',
          tableId: tableId || 'All',
          categoryId: categoryId || 'All',
          amountRange: `${minAmount || '0'} - ${maxAmount || '∞'}`
        }
      }
    });
  } catch (error) {
    console.error('Enhanced sales report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get enhanced sales report'
    });
  }
});

module.exports = router; 