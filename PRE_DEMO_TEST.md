# 🧪 Pre-Demo Testing Script

## ✅ Complete System Test (5-10 minutes before demo)

### 1. Start Your System

#### Step 1: Start MySQL
```
Open XAMPP → Click "Start" on MySQL → Wait for green light
```

#### Step 2: Start the App
```powershell
cd C:\xampp\htdocs\Theory\PosRes1
npm run dev
```

**Wait for these messages:**
- ✅ "Server running on port 5000"
- ✅ "webpack compiled successfully"

---

### 2. Test Backend (30 seconds)

Open browser and check:
- http://localhost:5000

**Expected:** Should show "Cannot GET /" (this is correct!)
- ✅ **If you see this** → Backend is running ✓
- ❌ **If page doesn't load** → Backend is down ✗

---

### 3. Test Frontend (30 seconds)

Open browser and check:
- http://localhost:3000

**Expected:** Should show login page
- ✅ **If you see login form** → Frontend is running ✓
- ❌ **If page doesn't load** → Frontend is down ✗

---

### 4. Test Cashier Login (1 minute)

```
1. Go to: http://localhost:3000
2. Enter username: cashier
3. Enter password: cashier123
4. Click "Login"
```

**Expected Results:**
- ✅ Successfully logs in
- ✅ See cashier dashboard
- ✅ Menu shows: Dashboard, Create Order, Orders, Reports, Profile

**Test Actions:**
- Click on "Dashboard" → Should load
- Click on "Create Order" → Should load
- Click on "Orders" → Should load
- Click on "Reports" → Should load

**After Testing:**
- Click Profile → Logout

---

### 5. Test Admin Login (1 minute)

```
1. Go to: http://localhost:3000
2. Enter username: admin
3. Enter password: admin123
4. Click "Login"
```

**Expected Results:**
- ✅ Successfully logs in
- ✅ See admin dashboard
- ✅ Menu shows: Dashboard, Inventory, Menu, Tables, Users, Reports, Settings, Profile

**Test Actions:**
- Click on "Dashboard" → Should load
- Click on "Inventory" → Should load
- Click on "Menu" → Should load
- Click on "Tables" → Should load
- Click on "Users" → Should load
- Click on "Reports" → Should load

**After Testing:**
- Click Profile → Logout

---

### 6. Test Order Creation (2 minutes)

```
1. Login as cashier (cashier / cashier123)
2. Go to "Create Order"
3. Select any table
4. Add at least 2-3 products (food and drinks)
5. Check if total calculates correctly
6. Click "Confirm Order"
```

**Expected Results:**
- ✅ Table selection works
- ✅ Can add products
- ✅ Quantity buttons (+ and -) work
- ✅ Total updates in real-time
- ✅ Order confirms successfully
- ✅ Success message appears

---

### 7. Test Payment (2 minutes)

```
1. Still logged in as cashier
2. Go to "Orders" → "Pending Orders"
3. Find the order you just created
4. Click "Pay" button
5. Select payment method (Cash)
6. Click "Process Payment"
```

**Expected Results:**
- ✅ Order appears in pending list
- ✅ Pay button works
- ✅ Payment form opens
- ✅ Can select payment method
- ✅ Payment processes successfully
- ✅ Invoice appears

---

### 8. Test Reports (1 minute)

```
1. Still logged in as cashier
2. Go to "Reports" → "Sales Report"
3. Select "Today"
4. Check if data shows
```

**Expected Results:**
- ✅ Report loads
- ✅ Shows sales data
- ✅ Shows revenue, cost, profit
- ✅ Shows payment breakdown

---

### 9. Test Inventory (Admin) (1 minute)

```
1. Logout from cashier
2. Login as admin (admin / admin123)
3. Go to "Inventory"
4. Find a drink product
5. Try to add stock (don't need to save)
```

**Expected Results:**
- ✅ Inventory page loads
- ✅ Shows stock levels
- ✅ Add stock form works

---

### 10. Test Menu Management (Admin) (1 minute)

```
1. Still logged in as admin
2. Go to "Menu" or "Products"
3. View product list
4. Click "Add Product" (open form, don't need to save)
```

**Expected Results:**
- ✅ Product list loads
- ✅ Shows all products
- ✅ Add product form opens
- ✅ Edit buttons work

---

### 11. Test Table Management (Admin) (30 seconds)

```
1. Still logged in as admin
2. Go to "Tables"
3. View table list
4. Check table statuses
```

**Expected Results:**
- ✅ Tables list loads
- ✅ Shows table statuses (Available/Occupied)
- ✅ The table you used for order shows "Occupied" (if not paid)
  or "Available" (if you completed payment)

---

### 12. Test User Management (Admin) (30 seconds)

```
1. Still logged in as admin
2. Go to "Users" or "Staff"
3. View user list
4. Click "Add User" (open form, don't need to save)
```

**Expected Results:**
- ✅ User list loads
- ✅ Shows existing users (admin, cashier)
- ✅ Add user form opens

---

## 📋 Quick Checklist Summary

Copy this checklist and check each item:

```
[ ] MySQL running (XAMPP green)
[ ] Backend running (port 5000)
[ ] Frontend running (port 3000)
[ ] Cashier login works
[ ] Admin login works
[ ] Can create order
[ ] Can process payment
[ ] Reports show data
[ ] Inventory page loads
[ ] Menu page loads
[ ] Tables page loads
[ ] Users page loads
[ ] No error messages in browser console
[ ] All pages load quickly
[ ] Navigation works smoothly
```

---

## 🚨 What If Something Fails?

### If Backend Won't Start
```powershell
# Stop the app (Ctrl+C)
# Check if port 5000 is busy:
netstat -ano | findstr :5000

# If busy, kill the process or restart computer
# Then try again:
npm run dev
```

### If Frontend Won't Start
```powershell
# Stop the app (Ctrl+C)
# Clear cache:
cd client
npm start
```

### If Login Doesn't Work
```powershell
# Reset the database:
npm run setup-db

# Default credentials:
# Admin: admin / admin123
# Cashier: cashier / cashier123
```

### If Database Error
```
1. Open XAMPP
2. Stop MySQL
3. Start MySQL again
4. Restart your app (npm run dev)
```

### If Port Already in Use
```powershell
# Find and kill the process:
netstat -ano | findstr :5000
taskkill /PID [process_id] /F

# Or just restart your computer
```

---

## 🎯 Expected Test Results

If all tests pass, you should have:
- ✅ **1 completed order** (from your test)
- ✅ **1 invoice generated**
- ✅ **Sales data in reports**
- ✅ **Stock deducted for drinks** (if order had drinks)
- ✅ **Table status changed**

---

## ✨ Final Pre-Demo Steps

Before your actual demo:

1. **Clear Test Data (Optional)**
   - You can keep the test order to show existing data
   - Or create new orders during live demo

2. **Reset Browser**
   ```
   - Clear cache (Ctrl+Shift+Delete)
   - Close all tabs
   - Open only: http://localhost:3000
   - Make sure you're logged out
   ```

3. **Check Screen**
   ```
   - Full screen (F11)
   - Console closed (F12 if open)
   - Zoom at 100% (Ctrl+0)
   ```

4. **Practice Once**
   ```
   - Run through demo flow
   - Time yourself (should be 15-20 min)
   - Make sure you know the navigation
   ```

---

## 📱 Emergency Contacts (For Demo Day)

Keep these ready:

**Default Credentials:**
```
Admin:
  Username: admin
  Password: admin123

Cashier:
  Username: cashier
  Password: cashier123
```

**URLs:**
```
Frontend: http://localhost:3000
Backend: http://localhost:5000
phpMyAdmin: http://localhost/phpmyadmin
```

**Quick Commands:**
```
Start App: npm run dev
Stop App: Ctrl+C
Reset DB: npm run setup-db
```

---

## ✅ All Tests Passed?

If everything above works:
- 🎉 **Your system is demo-ready!**
- 💪 **You're prepared!**
- 🚀 **Go confidently into your demo!**

If something doesn't work:
- 📝 Document the issue
- 🔧 Try troubleshooting steps
- 🆘 Ask for help if needed
- 🎥 Prepare screenshots as backup

---

**Remember: Even if something goes wrong during the demo, explain what SHOULD happen and discuss the concepts. Theory is more important than perfect execution!**

**Good luck! You've got this! 🌟**




