const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Login validation
const loginValidation = [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
];

// Login route
router.post('/login', loginValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { username, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check shift timing for cashiers (not for admins)
    let userWithShift = null;
    if (user.role === 'CASHIER') {
      // Get user with shift info
      userWithShift = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          shift: true
        }
      });

      // Check if user has a shift assigned
      if (!userWithShift || !userWithShift.shift) {
        return res.status(403).json({
          success: false,
          message: 'No shift assigned. Please contact admin.',
          errorCode: 'NO_SHIFT_ASSIGNED'
        });
      }

      // Check if current time is within shift time (±grace period)
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
      const shift = userWithShift.shift;

      // Helper function to check if time is within shift
      const isWithinShiftTime = (currentTime, startTime, endTime, gracePeriod, daysOfWeek = null) => {
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

        const timeToMinutes = (timeString) => {
          const [hours, minutes] = timeString.split(':').map(Number);
          return hours * 60 + minutes;
        };

        const current = timeToMinutes(currentTime);
        const start = timeToMinutes(startTime) - gracePeriod;
        const end = timeToMinutes(endTime) + gracePeriod;

        // Handle overnight shifts (e.g., 23:00 - 07:00)
        if (start > end) {
          return current >= start || current <= end;
        }

        return current >= start && current <= end;
      };

      if (!isWithinShiftTime(currentTime, shift.startTime, shift.endTime, shift.gracePeriod, shift.daysOfWeek)) {
        return res.status(403).json({
          success: false,
          message: 'You are not scheduled for this shift. Contact admin.',
          errorCode: 'OUTSIDE_SHIFT_TIME',
          shiftInfo: {
            name: shift.name,
            startTime: shift.startTime,
            endTime: shift.endTime,
            gracePeriod: shift.gracePeriod,
            currentTime
          }
        });
      }
    }

    // Update login tracking
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLogin: new Date(),
        loginCount: {
          increment: 1
        },
        updatedAt: new Date()
      }
    });

    // Auto clock-in for cashiers (since login already validates shift time)
    if (user.role === 'CASHIER' && userWithShift && userWithShift.shift) {
      try {
        // Check if user is already clocked in
        const activeClockIn = await prisma.shiftLog.findFirst({
          where: {
            userId: user.id,
            type: 'CLOCK_IN',
            clockOut: null
          }
        });

        // Only auto clock-in if not already clocked in
        if (!activeClockIn) {
          // Create auto clock-in log
          await prisma.shiftLog.create({
            data: {
              userId: user.id,
              shiftId: userWithShift.shiftId,
              type: 'CLOCK_IN',
              clockIn: new Date(),
              notes: 'Auto clock-in on login'
            }
          });

          console.log(`Auto clock-in: User ${user.username} (${user.name}) clocked in automatically on login`);
        }
      } catch (autoClockInError) {
        // Log error but don't fail login
        console.error('Auto clock-in error:', autoClockInError);
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Return user data (without password) and token
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userWithoutPassword,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
        loginCount: true
      }
    });

    // Get user permissions
    const { getUserPermissions } = require('../middleware/permissions');
    const permissions = await getUserPermissions(user.id, user.role);

    res.json({
      success: true,
      data: {
        ...user,
        permissions
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile'
    });
  }
});

// Change password
router.post('/change-password', authenticateToken, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
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

    const { currentPassword, newPassword } = req.body;

    // Get current user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword }
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
});

// Update profile
router.put('/profile', authenticateToken, [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required')
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

    const { name, email } = req.body;

    // Check if email is already taken by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        id: { not: req.user.id }
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email is already taken by another user'
      });
    }

    // Update profile
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { name, email },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
        loginCount: true
      }
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// Logout (client-side token removal)
router.post('/logout', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

module.exports = router; 