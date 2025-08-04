# 🚀 Quick Railway Deployment Checklist

## ✅ Pre-Deployment Checklist

- [ ] Your project is pushed to GitHub
- [ ] You have a Railway account
- [ ] You have a Netlify account (for frontend)

## 🚀 Deployment Steps

### 1. Deploy Backend to Railway
1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your `restaurant-pos-system` repository
4. Add MySQL database service
5. Configure environment variables (see `railway.env.example`)
6. Deploy!

### 2. Deploy Frontend to Netlify
1. Go to [netlify.com](https://netlify.com)
2. Click "New site from Git"
3. Select your repository
4. Set build settings:
   - **Build command**: `cd client && npm run build`
   - **Publish directory**: `client/build`
5. Add environment variable: `REACT_APP_API_URL=https://your-railway-backend-url.railway.app`

### 3. Update CORS Settings
1. Get your Netlify frontend URL
2. Update `FRONTEND_URL` in Railway environment variables
3. Redeploy backend if needed

### 4. Initialize Database
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and link project
railway login
railway link

# Setup database
railway run npm run setup-db
```

## 🔗 Your URLs
- **Backend API**: `https://your-app.railway.app`
- **Frontend**: `https://your-app.netlify.app`
- **Health Check**: `https://your-app.railway.app/api/health`

## 🔑 Login Credentials
- **Admin**: `admin` / `admin123`
- **Cashier**: `cashier` / `cashier123`

## 📞 Share with Friends
Send them the frontend URL: `https://your-app.netlify.app`

---

**Need detailed instructions? Check `RAILWAY_DEPLOYMENT.md`** 📖 