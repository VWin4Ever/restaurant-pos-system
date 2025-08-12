# 🗄️ Railway Database Setup Guide

## 🚨 **Current Issue:**
Your Railway backend is returning a **500 Internal Server Error** when trying to log in, which suggests the database hasn't been properly initialized.

## ✅ **What We've Fixed:**
1. ✅ CORS issues resolved
2. ✅ Frontend authentication headers added
3. ✅ Settings fetch prevented before login

## 🔧 **Next Step: Initialize Database in Railway**

### **Option 1: Via Railway Dashboard (Recommended)**

1. **Go to Railway Dashboard**
   - Visit: https://railway.app/dashboard
   - Click on your project: `restaurant-pos-system`

2. **Check Database Service**
   - Look for a MySQL database service
   - If not present, you need to add one

3. **Add MySQL Database (if needed)**
   - Click "New Service" → "Database" → "MySQL"
   - This will create a new MySQL database service

4. **Set Environment Variables**
   - Go to your main service (not the database)
   - Click "Variables" tab
   - Add these variables:
     ```
     DATABASE_URL=mysql://root:password@host:port/database_name
     JWT_SECRET=your-secret-key-here
     JWT_EXPIRES_IN=24h
     NODE_ENV=production
     FRONTEND_URL=https://restaurantposmyv.netlify.app
     ```

5. **Initialize Database**
   - Go to your main service
   - Click "Deployments" tab
   - Find the latest deployment
   - Click the three dots → "View Logs"
   - Look for any database connection errors

### **Option 2: Via Railway CLI**

```bash
# Connect to Railway
railway login --browserless

# Link to your project
railway link

# Set environment variables
railway variables set JWT_SECRET=your-secret-key-here
railway variables set JWT_EXPIRES_IN=24h
railway variables set NODE_ENV=production
railway variables set FRONTEND_URL=https://restaurantposmyv.netlify.app

# Deploy
railway up
```

## 🔍 **Database Initialization**

### **Check if Database is Ready:**
1. **Go to Railway Dashboard**
2. **Click on your MySQL database service**
3. **Check if it shows "Online" status**
4. **Note the connection details**

### **Manual Database Setup (if needed):**
If the database isn't automatically initialized, you can run the setup manually:

```bash
# Connect to Railway
railway login --browserless
railway link

# Run database setup
railway run npm run setup-db
```

## 🚀 **Default Login Credentials**

Once the database is set up, you can log in with:

### **Admin User:**
- **Username:** `admin`
- **Password:** `admin123`

### **Cashier User:**
- **Username:** `cashier`
- **Password:** `cashier123`

## 🔍 **Verify the Fix:**

### **1. Check Railway Logs**
- Go to Railway dashboard
- Click on your main service
- Go to "Deployments" tab
- Check the latest deployment logs for errors

### **2. Test the Login**
- Go to: https://restaurantposmyv.netlify.app
- Try logging in with:
  - Username: `admin`
  - Password: `admin123`

### **3. Expected Result**
- ✅ No 500 errors
- ✅ Login successful
- ✅ Redirected to dashboard

## 🚨 **Common Issues:**

### **Issue 1: Database Connection Failed**
- Check if MySQL service is running
- Verify DATABASE_URL environment variable
- Ensure database service is online

### **Issue 2: JWT Secret Missing**
- Set JWT_SECRET environment variable
- Use a strong, random string

### **Issue 3: Database Not Initialized**
- Run the database setup script
- Check if tables exist in the database

## 📞 **Need Help?**
- Check Railway deployment logs
- Verify all environment variables are set
- Test database connection manually

---

**🎯 Goal:** Your Railway backend should connect to the database and allow login without 500 errors! 