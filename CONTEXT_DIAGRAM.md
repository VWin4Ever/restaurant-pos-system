# Restaurant POS System - Context Diagram

## System Overview
The Restaurant POS System is a comprehensive point-of-sale solution that manages restaurant operations including order processing, inventory management, table management, and reporting.

## Context Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              RESTAURANT POS SYSTEM                              │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                           CORE SYSTEM                                   │    │
│  │                                                                         │    │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐  │    │
│  │  │   Frontend      │  │    Backend      │  │      Database           │  │    │
│  │  │   (React)       │◄─┤   (Node.js)     │◄─┤     (MySQL)             │  │    │
│  │  │                 │  │                 │  │                         │  │    │
│  │  │ • Dashboard     │  │ • REST API      │  │ • Users                 │  │    │
│  │  │ • Orders        │  │ • WebSocket     │  │ • Tables                │  │    │
│  │  │ • Products      │  │ • Auth          │  │ • Categories            │  │    │
│  │  │ • Tables        │  │ • File Upload   │  │ • Products              │  │    │
│  │  │ • Reports       │  │ • Security      │  │ • Orders                │  │    │
│  │  │ • Settings      │  │                 │  │ • Stock                 │  │    │
│  │  │ • Stock         │  │                 │  │ • Stock Logs            │  │    │
│  │  │ • Users         │  │                 │  │ • Settings              │  │    │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    ▲
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              EXTERNAL ENTITIES                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    CASHIERS     │    │     ADMINS      │    │    CUSTOMERS    │    │   MANAGEMENT    │
│                 │    │                 │    │                 │    │                 │
│ • Process Orders│    │ • User Mgmt     │    │ • Place Orders  │    │ • View Reports  │
│ • Handle Cash   │    │ • Inventory     │    │ • Make Payments │    │ • Monitor Sales │
│ • Print Receipts│    │ • Settings      │    │ • View Menu     │    │ • Track Metrics │
│ • Manage Tables │    │ • Reports       │    │ • Get Receipts  │    │ • Business Data │
│ • View Products │    │ • Stock Mgmt    │    │ • Order Status  │    │ • Staff Reports │
│ • View Reports  │    │ • Product Mgmt  │    │ • Table Status  │    │ • Financial Data│
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
         ▲                       ▲                       ▲                       ▲
         │                       │                       │                       │
         ▼                       ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              DATA FLOWS                                         │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Order Data    │    │  User Data      │    │  Stock Data     │    │  Report Data    │
│                 │    │                 │    │                 │    │                 │
│ • Order Items   │    │ • Login/Logout  │    │ • Stock Levels  │    │ • Sales Reports │
│ • Payment Info  │    │ • Permissions   │    │ • Stock Logs    │    │ • Inventory     │
│ • Table Status  │    │ • User Mgmt     │    │ • Adjustments   │    │ • Financial     │
│ • Order Status  │    │ • Role Mgmt     │    │ • Alerts        │    │ • Operational   │
│ • Order Number  │    │ • Profile Mgmt  │    │ • Min Stock     │    │ • Staff Reports │
│ • Business Snap │    │ • Auth Tokens   │    │ • Stock History │    │ • Performance   │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

## External Entities and Their Interactions

### 1. **Cashiers**
- **Input**: Process orders, handle payments, manage tables, view products and reports
- **Output**: Receipts, order confirmations, table status updates, real-time notifications
- **Data Flows**: 
  - Order creation and modification
  - Payment processing (Cash/Card)
  - Table management
  - Real-time order updates via WebSocket
  - Product viewing and order item selection
  - Basic report viewing

### 2. **Admins**
- **Input**: User management, inventory control, system settings, product management, stock management
- **Output**: User accounts, inventory reports, system configurations, comprehensive reports, stock logs
- **Data Flows**:
  - User creation and role management (ADMIN/CASHIER)
  - Stock adjustments and monitoring
  - System settings configuration
  - Product and category management
  - Comprehensive reports (Sales, Staff, Inventory, Financial)
  - Stock log management

### 3. **Customers**
- **Input**: Order placement, payment information, menu requests
- **Output**: Receipts, order confirmations, menu information, order status updates
- **Data Flows**:
  - Order placement through cashier interface
  - Payment processing
  - Menu viewing
  - Order status tracking
  - Receipt generation

### 4. **Management**
- **Input**: Report requests, performance metrics requests, business data requests
- **Output**: Financial reports, sales analytics, performance metrics, business insights, staff reports
- **Data Flows**:
  - Sales report generation
  - Inventory analysis
  - Financial reporting
  - Staff performance tracking
  - Business metrics monitoring

## System Components

### Frontend (React)
- **Dashboard**: Real-time overview of restaurant operations
- **Orders**: Order creation, modification, and management with business snapshot
- **Products**: Menu management and product catalog with image upload
- **Tables**: Table status and management with capacity and group support
- **Reports**: Comprehensive reporting interface (Sales, Staff, Inventory, Financial)
- **Settings**: System configuration and user management
- **Stock**: Inventory management with stock logs and alerts
- **Users**: User management with role-based permissions
- **Categories**: Product categorization management

### Backend (Node.js)
- **REST API**: HTTP endpoints for all system operations
- **WebSocket Server**: Real-time communication for live updates
- **Authentication**: JWT-based user authentication and authorization
- **File Upload**: Product image management
- **Security**: Rate limiting, CORS, Helmet security headers
- **Role-based Access**: ADMIN and CASHIER roles with permissions

### Database (MySQL with Prisma ORM)
- **Users**: User accounts, roles (ADMIN/CASHIER), permissions
- **Tables**: Restaurant table management with status, capacity, groups
- **Categories**: Product categorization
- **Products**: Menu items, pricing, images, drink classification
- **Orders**: Order records with business snapshot, payment methods
- **Order Items**: Individual order line items
- **Stock**: Inventory management with minimum stock levels
- **Stock Logs**: Inventory transaction history
- **Settings**: System configuration storage

## Key Data Flows

### Order Processing Flow
1. Customer places order → Cashier enters order → System validates → Order created with business snapshot
2. Kitchen receives order → Order status updated → Real-time notification sent via WebSocket
3. Order completed → Payment processed (Cash/Card) → Receipt generated → Table status updated

### Inventory Management Flow
1. Admin adjusts stock → Stock log created → Inventory updated → Alerts triggered for low stock
2. Low stock detection → Notification sent → Reorder recommendations

### User Management Flow
1. Admin creates user → Role assigned (ADMIN/CASHIER) → Permissions set → User can access system
2. User login → JWT token generated → Role-based access enforced → Session management

### Reporting Flow
1. System collects data → Reports generated → Management views insights
2. Real-time metrics → Dashboard updates → Performance monitoring
3. Staff reports → Performance tracking → Business insights

## Technology Stack

- **Frontend**: React.js, Tailwind CSS, React Router, React Toastify
- **Backend**: Node.js, Express.js, WebSocket, Prisma ORM
- **Database**: MySQL with Prisma migrations
- **Authentication**: JWT tokens with role-based authorization
- **Real-time**: WebSocket for live updates and notifications
- **File Storage**: Local file system for product images
- **Security**: Helmet, Rate limiting, CORS, Environment-based security
- **Deployment**: Railway (Backend/DB), Netlify (Frontend)

## Deployment Architecture

- **Frontend**: Netlify (Static hosting with React)
- **Backend**: Railway (Node.js hosting with Express)
- **Database**: Railway MySQL with Prisma ORM
- **File Storage**: Local storage with uploads directory
- **Environment**: Development and Production configurations

This context diagram provides a comprehensive view of how the Restaurant POS System interacts with its external entities and manages data flows throughout the system, accurately reflecting the actual implementation.
