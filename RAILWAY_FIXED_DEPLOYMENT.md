# 🚀 Railway Deployment Guide (Fixed)

This guide addresses the MySQL/Nixpacks issue and provides a working deployment solution.

## 🚨 Important: MySQL Issue Fixed

The error you encountered was due to MySQL package naming in Nixpacks. We've fixed this by:
- Removing MySQL from the build environment (Railway provides it as a service)
- Simplifying the Nixpacks configuration
- Adding proper ignore files

## 🚀 Step-by-Step Deployment

### 1. Connect Your GitHub Repository

1. **Login to Railway**
   - Go to [railway.app](https://railway.app)
   - Sign in with your GitHub account

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your `restaurant-pos-system` repository
   - Select the `main` branch

### 2. Add MySQL Database Service (Important!)

1. **Add MySQL Database FIRST**
   - In your Railway project, click "New Service"
   - Select "Database" → "MySQL"
   - Railway will create a MySQL database for you
   - **Wait for it to be fully provisioned**

2. **Get Database URL**
   - Click on your MySQL service
   - Go to "Connect" tab
   - Copy the "MySQL Connection URL"
   - It should look like: `mysql://root:password@containers-us-west-XX.railway.app:XXXX/railway`

### 3. Configure Environment Variables

1. **Go to Variables Tab** in your main service
2. **Add these environment variables**:

```env
# Database Configuration (use the URL from Railway MySQL service)
DATABASE_URL="mysql://root:password@containers-us-west-XX.railway.app:XXXX/railway"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="24h"

# Server Configuration
PORT=5000
NODE_ENV=production

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Frontend URL (update this after deploying frontend)
FRONTEND_URL="https://your-frontend-domain.com"

# File Upload Configuration
MAX_FILE_SIZE=10485760
```

### 4. Deploy the Backend

1. **Railway will automatically deploy** when you push to GitHub
2. **Monitor the deployment** in the Railway dashboard
3. **Check logs** - the build should now succeed without MySQL errors

### 5. Initialize Database

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login and link project**
   ```bash
   railway login
   railway link
   ```

3. **Setup database**
   ```bash
   railway run npm run setup-db
   ```

### 6. Deploy Frontend to Netlify

1. **Go to Netlify**
   - Visit [netlify.com](https://netlify.com)
   - Sign in with GitHub

2. **Deploy from GitHub**
   - Click "New site from Git"
   - Choose your repository
   - Set build settings:
     - **Build command**: `cd client && npm run build`
     - **Publish directory**: `client/build`

3. **Configure Environment Variables**
   - Go to Site settings → Environment variables
   - Add: `REACT_APP_API_URL=https://your-railway-backend-url.railway.app`

### 7. Update CORS Settings

1. **Get your Netlify frontend URL**
2. **Update the FRONTEND_URL** in Railway environment variables
3. **Redeploy the backend** if needed

## 🔧 Fixed Configuration Files

### nixpacks.toml (Fixed)
```toml
[phases.setup]
nixPkgs = ["nodejs", "npm"]

[phases.install]
cmds = ["npm install"]

[phases.build]
cmds = ["npm run build"]

[start]
cmd = "npm start"
```

### .railwayignore (New)
```
# Excludes unnecessary files from deployment
node_modules/
.env
client/build/
*.md
quick-start.*
update-project.*
```

## 🚨 Troubleshooting

### If you still get MySQL errors:
1. **Make sure MySQL service is added FIRST**
2. **Wait for MySQL to be fully provisioned**
3. **Check that DATABASE_URL is correct**
4. **Redeploy after fixing environment variables**

### If build fails:
1. **Check Railway logs** for specific errors
2. **Verify all environment variables** are set
3. **Make sure MySQL service is running**

### If database connection fails:
1. **Verify DATABASE_URL format**
2. **Check MySQL service status**
3. **Run database setup command**

## ✅ Success Indicators

- ✅ Build completes without MySQL errors
- ✅ Database connects successfully
- ✅ Health check endpoint responds: `https://your-app.railway.app/api/health`
- ✅ Frontend can connect to backend

## 🔗 Your URLs
- **Backend API**: `https://your-app.railway.app`
- **Frontend**: `https://your-app.netlify.app`
- **Health Check**: `https://your-app.railway.app/api/health`

## 🔑 Login Credentials
- **Admin**: `admin` / `admin123`
- **Cashier**: `cashier` / `cashier123`

---

**The MySQL issue has been resolved! Your deployment should now work smoothly.** 🚀 