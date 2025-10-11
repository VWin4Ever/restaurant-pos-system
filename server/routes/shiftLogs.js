const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const ShiftOverrideLogger = require('../services/shiftOverrideLogger');

const router = express.Router();
const prisma = new PrismaClient();

// Helper function to convert time string to minutes
function timeToMinutes(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

// ENHANCED: Helper function to check if current time is within shift time
function isWithinShiftTime(currentTime, startTime, endTime, gracePeriod, daysOfWeek = null) {
  // Check days of week first
  if (daysOfWeek) {
    try {
      const allowedDays = JSON.parse(daysOfWeek);
      const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
      
      if (!allowedDays.includes(currentDay)) {
        return false; // Not a valid day for this shift
      }
    } catch (error) {
      console.error('Error parsing days of week:', error);
      // Continue with time check if days parsing fails
    }
  }

  const current = timeToMinutes(currentTime);
  const start = timeToMinutes(startTime) - gracePeriod;
  const end = timeToMinutes(endTime) + gracePeriod;

  // Handle overnight shifts (e.g., 23:00 - 07:00)
  if (start > end) {
    return current >= start || current <= end;
  }

  return current >= start && current <= end;
}

// Clock in
router.post('/clock-in', authenticateToken, [
  body('notes').optional().isString().withMessage('Notes must be a string'),
  body('openingBalance').optional().isFloat({ min: 0 }).withMessage('Opening balance must be a positive number')
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

    const userId = req.user.id;
    const { notes, openingBalance } = req.body;

    // Check if user has a shift assigned
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        shift: true
      }
    });

    if (!user || !user.shift) {
      return res.status(400).json({
        success: false,
        message: 'No shift assigned to user'
      });
    }

    // Check if user is already clocked in
    const activeClockIn = await prisma.shiftLog.findFirst({
      where: {
        userId,
        type: 'CLOCK_IN',
        clockOut: null
      }
    });

    if (activeClockIn) {
      return res.status(400).json({
        success: false,
        message: 'User is already clocked in'
      });
    }

    // Check if it's within shift time (with grace period)
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    const shift = user.shift;

    if (!isWithinShiftTime(currentTime, shift.startTime, shift.endTime, shift.gracePeriod, shift.daysOfWeek)) {
      return res.status(400).json({
        success: false,
        message: `Cannot clock in outside shift time. Shift: ${shift.startTime} - ${shift.endTime} (Grace period: ${shift.gracePeriod} minutes)`,
        errorCode: 'OUTSIDE_SHIFT_TIME',
        shiftInfo: {
          name: shift.name,
          startTime: shift.startTime,
          endTime: shift.endTime,
          gracePeriod: shift.gracePeriod,
          daysOfWeek: shift.daysOfWeek
        }
      });
    }

    // Create clock in log
    const shiftLog = await prisma.shiftLog.create({
      data: {
        userId,
        shiftId: user.shiftId,
        type: 'CLOCK_IN',
        clockIn: now,
        notes,
        openingBalance: openingBalance ? parseFloat(openingBalance) : null
      },
      include: {
        shift: {
          select: {
            name: true,
            startTime: true,
            endTime: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Clocked in successfully',
      data: shiftLog
    });
  } catch (error) {
    console.error('Error clocking in:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clock in'
    });
  }
});

// Clock out
router.post('/clock-out', authenticateToken, [
  body('notes').optional().isString().withMessage('Notes must be a string'),
  body('closingBalance').optional().isFloat({ min: 0 }).withMessage('Closing balance must be a positive number')
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

    const userId = req.user.id;
    const { notes, closingBalance } = req.body;

    // Find active clock in
    const activeClockIn = await prisma.shiftLog.findFirst({
      where: {
        userId,
        type: 'CLOCK_IN',
        clockOut: null
      },
      include: {
        shift: true
      }
    });

    if (!activeClockIn) {
      return res.status(400).json({
        success: false,
        message: 'User is not clocked in'
      });
    }

    // Check if user is trying to clock out early (before shift ends)
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    const shift = activeClockIn.shift;

    // Allow clock out at any time - no early clock-out restrictions
    // Cashiers can clock out whenever they need to
    // The attendance report will show the actual hours worked

    // Calculate cash difference if both opening and closing balances are provided
    let cashDifference = null;
    let expectedBalance = null;
    
    if (activeClockIn.openingBalance && closingBalance) {
      // ENHANCED FIX: Get total CASH sales for this shift to calculate expected balance
      const shiftStart = activeClockIn.clockIn;
      const totalCashSales = await prisma.order.aggregate({
        where: {
          userId,
          createdAt: {
            gte: shiftStart,
            lte: now
          },
          paymentMethod: 'CASH', // Only cash payments
          status: { in: ['COMPLETED', 'PENDING'] } // Include pending cash orders
        },
        _sum: {
          total: true
        }
      });
      
      // Subtract any cash refunds or cancellations
      const totalCashRefunds = await prisma.order.aggregate({
        where: {
          userId,
          createdAt: {
            gte: shiftStart,
            lte: now
          },
          paymentMethod: 'CASH',
          status: 'CANCELLED'
        },
        _sum: {
          total: true
        }
      });
      
      const netCashSales = (totalCashSales._sum.total || 0) - (totalCashRefunds._sum.total || 0);
      expectedBalance = activeClockIn.openingBalance + netCashSales;
      cashDifference = parseFloat(closingBalance) - expectedBalance;
    }

    // Update clock out
    const shiftLog = await prisma.shiftLog.update({
      where: { id: activeClockIn.id },
      data: {
        clockOut: now,
        notes: notes || activeClockIn.notes,
        closingBalance: closingBalance ? parseFloat(closingBalance) : null,
        expectedBalance,
        cashDifference
      },
      include: {
        shift: {
          select: {
            name: true,
            startTime: true,
            endTime: true
          }
        }
      }
    });

    // Calculate work duration
    const duration = Math.round((now - activeClockIn.clockIn) / (1000 * 60)); // minutes

    res.json({
      success: true,
      message: 'Clocked out successfully',
      data: {
        ...shiftLog,
        durationMinutes: duration,
        durationHours: Math.round(duration / 60 * 100) / 100
      }
    });
  } catch (error) {
    console.error('Error clocking out:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clock out'
    });
  }
});

// Get user's shift logs
router.get('/my-logs', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, startDate, endDate } = req.query;

    const where = {
      userId
    };

    // Add date filters if provided
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const shiftLogs = await prisma.shiftLog.findMany({
      where,
      include: {
        shift: {
          select: {
            name: true,
            startTime: true,
            endTime: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: parseInt(limit)
    });

    const total = await prisma.shiftLog.count({ where });

    res.json({
      success: true,
      data: shiftLogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching shift logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shift logs'
    });
  }
});

// Get current user's shift status
router.get('/my-status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user with shift info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        shift: true
      }
    });

    if (!user || !user.shift) {
      return res.json({
        success: true,
        data: {
          hasShift: false,
          isClockedIn: false,
          message: 'No shift assigned'
        }
      });
    }

    // Check if currently clocked in
    const activeClockIn = await prisma.shiftLog.findFirst({
      where: {
        userId,
        type: 'CLOCK_IN',
        clockOut: null
      }
    });

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    const isWithinShift = isWithinShiftTime(currentTime, user.shift.startTime, user.shift.endTime, user.shift.gracePeriod);

    res.json({
      success: true,
      data: {
        hasShift: true,
        isClockedIn: !!activeClockIn,
        shift: {
          id: user.shift.id,
          name: user.shift.name,
          startTime: user.shift.startTime,
          endTime: user.shift.endTime,
          gracePeriod: user.shift.gracePeriod
        },
        isWithinShiftTime: isWithinShift,
        currentTime,
        clockInTime: activeClockIn?.clockIn
      }
    });
  } catch (error) {
    console.error('Error fetching shift status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shift status'
    });
  }
});

// Admin: Get all shift logs
router.get('/all', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { page = 1, limit = 20, userId, shiftId, startDate, endDate } = req.query;

    const where = {};

    if (userId) where.userId = parseInt(userId);
    if (shiftId) where.shiftId = parseInt(shiftId);
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const shiftLogs = await prisma.shiftLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true
          }
        },
        shift: {
          select: {
            id: true,
            name: true,
            startTime: true,
            endTime: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: parseInt(limit)
    });

    const total = await prisma.shiftLog.count({ where });

    res.json({
      success: true,
      data: shiftLogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching all shift logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shift logs'
    });
  }
});

// Admin: Extend shift duration
router.post('/extend/:userId', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { duration, notes } = req.body;
    const userId = parseInt(req.params.userId);

    // Find active clock in
    const activeClockIn = await prisma.shiftLog.findFirst({
      where: {
        userId,
        type: 'CLOCK_IN',
        clockOut: null
      },
      include: {
        shift: true
      }
    });

    if (!activeClockIn) {
      return res.status(400).json({
        success: false,
        message: 'User is not currently clocked in'
      });
    }

    // Create extension log
    const extensionLog = await prisma.shiftLog.create({
      data: {
        userId,
        shiftId: activeClockIn.shiftId,
        type: 'OVERTIME_START',
        notes: `Shift extended by ${duration} minutes. ${notes || ''}`
      }
    });

    res.json({
      success: true,
      message: `Shift extended by ${duration} minutes`,
      data: extensionLog
    });
  } catch (error) {
    console.error('Error extending shift:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to extend shift'
    });
  }
});

// Admin: Force logout user
router.post('/force-logout/:userId', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { notes } = req.body;
    const userId = parseInt(req.params.userId);

    // Find active clock in
    const activeClockIn = await prisma.shiftLog.findFirst({
      where: {
        userId,
        type: 'CLOCK_IN',
        clockOut: null
      }
    });

    if (!activeClockIn) {
      return res.status(400).json({
        success: false,
        message: 'User is not currently clocked in'
      });
    }

    const now = new Date();

    // Force clock out
    const shiftLog = await prisma.shiftLog.update({
      where: { id: activeClockIn.id },
      data: {
        clockOut: now,
        notes: `Force logout by admin. ${notes || ''}`
      }
    });

    res.json({
      success: true,
      message: 'User has been force logged out',
      data: shiftLog
    });
  } catch (error) {
    console.error('Error force logging out user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to force logout user'
    });
  }
});

// ENHANCED: Log admin override actions
const logShiftOverride = async (shiftId, userId, adminId, action, reason, oldValue = null, newValue = null, notes = null) => {
  try {
    await prisma.shiftOverride.create({
      data: {
        shiftId,
        userId,
        adminId,
        action,
        reason,
        oldValue,
        newValue,
        notes
      }
    });
  } catch (error) {
    console.error('Error logging shift override:', error);
  }
};

// Admin: Allow early clock-out for cashier
router.post('/admin-clock-out/:userId', authenticateToken, requireAdmin, [
  body('notes').optional().isString().withMessage('Notes must be a string'),
  body('closingBalance').optional().isFloat({ min: 0 }).withMessage('Closing balance must be a positive number'),
  body('reason').notEmpty().withMessage('Reason for early clock-out is required')
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

    const userId = parseInt(req.params.userId);
    const { notes, closingBalance, reason } = req.body;
    const adminId = req.user.id;

    // Find active clock in for the user
    const activeClockIn = await prisma.shiftLog.findFirst({
      where: {
        userId,
        type: 'CLOCK_IN',
        clockOut: null
      },
      include: {
        shift: true,
        user: {
          select: {
            name: true,
            username: true,
            role: true
          }
        }
      }
    });

    if (!activeClockIn) {
      return res.status(400).json({
        success: false,
        message: 'User is not clocked in'
      });
    }

    // Check if user is a cashier
    if (activeClockIn.user.role !== 'CASHIER') {
      return res.status(400).json({
        success: false,
        message: 'Admin clock-out override is only available for cashiers'
      });
    }

    const now = new Date();

    // Calculate cash difference if both opening and closing balances are provided
    let cashDifference = null;
    let expectedBalance = null;
    
    if (activeClockIn.openingBalance && closingBalance) {
      // Get total CASH sales for this shift to calculate expected balance
      const shiftStart = activeClockIn.clockIn;
      const totalCashSales = await prisma.order.aggregate({
        where: {
          userId,
          createdAt: {
            gte: shiftStart,
            lte: now
          },
          paymentMethod: 'CASH',
          status: { in: ['COMPLETED', 'PENDING'] }
        },
        _sum: {
          total: true
        }
      });
      
      // Subtract any cash refunds or cancellations
      const totalCashRefunds = await prisma.order.aggregate({
        where: {
          userId,
          createdAt: {
            gte: shiftStart,
            lte: now
          },
          paymentMethod: 'CASH',
          status: 'CANCELLED'
        },
        _sum: {
          total: true
        }
      });
      
      const netCashSales = (totalCashSales._sum.total || 0) - (totalCashRefunds._sum.total || 0);
      expectedBalance = activeClockIn.openingBalance + netCashSales;
      cashDifference = parseFloat(closingBalance) - expectedBalance;
    }

    // Update clock out with admin override flag
    const shiftLog = await prisma.shiftLog.update({
      where: { id: activeClockIn.id },
      data: {
        clockOut: now,
        notes: `${notes || activeClockIn.notes || ''} [ADMIN OVERRIDE: ${reason}]`.trim(),
        closingBalance: closingBalance ? parseFloat(closingBalance) : null,
        expectedBalance,
        cashDifference,
        adminOverride: true,
        adminOverrideBy: adminId,
        adminOverrideReason: reason
      },
      include: {
        shift: {
          select: {
            name: true,
            startTime: true,
            endTime: true
          }
        }
      }
    });

    // Log the admin override action using comprehensive logging
    await ShiftOverrideLogger.logOverride({
      shiftId: activeClockIn.shift.id,
      userId: userId,
      adminId: adminId,
      action: 'EARLY_CLOCK_OUT',
      reason: reason,
      oldValue: 'Clocked In',
      newValue: 'Clocked Out (Admin Override)',
      metadata: {
        originalClockIn: activeClockIn.clockIn,
        overrideClockOut: now,
        duration: Math.round((now - activeClockIn.clockIn) / (1000 * 60)),
        cashDifference: cashDifference,
        expectedBalance: expectedBalance
      },
      notes: `Admin override: ${reason}`
    });

    // Calculate work duration
    const duration = Math.round((now - activeClockIn.clockIn) / (1000 * 60)); // minutes

    res.json({
      success: true,
      message: 'Cashier clocked out successfully (Admin Override)',
      data: {
        ...shiftLog,
        durationMinutes: duration,
        durationHours: Math.round(duration / 60 * 100) / 100,
        adminOverride: true,
        adminOverrideReason: reason
      }
    });
  } catch (error) {
    console.error('Error in admin clock-out:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clock out user'
    });
  }
});

// Admin: Log shift override action
router.post('/override', authenticateToken, requireAdmin, [
  body('shiftId').isInt().withMessage('Shift ID is required'),
  body('action').notEmpty().withMessage('Action is required'),
  body('reason').notEmpty().withMessage('Reason is required'),
  body('userId').optional().isInt().withMessage('User ID must be an integer'),
  body('oldValue').optional().isString(),
  body('newValue').optional().isString(),
  body('notes').optional().isString()
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

    const { shiftId, userId, action, reason, oldValue, newValue, notes } = req.body;
    const adminId = req.user.id;

    // Log the override action
    await logShiftOverride(shiftId, userId, adminId, action, reason, oldValue, newValue, notes);

    res.json({
      success: true,
      message: 'Override action logged successfully'
    });
  } catch (error) {
    console.error('Error logging override action:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to log override action'
    });
  }
});

// Admin: Get shift override history
router.get('/overrides', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { shiftId, userId, limit = 50 } = req.query;

    const where = {};
    if (shiftId) where.shiftId = parseInt(shiftId);
    if (userId) where.userId = parseInt(userId);

    const overrides = await prisma.shiftOverride.findMany({
      where,
      include: {
        shift: {
          select: {
            name: true,
            startTime: true,
            endTime: true
          }
        },
        user: {
          select: {
            name: true,
            username: true
          }
        },
        admin: {
          select: {
            name: true,
            username: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: parseInt(limit)
    });

    res.json({
      success: true,
      data: overrides
    });
  } catch (error) {
    console.error('Error fetching shift overrides:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shift overrides'
    });
  }
});

// Get sales summary for shift end confirmation
router.get('/sales-summary/:userId', authenticateToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    // Verify user can access this data (admin or own data)
    if (req.user.role !== 'ADMIN' && req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Find active clock in
    const activeClockIn = await prisma.shiftLog.findFirst({
      where: {
        userId,
        type: 'CLOCK_IN',
        clockOut: null
      },
      include: {
        shift: true
      }
    });

    if (!activeClockIn) {
      return res.status(400).json({
        success: false,
        message: 'User is not currently clocked in'
      });
    }

    const shiftStart = activeClockIn.clockIn;
    const now = new Date();
    const duration = Math.round((now - shiftStart) / (1000 * 60)); // minutes

    // Get total orders and revenue
    const orderStats = await prisma.order.aggregate({
      where: {
        userId,
        createdAt: {
          gte: shiftStart,
          lte: now
        },
        status: { in: ['COMPLETED', 'PENDING'] }
      },
      _count: {
        id: true
      },
      _sum: {
        total: true
      }
    });

    // Get cash sales
    const cashSales = await prisma.order.aggregate({
      where: {
        userId,
        createdAt: {
          gte: shiftStart,
          lte: now
        },
        paymentMethod: 'CASH',
        status: { in: ['COMPLETED', 'PENDING'] }
      },
      _sum: {
        total: true
      }
    });

    // Get card sales
    const cardSales = await prisma.order.aggregate({
      where: {
        userId,
        createdAt: {
          gte: shiftStart,
          lte: now
        },
        paymentMethod: { in: ['CARD', 'CREDIT_CARD', 'DEBIT_CARD'] },
        status: { in: ['COMPLETED', 'PENDING'] }
      },
      _sum: {
        total: true
      }
    });

    // Calculate expected balance
    const openingBalance = activeClockIn.openingBalance ? parseFloat(activeClockIn.openingBalance) : 0;
    const cashSalesAmount = cashSales._sum.total || 0;
    const expectedBalance = openingBalance + cashSalesAmount;

    const salesSummary = {
      shiftStart: shiftStart,
      duration: duration,
      totalOrders: orderStats._count.id || 0,
      totalRevenue: orderStats._sum.total || 0,
      cashSales: cashSalesAmount,
      cardSales: cardSales._sum.total || 0,
      openingBalance: openingBalance,
      expectedBalance: expectedBalance
    };

    res.json({
      success: true,
      data: salesSummary
    });
  } catch (error) {
    console.error('Error fetching sales summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales summary'
    });
  }
});

// Get shift override history
router.get('/overrides/history', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      shiftId,
      userId,
      action,
      fromDate,
      toDate,
      limit = 50,
      offset = 0
    } = req.query;

    let overrides;
    if (shiftId) {
      overrides = await ShiftOverrideLogger.getShiftOverrideHistory(parseInt(shiftId), {
        limit: parseInt(limit),
        offset: parseInt(offset),
        action,
        fromDate: fromDate ? new Date(fromDate) : null,
        toDate: toDate ? new Date(toDate) : null
      });
    } else if (userId) {
      overrides = await ShiftOverrideLogger.getUserOverrideHistory(parseInt(userId), {
        limit: parseInt(limit),
        offset: parseInt(offset),
        action,
        fromDate: fromDate ? new Date(fromDate) : null,
        toDate: toDate ? new Date(toDate) : null
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Either shiftId or userId must be provided'
      });
    }

    res.json({
      success: true,
      data: overrides
    });
  } catch (error) {
    console.error('Error fetching override history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch override history'
    });
  }
});

// Get override statistics
router.get('/overrides/statistics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      fromDate,
      toDate,
      shiftId,
      adminId
    } = req.query;

    const statistics = await ShiftOverrideLogger.getOverrideStatistics({
      fromDate: fromDate ? new Date(fromDate) : null,
      toDate: toDate ? new Date(toDate) : null,
      shiftId: shiftId ? parseInt(shiftId) : null,
      adminId: adminId ? parseInt(adminId) : null
    });

    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    console.error('Error fetching override statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch override statistics'
    });
  }
});

// Get recent overrides
router.get('/overrides/recent', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const overrides = await ShiftOverrideLogger.getRecentOverrides(parseInt(limit));

    res.json({
      success: true,
      data: overrides
    });
  } catch (error) {
    console.error('Error fetching recent overrides:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent overrides'
    });
  }
});

module.exports = router;
