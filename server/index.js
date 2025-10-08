const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const path = require('path');
require('dotenv').config({ path: './config.env' });

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const tableRoutes = require('./routes/tables');
const categoryRoutes = require('./routes/categories');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const stockRoutes = require('./routes/stock');
const reportRoutes = require('./routes/reports');
const settingsRoutes = require('./routes/settings');
const shiftRoutes = require('./routes/shifts');
const shiftLogRoutes = require('./routes/shiftLogs');
const migrateSettings = require('./scripts/migrateSettings');
const { runAutomatedBackup } = require('./scripts/automatedBackup');

const { authenticateToken, authorizeRole } = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');
const { checkShiftEnd } = require('./middleware/shiftEndHandler');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Global backup interval tracker
let backupIntervalId = null;

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Initialize WebSocket server
const WebSocketServer = require('./websocket');
const wss = new WebSocketServer(server);

// Security middleware with cross-origin image policy
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "img-src": ["'self'", "data:", "http://localhost:5000", "https:"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 10000 : (parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100), // Much more lenient in development
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS configuration
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? [
      process.env.FRONTEND_URL,
      'https://*.railway.app',
      'https://*.netlify.app',
      'https://*.netlify.com',
      'https://restaurantposmyv.netlify.app'
    ].filter(Boolean) // Remove undefined values
  : [
      'http://localhost:3000', 
      'http://localhost:3001',
      'http://192.168.18.62:3000',
      'http://192.168.18.62:3001'
    ];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin.includes('*')) {
        return origin.includes(allowedOrigin.replace('*', ''));
      }
      return origin === allowedOrigin;
    })) {
      callback(null, true);
    } else {
      console.log(`CORS: Blocking origin ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve food and beverage images with CORS headers
app.use('/food_and_berverage', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
}, express.static(path.join(__dirname, 'food_and_berverage')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// API Routes
app.use('/api/auth', authRoutes);

// Protected routes with shift end checking
app.use('/api/users', authenticateToken, authorizeRole(['ADMIN']), userRoutes);
app.use('/api/tables', authenticateToken, checkShiftEnd, tableRoutes);
app.use('/api/categories', authenticateToken, checkShiftEnd, categoryRoutes);
app.use('/api/products', authenticateToken, checkShiftEnd, productRoutes);
app.use('/api/orders', authenticateToken, checkShiftEnd, orderRoutes);
app.use('/api/stock', authenticateToken, authorizeRole(['ADMIN']), checkShiftEnd, stockRoutes);
app.use('/api/reports', authenticateToken, checkShiftEnd, reportRoutes);
app.use('/api/settings', authenticateToken, checkShiftEnd, settingsRoutes); // Allow cashiers to access basic settings
app.use('/api/shifts', authenticateToken, shiftRoutes);
app.use('/api/shift-logs', authenticateToken, shiftLogRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

// Auto-initialize settings on server startup
async function startServer() {
  try {
    // Initialize settings first
    console.log('🔧 Initializing settings...');
    const settingsResult = await migrateSettings();
    
    if (settingsResult.success) {
      console.log(`✅ Settings initialization: ${settingsResult.message}`);
    } else {
      console.log(`⚠️ Settings initialization warning: ${settingsResult.message}`);
    }
    
    // Setup auto-backup if enabled
    await setupAutoBackup();
    
    // Start the server
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Restaurant POS Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🌐 Network access: http://192.168.18.62:${PORT}/api/health`);
      console.log(`🔌 WebSocket server ready on ws://localhost:${PORT}`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Clear existing backup interval
function clearBackupInterval() {
  if (backupIntervalId) {
    clearInterval(backupIntervalId);
    backupIntervalId = null;
    console.log('🛑 Cleared existing backup interval');
  }
}

// Setup auto-backup based on settings
async function setupAutoBackup() {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    // Clear any existing backup interval
    clearBackupInterval();
    
    // Get system settings
    const systemSettings = await prisma.settings.findUnique({
      where: { category: 'system' }
    });
    
    if (systemSettings) {
      const settings = JSON.parse(systemSettings.data);
      
      if (settings.enableAutoBackup && process.env.NODE_ENV !== 'development') {
        console.log(`🔄 Auto-backup enabled: ${settings.backupFrequency}`);
        
        // Schedule backup based on frequency
        const intervals = {
          daily: 24 * 60 * 60 * 1000,    // 24 hours
          weekly: 7 * 24 * 60 * 60 * 1000, // 7 days
          monthly: 30 * 24 * 60 * 60 * 1000 // 30 days
        };
        
        const interval = intervals[settings.backupFrequency] || intervals.daily;
        
        // Schedule first backup after 5 minutes, then repeat
        setTimeout(() => {
          console.log('🔄 Running scheduled backup...');
          runAutomatedBackup().catch(error => {
            console.error('❌ Scheduled backup failed:', error);
            // Don't continue with scheduled backups if initial backup fails
            console.log('⏹️  Stopping scheduled backups due to failure');
          });
          
          // Set up recurring backups only if initial backup succeeds
          backupIntervalId = setInterval(() => {
            console.log('🔄 Running scheduled backup...');
            runAutomatedBackup().catch(error => {
              console.error('❌ Scheduled backup failed:', error);
              // If backup fails 3 times in a row, stop scheduled backups
              if (!global.backupFailureCount) global.backupFailureCount = 0;
              global.backupFailureCount++;
              
              if (global.backupFailureCount >= 3) {
                console.log('⏹️  Stopping scheduled backups due to repeated failures');
                clearInterval(backupIntervalId);
              }
            });
          }, interval);
        }, 300000); // 5 minute delay to prevent immediate backup spam
        
        console.log(`⏰ Auto-backup scheduled every ${settings.backupFrequency}`);
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log('📴 Auto-backup disabled in development mode');
        } else {
          console.log('📴 Auto-backup disabled');
        }
      }
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('⚠️ Failed to setup auto-backup:', error);
  }
}

// Export functions for use by other modules
global.restartAutoBackup = setupAutoBackup;

startServer();

// Make WebSocket server available globally
global.wss = wss;

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
}); 