const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Get all settings
router.get('/', async (req, res) => {
  try {
    // Get settings from database
    const settingsRecords = await prisma.settings.findMany();
    
    // Convert to expected format
    const settings = {
      business: {
        restaurantName: 'Restaurant POS',
        address: '123 Main Street, City, State 12345',
        phone: '+1 (555) 123-4567',
        email: 'info@restaurant.com',
        taxRate: 8.5,
        currency: 'USD',
        timezone: 'America/New_York'
      },
      system: {
        autoRefreshInterval: 30,
        lowStockThreshold: 10,
        maxTables: 20,
        enableNotifications: true,
        enableAutoBackup: false,
        backupFrequency: 'daily'
      },
      security: {
        sessionTimeout: 1440, // 24 hours in minutes
        forceLogoutOnPasswordChange: true,
        minPasswordLength: 6,
        requireUppercase: true,
        requireNumbers: true
      }
    };

    // Override with database values if they exist
    settingsRecords.forEach(record => {
      if (settings[record.category]) {
        settings[record.category] = { ...settings[record.category], ...record.data };
      }
    });

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get settings'
    });
  }
});

// Update business settings
router.put('/business', [
  body('restaurantName').notEmpty().withMessage('Restaurant name is required'),
  body('address').notEmpty().withMessage('Address is required'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('taxRate').isFloat({ min: 0, max: 100 }).withMessage('Tax rate must be between 0 and 100'),
  body('currency').notEmpty().withMessage('Currency is required'),
  body('timezone').notEmpty().withMessage('Timezone is required')
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

    const {
      restaurantName,
      address,
      phone,
      email,
      taxRate,
      currency,
      timezone
    } = req.body;

    // Fetch existing data
    const existing = await prisma.settings.findUnique({ where: { category: 'business' } });
    const prevData = existing?.data || {};

    // Merge old and new
    const businessData = {
      ...prevData,
      restaurantName,
      address,
      phone,
      email,
      taxRate: parseFloat(taxRate),
      currency,
      timezone
    };

    await prisma.settings.upsert({
      where: { category: 'business' },
      update: { data: businessData },
      create: { category: 'business', data: businessData }
    });

    console.log('Business settings updated:', businessData);

    res.json({
      success: true,
      message: 'Business settings updated successfully',
      data: businessData
    });
  } catch (error) {
    console.error('Update business settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update business settings'
    });
  }
});

// Update system settings
router.put('/system', [
  body('autoRefreshInterval').isInt({ min: 10, max: 300 }).withMessage('Auto refresh interval must be between 10 and 300 seconds'),
  body('lowStockThreshold').isInt({ min: 1, max: 100 }).withMessage('Low stock threshold must be between 1 and 100'),
  body('maxTables').isInt({ min: 1, max: 100 }).withMessage('Maximum tables must be between 1 and 100'),
  body('enableNotifications').isBoolean().withMessage('Enable notifications must be a boolean'),
  body('enableAutoBackup').isBoolean().withMessage('Enable auto backup must be a boolean'),
  body('backupFrequency').optional().isIn(['daily', 'weekly', 'monthly']).withMessage('Backup frequency must be daily, weekly, or monthly')
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

    const {
      autoRefreshInterval,
      lowStockThreshold,
      maxTables,
      enableNotifications,
      enableAutoBackup,
      backupFrequency
    } = req.body;

    // Save to database
    const systemData = {
      autoRefreshInterval: parseInt(autoRefreshInterval),
      lowStockThreshold: parseInt(lowStockThreshold),
      maxTables: parseInt(maxTables),
      enableNotifications: Boolean(enableNotifications),
      enableAutoBackup: Boolean(enableAutoBackup),
      backupFrequency: backupFrequency || 'daily'
    };

    await prisma.settings.upsert({
      where: { category: 'system' },
      update: { data: systemData },
      create: { category: 'system', data: systemData }
    });

    console.log('System settings updated:', systemData);

    res.json({
      success: true,
      message: 'System settings updated successfully',
      data: systemData
    });
  } catch (error) {
    console.error('Update system settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update system settings'
    });
  }
});

// Update security settings
router.put('/security', [
  body('sessionTimeout').isInt({ min: 15, max: 480 }).withMessage('Session timeout must be between 15 and 480 minutes'),
  body('forceLogoutOnPasswordChange').isBoolean().withMessage('Force logout on password change must be a boolean'),
  body('minPasswordLength').isInt({ min: 6, max: 20 }).withMessage('Minimum password length must be between 6 and 20'),
  body('requireUppercase').isBoolean().withMessage('Require uppercase must be a boolean'),
  body('requireNumbers').isBoolean().withMessage('Require numbers must be a boolean')
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

    const {
      sessionTimeout,
      forceLogoutOnPasswordChange,
      minPasswordLength,
      requireUppercase,
      requireNumbers
    } = req.body;

    // Save to database
    const securityData = {
      sessionTimeout: parseInt(sessionTimeout),
      forceLogoutOnPasswordChange: Boolean(forceLogoutOnPasswordChange),
      minPasswordLength: parseInt(minPasswordLength),
      requireUppercase: Boolean(requireUppercase),
      requireNumbers: Boolean(requireNumbers)
    };

    await prisma.settings.upsert({
      where: { category: 'security' },
      update: { data: securityData },
      create: { category: 'security', data: securityData }
    });

    console.log('Security settings updated:', securityData);

    res.json({
      success: true,
      message: 'Security settings updated successfully',
      data: securityData
    });
  } catch (error) {
    console.error('Update security settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update security settings'
    });
  }
});

// Reset settings to defaults
router.post('/reset', async (req, res) => {
  try {
    // Delete all settings to reset to defaults
    await prisma.settings.deleteMany();
    console.log('Settings reset to defaults');

    res.json({
      success: true,
      message: 'Settings reset to defaults successfully'
    });
  } catch (error) {
    console.error('Reset settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset settings'
    });
  }
});

// Create system backup
router.post('/backup', async (req, res) => {
  try {
    // Get all data for backup
    const backup = {
      timestamp: new Date().toISOString(),
      users: await prisma.user.findMany({
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true
        }
      }),
      categories: await prisma.category.findMany(),
      products: await prisma.product.findMany({
        include: {
          category: true,
          stock: true
        }
      }),
      tables: await prisma.table.findMany(),
      orders: await prisma.order.findMany({
        include: {
          orderItems: {
            include: {
              product: true
            }
          },
          table: true,
          user: {
            select: {
              id: true,
              name: true,
              username: true
            }
          }
        }
      }),
      stockLogs: await prisma.stockLog.findMany({
        include: {
          stock: {
            include: {
              product: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              username: true
            }
          }
        }
      })
    };

    res.json({
      success: true,
      message: 'Backup created successfully',
      data: backup
    });
  } catch (error) {
    console.error('Create backup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create backup'
    });
  }
});

module.exports = router; 