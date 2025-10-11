# 📋 Quick Demo Checklist

## 🔴 CRITICAL - Do This First!

### 1. Start MySQL (XAMPP)
- [ ] Open XAMPP Control Panel
- [ ] Click "Start" next to MySQL
- [ ] Wait for green "Running" status

### 2. Verify Database
- [ ] Open phpMyAdmin (http://localhost/phpmyadmin)
- [ ] Check `restaurant_pos` database exists
- [ ] If NOT exists, run: `npm run setup-db`

### 3. Install Dependencies (First Time Only)
```bash
npm run install-all
```

### 4. Start the Application
```bash
npm run dev
```
**Wait until you see:**
- ✅ "Server running on port 5000"
- ✅ "Compiled successfully!"

### 5. Test Both URLs
- [ ] Frontend works: http://localhost:3000
- [ ] Backend works: http://localhost:5000 (should show "Cannot GET /")

---

## 🟡 IMPORTANT - Test Before Demo

### Test Admin Login
- [ ] Go to http://localhost:3000
- [ ] Username: `admin`
- [ ] Password: `admin123`
- [ ] Successfully logged in
- [ ] Can see dashboard
- [ ] **LOGOUT**

### Test Cashier Login
- [ ] Username: `cashier`
- [ ] Password: `cashier123`
- [ ] Successfully logged in
- [ ] Can see dashboard
- [ ] **LOGOUT**

### Verify Data Exists
- [ ] Products/Menu has items
- [ ] Tables exist
- [ ] At least one sample order (create if needed)

---

## 🟢 NICE TO HAVE - Setup Your Demo Environment

### Browser Setup
- [ ] Use Chrome or Edge (best compatibility)
- [ ] Clear browser cache (Ctrl+Shift+Delete)
- [ ] Close all unnecessary tabs
- [ ] Full screen mode (F11)
- [ ] Close developer console (F12 if open)
- [ ] Zoom at 100% (Ctrl+0)

### Demo Preparation
- [ ] Have DEMO_GUIDE.md open on another screen/phone
- [ ] Know your demo flow (practice once)
- [ ] Prepare opening statement
- [ ] Have backup screenshots (in case of issues)
- [ ] Close all distracting apps (chat, email, etc.)

---

## 🎬 During Demo - Quick Reference

### Login Credentials
```
ADMIN:
Username: admin
Password: admin123

CASHIER:
Username: cashier
Password: cashier123
```

### Demo Flow (15-20 min)
1. **Intro** (2 min) - Explain project & tech stack
2. **Cashier** (5 min) - Login → Create Order → Pay → Reports → Logout
3. **Admin** (10 min) - Login → Dashboard → Inventory → Menu → Tables → Users → Reports
4. **Q&A** (3 min) - Answer questions confidently

### Quick Navigation
**Cashier can access:**
- Dashboard
- Create Order
- Orders (View/Pay)
- Sales Reports
- Profile

**Admin can access:**
- Everything Cashier has, PLUS:
- Inventory Management
- Menu/Product Management
- Table Management
- User Management
- Advanced Reports
- System Settings

---

## 🚨 Emergency Troubleshooting

### App Won't Start
1. Check if MySQL is running (XAMPP green light)
2. Run: `npm run setup-db`
3. Try: `npm run dev` again

### Can't Login
1. Check console for errors (F12)
2. Verify backend is running (check terminal)
3. Try clearing browser cache
4. Verify credentials are correct

### Page Crashes or Errors
1. Refresh the page (F5)
2. Clear cache and refresh (Ctrl+Shift+R)
3. Restart the app (Ctrl+C, then `npm run dev`)

### Stock Not Working
1. Make sure product is marked as "stock tracked"
2. Stock deducts on PAYMENT, not order creation
3. Check inventory page for current levels

---

## ⏰ 5 Minutes Before Demo

- [ ] App is running (both frontend & backend)
- [ ] Logged out (start fresh for demo)
- [ ] Browser at http://localhost:3000
- [ ] Full screen, clean screen
- [ ] DEMO_GUIDE.md nearby for reference
- [ ] Deep breath - you got this! 💪

---

## ✨ Pro Tips

1. **Speak clearly and confidently** - You built this!
2. **If something breaks** - Stay calm, refresh, or explain what should happen
3. **Emphasize the features** - Real-time updates, security, user experience
4. **Use business terms** - "profit margin", "inventory optimization", "role-based access"
5. **Show the value** - "This helps restaurants increase efficiency and reduce errors"
6. **Be ready for questions** - Technical and business-related
7. **Practice once** - Run through the demo flow before presenting
8. **Have fun!** - Be proud of what you built

---

**REMEMBER:** Even if something goes wrong, explain what you built and the concepts behind it. The theory is more important than perfect execution!

**You've got this! 🚀🎉**




