# DINE-IN Restaurant POS System - Level 0 DFD (Context Diagram)

## System Overview
The DINE-IN Restaurant POS System is a comprehensive point-of-sale solution specifically designed for dine-in restaurant operations.

## Level 0 DFD (Context Diagram)

```
                                    ┌─────────────────────────────────────┐
                                    │                                     │
                                    │    DINE-IN RESTAURANT POS SYSTEM    │
                                    │                                     │
                                    └─────────────────────────────────────┘
                                              ▲
                                              │
                                              ▼
                    ┌─────────────────────────────────────────────────────────────┐
                    │                    EXTERNAL ENTITIES                        │
                    └─────────────────────────────────────────────────────────────┘

┌─────────────────┐                                    ┌─────────────────┐
│    CASHIERS     │                                    │     ADMINS      │
│                 │                                    │                 │
└─────────────────┘                                    └─────────────────┘
         ▲                                                       ▲
         │                                                       │
         ▼                                                       ▼

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              DINE-IN CUSTOMERS                                  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Data Flows with Labeled Arrows

### **DINE-IN CUSTOMERS ↔ CASHIERS**

**From Customers to Cashiers:**
- **Order Details** → Cashiers
- **Payment** → Cashiers

**From Cashiers to Customers:**
- **Invoice** ← Cashiers

### **CASHIERS ↔ DINE-IN RESTAURANT POS SYSTEM**

**From Cashiers to System:**
- **Create Order** → System
- **Make Payment** → System
- **Table Status** → System
- **Menu Request** → System

**From System to Cashiers:**
- **Order Confirmation** ← System
- **Payment Confirmation** ← System
- **Table Info** ← System
- **Menu Data** ← System
- **Basic Report** ← System

### **ADMINS ↔ DINE-IN RESTAURANT POS SYSTEM**

**From Admins to System:**
- **User Management** → System
- **Inventory** → System
- **Settings** → System
- **Menu Management** → System
- **Stock Management** → System
- **Report Request** → System

**From System to Admins:**
- **User Data** ← System
- **Inventory Report** ← System
- **Settings Config** ← System
- **Menu Data** ← System
- **Stock Data** ← System
- **Reports** ← System
- **Analytics** ← System

## External Entities

### **DINE-IN CUSTOMERS:**
- Provide order details to cashiers
- Make payments to cashiers
- Receive printed invoices from cashiers

### **CASHIERS:**
- Receive order details from customers
- Input orders into the system
- Process payments through the system
- Print invoices for customers
- Manage tables
- View menu
- Basic reports

### **ADMINS:**
- User management
- Inventory control
- System settings
- Menu management
- Stock management
- Request and receive comprehensive reports
- All analytics and business intelligence

## System Functions

### **DINE-IN RESTAURANT POS SYSTEM:**
- Order Processing
- Table Management
- Inventory Management
- User Management
- Menu Management
- Reporting System
- Settings Management
- Real-time Updates

## Relationship Summary

**The Customer interacts indirectly with the system through the Cashier** by providing their Order Details and Payment. They receive a printed Invoice.

**The Cashier directly interacts with the Restaurant POS System** by inputting the Create Order and Make Payment information.

**The Admin has a broader scope of interaction.** They can perform all cashier tasks and also request and receive Reports from the system.

This Level 0 DFD provides a clear, simple view of how the DINE-IN Restaurant POS System interacts with its external entities through specific labeled data flows, accurately reflecting the dine-in restaurant workflow.
