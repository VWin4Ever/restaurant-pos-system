# Restaurant POS System - Data Flow Diagrams (DFD)

## Overview
This document contains both Level 0 (Context Diagram) and Level 1 Data Flow Diagrams for the Restaurant POS System, showing how data flows through the system at different levels of detail.

---

## Level 0 DFD (Context Diagram)

**Level 0 shows the system as a single process with all external entities and their data flows.**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              RESTAURANT POS SYSTEM                              │
│                              (Level 0 - Context)                                │
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

### Level 0 Data Flows:

#### **From Cashiers:**
- Order requests → System
- Payment information (Cash/Card) → System
- Table status updates → System
- Receipt requests → System
- Product viewing requests → System
- Basic report requests → System

#### **From Admins:**
- User management requests → System
- Inventory adjustments → System
- System settings → System
- Report generation requests → System
- Stock management requests → System
- Product management requests → System

#### **From Customers:**
- Order placement → System
- Payment information → System
- Menu requests → System
- Order status inquiries → System

#### **From Management:**
- Report requests → System
- Performance metrics requests → System
- Business data requests → System
- Staff performance requests → System

#### **To Cashiers:**
- Order confirmations ← System
- Receipts ← System
- Table status updates ← System
- Real-time notifications ← System
- Product information ← System
- Basic reports ← System

#### **To Admins:**
- User accounts ← System
- Inventory reports ← System
- System configurations ← System
- Comprehensive reports ← System
- Stock logs ← System
- Product data ← System

#### **To Customers:**
- Receipts ← System
- Order confirmations ← System
- Menu information ← System
- Order status updates ← System

#### **To Management:**
- Financial reports ← System
- Sales analytics ← System
- Performance metrics ← System
- Business insights ← System
- Staff reports ← System

---

## Level 1 DFD (Major Processes)

**Level 1 breaks down the system into major processes, showing how data flows between them.**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              RESTAURANT POS SYSTEM                              │
│                              (Level 1 - Major Processes)                        │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    CASHIERS     │    │     ADMINS      │    │    CUSTOMERS    │    │   MANAGEMENT    │
│                 │    │                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
         ▲                       ▲                       ▲                       ▲
         │                       │                       │                       │
         ▼                       ▼                       ▼                       ▼

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              MAJOR PROCESSES                                   │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   1.0 USER      │    │  2.0 ORDER      │    │  3.0 INVENTORY  │    │  4.0 TABLE      │
│  AUTHENTICATION │    │   MANAGEMENT    │    │   MANAGEMENT    │    │   MANAGEMENT    │
│                 │    │                 │    │                 │    │                 │
│ • Login/Logout  │    │ • Create Order  │    │ • Track Stock   │    │ • Table Status  │
│ • Role Check    │    │ • Modify Order  │    │ • Adjust Stock  │    │ • Reservations  │
│ • Permissions   │    │ • Process Order │    │ • Stock Alerts  │    │ • Capacity Mgmt │
│ • User Mgmt     │    │ • Payment Proc  │    │ • Stock Logs    │    │ • Maintenance   │
│ • JWT Tokens    │    │ • Business Snap │    │ • Min Stock     │    │ • Groups        │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
         ▲                       ▲                       ▲                       ▲
         │                       │                       │                       │
         ▼                       ▼                       ▼                       ▼

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  5.0 PRODUCT    │    │  6.0 REPORTING  │    │  7.0 SETTINGS   │    │  8.0 REAL-TIME  │
│   MANAGEMENT    │    │     SYSTEM      │    │   MANAGEMENT    │    │   UPDATES       │
│                 │    │                 │    │                 │    │                 │
│ • Product CRUD  │    │ • Sales Reports │    │ • System Config │    │ • WebSocket     │
│ • Category Mgmt │    │ • Inventory Rep │    │ • Business Rules│    │ • Live Updates  │
│ • Price Mgmt    │    │ • Financial Rep │    │ • Tax Settings  │    │ • Notifications │
│ • Image Upload  │    │ • Staff Reports │    │ • Security Set  │    │ • Sync Data     │
│ • Drink Class   │    │ • Performance   │    │ • Environment   │    │ • Event Broadcast│
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              DATA STORES                                        │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   D1: USERS     │    │   D2: ORDERS    │    │   D3: PRODUCTS  │    │   D4: STOCK     │
│                 │    │                 │    │                 │    │                 │
│ • User accounts │    │ • Order records │    │ • Product info  │    │ • Stock levels  │
│ • Roles (ADMIN/ │    │ • Order items   │    │ • Categories    │    │ • Stock logs    │
│   CASHIER)      │    │ • Payment info  │    │ • Prices        │    │ • Alerts        │
│ • Permissions   │    │ • Status        │    │ • Images        │    │ • Min levels    │
│ • Auth tokens   │    │ • Business snap │    │ • Drink class   │    │ • History       │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   D5: TABLES    │    │   D6: SETTINGS  │    │   D7: REPORTS   │    │   D8: LOGS      │
│                 │    │                 │    │                 │    │                 │
│ • Table info    │    │ • System config │    │ • Report data   │    │ • Activity logs │
│ • Status        │    │ • Business rules│    │ • Analytics     │    │ • Error logs    │
│ • Capacity      │    │ • Tax settings  │    │ • Metrics       │    │ • Audit trails  │
│ • Groups        │    │ • Security set  │    │ • Historical    │    │ • Performance   │
│ • Maintenance   │    │ • Environment   │    │ • Staff data    │    │ • WebSocket logs│
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Level 1 Process Details:

#### **1.0 User Authentication**
- **Inputs**: Login credentials, user management requests, role assignments
- **Outputs**: JWT authentication tokens, user accounts, role-based permissions
- **Data Stores**: D1 (Users), D8 (Logs)
- **Functions**: Login/logout, role management (ADMIN/CASHIER), permission checking, JWT token generation

#### **2.0 Order Management**
- **Inputs**: Order requests, payment information (Cash/Card), table assignments, business snapshot
- **Outputs**: Order confirmations, receipts, payment confirmations, order status updates
- **Data Stores**: D2 (Orders), D3 (Products), D5 (Tables), D8 (Logs)
- **Functions**: Order creation, modification, payment processing, status updates, business snapshot generation

#### **3.0 Inventory Management**
- **Inputs**: Stock adjustments, inventory requests, alerts, minimum stock levels
- **Outputs**: Stock levels, inventory reports, reorder notifications, stock history
- **Data Stores**: D4 (Stock), D3 (Products), D8 (Logs)
- **Functions**: Stock tracking, adjustments, alert generation, log management, minimum stock monitoring

#### **4.0 Table Management**
- **Inputs**: Table status updates, reservation requests, capacity changes, group assignments
- **Outputs**: Table availability, reservation confirmations, status notifications, group management
- **Data Stores**: D5 (Tables), D8 (Logs)
- **Functions**: Status management, reservation handling, capacity tracking, group organization, maintenance tracking

#### **5.0 Product Management**
- **Inputs**: Product information, category requests, price updates, image uploads, drink classification
- **Outputs**: Product catalog, category lists, price information, image URLs, drink/food classification
- **Data Stores**: D3 (Products), D8 (Logs)
- **Functions**: Product CRUD, category management, price management, image handling, drink classification

#### **6.0 Reporting System**
- **Inputs**: Report requests, data queries, analytics requests, staff performance data
- **Outputs**: Sales reports, inventory reports, financial reports, staff reports, performance metrics
- **Data Stores**: D7 (Reports), D2 (Orders), D4 (Stock), D1 (Users), D8 (Logs)
- **Functions**: Report generation, data aggregation, analytics, export functionality, staff performance tracking

#### **7.0 Settings Management**
- **Inputs**: Configuration requests, business rule updates, security settings, environment configurations
- **Outputs**: System configurations, business rules, security policies, environment settings
- **Data Stores**: D6 (Settings), D8 (Logs)
- **Functions**: Configuration management, business rule enforcement, security management, environment configuration

#### **8.0 Real-Time Updates**
- **Inputs**: System events, status changes, notifications, WebSocket connections
- **Outputs**: Real-time updates, live notifications, synchronized data, event broadcasting
- **Data Stores**: All data stores (D1-D8)
- **Functions**: WebSocket management, event broadcasting, data synchronization, live notifications

### Key Data Flows Between Processes:

1. **User Authentication ↔ Order Management**: User validation for order processing
2. **Order Management ↔ Inventory Management**: Stock deduction for orders
3. **Order Management ↔ Table Management**: Table assignment and status updates
4. **Product Management ↔ Inventory Management**: Product-stock relationships
5. **Reporting System ↔ All Processes**: Data collection for reports
6. **Real-Time Updates ↔ All Processes**: Live synchronization of data changes
7. **Settings Management ↔ All Processes**: Configuration enforcement
8. **User Authentication ↔ All Processes**: Role-based access control

### Data Store Relationships:

- **D1 (Users)** ↔ Processes 1.0, 6.0, 8.0
- **D2 (Orders)** ↔ Processes 2.0, 6.0, 8.0
- **D3 (Products)** ↔ Processes 2.0, 3.0, 5.0, 6.0, 8.0
- **D4 (Stock)** ↔ Processes 3.0, 6.0, 8.0
- **D5 (Tables)** ↔ Processes 2.0, 4.0, 6.0, 8.0
- **D6 (Settings)** ↔ Processes 7.0, 8.0
- **D7 (Reports)** ↔ Processes 6.0, 8.0
- **D8 (Logs)** ↔ All processes (audit trail)

This Level 1 DFD provides a detailed view of how data flows between the major processes in your Restaurant POS System, showing the relationships between different system components and data stores, accurately reflecting the actual implementation.

