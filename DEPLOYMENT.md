# 🚀 Deployment Guide - Restaurant POS System

## Netlify Deployment (Frontend)

### Prerequisites
- GitHub/GitLab account
- Netlify account
- Backend deployed (see Backend Deployment section)

### Step 1: Prepare Your Repository

1. **Push your code to GitHub/GitLab**
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Ensure your repository structure is correct:**
   ```
   your-repo/
   ├── client/          # React frontend
   ├── server/          # Node.js backend
   ├── package.json     # Root package.json
   └── README.md
   ```

### Step 2: Deploy Backend First

Before deploying the frontend, you need to deploy your backend to a service that supports Node.js:

#### Option A: Render (Recommended - Free)
1. Go to [render.com](https://render.com)
2. Connect your GitHub account
3. Create a new **Web Service**
4. Select your repository
5. Configure:
   - **Name**: `restaurant-pos-backend`
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     ```
     DATABASE_URL=your-production-database-url
     JWT_SECRET=your-production-jwt-secret
     JWT_EXPIRES_IN=24h
     NODE_ENV=production
     ```

#### Option B: Railway
1. Go to [railway.app](https://railway.app)
2. Connect your GitHub account
3. Deploy from GitHub
4. Set environment variables

#### Option C: Heroku
1. Go to [heroku.com](https://heroku.com)
2. Create new app
3. Connect to GitHub
4. Deploy from GitHub

### Step 3: Deploy Frontend to Netlify

1. **Go to [netlify.com](https://netlify.com)**
2. **Click "New site from Git"**
3. **Connect your GitHub/GitLab account**
4. **Select your repository**
5. **Configure build settings:**
   - **Base directory**: `client`
   - **Build command**: `npm run build`
   - **Publish directory**: `build`

6. **Set Environment Variables:**
   - Go to Site settings → Environment variables
   - Add: `REACT_APP_API_URL` = `https://your-backend-url.com`

7. **Deploy!**

### Step 4: Configure Custom Domain (Optional)

1. Go to Site settings → Domain management
2. Add your custom domain
3. Configure DNS settings

## Environment Variables

### Frontend (Netlify)
```
REACT_APP_API_URL=https://your-backend-url.com
```

### Backend (Render/Railway/Heroku)
```
DATABASE_URL=your-production-database-url
JWT_SECRET=your-production-jwt-secret
JWT_EXPIRES_IN=24h
NODE_ENV=production
PORT=5000
```

## Database Setup

### Option 1: PlanetScale (Recommended)
1. Go to [planetscale.com](https://planetscale.com)
2. Create a new database
3. Get your connection string
4. Update `DATABASE_URL` in your backend environment variables

### Option 2: Railway Database
1. Create a new MySQL database in Railway
2. Use the provided connection string

### Option 3: Supabase
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Use PostgreSQL instead of MySQL

## Post-Deployment

1. **Run database migrations:**
   ```bash
   # Connect to your backend and run:
   npm run db:setup
   ```

2. **Test your application:**
   - Login with default credentials
   - Test all features
   - Check for any CORS issues

3. **Monitor your application:**
   - Check Netlify analytics
   - Monitor backend logs
   - Set up error tracking

## Troubleshooting

### Common Issues:

1. **CORS Errors:**
   - Ensure backend CORS is configured for your Netlify domain
   - Update `server/index.js` CORS settings

2. **API Connection Issues:**
   - Check `REACT_APP_API_URL` environment variable
   - Verify backend is running and accessible

3. **Database Connection Issues:**
   - Verify `DATABASE_URL` is correct
   - Check database is accessible from your backend

4. **Build Failures:**
   - Check Netlify build logs
   - Ensure all dependencies are in `package.json`

## Security Considerations

1. **Use strong JWT secrets**
2. **Enable HTTPS everywhere**
3. **Set up proper CORS policies**
4. **Use environment variables for sensitive data**
5. **Regular security updates**

## Cost Estimation

### Free Tier (Recommended for starting):
- **Netlify**: Free (100GB bandwidth/month)
- **Render**: Free (750 hours/month)
- **PlanetScale**: Free (1 database, 1 billion reads/month)

### Paid Options (for production):
- **Netlify Pro**: $19/month
- **Render**: $7/month per service
- **PlanetScale**: $29/month

## Support

If you encounter issues:
1. Check the deployment logs
2. Verify environment variables
3. Test locally first
4. Check the documentation of your hosting provider 