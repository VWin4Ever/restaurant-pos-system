# 📊 Demo Flow - Visual Guide

## 🎯 Complete Demo Flow (15-20 minutes)

```
┌─────────────────────────────────────────────────────────────┐
│                    START DEMO                               │
│                 (2 minutes intro)                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │   Introduce Yourself       │
        │   & Project                │
        └────────────┬───────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │   Explain Tech Stack       │
        │   React + Node + MySQL     │
        └────────────┬───────────────┘
                     │
                     │
┌────────────────────▼────────────────────────────────────────┐
│                PART 1: CASHIER ROLE                         │
│                    (5-6 minutes)                            │
└─────────────────────────────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │  Login as Cashier          │
        │  User: cashier             │
        │  Pass: cashier123          │
        └────────────┬───────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │  Show Dashboard            │
        │  - Today's sales           │
        │  - Active orders           │
        │  - Table status            │
        └────────────┬───────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │  Create Order              │
        │  1. Select table           │
        │  2. Add items (food+drink) │
        │  3. Show total calculation │
        │  4. Confirm order          │
        └────────────┬───────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │  Process Payment           │
        │  1. Go to Pending Orders   │
        │  2. Click Pay              │
        │  3. Select payment method  │
        │  4. Show currency calc     │
        │  5. Complete payment       │
        └────────────┬───────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │  Show Sales Report         │
        │  - Date filters            │
        │  - Financial metrics       │
        │  - Payment breakdown       │
        └────────────┬───────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │  Logout                    │
        └────────────┬───────────────┘
                     │
                     │
┌────────────────────▼────────────────────────────────────────┐
│                PART 2: ADMIN ROLE                           │
│                   (8-10 minutes)                            │
└─────────────────────────────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │  Login as Admin            │
        │  User: admin               │
        │  Pass: admin123            │
        └────────────┬───────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │  Admin Dashboard           │
        │  - Sales overview          │
        │  - Revenue trends          │
        │  - Inventory alerts        │
        │  - Top products            │
        │  - Staff performance       │
        └────────────┬───────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │  Inventory Management      │
        │  1. Show stock levels      │
        │  2. Add stock to a drink   │
        │  3. Show stock history     │
        │  4. Show low stock alerts  │
        └────────────┬───────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │  Menu Management           │
        │  1. Show product list      │
        │  2. Add new product        │
        │  3. Edit product           │
        │  4. Show categories        │
        └────────────┬───────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │  Table Management          │
        │  1. Show table statuses    │
        │  2. Add new table          │
        │  3. Explain auto-status    │
        └────────────┬───────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │  User Management           │
        │  1. Show user list         │
        │  2. Add new user           │
        │  3. Explain roles          │
        │  4. Explain security       │
        └────────────┬───────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │  Advanced Reports          │
        │  1. Sales reports          │
        │  2. Top products           │
        │  3. Staff performance      │
        │  4. Inventory reports      │
        │  5. Financial reports      │
        └────────────┬───────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │  Settings (Optional)       │
        │  - Restaurant info         │
        │  - Tax settings            │
        │  - Currency                │
        └────────────┬───────────────┘
                     │
                     │
┌────────────────────▼────────────────────────────────────────┐
│                    CONCLUSION                               │
│                   (2-3 minutes)                             │
└─────────────────────────────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │  Summarize Key Features    │
        │  - Security                │
        │  - Real-time updates       │
        │  - Role-based access       │
        │  - Business intelligence   │
        └────────────┬───────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │  Closing Statement         │
        │  Thank audience            │
        └────────────┬───────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │  Questions & Answers       │
        └────────────────────────────┘
```

---

## 🎨 Feature Coverage Map

```
┌─────────────────────────────────────────────────────────────┐
│                      SYSTEM FEATURES                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────┐     ┌─────────────────┐
│  AUTHENTICATION │────▶│   AUTHORIZATION  │
│  - JWT tokens   │     │   - Role-based   │
│  - bcrypt hash  │     │   - Permissions  │
└─────────────────┘     └─────────────────┘
         │                       │
         └───────────┬───────────┘
                     ▼
         ┌───────────────────────┐
         │   USER INTERFACE      │
         │   - React             │
         │   - Tailwind CSS      │
         │   - Responsive        │
         └───────────┬───────────┘
                     │
         ┌───────────┼───────────┐
         │           │           │
         ▼           ▼           ▼
┌────────────┐ ┌─────────┐ ┌──────────┐
│   CASHIER  │ │  SHARED │ │   ADMIN  │
└────────────┘ └─────────┘ └──────────┘
     │              │             │
     │              │             │
     ▼              ▼             ▼
┌─────────┐   ┌──────────┐  ┌────────────┐
│ Orders  │   │Dashboard │  │ Inventory  │
│ - Create│   │- Sales   │  │ - Stock    │
│ - Pay   │   │- Tables  │  │ - Logs     │
└─────────┘   └──────────┘  └────────────┘
     │              │             │
     ▼              ▼             ▼
┌─────────┐   ┌──────────┐  ┌────────────┐
│ Reports │   │ Profile  │  │   Menu     │
│ - Sales │   │- Settings│  │ - Products │
└─────────┘   └──────────┘  │ - Category │
                             └────────────┘
                                  │
                                  ▼
                             ┌────────────┐
                             │   Tables   │
                             │ - Status   │
                             │ - Auto     │
                             └────────────┘
                                  │
                                  ▼
                             ┌────────────┐
                             │   Users    │
                             │ - Staff    │
                             │ - Roles    │
                             └────────────┘
                                  │
                                  ▼
                             ┌────────────┐
                             │  Reports   │
                             │ - Advanced │
                             │ - Export   │
                             └────────────┘
```

---

## 📱 Screen Flow Navigation

```
LOGIN SCREEN
    │
    ├──▶ CASHIER LOGIN ──▶ CASHIER DASHBOARD
    │                           │
    │                           ├─▶ Create Order ──▶ Confirm ──▶ Back to Dashboard
    │                           │
    │                           ├─▶ Orders ──▶ Pending ──▶ Pay ──▶ Invoice
    │                           │
    │                           ├─▶ Reports ──▶ Sales Report
    │                           │
    │                           └─▶ Profile ──▶ Logout
    │
    └──▶ ADMIN LOGIN ──▶ ADMIN DASHBOARD
                            │
                            ├─▶ Inventory ──▶ Stock List ──▶ Add Stock
                            │
                            ├─▶ Menu ──▶ Product List ──▶ Add/Edit Product
                            │
                            ├─▶ Tables ──▶ Table List ──▶ Add/Edit Table
                            │
                            ├─▶ Users ──▶ User List ──▶ Add/Edit User
                            │
                            ├─▶ Reports ──▶ Multiple Report Types
                            │
                            ├─▶ Settings ──▶ System Configuration
                            │
                            └─▶ Profile ──▶ Logout
```

---

## ⏱️ Time Distribution

```
┌──────────────────────────────────────────────────────────────┐
│                     TIME BREAKDOWN                           │
└──────────────────────────────────────────────────────────────┘

Introduction        ████                           2 min (10%)
Cashier Demo        ████████████                   6 min (30%)
Admin Demo          ████████████████████          10 min (50%)
Q&A                 ████                           2 min (10%)
                    │
                    └─▶ Total: 20 minutes

Detail:
┌─────────────────────┬──────────┬──────────┐
│ Section             │ Time     │ % Total  │
├─────────────────────┼──────────┼──────────┤
│ Intro & Tech Stack  │ 2 min    │ 10%      │
│ Cashier Login       │ 0.5 min  │ 2.5%     │
│ Cashier Dashboard   │ 1 min    │ 5%       │
│ Create Order        │ 2 min    │ 10%      │
│ Process Payment     │ 1.5 min  │ 7.5%     │
│ Sales Report        │ 1 min    │ 5%       │
│ Admin Login         │ 0.5 min  │ 2.5%     │
│ Admin Dashboard     │ 1.5 min  │ 7.5%     │
│ Inventory Mgmt      │ 2 min    │ 10%      │
│ Menu Management     │ 2 min    │ 10%      │
│ Table Management    │ 1 min    │ 5%       │
│ User Management     │ 1.5 min  │ 7.5%     │
│ Advanced Reports    │ 2 min    │ 10%      │
│ Conclusion          │ 0.5 min  │ 2.5%     │
│ Q&A                 │ 2 min    │ 10%      │
├─────────────────────┼──────────┼──────────┤
│ TOTAL               │ 20 min   │ 100%     │
└─────────────────────┴──────────┴──────────┘
```

---

## 🔄 Data Flow During Demo

```
┌─────────────────────────────────────────────────────────────┐
│                  CREATE ORDER FLOW                          │
└─────────────────────────────────────────────────────────────┘

USER (Cashier)
    │
    │ 1. Select Table
    ▼
┌─────────────┐
│  FRONTEND   │ ──▶ Check table availability
│   (React)   │
└──────┬──────┘
       │ 2. Add Products
       │ 3. Calculate Total
       ▼
┌─────────────┐
│   API Call  │ ──▶ POST /api/orders
│             │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   BACKEND   │ ──▶ Validate stock (drinks only)
│  (Express)  │ ──▶ Create order record
│             │ ──▶ Create order items
│             │ ──▶ Update table status
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  DATABASE   │ ──▶ Insert into Orders table
│   (MySQL)   │ ──▶ Insert into OrderItems table
│             │ ──▶ Update Tables table
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  RESPONSE   │ ──▶ Order created successfully
│             │ ──▶ Order ID
└──────┬──────┘
       │
       ▼
USER (Sees confirmation)
```

```
┌─────────────────────────────────────────────────────────────┐
│                  PAYMENT FLOW                               │
└─────────────────────────────────────────────────────────────┘

USER (Cashier)
    │
    │ 1. Select Order
    ▼
┌─────────────┐
│  FRONTEND   │ ──▶ Display order details
│             │ ──▶ Calculate total
└──────┬──────┘
       │ 2. Choose payment method
       │ 3. Confirm payment
       ▼
┌─────────────┐
│   API Call  │ ──▶ POST /api/orders/:id/pay
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   BACKEND   │ ──▶ Update order status
│             │ ──▶ Deduct stock (drinks)
│             │ ──▶ Create stock logs
│             │ ──▶ Update table status
│             │ ──▶ Generate invoice
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  DATABASE   │ ──▶ Update Orders table
│             │ ──▶ Update Stock table
│             │ ──▶ Insert StockLogs
│             │ ──▶ Update Tables table
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  RESPONSE   │ ──▶ Payment successful
│             │ ──▶ Invoice data
└──────┬──────┘
       │
       ▼
USER (Sees invoice)
```

---

## 🎯 Key Demo Moments

```
┌──────────────────────────────────────────────┐
│         IMPRESSIVE FEATURES TO SHOW          │
└──────────────────────────────────────────────┘

1. REAL-TIME CALCULATION
   ───────────────────────────
   When adding items to order
   ├─▶ Total updates instantly
   ├─▶ Quantity changes reflect immediately
   └─▶ Tax calculated automatically

2. STOCK VALIDATION
   ───────────────────────────
   When creating order
   ├─▶ Out of stock? Alert shows
   ├─▶ Can't complete order
   └─▶ Prevents overselling

3. AUTO TABLE STATUS
   ───────────────────────────
   Watch table status change
   ├─▶ Order created → "Occupied"
   ├─▶ Payment done → "Available"
   └─▶ No manual updates needed

4. CURRENCY BREAKDOWN
   ───────────────────────────
   Cash payment calculator
   ├─▶ Enter amount received
   ├─▶ Shows change breakdown
   └─▶ By currency denomination

5. ROLE-BASED ACCESS
   ───────────────────────────
   Show different menus
   ├─▶ Cashier: Limited access
   ├─▶ Admin: Full access
   └─▶ Security enforcement

6. PROFIT CALCULATION
   ───────────────────────────
   In reports
   ├─▶ Revenue - Cost = Profit
   ├─▶ Profit margin %
   └─▶ Per product tracking
```

---

**Print this visual guide and keep it handy during your demo! 🚀**




