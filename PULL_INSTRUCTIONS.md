# How to Pull the Restaurant POS System Project

## 🚀 Quick Start Guide for Friends

### Prerequisites
Before pulling the project, make sure you have the following installed:

1. **Git** - Download from [https://git-scm.com/](https://git-scm.com/)
2. **Node.js** (v16 or higher) - Download from [https://nodejs.org/](https://nodejs.org/)
3. **XAMPP** (for local development) - Download from [https://www.apachefriends.org/](https://www.apachefriends.org/)

### Step 1: Clone the Repository

Open your terminal/command prompt and run:

```bash
git clone https://github.com/VWin4Ever/restaurant-pos-system.git
cd restaurant-pos-system
```

### Step 2: Install Dependencies

Install both client and server dependencies:

```bash
# Install root dependencies (if any)
npm install

# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

### Step 3: Set Up Environment Variables

#### For the Server:
Create a `.env` file in the `server` directory:

```bash
cd server
```

Create a file named `.env` with the following content:

```env
# Database Configuration
DATABASE_URL="mysql://root:@localhost:3306/restaurant_pos"
JWT_SECRET="your-super-secret-jwt-key-here"
PORT=5000

# File Upload Configuration
UPLOAD_PATH="./uploads"
MAX_FILE_SIZE=5242880

# Email Configuration (optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Payment Configuration (optional)
STRIPE_SECRET_KEY="your-stripe-secret-key"
STRIPE_PUBLISHABLE_KEY="your-stripe-publishable-key"
```

#### For the Client:
Create a `.env` file in the `client` directory:

```bash
cd client
```

Create a file named `.env` with the following content:

```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_WS_URL=ws://localhost:5000
```

### Step 4: Set Up the Database

1. **Start XAMPP** and ensure MySQL is running
2. **Create the database**:
   ```sql
   CREATE DATABASE restaurant_pos;
   ```
3. **Run database migrations**:
   ```bash
   cd server
   npx prisma migrate dev
   npx prisma generate
   ```

### Step 5: Start the Application

#### Start the Server:
```bash
cd server
npm start
```

#### Start the Client (in a new terminal):
```bash
cd client
npm start
```

The application should now be running at:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000

## 🔄 How to Pull Updates (When Project is Updated)

If you already have the project and want to get the latest updates:

```bash
# Navigate to your project directory
cd restaurant-pos-system

# Pull the latest changes
git pull origin main

# Install any new dependencies
npm install
cd client && npm install
cd ../server && npm install

# Restart your application
```

## 🛠️ Troubleshooting

### Common Issues:

1. **Port already in use**:
   - Change the port in server/.env: `PORT=5001`
   - Update client/.env: `REACT_APP_API_URL=http://localhost:5001`

2. **Database connection failed**:
   - Make sure XAMPP MySQL is running
   - Check your DATABASE_URL in server/.env
   - Ensure the database exists

3. **Node modules issues**:
   ```bash
   # Clear node modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Permission denied errors**:
   - On Windows: Run terminal as Administrator
   - On Mac/Linux: Use `sudo` if needed

### Getting Help:

If you encounter any issues:
1. Check the error messages carefully
2. Ensure all prerequisites are installed
3. Verify your environment variables are correct
4. Check if the database is running

## 📁 Project Structure

```
restaurant-pos-system/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   └── services/       # API services
│   └── package.json
├── server/                 # Node.js backend
│   ├── routes/            # API routes
│   ├── middleware/        # Express middleware
│   ├── prisma/           # Database schema
│   └── package.json
└── README.md
```

## 🎯 Default Login Credentials

For testing purposes, you can use these default credentials:
- **Username**: admin
- **Password**: admin123

## 📞 Support

If you need help, contact the project maintainer or check the project's GitHub issues page.

---

**Happy Coding! 🎉**
