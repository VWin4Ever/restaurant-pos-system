# 🔧 Railway CORS Fix Guide

## 🚨 **Current Issue:**
Your frontend (`https://restaurantposmyv.netlify.app`) can't communicate with your Railway backend due to CORS policy.

## ✅ **What We've Done:**
1. ✅ Updated CORS configuration in `server/index.js`
2. ✅ Added your specific Netlify domain to allowed origins
3. ✅ Pushed changes to GitHub (Railway will auto-deploy)

## 🔧 **Next Step: Set Environment Variable in Railway**

### **Option 1: Via Railway Dashboard (Recommended)**

1. **Go to Railway Dashboard**
   - Visit: https://railway.app/dashboard
   - Click on your project: `restaurant-pos-system`

2. **Navigate to Variables Tab**
   - Click on the "Variables" tab in your project
   - Look for existing environment variables

3. **Add/Update Environment Variable**
   - **Variable Name:** `FRONTEND_URL`
   - **Value:** `https://restaurantposmyv.netlify.app`
   - Click "Add" or "Update"

4. **Save Changes**
   - Railway will automatically redeploy with the new variable

### **Option 2: Via Railway CLI**

```bash
# Set the environment variable
railway variables set FRONTEND_URL=https://restaurantposmyv.netlify.app

# Deploy the changes
railway up
```

## 🔍 **Verify the Fix:**

### **1. Check Railway Deployment**
- Go to Railway dashboard
- Check if deployment completed successfully
- Look for any error messages

### **2. Test the Connection**
- Go to: https://restaurantposmyv.netlify.app
- Try to log in
- Check browser console for CORS errors

### **3. Expected Result**
- ✅ No CORS errors in browser console
- ✅ Login should work
- ✅ All API calls should succeed

## 🚀 **If Still Having Issues:**

### **Check Railway Logs:**
1. Go to Railway dashboard
2. Click on your service
3. Go to "Deployments" tab
4. Check the latest deployment logs

### **Alternative CORS Configuration:**
If the issue persists, we can update the CORS config to be more permissive:

```javascript
// More permissive CORS (for testing only)
app.use(cors({
  origin: true, // Allow all origins
  credentials: true
}));
```

## 📞 **Need Help?**
- Check Railway deployment logs
- Verify environment variables are set correctly
- Test with browser developer tools (F12 → Console)

---

**🎯 Goal:** Your frontend should be able to communicate with your Railway backend without CORS errors! 