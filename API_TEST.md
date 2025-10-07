# 🔧 API Test Guide - Restaurant POS System

## 🎯 **Testing Dashboard Endpoints**

This guide helps you test the API endpoints used by the dashboard to ensure they're working correctly.

---

## 📋 **Required Endpoints**

The dashboard uses these API endpoints:

1. **`/api/reports/dashboard`** - Main dashboard metrics
2. **`/api/reports/sales`** - Sales data for charts
3. **`/api/reports/top-products`** - Top selling products
4. **`/api/reports/inventory/low-stock-alert`** - Low stock alerts
5. **`/api/reports/sales/peak-hours`** - Hourly sales data
6. **`/api/reports/sales/category-sales`** - Category performance

---

## 🔐 **Authentication Required**

All endpoints require authentication. You need to:

1. **Login first** to get a JWT token
2. **Include the token** in the Authorization header
3. **Use the token** for all API requests

---

## 🧪 **Testing Steps**

### **Step 1: Login to Get Token**

```bash
# Login as admin
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### **Step 2: Test Dashboard Endpoints**

Replace `YOUR_TOKEN_HERE` with the actual token from step 1.

```bash
# Test dashboard metrics
curl -X GET "http://localhost:5000/api/reports/dashboard?range=today" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Test top products
curl -X GET "http://localhost:5000/api/reports/top-products?limit=5" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Test low stock alerts
curl -X GET "http://localhost:5000/api/reports/inventory/low-stock-alert" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Test peak hours
curl -X GET "http://localhost:5000/api/reports/sales/peak-hours" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Test category sales
curl -X GET "http://localhost:5000/api/reports/sales/category-sales" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🚨 **Common Issues & Solutions**

### **Issue 1: "Access token required"**
- **Cause**: Missing or invalid Authorization header
- **Solution**: Ensure you're logged in and using the correct token

### **Issue 2: "500 Internal Server Error"**
- **Cause**: Server-side error in the endpoint
- **Solution**: Check server logs for specific error details

### **Issue 3: "Insufficient permissions"**
- **Cause**: User doesn't have required permissions
- **Solution**: Ensure user has 'reports.view' permission

### **Issue 4: "No data returned"**
- **Cause**: No data exists for the requested period
- **Solution**: Create some test data (orders, products, etc.)

---

## 📊 **Expected Data Format**

### **Dashboard Metrics Response:**
```json
{
  "success": true,
  "data": {
    "todaySales": {
      "total": 1250.50,
      "count": 15
    },
    "averageOrder": 83.37,
    "pendingOrders": 3,
    "availableTables": 8
  }
}
```

### **Top Products Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Burger",
      "category": "Main Course",
      "quantity": 25,
      "revenue": 375.00
    }
  ]
}
```

### **Low Stock Alerts Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "productName": "Coca Cola",
      "currentStock": 5,
      "minStock": 10
    }
  ]
}
```

---

## 🔧 **Troubleshooting**

### **Check Server Status:**
```bash
# Test if server is running
curl -X GET "http://localhost:5000/api/health"
```

### **Check Database Connection:**
```bash
# Test database connection (if you have access)
mysql -u root -p restaurant_pos -e "SELECT COUNT(*) FROM users;"
```

### **Check Server Logs:**
Look for error messages in the server console output.

---

## ✅ **Success Indicators**

- ✅ **All endpoints return 200 status**
- ✅ **JSON responses are properly formatted**
- ✅ **Data arrays are not empty (or show appropriate empty state)**
- ✅ **No authentication errors**
- ✅ **No permission errors**

---

## 🎯 **Next Steps**

Once all endpoints are working:

1. **Refresh the dashboard** in your browser
2. **Check browser console** for any remaining errors
3. **Verify data is displaying** correctly
4. **Test different time ranges** (today, week, month)

---

*This guide helps ensure your dashboard API endpoints are working correctly before using the application.*


































