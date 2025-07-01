# 🚀 Quick Deployment Checklist

## Before Deployment

- [ ] Code is pushed to GitHub/GitLab
- [ ] All environment variables are ready
- [ ] Database is set up and accessible
- [ ] Backend is tested locally

## Backend Deployment (Choose One)

### Render (Recommended)
- [ ] Create account at render.com
- [ ] Connect GitHub repository
- [ ] Create Web Service
- [ ] Set root directory: `server`
- [ ] Set build command: `npm install`
- [ ] Set start command: `npm start`
- [ ] Add environment variables
- [ ] Deploy and get URL

### Railway
- [ ] Create account at railway.app
- [ ] Connect GitHub repository
- [ ] Deploy and set environment variables
- [ ] Get deployment URL

### Heroku
- [ ] Create account at heroku.com
- [ ] Create new app
- [ ] Connect GitHub repository
- [ ] Deploy and set environment variables
- [ ] Get deployment URL

## Frontend Deployment (Netlify)

- [ ] Create account at netlify.com
- [ ] Click "New site from Git"
- [ ] Connect GitHub repository
- [ ] Set base directory: `client`
- [ ] Set build command: `npm run build`
- [ ] Set publish directory: `build`
- [ ] Add environment variable: `REACT_APP_API_URL`
- [ ] Deploy

## Post-Deployment

- [ ] Test login functionality
- [ ] Test all major features
- [ ] Check for CORS errors
- [ ] Verify database connection
- [ ] Test file uploads (if any)
- [ ] Check mobile responsiveness

## Environment Variables Checklist

### Backend
- [ ] `DATABASE_URL`
- [ ] `JWT_SECRET`
- [ ] `JWT_EXPIRES_IN`
- [ ] `NODE_ENV=production`
- [ ] `PORT=5000`

### Frontend
- [ ] `REACT_APP_API_URL`

## Common Issues & Solutions

- **CORS Error**: Update backend CORS settings
- **API Connection**: Check `REACT_APP_API_URL`
- **Database Error**: Verify `DATABASE_URL`
- **Build Failure**: Check Netlify build logs
- **404 Errors**: Ensure `_redirects` file is present

## Quick Commands

```bash
# Test build locally
cd client && npm run build

# Test server locally
cd server && npm start

# Check environment variables
echo $DATABASE_URL
echo $REACT_APP_API_URL
``` 