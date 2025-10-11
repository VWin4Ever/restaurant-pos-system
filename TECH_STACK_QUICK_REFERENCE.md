# ⚡ TECH STACK - Quick Reference Card

## 🎯 Print This! Keep It During Demo!

---

## 💻 TECHNOLOGY STACK (Memorize This!)

### **Frontend:**
```
React.js (v18)
├─ Why? Component-based, efficient, large ecosystem
├─ Tailwind CSS → Rapid styling, responsive design
├─ React Router → Client-side navigation
└─ Axios → HTTP requests to backend
```

### **Backend:**
```
Node.js + Express.js
├─ Why? JavaScript full-stack, non-blocking I/O
├─ Prisma ORM → Type-safe queries, prevents SQL injection
└─ JWT + bcrypt → Authentication + password security
```

### **Database:**
```
MySQL (v8.0+)
└─ Why? ACID compliance, reliable, industry standard
```

---

## 🏗️ ARCHITECTURE

```
CLIENT (React)          SERVER (Express)         DATABASE (MySQL)
Port 3000      ◄──────►  Port 5000       ◄──────►  Port 3306
   │                         │                         │
   ├─ Components            ├─ Routes                 ├─ Tables:
   ├─ State (Context)       ├─ Middleware             │  • Users
   ├─ Routing               ├─ Controllers            │  • Products
   └─ API calls (Axios)     └─ Prisma (ORM)           │  • Orders
                                                       │  • OrderItems
                                                       │  • Tables
                                                       │  • Stock
                                                       └─ • StockLogs
```

**Pattern:** MVC (Model-View-Controller)
**API Style:** RESTful
**Communication:** HTTP/JSON

---

## 🔐 SECURITY

### **Authentication (Who are you?):**
```
1. User login → username + password
2. Server validates with bcrypt
3. Server creates JWT token
4. Client stores token
5. Client sends token in all requests
6. Server validates token before processing
```

**JWT = JSON Web Token (Stateless, scalable)**

### **Authorization (What can you do?):**
```
RBAC = Role-Based Access Control

USER
 ├─ CASHIER
 │   ├─ Dashboard
 │   ├─ Orders
 │   └─ Reports (limited)
 │
 └─ ADMIN
     ├─ Everything Cashier has
     ├─ Inventory
     ├─ Menu
     ├─ Tables
     ├─ Users
     └─ Advanced Reports
```

### **Password Security:**
```
bcrypt hashing:
Password → Add Salt → Hash → Store hash
```
**Never store plain passwords!**

---

## 🗄️ DATABASE DESIGN

### **Main Tables:**

**Users** (Staff accounts)
- id, username, password (hashed), name, role

**Products** (Menu items)
- id, name, category (FOOD/DRINK), price, cost, stockTracked

**Orders** (Customer orders)
- id, userId, tableId, status, total, paymentMethod

**OrderItems** (What's in each order)
- id, orderId, productId, quantity, price

**Tables** (Restaurant tables)
- id, number, status (AVAILABLE/OCCUPIED/RESERVED)

**Stock** (Current inventory)
- id, productId, quantity

**StockLogs** (Audit trail)
- id, stockId, userId, type (ADD/DEDUCT), quantity, timestamp

### **Relationships:**
- Orders → Has many → OrderItems
- Orders → Belongs to → User, Table
- OrderItems → Belongs to → Product
- Stock → Belongs to → Product
- StockLogs → Belongs to → Stock, User

### **Normalization:** 3NF (Third Normal Form)
- No redundancy
- Data integrity
- Efficient updates

---

## 🔄 KEY BUSINESS FLOWS

### **Create Order:**
```
1. Select table
2. Add products
3. Validate stock (drinks only)
4. Calculate total
5. Create order + items
6. Table → OCCUPIED
```
**Note:** Stock NOT deducted yet!

### **Process Payment:**
```
1. Select pending order
2. Choose payment method
3. Update order → COMPLETED
4. Deduct stock (drinks only)
5. Log stock changes
6. Table → AVAILABLE
7. Generate invoice
```
**Note:** Stock deducted ONLY on payment!

### **Profit Calculation:**
```
Profit = Revenue - Cost
Revenue = Σ(Price × Quantity)
Cost = Σ(Cost × Quantity)
Margin% = (Profit / Revenue) × 100
```

---

## 📡 API ENDPOINTS (RESTful)

```
POST   /api/auth/login          → Login
GET    /api/auth/me             → Get current user

GET    /api/products            → List products
POST   /api/products            → Create (admin)
PUT    /api/products/:id        → Update (admin)

GET    /api/orders              → List orders
POST   /api/orders              → Create order
POST   /api/orders/:id/pay      → Process payment

GET    /api/stock               → Stock levels (admin)
POST   /api/stock/add           → Add stock (admin)

GET    /api/users               → List users (admin)
POST   /api/users               → Create user (admin)

GET    /api/reports/sales       → Sales report
```

**HTTP Methods:**
- GET = Retrieve
- POST = Create
- PUT = Update
- DELETE = Delete

---

## 🎓 ACADEMIC CONCEPTS

### **Software Engineering:**
- Client-Server Architecture
- MVC Pattern
- RESTful API Design
- Separation of Concerns
- Modular Design

### **Database:**
- Entity-Relationship Model
- Relational Database
- Normalization (3NF)
- ACID Properties
- Foreign Keys
- Transactions

### **Security:**
- Authentication vs Authorization
- JWT (Stateless tokens)
- Password Hashing (bcrypt)
- RBAC (Role-Based Access Control)
- SQL Injection Prevention (ORM)

### **Web Development:**
- HTTP Protocol
- Request-Response Model
- JSON Data Format
- Status Codes (200, 401, 404, 500)
- CORS (Cross-Origin Resource Sharing)

---

## 🎤 QUICK EXPLANATIONS

### **"Why React?"**
"Component-based architecture makes UI development faster and maintainable. Virtual DOM provides efficient updates. Large ecosystem with extensive libraries."

### **"Why Node.js?"**
"Allows JavaScript on both frontend and backend, reducing context switching. Non-blocking I/O handles multiple requests efficiently. Large npm ecosystem."

### **"Why MySQL?"**
"ACID-compliant for data integrity crucial in financial transactions. Mature and reliable. Supports complex relationships between data."

### **"Why Prisma?"**
"Type-safe database queries prevent errors. Automatic migrations simplify database changes. Prevents SQL injection attacks. Developer-friendly syntax."

### **"Why JWT?"**
"Stateless authentication scales better than sessions. Works well with REST APIs. Can be validated without database lookup. Secure and industry-standard."

### **"Why separate frontend and backend?"**
"Separation of concerns improves maintainability. Can scale independently. Frontend team and backend team can work separately. Can support multiple clients (web, mobile)."

### **"How do you prevent SQL injection?"**
"Using Prisma ORM which uses parameterized queries. Never concatenating user input into SQL strings. Server-side validation of all inputs."

### **"How is data integrity maintained?"**
"MySQL ACID properties ensure transaction consistency. Foreign key constraints prevent orphaned records. Server-side validation prevents invalid data. Transactions ensure all-or-nothing operations."

### **"How would you scale this?"**
"Horizontal scaling with load balancer. Database indexing for performance. Caching with Redis. Database replication for reads. CDN for static assets. Already stateless with JWT."

---

## 💡 IMPRESSIVE TERMS TO USE

**Architecture:**
- "Full-stack architecture"
- "Client-server model"
- "RESTful API design"
- "MVC pattern"
- "Microservices-ready"

**Database:**
- "ACID properties"
- "Third Normal Form"
- "Foreign key constraints"
- "Transaction management"
- "Entity-relationship model"

**Security:**
- "JWT authentication"
- "bcrypt password hashing"
- "Role-based access control"
- "SQL injection prevention"
- "Stateless authentication"

**Development:**
- "Component-based architecture"
- "State management"
- "ORM (Object-Relational Mapping)"
- "Middleware pattern"
- "API interceptors"

---

## ✅ MUST KNOW CHECKLIST

**Before demo, ensure you can answer:**

- [ ] What is React and why did you use it?
- [ ] What is Node.js and its benefits?
- [ ] Why MySQL over other databases?
- [ ] How does JWT authentication work?
- [ ] What is bcrypt and why use it?
- [ ] What is Prisma ORM?
- [ ] Explain MVC pattern
- [ ] What is REST API?
- [ ] How is profit calculated?
- [ ] When is stock deducted?
- [ ] What are ACID properties?
- [ ] What is RBAC?
- [ ] How do you prevent SQL injection?
- [ ] What is database normalization?
- [ ] How does payment processing work?

---

## 🚀 ELEVATOR PITCH (30 seconds)

**Memorize this:**

"I built a full-stack Restaurant POS System using React for the frontend, Node.js with Express for the backend, and MySQL for the database. The system implements JWT-based authentication with bcrypt password hashing, role-based access control for Admin and Cashier roles, and uses Prisma ORM for type-safe database operations that prevent SQL injection. It features real-time order management, automated inventory tracking for beverages, comprehensive profit margin analysis, and business intelligence reporting. The architecture follows MVC pattern with RESTful API design, ensuring scalability, security, and maintainability."

---

## 📊 SYSTEM CAPABILITIES (Quick Facts)

- **Users:** 2 roles (Admin, Cashier) with RBAC
- **Security:** JWT + bcrypt + Prisma
- **Database:** 7 tables, 3NF normalized
- **API:** RESTful with 20+ endpoints
- **Features:** Orders, Payments, Inventory, Reports
- **Stock:** Auto-deduction, validation, audit logs
- **Reports:** Sales, profit, staff, inventory
- **Payments:** Cash, Card, QR
- **Real-time:** Table status, calculations, validation

---

## 🎯 IF ASKED "WHAT MAKES YOUR SYSTEM GOOD?"

**Say this:**

"Three key strengths:

1. **Security:** JWT authentication, bcrypt hashing, role-based permissions, and Prisma ORM preventing SQL injection.

2. **Business Value:** Real-time profit tracking, automated inventory management, prevents overselling, comprehensive audit trail.

3. **Architecture:** Separated concerns with MVC pattern, RESTful API design, normalized database, and scalable client-server architecture."

---

**MEMORIZE THE TOP SECTION AND YOU'RE READY! 💪🚀**



