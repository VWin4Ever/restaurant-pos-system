# 🚀 Quick Pull Guide - Restaurant POS System

## One-Command Setup (Copy & Paste)

```bash
# 1. Clone the project
git clone https://github.com/VWin4Ever/restaurant-pos-system.git
cd restaurant-pos-system

# 2. Install dependencies
npm install && cd client && npm install && cd ../server && npm install

# 3. Create environment files
echo "DATABASE_URL=\"mysql://root:@localhost:3306/restaurant_pos\"" > server/.env
echo "JWT_SECRET=\"your-secret-key\"" >> server/.env
echo "PORT=5000" >> server/.env
echo "REACT_APP_API_URL=http://localhost:5000" > client/.env

# 4. Start XAMPP MySQL and create database
# Open phpMyAdmin: http://localhost/phpmyadmin
# Create database: restaurant_pos

# 5. Setup database
cd server && npx prisma migrate dev && npx prisma generate

# 6. Start the app (in separate terminals)
# Terminal 1: cd server && npm start
# Terminal 2: cd client && npm start
```

## 🔗 Quick Links
- **Repository**: https://github.com/VWin4Ever/restaurant-pos-system
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000
- **Login**: admin / admin123

## 📋 Prerequisites
- Git, Node.js, XAMPP

## 🆘 Need Help?
See `PULL_INSTRUCTIONS.md` for detailed guide with troubleshooting.
