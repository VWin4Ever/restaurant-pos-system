# Visual ER Diagram - Restaurant Management System

## Entity Relationship Diagram

```mermaid
erDiagram
    User {
        int id PK
        string username UK
        string password
        enum role
        string name
        string email UK
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }

    UserPermission {
        int id PK
        int userId FK
        string permission
        datetime createdAt
    }

    Table {
        int id PK
        int number UK
        enum status
        int capacity
        string group
        string notes
        boolean maintenance
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }

    Category {
        int id PK
        string name UK
        string description
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }

    Product {
        int id PK
        string name UK
        string description
        decimal price
        int categoryId FK
        boolean isDrink
        boolean isActive
        string imageUrl
        datetime createdAt
        datetime updatedAt
    }

    Stock {
        int id PK
        int productId FK,UK
        int quantity
        int minStock
        datetime createdAt
        datetime updatedAt
    }

    Order {
        int id PK
        string orderNumber UK
        int tableId FK
        int userId FK
        enum status
        decimal subtotal
        decimal tax
        decimal discount
        decimal total
        enum paymentMethod
        string customerNote
        datetime createdAt
        datetime updatedAt
        string businessSnapshot
    }

    OrderItem {
        int id PK
        int orderId FK
        int productId FK
        int quantity
        decimal price
        decimal subtotal
        datetime createdAt
    }

    StockLog {
        int id PK
        int stockId FK
        int userId FK
        enum type
        int quantity
        string note
        datetime createdAt
    }

    Settings {
        int id PK
        string category UK
        string data
        datetime createdAt
        datetime updatedAt
    }

    %% Relationships
    User ||--o{ UserPermission : "has"
    User ||--o{ Order : "creates"
    User ||--o{ StockLog : "performs"
    
    Table ||--o{ Order : "assigned_to"
    
    Category ||--o{ Product : "contains"
    
    Product ||--|| Stock : "has"
    Product ||--o{ OrderItem : "included_in"
    
    Order ||--o{ OrderItem : "contains"
    
    Stock ||--o{ StockLog : "tracked_by"

    %% Enums
    UserRole {
        ADMIN
        CASHIER
    }

    TableStatus {
        AVAILABLE
        OCCUPIED
        RESERVED
    }

    OrderStatus {
        PENDING
        COMPLETED
        CANCELLED
    }

    PaymentMethod {
        CASH
        CARD
    }

    StockLogType {
        ADD
        REMOVE
        ADJUST
    }
```

## Key Relationships Summary

### Core Business Entities
1. **User Management**
   - Users can have multiple permissions (UserPermission)
   - Users create orders and perform stock operations

2. **Table Management**
   - Tables are assigned to orders
   - Each table has a status (available/occupied/reserved)

3. **Product Management**
   - Products belong to categories
   - Each product has associated stock
   - Products are included in order items

4. **Order Management**
   - Orders are created by users and assigned to tables
   - Orders contain multiple order items
   - Each order item references a specific product

5. **Inventory Management**
   - Stock tracks product quantities
   - StockLog records all inventory changes
   - All stock operations are attributed to users

6. **System Configuration**
   - Settings table stores system configuration data

## Cardinality Rules

- **1:1 Relationships**: Product ↔ Stock (one product has exactly one stock record)
- **1:Many Relationships**: 
  - User → Orders, StockLogs, UserPermissions
  - Table → Orders
  - Category → Products
  - Product → OrderItems
  - Order → OrderItems
  - Stock → StockLogs
- **Many:Many Relationships**: None (all relationships are 1:1 or 1:Many)

## Data Flow Patterns

1. **Order Creation Flow**: User → Table → Order → OrderItems → Products
2. **Inventory Management Flow**: User → StockLog → Stock → Product
3. **Product Management Flow**: Category → Product → Stock
4. **User Activity Tracking**: User → Orders/StockLogs (audit trail)

























