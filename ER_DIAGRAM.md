# Entity Relationship (ER) Diagram - Restaurant Management System

## Overview
This document provides a detailed Entity Relationship diagram for the restaurant management system, showing all entities, their attributes, and relationships.

## Entities and Attributes

### 1. User Entity
```
User {
  id: Int (PK)
  username: String (Unique)
  password: String
  role: UserRole (ADMIN/CASHIER)
  name: String
  email: String (Unique, Optional)
  isActive: Boolean
  createdAt: DateTime
  updatedAt: DateTime
}
```

### 2. UserPermission Entity
```
UserPermission {
  id: Int (PK)
  userId: Int (FK)
  permission: String
  createdAt: DateTime
}
```

### 3. Table Entity
```
Table {
  id: Int (PK)
  number: Int (Unique)
  status: TableStatus (AVAILABLE/OCCUPIED/RESERVED)
  capacity: Int
  group: String (Optional)
  notes: String (Optional)
  maintenance: Boolean
  isActive: Boolean
  createdAt: DateTime
  updatedAt: DateTime
}
```

### 4. Category Entity
```
Category {
  id: Int (PK)
  name: String (Unique)
  description: String (Optional)
  isActive: Boolean
  createdAt: DateTime
  updatedAt: DateTime
}
```

### 5. Product Entity
```
Product {
  id: Int (PK)
  name: String (Unique)
  description: String (Optional)
  price: Decimal(10,2)
  categoryId: Int (FK)
  isDrink: Boolean
  isActive: Boolean
  imageUrl: String (Optional)
  createdAt: DateTime
  updatedAt: DateTime
}
```

### 6. Stock Entity
```
Stock {
  id: Int (PK)
  productId: Int (FK, Unique)
  quantity: Int
  minStock: Int
  createdAt: DateTime
  updatedAt: DateTime
}
```

### 7. Order Entity
```
Order {
  id: Int (PK)
  orderNumber: String (Unique)
  tableId: Int (FK)
  userId: Int (FK)
  status: OrderStatus (PENDING/COMPLETED/CANCELLED)
  subtotal: Decimal(10,2)
  tax: Decimal(10,2)
  discount: Decimal(10,2)
  total: Decimal(10,2)
  paymentMethod: PaymentMethod (CASH/CARD, Optional)
  customerNote: String (Optional)
  createdAt: DateTime
  updatedAt: DateTime
  businessSnapshot: String (Optional, LongText)
}
```

### 8. OrderItem Entity
```
OrderItem {
  id: Int (PK)
  orderId: Int (FK)
  productId: Int (FK)
  quantity: Int
  price: Decimal(10,2)
  subtotal: Decimal(10,2)
  createdAt: DateTime
}
```

### 9. StockLog Entity
```
StockLog {
  id: Int (PK)
  stockId: Int (FK)
  userId: Int (FK)
  type: StockLogType (ADD/REMOVE/ADJUST)
  quantity: Int
  note: String (Optional)
  createdAt: DateTime
}
```

### 10. Settings Entity
```
Settings {
  id: Int (PK)
  category: String (Unique)
  data: String (LongText)
  createdAt: DateTime
  updatedAt: DateTime
}
```

## Relationships

### One-to-Many Relationships
1. **User → Order**: One user can create many orders
2. **User → StockLog**: One user can create many stock logs
3. **User → UserPermission**: One user can have many permissions
4. **Table → Order**: One table can have many orders
5. **Category → Product**: One category can have many products
6. **Product → OrderItem**: One product can be in many order items
7. **Product → Stock**: One product has one stock record (1:1)
8. **Order → OrderItem**: One order can have many order items
9. **Stock → StockLog**: One stock can have many stock logs

### Foreign Key Relationships
- `UserPermission.userId` → `User.id`
- `Product.categoryId` → `Category.id`
- `Stock.productId` → `Product.id`
- `Order.tableId` → `Table.id`
- `Order.userId` → `User.id`
- `OrderItem.orderId` → `Order.id`
- `OrderItem.productId` → `Product.id`
- `StockLog.stockId` → `Stock.id`
- `StockLog.userId` → `User.id`

## Enums

### UserRole
- ADMIN
- CASHIER

### TableStatus
- AVAILABLE
- OCCUPIED
- RESERVED

### OrderStatus
- PENDING
- COMPLETED
- CANCELLED

### PaymentMethod
- CASH
- CARD

### StockLogType
- ADD
- REMOVE
- ADJUST

## Database Constraints

### Unique Constraints
- `User.username` - Unique
- `User.email` - Unique (if provided)
- `Table.number` - Unique
- `Category.name` - Unique
- `Product.name` - Unique
- `Order.orderNumber` - Unique
- `Stock.productId` - Unique (1:1 relationship with Product)
- `Settings.category` - Unique
- `UserPermission[userId, permission]` - Composite unique

### Indexes
- `Product.categoryId` - Indexed for faster category lookups
- `Order.tableId` - Indexed for faster table order lookups
- `Order.userId` - Indexed for faster user order lookups
- `OrderItem.orderId` - Indexed for faster order item lookups
- `OrderItem.productId` - Indexed for faster product order item lookups
- `StockLog.stockId` - Indexed for faster stock log lookups
- `StockLog.userId` - Indexed for faster user stock log lookups

## Business Logic Relationships

### Order Management Flow
1. **Table Assignment**: Orders are assigned to specific tables
2. **User Tracking**: All orders are tracked by the user who created them
3. **Product Selection**: Orders contain multiple order items, each referencing a product
4. **Pricing**: Each order item stores the price at the time of order (price history)
5. **Stock Management**: Products have associated stock levels that are tracked through stock logs

### Inventory Management Flow
1. **Stock Tracking**: Each product has one stock record
2. **Stock Logging**: All stock changes are logged with user attribution
3. **Minimum Stock**: Stock records include minimum stock levels for alerts

### User Management Flow
1. **Role-Based Access**: Users have specific roles (ADMIN/CASHIER)
2. **Permission System**: Additional granular permissions through UserPermission table
3. **Activity Tracking**: All user actions are tracked through related entities

## Data Integrity

### Cascade Deletes
- When a User is deleted, all related UserPermissions are deleted
- When an Order is deleted, all related OrderItems are deleted
- When a Stock is deleted, all related StockLogs are deleted

### Referential Integrity
- All foreign key relationships maintain referential integrity
- Products cannot exist without a valid Category
- Orders cannot exist without valid Table and User references
- OrderItems cannot exist without valid Order and Product references
- Stock cannot exist without a valid Product reference
- StockLogs cannot exist without valid Stock and User references


































