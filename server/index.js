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

const { authenticateToken, authorizeRole } = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

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
  max: process.env.NODE_ENV === 'development' ? 1000 : (parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100), // More lenient in development
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
  : ['http://localhost:3000', 'http://localhost:3001'];

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
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
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

// Protected routes
app.use('/api/users', authenticateToken, authorizeRole(['ADMIN']), userRoutes);
app.use('/api/tables', authenticateToken, tableRoutes);
app.use('/api/categories', authenticateToken, categoryRoutes);
app.use('/api/products', authenticateToken, productRoutes);
app.use('/api/orders', authenticateToken, orderRoutes);
app.use('/api/stock', authenticateToken, authorizeRole(['ADMIN']), stockRoutes);
app.use('/api/reports', authenticateToken, reportRoutes);
app.use('/api/settings', authenticateToken, authorizeRole(['ADMIN']), settingsRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Restaurant POS Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔌 WebSocket server ready on ws://localhost:${PORT}`);
});

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