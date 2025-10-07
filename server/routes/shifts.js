const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all shifts
router.get('/', authenticateToken, async (req, res) => {
  try {
    const shifts = await prisma.shift.findMany({
      include: {
        users: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true
          }
        },
        _count: {
          select: {
            users: true,
            shiftLogs: true
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    });

    res.json({
      success: true,
      data: shifts
    });
  } catch (error) {
    console.error('Error fetching shifts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shifts'
    });
  }
});

// Get single shift
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const shift = await prisma.shift.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true
          }
        },
        shiftLogs: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!shift) {
      return res.status(404).json({
        success: false,
        message: 'Shift not found'
      });
    }

    res.json({
      success: true,
      data: shift
    });
  } catch (error) {
    console.error('Error fetching shift:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shift'
    });
  }
});

// Create new shift
router.post('/', authenticateToken, requireAdmin, [
  body('name').notEmpty().withMessage('Shift name is required'),
  body('startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Start time must be in HH:MM format'),
  body('endTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('End time must be in HH:MM format'),
  body('gracePeriod').isInt({ min: 0, max: 60 }).withMessage('Grace period must be between 0 and 60 minutes')
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

    const { name, startTime, endTime, gracePeriod = 10, description, daysOfWeek } = req.body;

    // Check if shift name already exists
    const existingShift = await prisma.shift.findUnique({
      where: { name }
    });

    if (existingShift) {
      return res.status(400).json({
        success: false,
        message: 'Shift name already exists'
      });
    }

    // Validate shift overlap with existing shifts
    const overlapError = await validateShiftOverlap(startTime, endTime, daysOfWeek);
    if (overlapError) {
      return res.status(400).json({
        success: false,
        message: overlapError
      });
    }

    const shift = await prisma.shift.create({
      data: {
        name,
        startTime,
        endTime,
        gracePeriod,
        description,
        daysOfWeek: daysOfWeek ? JSON.stringify(daysOfWeek) : null
      }
    });

    res.status(201).json({
      success: true,
      message: 'Shift created successfully',
      data: shift
    });
  } catch (error) {
    console.error('Error creating shift:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create shift'
    });
  }
});

// Update shift
router.put('/:id', authenticateToken, requireAdmin, [
  body('name').optional().notEmpty().withMessage('Shift name cannot be empty'),
  body('startTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Start time must be in HH:MM format'),
  body('endTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('End time must be in HH:MM format'),
  body('gracePeriod').optional().isInt({ min: 0, max: 60 }).withMessage('Grace period must be between 0 and 60 minutes')
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

    const { name, startTime, endTime, gracePeriod, description, isActive, daysOfWeek } = req.body;
    const shiftId = parseInt(req.params.id);

    // Check if shift exists
    const existingShift = await prisma.shift.findUnique({
      where: { id: shiftId }
    });

    if (!existingShift) {
      return res.status(404).json({
        success: false,
        message: 'Shift not found'
      });
    }

    // Check if new name conflicts with existing shift
    if (name && name !== existingShift.name) {
      const nameConflict = await prisma.shift.findUnique({
        where: { name }
      });

      if (nameConflict) {
        return res.status(400).json({
          success: false,
          message: 'Shift name already exists'
        });
      }
    }

    // Validate shift overlap if times are being updated
    if (startTime || endTime) {
      const finalStartTime = startTime || existingShift.startTime;
      const finalEndTime = endTime || existingShift.endTime;
      const finalDaysOfWeek = daysOfWeek !== undefined ? daysOfWeek : (existingShift.daysOfWeek ? JSON.parse(existingShift.daysOfWeek) : null);
      
      const overlapError = await validateShiftOverlap(finalStartTime, finalEndTime, finalDaysOfWeek, shiftId);
      if (overlapError) {
        return res.status(400).json({
          success: false,
          message: overlapError
        });
      }
    }

    const shift = await prisma.shift.update({
      where: { id: shiftId },
      data: {
        ...(name && { name }),
        ...(startTime && { startTime }),
        ...(endTime && { endTime }),
        ...(gracePeriod !== undefined && { gracePeriod }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
        ...(daysOfWeek !== undefined && { daysOfWeek: daysOfWeek ? JSON.stringify(daysOfWeek) : null })
      }
    });

    res.json({
      success: true,
      message: 'Shift updated successfully',
      data: shift
    });
  } catch (error) {
    console.error('Error updating shift:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update shift'
    });
  }
});

// Delete shift
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const shiftId = parseInt(req.params.id);

    // Check if shift exists
    const existingShift = await prisma.shift.findUnique({
      where: { id: shiftId },
      include: {
        users: true
      }
    });

    if (!existingShift) {
      return res.status(404).json({
        success: false,
        message: 'Shift not found'
      });
    }

    // Check if shift has assigned users
    if (existingShift.users.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete shift with assigned users. Please reassign users first.'
      });
    }

    await prisma.shift.delete({
      where: { id: shiftId }
    });

    res.json({
      success: true,
      message: 'Shift deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting shift:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete shift'
    });
  }
});

// Assign user to shift
router.post('/:id/assign', authenticateToken, requireAdmin, [
  body('userId').isInt().withMessage('User ID is required')
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

    const shiftId = parseInt(req.params.id);
    const { userId } = req.body;

    // Check if shift exists
    const shift = await prisma.shift.findUnique({
      where: { id: shiftId }
    });

    if (!shift) {
      return res.status(404).json({
        success: false,
        message: 'Shift not found'
      });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user's shift assignment
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { shiftId },
      include: {
        shift: true
      }
    });

    res.json({
      success: true,
      message: 'User assigned to shift successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error assigning user to shift:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign user to shift'
    });
  }
});

// Remove user from shift
router.delete('/:id/assign/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const shiftId = parseInt(req.params.id);
    const userId = parseInt(req.params.userId);

    // Check if user is assigned to this shift
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        shift: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.shiftId !== shiftId) {
      return res.status(400).json({
        success: false,
        message: 'User is not assigned to this shift'
      });
    }

    // Remove shift assignment
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { shiftId: null },
      include: {
        shift: true
      }
    });

    res.json({
      success: true,
      message: 'User removed from shift successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error removing user from shift:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove user from shift'
    });
  }
});

// Get active shifts (currently clocked in users)
router.get('/active/status', authenticateToken, async (req, res) => {
  try {
    const activeShifts = await prisma.shiftLog.findMany({
      where: {
        type: 'CLOCK_IN',
        clockOut: null
      },
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
        clockIn: 'desc'
      }
    });

    res.json({
      success: true,
      data: activeShifts
    });
  } catch (error) {
    console.error('Error fetching active shifts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active shifts'
    });
  }
});

// Helper function to validate shift overlap
async function validateShiftOverlap(startTime, endTime, daysOfWeek, excludeShiftId = null) {
  try {
    // Get all active shifts
    const existingShifts = await prisma.shift.findMany({
      where: {
        isActive: true,
        ...(excludeShiftId && { id: { not: excludeShiftId } })
      }
    });

    for (const shift of existingShifts) {
      const shiftDays = shift.daysOfWeek ? JSON.parse(shift.daysOfWeek) : null;
      
      // Check if shifts have overlapping days
      if (daysOfWeek && shiftDays) {
        const hasOverlappingDays = daysOfWeek.some(day => shiftDays.includes(day));
        if (!hasOverlappingDays) continue;
      } else if (daysOfWeek || shiftDays) {
        // One shift has specific days, other doesn't - assume overlap
        continue;
      }

      // Check time overlap
      if (shiftsOverlap(startTime, endTime, shift.startTime, shift.endTime)) {
        return `Shift time overlaps with existing "${shift.name}" shift (${shift.startTime} - ${shift.endTime})`;
      }
    }

    return null; // No overlap found
  } catch (error) {
    console.error('Error validating shift overlap:', error);
    return 'Error validating shift overlap';
  }
}

// Helper function to check if two time ranges overlap
function shiftsOverlap(start1, end1, start2, end2) {
  const start1Minutes = timeToMinutes(start1);
  const end1Minutes = timeToMinutes(end1);
  const start2Minutes = timeToMinutes(start2);
  const end2Minutes = timeToMinutes(end2);

  // Handle overnight shifts
  const isOvernight1 = start1Minutes > end1Minutes;
  const isOvernight2 = start2Minutes > end2Minutes;

  if (isOvernight1 && isOvernight2) {
    // Both are overnight shifts
    return (start1Minutes <= end2Minutes) || (start2Minutes <= end1Minutes);
  } else if (isOvernight1) {
    // First shift is overnight
    return (start1Minutes <= end2Minutes) || (end1Minutes >= start2Minutes);
  } else if (isOvernight2) {
    // Second shift is overnight
    return (start2Minutes <= end1Minutes) || (end2Minutes >= start1Minutes);
  } else {
    // Both are regular shifts
    return start1Minutes < end2Minutes && start2Minutes < end1Minutes;
  }
}

// Helper function to convert time string to minutes
function timeToMinutes(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

module.exports = router;
