# Restaurant POS Database - Data Dictionary

**Generated:** August 17, 2025  
**Database:** restaurant_pos  
**Version:** 1.0

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [Table Definitions](#table-definitions)
4. [Relationships](#relationships)
5. [Business Rules](#business-rules)
6. [Data Types and Constraints](#data-types-and-constraints)
7. [Enums and Constants](#enums-and-constants)

---

## 📊 Overview

This data dictionary documents the complete database schema for the Restaurant POS (Point of Sale) system. The database consists of 10 tables designed to handle restaurant operations including user management, menu management, order processing, inventory tracking, and system configuration.

### Key Features:
- **User Management**: Role-based access control with granular permissions
- **Menu Management**: Product categorization and pricing
- **Order Processing**: Complete order lifecycle management
- **Inventory Tracking**: Stock management for drink products
- **Table Management**: Restaurant table status and capacity
- **Audit Trail**: Complete transaction history and stock logs

---

## 🗄️ Database Schema

### Table Summary

| # | Table Name | Description | Records | Primary Purpose |
|---|------------|-------------|---------|-----------------|
| 1 | `users` | Staff user accounts | 4 | Authentication & Authorization |
| 2 | `user_permissions` | User access permissions | 7 | Access Control |
| 3 | `tables` | Restaurant tables | 20 | Table Management |
| 4 | `categories` | Product categories | 6 | Menu Organization |
| 5 | `products` | Menu items | 18 | Product Management |
| 6 | `stock` | Inventory levels | 8 | Stock Management |
| 7 | `orders` | Customer orders | 14 | Order Processing |
| 8 | `order_items` | Order line items | 19 | Order Details |
| 9 | `stock_logs` | Inventory transactions | 9 | Audit Trail |
| 10 | `settings` | System configuration | 1 | Configuration |

---

## 📋 Table Definitions

### 1. USERS TABLE

**Purpose:** Stores staff user accounts and authentication information

**Table Name:** `users`

| Field | Data Type | Constraints | Description |
|-------|-----------|-------------|-------------|
| `id` | INT(11) | PRIMARY KEY, AUTO_INCREMENT | Unique user identifier |
| `username` | VARCHAR(191) | UNIQUE, NOT NULL | Login username |
| `password` | VARCHAR(191) | NOT NULL | Hashed password (bcrypt) |
| `role` | ENUM | DEFAULT 'CASHIER' | User role: ADMIN, CASHIER |
| `name` | VARCHAR(191) | NOT NULL | Full name of user |
| `email` | VARCHAR(191) | UNIQUE, NULL | Email address (optional) |
| `isActive` | BOOLEAN | DEFAULT true | Account status |
| `createdAt` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Account creation time |
| `updatedAt` | DATETIME | ON UPDATE CURRENT_TIMESTAMP | Last update time |

**Business Rules:**
- Username must be unique across all users
- Email must be unique if provided
- Password is hashed using bcrypt algorithm
- Only active users can log into the system
- ADMIN users have full system access
- CASHIER users have limited access based on permissions

---

### 2. USER_PERMISSIONS TABLE

**Purpose:** Stores granular permissions for user access control

**Table Name:** `user_permissions`

| Field | Data Type | Constraints | Description |
|-------|-----------|-------------|-------------|
| `id` | INT(11) | PRIMARY KEY, AUTO_INCREMENT | Unique permission record ID |
| `userId` | INT(11) | FOREIGN KEY, NOT NULL | Reference to users.id |
| `permission` | VARCHAR(191) | NOT NULL | Permission string |
| `createdAt` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Permission assignment time |

**Unique Constraint:** `userId` + `permission` combination

**Business Rules:**
- Each user can have multiple permissions
- Permission format: "resource.action" (e.g., "orders.create")
- Common permissions: orders.create, orders.read, products.read, categories.read, tables.read, stock.read
- Cascade delete when user is deleted
- Permissions are checked during application access

---

### 3. TABLES TABLE

**Purpose:** Manages restaurant table information and status

**Table Name:** `tables`

| Field | Data Type | Constraints | Description |
|-------|-----------|-------------|-------------|
| `id` | INT(11) | PRIMARY KEY, AUTO_INCREMENT | Unique table identifier |
| `number` | INT(11) | UNIQUE, NOT NULL | Table number |
| `status` | ENUM | DEFAULT 'AVAILABLE' | Table status |
| `capacity` | INT(11) | DEFAULT 4 | Maximum seating capacity |
| `group` | VARCHAR(191) | DEFAULT 'General' | Table grouping |
| `notes` | VARCHAR(191) | NULL | Additional notes |
| `maintenance` | BOOLEAN | DEFAULT false | Maintenance flag |
| `isActive` | BOOLEAN | DEFAULT true | Table availability |
| `createdAt` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Table creation time |
| `updatedAt` | DATETIME | ON UPDATE CURRENT_TIMESTAMP | Last update time |

**Status Values:** AVAILABLE, OCCUPIED, RESERVED

**Business Rules:**
- Table number must be unique
- Status changes automatically based on order activity
- Capacity determines maximum order size recommendations
- Inactive tables cannot receive new orders
- Maintenance tables are unavailable for orders
- Tables 1-4: 4 seats, Tables 5-8: 6 seats, Tables 9-20: 8 seats

---

### 4. CATEGORIES TABLE

**Purpose:** Product categories for menu organization

**Table Name:** `categories`

| Field | Data Type | Constraints | Description |
|-------|-----------|-------------|-------------|
| `id` | INT(11) | PRIMARY KEY, AUTO_INCREMENT | Unique category identifier |
| `name` | VARCHAR(191) | UNIQUE, NOT NULL | Category name |
| `description` | VARCHAR(191) | NULL | Category description |
| `isActive` | BOOLEAN | DEFAULT true | Category availability |
| `createdAt` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Category creation time |
| `updatedAt` | DATETIME | ON UPDATE CURRENT_TIMESTAMP | Last update time |

**Business Rules:**
- Category name must be unique
- Inactive categories hide their products from the menu
- Cannot delete categories that have active products
- Common categories: Appetizers, Main Course, Beverages, Desserts, Alcoholic Drinks

---

### 5. PRODUCTS TABLE

**Purpose:** Menu items with pricing and categorization

**Table Name:** `products`

| Field | Data Type | Constraints | Description |
|-------|-----------|-------------|-------------|
| `id` | INT(11) | PRIMARY KEY, AUTO_INCREMENT | Unique product identifier |
| `name` | VARCHAR(191) | UNIQUE, NOT NULL | Product name |
| `description` | VARCHAR(191) | NULL | Product description |
| `price` | DECIMAL(10,2) | NOT NULL | Product price |
| `categoryId` | INT(11) | FOREIGN KEY, NOT NULL | Reference to categories.id |
| `isDrink` | BOOLEAN | DEFAULT false | Drink flag for inventory |
| `isActive` | BOOLEAN | DEFAULT true | Product availability |
| `imageUrl` | VARCHAR(191) | NULL | Product image URL |
| `createdAt` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Product creation time |
| `updatedAt` | DATETIME | ON UPDATE CURRENT_TIMESTAMP | Last update time |

**Business Rules:**
- Product name must be unique
- Price must be positive
- isDrink flag determines if product needs stock tracking
- Inactive products cannot be ordered
- Image URL is optional
- Products with isDrink=true automatically get stock records

---

### 6. STOCK TABLE

**Purpose:** Inventory levels for drink products

**Table Name:** `stock`

| Field | Data Type | Constraints | Description |
|-------|-----------|-------------|-------------|
| `id` | INT(11) | PRIMARY KEY, AUTO_INCREMENT | Unique stock record ID |
| `productId` | INT(11) | FOREIGN KEY, UNIQUE, NOT NULL | Reference to products.id |
| `quantity` | INT(11) | DEFAULT 0 | Current stock quantity |
| `minStock` | INT(11) | DEFAULT 10 | Minimum stock level |
| `createdAt` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Stock record creation time |
| `updatedAt` | DATETIME | ON UPDATE CURRENT_TIMESTAMP | Last update time |

**Business Rules:**
- Only products with isDrink=true have stock records
- Quantity cannot be negative
- minStock triggers low stock alerts
- Stock is automatically reduced when drink is ordered
- Stock can be manually adjusted through stock management
- One-to-one relationship with products table

---

### 7. ORDERS TABLE

**Purpose:** Customer orders and transaction records

**Table Name:** `orders`

| Field | Data Type | Constraints | Description |
|-------|-----------|-------------|-------------|
| `id` | INT(11) | PRIMARY KEY, AUTO_INCREMENT | Unique order identifier |
| `orderNumber` | VARCHAR(191) | UNIQUE, NOT NULL | Auto-generated order number |
| `tableId` | INT(11) | FOREIGN KEY, NOT NULL | Reference to tables.id |
| `userId` | INT(11) | FOREIGN KEY, NOT NULL | Reference to users.id |
| `status` | ENUM | DEFAULT 'PENDING' | Order status |
| `subtotal` | DECIMAL(10,2) | NOT NULL | Order subtotal |
| `tax` | DECIMAL(10,2) | DEFAULT 0.00 | Tax amount |
| `discount` | DECIMAL(10,2) | DEFAULT 0.00 | Discount amount |
| `total` | DECIMAL(10,2) | NOT NULL | Final total amount |
| `paymentMethod` | ENUM | NULL | Payment method |
| `customerNote` | VARCHAR(191) | NULL | Customer special requests |
| `businessSnapshot` | LONGTEXT | NULL | Business settings at order time |
| `createdAt` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Order creation time |
| `updatedAt` | DATETIME | ON UPDATE CURRENT_TIMESTAMP | Last update time |

**Status Values:** PENDING, COMPLETED, CANCELLED  
**Payment Methods:** CASH, CARD

**Business Rules:**
- Order number format: ORD-YYYYMMDD-XXXXXX
- total = subtotal + tax - discount
- PENDING orders can be modified
- COMPLETED orders cannot be changed
- CANCELLED orders are marked but not deleted
- businessSnapshot preserves settings at order time
- Stock is reduced when order is completed

---

### 8. ORDER_ITEMS TABLE

**Purpose:** Individual items within each order

**Table Name:** `order_items`

| Field | Data Type | Constraints | Description |
|-------|-----------|-------------|-------------|
| `id` | INT(11) | PRIMARY KEY, AUTO_INCREMENT | Unique order item ID |
| `orderId` | INT(11) | FOREIGN KEY, NOT NULL | Reference to orders.id |
| `productId` | INT(11) | FOREIGN KEY, NOT NULL | Reference to products.id |
| `quantity` | INT(11) | NOT NULL | Quantity ordered |
| `price` | DECIMAL(10,2) | NOT NULL | Unit price at order time |
| `subtotal` | DECIMAL(10,2) | NOT NULL | Line item total |
| `createdAt` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Item creation time |

**Business Rules:**
- quantity must be positive
- price is captured at order time (may differ from current price)
- subtotal = quantity * price
- Cascade delete when order is deleted
- Stock is reduced based on quantity for drink items

---

### 9. STOCK_LOGS TABLE

**Purpose:** Inventory transaction history and audit trail

**Table Name:** `stock_logs`

| Field | Data Type | Constraints | Description |
|-------|-----------|-------------|-------------|
| `id` | INT(11) | PRIMARY KEY, AUTO_INCREMENT | Unique log record ID |
| `stockId` | INT(11) | FOREIGN KEY, NOT NULL | Reference to stock.id |
| `userId` | INT(11) | FOREIGN KEY, NOT NULL | Reference to users.id |
| `type` | ENUM | NOT NULL | Transaction type |
| `quantity` | INT(11) | NOT NULL | Quantity changed |
| `note` | VARCHAR(191) | NULL | Optional transaction note |
| `createdAt` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Transaction time |

**Transaction Types:** ADD, REMOVE, ADJUST

**Business Rules:**
- ADD: Increases stock quantity
- REMOVE: Decreases stock quantity (e.g., order completion)
- ADJUST: Sets stock to specific quantity
- quantity is positive for ADD, negative for REMOVE
- Provides complete audit trail for inventory changes
- Cannot be deleted (audit requirement)

---

### 10. SETTINGS TABLE

**Purpose:** System configuration and business settings

**Table Name:** `settings`

| Field | Data Type | Constraints | Description |
|-------|-----------|-------------|-------------|
| `id` | INT(11) | PRIMARY KEY, AUTO_INCREMENT | Unique setting record ID |
| `category` | VARCHAR(191) | UNIQUE, NOT NULL | Setting category |
| `data` | LONGTEXT | NOT NULL | JSON configuration data |
| `createdAt` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Setting creation time |
| `updatedAt` | DATETIME | ON UPDATE CURRENT_TIMESTAMP | Last update time |

**Business Rules:**
- category must be unique
- data contains JSON configuration
- Common categories: "business" (restaurant info, tax rates)
- Used by application for configuration
- businessSnapshot in orders references this data

---

## 🔗 Relationships

### Entity Relationship Diagram

```
users (1) ←→ (N) user_permissions
users (1) ←→ (N) orders
users (1) ←→ (N) stock_logs

tables (1) ←→ (N) orders

categories (1) ←→ (N) products

products (1) ←→ (N) order_items
products (1) ←→ (1) stock

stock (1) ←→ (N) stock_logs

orders (1) ←→ (N) order_items
```

### Relationship Details

| Parent Table | Child Table | Relationship Type | Foreign Key | Cascade Rule |
|--------------|-------------|-------------------|-------------|--------------|
| `users` | `user_permissions` | One-to-Many | userId | CASCADE DELETE |
| `users` | `orders` | One-to-Many | userId | RESTRICT |
| `users` | `stock_logs` | One-to-Many | userId | RESTRICT |
| `tables` | `orders` | One-to-Many | tableId | RESTRICT |
| `categories` | `products` | One-to-Many | categoryId | RESTRICT |
| `products` | `order_items` | One-to-Many | productId | RESTRICT |
| `products` | `stock` | One-to-One | productId | CASCADE DELETE |
| `stock` | `stock_logs` | One-to-Many | stockId | RESTRICT |
| `orders` | `order_items` | One-to-Many | orderId | CASCADE DELETE |

---

## 📋 Business Rules

### Data Validation Rules

1. **Stock Management:**
   - Stock quantity cannot be negative
   - Only drink products (isDrink=true) have stock records
   - Stock is automatically reduced when orders are completed

2. **Order Processing:**
   - Order total must equal subtotal + tax - discount
   - Order item subtotal must equal quantity * price
   - PENDING orders can be modified, COMPLETED orders cannot
   - Order numbers are auto-generated with timestamp

3. **Product Management:**
   - Product names must be unique
   - Prices must be positive
   - Inactive products cannot be ordered
   - Products must belong to an active category

4. **User Management:**
   - Usernames must be unique
   - Emails must be unique if provided
   - Only active users can log in
   - Passwords are hashed using bcrypt

5. **Table Management:**
   - Table numbers must be unique
   - Inactive tables cannot receive orders
   - Maintenance tables are unavailable
   - Status changes based on order activity

### Workflow Rules

1. **Order Creation:**
   - Select available table
   - Add products to order
   - Calculate totals automatically
   - Apply tax and discounts
   - Generate unique order number

2. **Order Completion:**
   - Update order status to COMPLETED
   - Reduce stock for drink items
   - Create stock log entries
   - Update table status to AVAILABLE

3. **Stock Management:**
   - Monitor stock levels
   - Alert when below minimum
   - Log all stock transactions
   - Maintain audit trail

---

## 📊 Data Types and Constraints

### Data Type Summary

| Data Type | Usage | Description |
|-----------|-------|-------------|
| INT(11) | IDs, quantities, capacities | Integer values |
| VARCHAR(191) | Names, descriptions, notes | Variable-length strings |
| DECIMAL(10,2) | Prices, totals, amounts | Fixed-point decimal numbers |
| BOOLEAN | Flags, status indicators | True/false values |
| ENUM | Status, types, methods | Predefined value sets |
| DATETIME | Timestamps | Date and time values |
| LONGTEXT | JSON data, snapshots | Large text content |

### Constraint Types

1. **Primary Keys:** All tables have auto-incrementing integer primary keys
2. **Foreign Keys:** All relationships are properly constrained
3. **Unique Constraints:** Business keys (usernames, product names, etc.)
4. **NOT NULL:** Required fields are marked as NOT NULL
5. **DEFAULT VALUES:** Appropriate default values for optional fields

---

## 🎯 Enums and Constants

### UserRole Enum
- **ADMIN:** Full system access, can manage all aspects
- **CASHIER:** Limited access based on assigned permissions

### TableStatus Enum
- **AVAILABLE:** Ready for new orders
- **OCCUPIED:** Currently has active order
- **RESERVED:** Reserved for future use

### OrderStatus Enum
- **PENDING:** Order created, not yet completed
- **COMPLETED:** Order finished and paid
- **CANCELLED:** Order cancelled

### PaymentMethod Enum
- **CASH:** Cash payment
- **CARD:** Card payment

### StockLogType Enum
- **ADD:** Increase stock quantity
- **REMOVE:** Decrease stock quantity
- **ADJUST:** Set stock to specific quantity

---

## 📈 Performance Considerations

### Indexes
- Primary keys are automatically indexed
- Foreign keys are indexed for join performance
- Unique constraints create indexes
- Composite indexes on frequently queried combinations

### Data Volume
- Current database size: ~586 lines in SQL dump
- Orders table: 14 records (growing with business)
- Stock logs: 9 records (audit trail)
- Products: 18 items (menu management)

### Optimization Recommendations
1. **Archive old orders** after 2-3 years
2. **Implement data retention policies** for stock_logs
3. **Regular cleanup** of inactive products/categories
4. **Monitor table growth** for performance planning

---

## 🔒 Security Considerations

### Data Protection
- Passwords are hashed using bcrypt
- User sessions are managed securely
- Role-based access control implemented
- Granular permissions system

### Audit Trail
- All stock changes are logged
- Order history is preserved
- User actions are tracked
- Business snapshots capture settings at order time

---

## 📝 Maintenance Procedures

### Regular Tasks
1. **Backup database** (currently using SQL dumps)
2. **Monitor stock levels** and low stock alerts
3. **Review inactive products** and categories
4. **Check for orphaned records**
5. **Update business settings** as needed

### Data Cleanup
1. **Archive old orders** periodically
2. **Remove inactive users** and products
3. **Consolidate duplicate categories**
4. **Validate data integrity** regularly

---

*This data dictionary provides complete documentation of the restaurant POS database schema. For technical implementation details, refer to the Prisma schema file and application code.*



