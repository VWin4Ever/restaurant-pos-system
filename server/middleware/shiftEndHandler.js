const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Middleware to check and handle shift end
const checkShiftEnd = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return next();
    }

    // Get user with shift info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        shift: true
      }
    });

    // CRITICAL FIX: Admins bypass all shift restrictions
    if (!user || user.role === 'ADMIN') {
      return next();
    }

    // Cashiers must have a shift assigned
    if (!user.shift) {
      return res.status(403).json({
        success: false,
        message: 'No shift assigned. Please contact admin.',
        errorCode: 'NO_SHIFT_ASSIGNED'
      });
    }

    // Check if user is currently clocked in
    const activeClockIn = await prisma.shiftLog.findFirst({
      where: {
        userId,
        type: 'CLOCK_IN',
        clockOut: null
      }
    });

    // CRITICAL FIX: Cashiers must be clocked in to perform actions
    if (!activeClockIn) {
      return res.status(403).json({
        success: false,
        message: 'You must clock in before performing this action.',
        errorCode: 'NOT_CLOCKED_IN',
        shiftInfo: {
          name: user.shift.name,
          startTime: user.shift.startTime,
          endTime: user.shift.endTime
        }
      });
    }

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    const shift = user.shift;

    // ENHANCED FIX: Check days of week and shift time
    const isShiftValid = isWithinShiftTime(
      currentTime, 
      shift.startTime, 
      shift.endTime, 
      shift.gracePeriod,
      shift.daysOfWeek
    );

    if (!isShiftValid) {
      // Auto clock out the user
      await prisma.shiftLog.update({
        where: { id: activeClockIn.id },
        data: {
          clockOut: now,
          notes: (activeClockIn.notes || '') + ' [Auto-logout: Shift ended]'
        }
      });

      // Return shift ended response
      return res.status(403).json({
        success: false,
        message: 'Your shift has ended. You have been automatically logged out.',
        errorCode: 'SHIFT_ENDED',
        shiftInfo: {
          name: shift.name,
          startTime: shift.startTime,
          endTime: shift.endTime,
          currentTime,
          daysOfWeek: shift.daysOfWeek
        },
        autoLogout: true
      });
    }

    // Check if shift is ending soon (within 10 minutes)
    const shiftEndMinutes = timeToMinutes(shift.endTime);
    const currentMinutes = timeToMinutes(currentTime);
    const timeUntilEnd = shiftEndMinutes - currentMinutes;

    if (timeUntilEnd <= 10 && timeUntilEnd > 0) {
      // Add warning to response headers
      res.set('X-Shift-Warning', `Your shift ends in ${timeUntilEnd} minutes`);
    }

    next();
  } catch (error) {
    console.error('Error checking shift end:', error);
    next(); // Continue on error to avoid blocking requests
  }
};

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

// Helper function to convert time string to minutes
function timeToMinutes(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

// Function to auto-logout all users whose shifts have ended
const autoLogoutExpiredShifts = async () => {
  try {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);

    // Get all active clock-ins
    const activeClockIns = await prisma.shiftLog.findMany({
      where: {
        type: 'CLOCK_IN',
        clockOut: null
      },
      include: {
        user: {
          include: {
            shift: true
          }
        }
      }
    });

    for (const clockIn of activeClockIns) {
      if (!clockIn.user.shift) continue;

      const shift = clockIn.user.shift;
      const isShiftEnded = !isWithinShiftTime(currentTime, shift.startTime, shift.endTime, shift.gracePeriod);

      if (isShiftEnded) {
        // Auto clock out
        await prisma.shiftLog.update({
          where: { id: clockIn.id },
          data: {
            clockOut: now,
            notes: (clockIn.notes || '') + ' [Auto-logout: Shift ended]'
          }
        });

        console.log(`Auto-logged out user ${clockIn.user.username} - shift ${shift.name} ended`);
      }
    }
  } catch (error) {
    console.error('Error in auto-logout expired shifts:', error);
  }
};

// Run auto-logout check every minute
setInterval(autoLogoutExpiredShifts, 60000);

module.exports = {
  checkShiftEnd,
  autoLogoutExpiredShifts
};
