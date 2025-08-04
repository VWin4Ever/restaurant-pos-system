# 🍽️ Restaurant POS System - Setup Guide for Friends

This guide will help your friends set up and run the Restaurant POS System on their local machine.

## 📋 Prerequisites

Before starting, make sure you have the following installed:

### Required Software
- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **MySQL** (v8.0 or higher) - [Download here](https://dev.mysql.com/downloads/mysql/)
- **XAMPP** (recommended for easy MySQL setup) - [Download here](https://www.apachefriends.org/)

### Verify Installation
Open your terminal/command prompt and run:
```bash
node --version
npm --version
mysql --version
```

## 🚀 Step-by-Step Setup

### 1. Clone the Repository
```bash
# Clone the project from your Git repository
git clone <YOUR_REPOSITORY_URL>
cd PosRes1
```

### 2. Install Dependencies
The project uses a root package.json with scripts to install all dependencies at once:
```bash
# Install all dependencies (root, server, and client)
npm run install-all
```

This command will:
- Install root dependencies
- Install server dependencies
- Install client dependencies

### 3. Database Setup

#### Option A: Using XAMPP (Recommended for beginners)
1. **Start XAMPP**
   - Open XAMPP Control Panel
   - Start Apache and MySQL services
   - Click "Admin" next to MySQL to open phpMyAdmin

2. **Create Database**
   - In phpMyAdmin, click "New" on the left sidebar
   - Enter database name: `restaurant_pos`
   - Click "Create"

#### Option B: Using MySQL directly
```bash
# Connect to MySQL
mysql -u root -p

# Create database
CREATE DATABASE restaurant_pos;
EXIT;
```

### 4. Environment Configuration

Create a configuration file for the server:
```bash
# Navigate to server directory
cd server

# Create config.env file
# On Windows (PowerShell):
New-Item -ItemType File -Name "config.env"

# On Mac/Linux:
touch config.env
```

Add the following content to `server/config.env`:
```env
DATABASE_URL="mysql://root:@localhost:3306/restaurant_pos"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="24h"
PORT=5000
NODE_ENV=development
```

**Note**: 
- If your MySQL has a password, update the DATABASE_URL: `mysql://root:YOUR_PASSWORD@localhost:3306/restaurant_pos`
- Change the JWT_SECRET to something unique for security

### 5. Initialize Database
```bash
# Go back to root directory
cd ..

# Setup database with initial data
npm run setup-db
```

This will:
- Create all database tables
- Insert default categories
- Create admin and cashier accounts
- Set up initial data

### 6. Start the Application
```bash
# Start both frontend and backend
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## 🔑 Default Login Credentials

### Admin Account
- **Username**: `admin`
- **Password**: `admin123`
- **Access**: Full system access (users, inventory, reports, settings)

### Cashier Account
- **Username**: `cashier`
- **Password**: `cashier123`
- **Access**: Order management and table operations

## 🛠️ Available Commands

```bash
# Install all dependencies
npm run install-all

# Start both frontend and backend (development)
npm run dev

# Start only backend
npm run server

# Start only frontend
npm run client

# Setup database
npm run setup-db

# Build for production
npm run build

# Start production server
npm start
```

## 📁 Project Structure

```
PosRes1/
├── server/                 # Backend API
│   ├── routes/            # API endpoints
│   ├── middleware/        # Authentication & validation
│   ├── prisma/           # Database schema & migrations
│   ├── scripts/          # Database setup scripts
│   ├── uploads/          # Product images
│   └── index.js          # Server entry point
├── client/                # Frontend React app
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── contexts/     # React contexts
│   │   ├── services/     # API services
│   │   └── App.js        # Main app component
│   └── public/           # Static files
├── package.json          # Root package.json with scripts
└── README.md            # Project documentation
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Port Already in Use
If you get "port already in use" errors:
```bash
# Kill processes on ports 3000 and 5000
# Windows:
netstat -ano | findstr :3000
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F

# Mac/Linux:
lsof -ti:3000 | xargs kill -9
lsof -ti:5000 | xargs kill -9
```

#### 2. Database Connection Issues
- Make sure MySQL is running
- Check if the database `restaurant_pos` exists
- Verify the DATABASE_URL in `server/config.env`
- Try restarting MySQL service

#### 3. Node Modules Issues
If you encounter module-related errors:
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
cd server && rm -rf node_modules package-lock.json
cd ../client && rm -rf node_modules package-lock.json
cd ..
npm run install-all
```

#### 4. Prisma Issues
If database schema issues occur:
```bash
cd server
npx prisma generate
npx prisma db push
```

### Getting Help

If you encounter any issues:
1. Check the console for error messages
2. Verify all prerequisites are installed
3. Make sure all services (MySQL, Node.js) are running
4. Check the troubleshooting section above

## 🎯 Next Steps

Once the application is running:

1. **Login as Admin** to:
   - Add products and categories
   - Create user accounts
   - Configure system settings
   - View reports

2. **Login as Cashier** to:
   - Create and manage orders
   - Handle table operations
   - Process payments

3. **Explore Features**:
   - Order management
   - Inventory tracking
   - Sales reporting
   - User management

## 📞 Support

If you need help setting up the project, you can:
- Check the main README.md for more details
- Review the troubleshooting section above
- Contact the project maintainer

---

**Happy coding! 🚀** 