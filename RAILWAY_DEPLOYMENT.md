# 🚀 Railway Deployment Guide

This guide will help you deploy your Restaurant POS System to Railway so your friends can access it online.

## 📋 Prerequisites

1. **Railway Account** - Sign up at [railway.app](https://railway.app)
2. **GitHub Repository** - Your project should be on GitHub
3. **Database** - Railway provides MySQL databases

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

### 2. Add Database Service

1. **Add MySQL Database**
   - In your Railway project, click "New Service"
   - Select "Database" → "MySQL"
   - Railway will create a MySQL database for you

2. **Get Database URL**
   - Click on your MySQL service
   - Go to "Connect" tab
   - Copy the "MySQL Connection URL"

### 3. Configure Environment Variables

1. **Go to Variables Tab**
   - In your main service, click "Variables" tab
   - Add the following environment variables:

```env
# Database Configuration (use the URL from Railway MySQL service)
DATABASE_URL="mysql://your-railway-mysql-url"

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
3. **Check logs** if there are any issues

### 5. Deploy the Frontend

#### Option A: Deploy to Netlify (Recommended)

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

#### Option B: Deploy to Railway (Alternative)

1. **Create Frontend Service**
   - In Railway, add another service
   - Choose "Deploy from GitHub repo"
   - Set the root directory to `client`

2. **Configure Build Settings**
   - Set build command: `npm run build`
   - Set start command: `npx serve -s build -l 3000`

### 6. Update CORS Settings

1. **Get your frontend URL**
2. **Update the FRONTEND_URL** in Railway environment variables
3. **Redeploy the backend** if needed

### 7. Initialize Database

1. **Access Railway CLI** (optional)
   ```bash
   npm install -g @railway/cli
   railway login
   railway link
   ```

2. **Run database setup**
   ```bash
   railway run npm run setup-db
   ```

## 🔧 Configuration Files

### railway.json
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "numReplicas": 1,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### nixpacks.toml
```toml
[phases.setup]
nixPkgs = ["nodejs", "npm", "mysql"]

[phases.install]
cmds = ["npm run install-all"]

[phases.build]
cmds = ["npm run build"]

[start]
cmd = "npm start"
```

## 🌐 Domain Configuration

### Custom Domain (Optional)
1. **In Railway dashboard**
   - Go to your service
   - Click "Settings" → "Domains"
   - Add your custom domain

2. **Update DNS**
   - Point your domain to Railway's servers
   - Follow Railway's DNS instructions

## 🔑 Default Login Credentials

After deployment, use these credentials:
- **Admin**: `admin` / `admin123`
- **Cashier**: `cashier` / `cashier123`

## 📊 Monitoring

### Railway Dashboard
- **Logs**: View real-time application logs
- **Metrics**: Monitor CPU, memory usage
- **Deployments**: Track deployment history

### Health Check
- Your API will be available at: `https://your-app.railway.app/api/health`

## 🚨 Troubleshooting

### Common Issues

#### 1. Database Connection Issues
- Check DATABASE_URL format
- Ensure MySQL service is running
- Verify database credentials

#### 2. Build Failures
- Check Railway build logs
- Verify all dependencies are in package.json
- Ensure Node.js version compatibility

#### 3. CORS Issues
- Update FRONTEND_URL in environment variables
- Check CORS configuration in server/index.js
- Verify frontend is using correct API URL

#### 4. File Upload Issues
- Check uploads directory permissions
- Verify MAX_FILE_SIZE configuration
- Ensure proper file handling middleware

### Getting Help

1. **Check Railway logs** in the dashboard
2. **Verify environment variables** are set correctly
3. **Test locally** before deploying
4. **Check Railway documentation** at [docs.railway.app](https://docs.railway.app)

## 💰 Cost Considerations

### Railway Pricing
- **Free tier**: Limited usage
- **Pro plan**: $5/month for more resources
- **Pay-as-you-go**: Based on actual usage

### Optimization Tips
- Use Railway's sleep feature for development
- Monitor resource usage
- Optimize build times

## 🔄 Continuous Deployment

### Automatic Deployments
- Railway automatically deploys on GitHub pushes
- Configure branch protection rules
- Use feature branches for testing

### Manual Deployments
- Trigger deployments from Railway dashboard
- Rollback to previous versions if needed

---

## 🎯 Next Steps

1. **Deploy to Railway** following this guide
2. **Share the URL** with your friends
3. **Monitor the application** for any issues
4. **Scale as needed** based on usage

**Your Restaurant POS System will be live at: `https://your-app.railway.app`** 🚀 