const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Comprehensive shift override logging service
 */
class ShiftOverrideLogger {
  
  /**
   * Log a shift override action
   * @param {Object} params - Override parameters
   * @param {number} params.shiftId - ID of the affected shift
   * @param {number} params.userId - ID of the affected user (null for shift-wide changes)
   * @param {number} params.adminId - ID of the admin performing the override
   * @param {string} params.action - Type of override action
   * @param {string} params.reason - Reason for the override
   * @param {string} params.oldValue - Previous value
   * @param {string} params.newValue - New value
   * @param {Object} params.metadata - Additional metadata
   * @param {string} params.notes - Additional notes
   */
  static async logOverride({
    shiftId,
    userId,
    adminId,
    action,
    reason,
    oldValue = null,
    newValue = null,
    metadata = null,
    notes = null
  }) {
    try {
      const override = await prisma.shiftOverride.create({
        data: {
          shiftId,
          userId,
          adminId,
          action,
          reason,
          oldValue,
          newValue,
          metadata,
          notes,
          createdAt: new Date()
        },
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
        }
      });

      // Log to console for debugging
      console.log(`🔧 Shift Override Logged:`, {
        id: override.id,
        action: override.action,
        shift: override.shift.name,
        user: override.user?.name || 'N/A',
        admin: override.admin.name,
        reason: override.reason,
        timestamp: override.createdAt
      });

      return override;
    } catch (error) {
      console.error('Error logging shift override:', error);
      throw error;
    }
  }

  /**
   * Get override history for a specific shift
   * @param {number} shiftId - Shift ID
   * @param {Object} options - Query options
   * @param {number} options.limit - Number of records to return
   * @param {number} options.offset - Number of records to skip
   * @param {string} options.action - Filter by action type
   * @param {Date} options.fromDate - Filter from date
   * @param {Date} options.toDate - Filter to date
   */
  static async getShiftOverrideHistory(shiftId, options = {}) {
    try {
      const {
        limit = 50,
        offset = 0,
        action = null,
        fromDate = null,
        toDate = null
      } = options;

      const where = {
        shiftId,
        ...(action && { action }),
        ...(fromDate && toDate && {
          createdAt: {
            gte: fromDate,
            lte: toDate
          }
        })
      };

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
        take: limit,
        skip: offset
      });

      const total = await prisma.shiftOverride.count({ where });

      return {
        overrides,
        total,
        hasMore: offset + overrides.length < total
      };
    } catch (error) {
      console.error('Error fetching shift override history:', error);
      throw error;
    }
  }

  /**
   * Get override history for a specific user
   * @param {number} userId - User ID
   * @param {Object} options - Query options
   */
  static async getUserOverrideHistory(userId, options = {}) {
    try {
      const {
        limit = 50,
        offset = 0,
        action = null,
        fromDate = null,
        toDate = null
      } = options;

      const where = {
        userId,
        ...(action && { action }),
        ...(fromDate && toDate && {
          createdAt: {
            gte: fromDate,
            lte: toDate
          }
        })
      };

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
        take: limit,
        skip: offset
      });

      const total = await prisma.shiftOverride.count({ where });

      return {
        overrides,
        total,
        hasMore: offset + overrides.length < total
      };
    } catch (error) {
      console.error('Error fetching user override history:', error);
      throw error;
    }
  }

  /**
   * Get override statistics
   * @param {Object} options - Query options
   */
  static async getOverrideStatistics(options = {}) {
    try {
      const {
        fromDate = null,
        toDate = null,
        shiftId = null,
        adminId = null
      } = options;

      const where = {
        ...(fromDate && toDate && {
          createdAt: {
            gte: fromDate,
            lte: toDate
          }
        }),
        ...(shiftId && { shiftId }),
        ...(adminId && { adminId })
      };

      // Get action counts
      const actionCounts = await prisma.shiftOverride.groupBy({
        by: ['action'],
        where,
        _count: {
          action: true
        }
      });

      // Get admin activity
      const adminActivity = await prisma.shiftOverride.groupBy({
        by: ['adminId'],
        where,
        _count: {
          adminId: true
        },
        include: {
          admin: {
            select: {
              name: true,
              username: true
            }
          }
        }
      });

      // Get total overrides
      const totalOverrides = await prisma.shiftOverride.count({ where });

      return {
        totalOverrides,
        actionCounts,
        adminActivity,
        period: {
          from: fromDate,
          to: toDate
        }
      };
    } catch (error) {
      console.error('Error fetching override statistics:', error);
      throw error;
    }
  }

  /**
   * Get recent overrides (for dashboard)
   * @param {number} limit - Number of recent overrides to return
   */
  static async getRecentOverrides(limit = 10) {
    try {
      const overrides = await prisma.shiftOverride.findMany({
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
        take: limit
      });

      return overrides;
    } catch (error) {
      console.error('Error fetching recent overrides:', error);
      throw error;
    }
  }
}

module.exports = ShiftOverrideLogger;

