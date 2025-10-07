const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { requirePermission } = require('../middleware/permissions');
const DEFAULT_SETTINGS = require('../config/settingsDefaults');
const { 
  setSecurePermissions, 
  validateBackupIntegrity, 
  logBackupOperation, 
  canPerformBackupOperation,
  sanitizeBackupFilename 
} = require('../config/backupSecurity');

const router = express.Router();
const prisma = new PrismaClient();

// Fallback backup function (JSON-based backup)
async function createFallbackBackup(req, res) {
  try {
    console.log('🔄 Creating fallback JSON backup...');
    console.log('📊 This method is optimized for large databases and will complete faster...');
    
    // Get all data for backup (same as before but as JSON)
    const backup = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      type: 'fallback-json-backup',
      settings: await prisma.settings.findMany(),
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
      }),
      metadata: {
        totalUsers: (await prisma.user.count()),
        totalProducts: (await prisma.product.count()),
        totalOrders: (await prisma.order.count()),
        totalTables: (await prisma.table.count()),
        backupType: 'JSON Fallback'
      }
    };

    const backupJson = JSON.stringify(backup, null, 2);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFilename = `pos-backup-fallback-${timestamp}.json`;

    // Set response headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${backupFilename}"`);
    res.setHeader('Content-Length', Buffer.byteLength(backupJson));

    // Send the JSON backup data
    res.send(backupJson);
    
    console.log(`✅ Fallback JSON backup created: ${backupFilename} (${(Buffer.byteLength(backupJson) / 1024 / 1024).toFixed(2)} MB)`);
    
  } catch (error) {
    console.error('Fallback backup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create fallback backup: ' + error.message
    });
  }
}

// Get all settings
router.get('/', async (req, res) => {
  try {
    // Get settings from database
    const settingsRecords = await prisma.settings.findMany();
    
    // Use shared default settings
    const settings = { ...DEFAULT_SETTINGS };

    // Override with database values if they exist
    settingsRecords.forEach(record => {
      if (settings[record.category]) {
        try {
          const parsedData = JSON.parse(record.data);
          settings[record.category] = { ...settings[record.category], ...parsedData };
        } catch (error) {
          console.error(`Failed to parse settings data for category ${record.category}:`, error);
        }
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
    const prevData = existing?.data ? JSON.parse(existing.data) : {};

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
      update: { data: JSON.stringify(businessData) },
      create: { category: 'business', data: JSON.stringify(businessData) }
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
      update: { data: JSON.stringify(systemData) },
      create: { category: 'system', data: JSON.stringify(systemData) }
    });

    console.log('System settings updated:', systemData);

    // Restart auto-backup scheduler if it exists
    if (global.restartAutoBackup) {
      console.log('🔄 Restarting auto-backup scheduler...');
      global.restartAutoBackup().catch(error => {
        console.error('⚠️ Failed to restart auto-backup scheduler:', error);
      });
    }

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
      update: { data: JSON.stringify(securityData) },
      create: { category: 'security', data: JSON.stringify(securityData) }
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

// Create system backup (Full SQL Database Backup)
router.post('/backup', requirePermission('settings.backup'), async (req, res) => {
  try {
    const { exec } = require('child_process');
    const fs = require('fs');
    const path = require('path');
    
    // Security checks
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const canBackup = canPerformBackupOperation(userId, 'create', userRole);
    
    if (!canBackup.allowed) {
      logBackupOperation('backup_denied', userId, { 
        reason: canBackup.reason,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      return res.status(403).json({
        success: false,
        message: canBackup.reason
      });
    }
    
    // Log backup attempt
    logBackupOperation('backup_started', userId, {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    // Get database name from DATABASE_URL
    const dbUrl = process.env.DATABASE_URL || 'mysql://root:@localhost:3306/restaurant_pos';
    const url = new URL(dbUrl);
    const database = url.pathname.substring(1);

    // Use configurable backup filename and sanitize it
    const { getBackupFileName } = require('../config/backupConfig');
    const backupFilename = sanitizeBackupFilename(getBackupFileName());
    
    console.log(`🔄 Creating database backup: ${database}`);
    console.log('📊 Starting FAST SQL backup process...');
    
    // Use simple, fast mysqldump command (works for local MySQL without password)
    const mysqldumpCommand = `mysqldump -u root --single-transaction --add-drop-table --quick --extended-insert ${database}`;

    // Set a very short timeout since backup should be fast (5 seconds)
    const backupTimeout = setTimeout(() => {
      console.error('❌ SQL backup timeout after 5 seconds - trying fallback method');
      if (!res.headersSent) {
        console.log('🔄 Switching to fallback JSON backup method...');
        return createFallbackBackup(req, res);
      }
    }, 5000); // 5 second timeout for fast backup

    // Execute mysqldump with short timeout since it should be very fast
    exec(mysqldumpCommand, { timeout: 10000 }, (error, stdout, stderr) => {
      clearTimeout(backupTimeout);
      
      // Check if response was already sent
      if (res.headersSent) {
        console.log('⚠️ Response already sent, ignoring backup result');
        return;
      }

      if (error) {
        console.error('❌ Backup failed:', error.message);
        console.error('Command:', mysqldumpCommand.replace(password, '***'));
        
        // Check if it's a timeout error - try fallback method
        if (error.code === 'ETIMEDOUT' || error.signal === 'SIGTERM') {
          console.log('🔄 SQL backup timed out, trying fallback method...');
          return createFallbackBackup(req, res);
        }
        
        // Check if mysqldump is not found - try fallback method
        if (error.message.includes('mysqldump') && error.message.includes('not found')) {
          console.log('🔄 mysqldump not found, trying fallback method...');
          return createFallbackBackup(req, res);
        }
        
        return res.status(500).json({
          success: false,
          message: 'Failed to create database backup: ' + error.message
        });
      }

      // Check for warnings
      if (stderr && !stderr.includes('Warning') && stderr.trim()) {
        console.error('❌ Backup warning:', stderr);
      }

      // Check if we got any output
      if (!stdout || stdout.trim().length === 0) {
        console.error('❌ No backup data received');
        return res.status(500).json({
          success: false,
          message: 'No backup data received from database'
        });
      }

      // Save backup to configured directory instead of downloading
      const { getBackupDirectory, ensureBackupDirectory } = require('../config/backupConfig');
      const backupDir = getBackupDirectory();
      ensureBackupDirectory(backupDir);
      
      const backupFilePath = path.join(backupDir, backupFilename);
      fs.writeFileSync(backupFilePath, stdout);
      
      // Set secure file permissions
      setSecurePermissions(backupFilePath);
      
      // Validate backup integrity
      const validation = validateBackupIntegrity(backupFilePath);
      if (!validation.valid) {
        logBackupOperation('backup_validation_failed', userId, { 
          error: validation.error,
          file: backupFilename
        });
        return res.status(500).json({
          success: false,
          message: 'Backup validation failed: ' + validation.error
        });
      }
      
      // Log successful backup
      logBackupOperation('backup_completed', userId, {
        file: backupFilename,
        size: validation.size,
        path: backupFilePath
      });
      
      // Return success response with backup info
      res.json({
        success: true,
        message: 'Backup created successfully',
        backupFile: backupFilename,
        backupPath: backupFilePath,
        backupSize: Buffer.byteLength(stdout),
        backupSizeMB: (Buffer.byteLength(stdout) / 1024 / 1024).toFixed(2),
        security: {
          permissions: validation.permissions,
          validated: true
        }
      });
      
      console.log(`✅ Database backup saved to: ${backupFilePath} (${(Buffer.byteLength(stdout) / 1024 / 1024).toFixed(2)} MB)`);
    });

  } catch (error) {
    console.error('Create backup error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Failed to create backup: ' + error.message
      });
    }
  }
});

// Restore from backup
router.post('/restore', requirePermission('settings.restore'), async (req, res) => {
  try {
    const { backupData } = req.body;
    
    if (!backupData || !backupData.version) {
      return res.status(400).json({
        success: false,
        message: 'Invalid backup data'
      });
    }
    
    console.log('🔄 Starting restore process...');
    
    // Validate backup structure
    const requiredFields = ['timestamp', 'version', 'settings', 'users', 'categories', 'products', 'tables'];
    for (const field of requiredFields) {
      if (!backupData[field]) {
        return res.status(400).json({
          success: false,
          message: `Missing required field: ${field}`
        });
      }
    }
    
    // Start transaction for atomic restore
    await prisma.$transaction(async (tx) => {
      // Clear existing data (in reverse order of dependencies)
      await tx.stockLog.deleteMany();
      await tx.orderItem.deleteMany();
      await tx.order.deleteMany();
      await tx.stock.deleteMany();
      await tx.product.deleteMany();
      await tx.category.deleteMany();
      await tx.table.deleteMany();
      await tx.user.deleteMany();
      await tx.settings.deleteMany();
      
      console.log('🗑️ Cleared existing data');
      
      // Restore settings first
      if (backupData.settings && backupData.settings.length > 0) {
        for (const setting of backupData.settings) {
          await tx.settings.create({
            data: {
              category: setting.category,
              data: setting.data
            }
          });
        }
        console.log(`✅ Restored ${backupData.settings.length} settings categories`);
      }
      
      // Restore users
      if (backupData.users && backupData.users.length > 0) {
        for (const user of backupData.users) {
          await tx.user.create({
            data: {
              id: user.id,
              username: user.username,
              name: user.name,
              email: user.email,
              role: user.role,
              isActive: user.isActive,
              createdAt: user.createdAt
            }
          });
        }
        console.log(`✅ Restored ${backupData.users.length} users`);
      }
      
      // Restore categories
      if (backupData.categories && backupData.categories.length > 0) {
        for (const category of backupData.categories) {
          await tx.category.create({
            data: {
              id: category.id,
              name: category.name,
              description: category.description,
              isActive: category.isActive,
              createdAt: category.createdAt,
              updatedAt: category.updatedAt
            }
          });
        }
        console.log(`✅ Restored ${backupData.categories.length} categories`);
      }
      
      // Restore tables
      if (backupData.tables && backupData.tables.length > 0) {
        for (const table of backupData.tables) {
          await tx.table.create({
            data: {
              id: table.id,
              number: table.number,
              capacity: table.capacity,
              status: table.status,
              createdAt: table.createdAt,
              updatedAt: table.updatedAt
            }
          });
        }
        console.log(`✅ Restored ${backupData.tables.length} tables`);
      }
      
      // Restore products
      if (backupData.products && backupData.products.length > 0) {
        for (const product of backupData.products) {
          await tx.product.create({
            data: {
              id: product.id,
              productId: product.productId,
              name: product.name,
              description: product.description,
              price: product.price,
              costPrice: product.costPrice,
              categoryId: product.categoryId,
              imageUrl: product.imageUrl,
              isActive: product.isActive,
              needStock: product.needStock,
              createdAt: product.createdAt,
              updatedAt: product.updatedAt
            }
          });
        }
        console.log(`✅ Restored ${backupData.products.length} products`);
      }
      
      // Restore stock records
      if (backupData.products) {
        for (const product of backupData.products) {
          if (product.stock) {
            await tx.stock.create({
              data: {
                id: product.stock.id,
                productId: product.stock.productId,
                quantity: product.stock.quantity,
                minQuantity: product.stock.minQuantity,
                maxQuantity: product.stock.maxQuantity,
                unit: product.stock.unit,
                lastUpdated: product.stock.lastUpdated
              }
            });
          }
        }
        console.log('✅ Restored stock records');
      }
      
      // Restore orders
      if (backupData.orders && backupData.orders.length > 0) {
        for (const order of backupData.orders) {
          await tx.order.create({
            data: {
              id: order.id,
              orderNumber: order.orderNumber,
              tableId: order.tableId,
              userId: order.userId,
              status: order.status,
              paymentMethod: order.paymentMethod,
              subtotal: order.subtotal,
              tax: order.tax,
              discount: order.discount,
              total: order.total,
              businessSnapshot: order.businessSnapshot,
              createdAt: order.createdAt,
              updatedAt: order.updatedAt
            }
          });
        }
        console.log(`✅ Restored ${backupData.orders.length} orders`);
      }
      
      // Restore order items
      if (backupData.orders) {
        for (const order of backupData.orders) {
          if (order.orderItems && order.orderItems.length > 0) {
            for (const item of order.orderItems) {
              await tx.orderItem.create({
                data: {
                  id: item.id,
                  orderId: item.orderId,
                  productId: item.productId,
                  quantity: item.quantity,
                  price: item.price,
                  subtotal: item.subtotal,
                  createdAt: item.createdAt
                }
              });
            }
          }
        }
        console.log('✅ Restored order items');
      }
      
      // Restore stock logs
      if (backupData.stockLogs && backupData.stockLogs.length > 0) {
        for (const log of backupData.stockLogs) {
          await tx.stockLog.create({
            data: {
              id: log.id,
              stockId: log.stockId,
              userId: log.userId,
              type: log.type,
              quantityChange: log.quantityChange,
              quantityBefore: log.quantityBefore,
              quantityAfter: log.quantityAfter,
              reason: log.reason,
              createdAt: log.createdAt
            }
          });
        }
        console.log(`✅ Restored ${backupData.stockLogs.length} stock logs`);
      }
    });
    
    console.log('🎉 Restore completed successfully');
    
    res.json({
      success: true,
      message: 'System restored successfully from backup',
      data: {
        restoredAt: new Date().toISOString(),
        backupTimestamp: backupData.timestamp,
        backupVersion: backupData.version
      }
    });
    
  } catch (error) {
    console.error('Restore error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to restore from backup',
      error: error.message
    });
  }
});

// Test backup endpoint (for debugging)
router.post('/backup/test', async (req, res) => {
  try {
    const { exec } = require('child_process');
    
    // Simple test command
    exec('mysqldump --version', (error, stdout, stderr) => {
      if (error) {
        return res.json({
          success: false,
          message: 'mysqldump not available',
          error: error.message
        });
      }
      
      res.json({
        success: true,
        message: 'mysqldump is available',
        version: stdout.trim()
      });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Test failed: ' + error.message
    });
  }
});

// Get backup status and history
router.get('/backup/status', requirePermission('settings.view'), async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const BACKUP_DIR = path.join(__dirname, '../backups');
    
    let backupFiles = [];
    let lastBackup = null;
    let totalSize = 0;
    
    if (fs.existsSync(BACKUP_DIR)) {
      const files = fs.readdirSync(BACKUP_DIR)
        .filter(file => file.startsWith('backup-') && file.endsWith('.sql'))
        .map(file => {
          const filePath = path.join(BACKUP_DIR, file);
          const stats = fs.statSync(filePath);
          return {
            name: file,
            size: stats.size,
            created: stats.mtime,
            sizeFormatted: `${(stats.size / 1024 / 1024).toFixed(2)} MB`
          };
        })
        .sort((a, b) => b.created - a.created);
      
      backupFiles = files.slice(0, 10); // Last 10 backups
      lastBackup = files.length > 0 ? files[0] : null;
      totalSize = files.reduce((sum, file) => sum + file.size, 0);
    }
    
    // Get system settings for auto-backup status
    const systemSettings = await prisma.settings.findUnique({
      where: { category: 'system' }
    });
    
    let autoBackupStatus = {
      enabled: false,
      frequency: 'daily'
    };
    
    if (systemSettings) {
      const settings = JSON.parse(systemSettings.data);
      autoBackupStatus = {
        enabled: settings.enableAutoBackup || false,
        frequency: settings.backupFrequency || 'daily'
      };
    }

    res.json({
      success: true,
      data: {
        autoBackup: autoBackupStatus,
        lastBackup,
        backupCount: backupFiles.length,
        totalSize: `${(totalSize / 1024 / 1024).toFixed(2)} MB`,
        recentBackups: backupFiles
      }
    });
    
  } catch (error) {
    console.error('Get backup status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get backup status'
    });
  }
});

module.exports = router; 