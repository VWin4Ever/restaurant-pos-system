# Restaurant POS Database Tables

**Database:** restaurant_pos  
**Generated:** August 17, 2025

---

## 📋 USERS TABLE

Field Name    Data Type    Size    Key
id            int          11      PK
username      varchar      191     -
password      varchar      191     -
role          enum         -       -
name          varchar      191     -
email         varchar      191     -
isActive      boolean      -       -
createdAt     datetime     -       -
updatedAt     datetime     -       -

---

## 📋 USER_PERMISSIONS TABLE

Field Name    Data Type    Size    Key
id            int          11      PK
userId        int          11      FK
permission    varchar      191     -
createdAt     datetime     -       -

---

## 📋 TABLES TABLE

Field Name    Data Type    Size    Key
id            int          11      PK
number        int          11      -
status        enum         -       -
capacity      int          11      -
group         varchar      191     -
notes         varchar      191     -
maintenance   boolean      -       -
isActive      boolean      -       -
createdAt     datetime     -       -
updatedAt     datetime     -       -

---

## 📋 CATEGORIES TABLE

Field Name    Data Type    Size    Key
id            int          11      PK
name          varchar      191     -
description   varchar      191     -
isActive      boolean      -       -
createdAt     datetime     -       -
updatedAt     datetime     -       -

---

## 📋 PRODUCTS TABLE

Field Name    Data Type    Size    Key
id            int          11      PK
name          varchar      191     -
description   varchar      191     -
price         decimal      10,2    -
categoryId    int          11      FK
isDrink       boolean      -       -
isActive      boolean      -       -
imageUrl      varchar      191     -
createdAt     datetime     -       -
updatedAt     datetime     -       -

---

## 📋 STOCK TABLE

Field Name    Data Type    Size    Key
id            int          11      PK
productId     int          11      FK
quantity      int          11      -
minStock      int          11      -
createdAt     datetime     -       -
updatedAt     datetime     -       -

---

## 📋 ORDERS TABLE

Field Name        Data Type    Size    Key
id                int          11      PK
orderNumber       varchar      191     -
tableId           int          11      FK
userId            int          11      FK
status            enum         -       -
subtotal          decimal      10,2    -
tax               decimal      10,2    -
discount          decimal      10,2    -
total             decimal      10,2    -
paymentMethod     enum         -       -
customerNote      varchar      191     -
businessSnapshot  longtext     -       -
createdAt         datetime     -       -
updatedAt         datetime     -       -

---

## 📋 ORDER_ITEMS TABLE

Field Name    Data Type    Size    Key
id            int          11      PK
orderId       int          11      FK
productId     int          11      FK
quantity      int          11      -
price         decimal      10,2    -
subtotal      decimal      10,2    -
createdAt     datetime     -       -

---

## 📋 STOCK_LOGS TABLE

Field Name    Data Type    Size    Key
id            int          11      PK
stockId       int          11      FK
userId        int          11      FK
type          enum         -       -
quantity      int          11      -
note          varchar      191     -
createdAt     datetime     -       -

---

## 📋 SETTINGS TABLE

Field Name    Data Type    Size    Key
id            int          11      PK
category      varchar      191     -
data          longtext     -       -
createdAt     datetime     -       -
updatedAt     datetime     -       -

---

## 🔑 Key Legend

- **PK**: Primary Key
- **FK**: Foreign Key
- **Size**: Field size/length
- **Data Type**: MySQL data type
- **enum**: Enumeration (predefined values)
- **decimal**: Decimal number with precision
- **longtext**: Large text field
- **boolean**: True/False value
- **datetime**: Date and time value

