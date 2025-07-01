# Restaurant POS System

A complete Point of Sale (POS) system designed specifically for restaurants with role-based access control, inventory management, and comprehensive reporting.

## Features

### Role-Based Access Control
- **Admin**: Full system access including user management, inventory, and reports
- **Cashier**: Order management and table operations

### Order Management
- Create and manage orders with real-time table status
- Automatic stock validation for drinks
- Payment processing with invoice generation
- Order status tracking (Pending, Completed, Cancelled)

### Inventory Management
- Stock tracking for drinks only
- Low stock alerts
- Stock logs with user tracking
- Automatic stock deduction on order completion

### Comprehensive Reporting
- Sales reports with date filtering
- Top-selling products analysis
- Cashier performance metrics
- Stock reports and alerts

### Table Management
- Real-time table status (Available, Occupied, Reserved)
- Automatic status updates on order creation/completion

### User Management
- Add/edit/remove users
- Role assignment
- Password management

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- XAMPP (recommended for easy setup)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd restaurant-pos-system
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Database Setup**
   - Start your MySQL server (XAMPP)
   - Create a database named `restaurant_pos`
   - Update database connection in `server/config.env` if needed

4. **Initialize Database**
   ```bash
   npm run setup-db
   ```

5. **Start the application**
   ```bash
   npm run dev
   ```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Default Login Credentials

### Admin Account
- **Username**: `admin`
- **Password**: `admin123`
- **Access**: Full system access

### Cashier Account
- **Username**: `cashier`
- **Password**: `cashier123`
- **Access**: Order management and table operations

## Project Structure

```
restaurant-pos-system/
├── server/                 # Backend API
│   ├── routes/            # API routes
│   ├── middleware/        # Authentication & validation
│   ├── prisma/           # Database schema
│   ├── scripts/          # Database setup
│   └── index.js          # Server entry point
├── client/                # Frontend React app
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── contexts/     # React contexts
│   │   └── App.js        # Main app component
│   └── public/           # Static files
└── package.json          # Root package.json
```

## Technology Stack

### Backend
- **Node.js** with Express.js
- **Prisma ORM** for database management
- **MySQL** database
- **JWT** for authentication
- **bcrypt** for password hashing

### Frontend
- **React.js** with hooks
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Axios** for API communication
- **React Hook Form** with Yup validation

## Configuration

### Environment Variables
Create `server/config.env`:
```env
DATABASE_URL="mysql://root:@localhost:3306/restaurant_pos"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="24h"
PORT=5000
NODE_ENV=development
```

## Development Commands
```bash
# Install all dependencies
npm run install-all

# Start both frontend and backend
npm run dev

# Start only backend
npm run server

# Start only frontend
npm run client

# Setup database
npm run setup-db

# Build for production
npm run build
```

## Important Notes

1. **Stock Management**: Only drinks are tracked in inventory. Food items are not stock-managed.
2. **Table Status**: Tables automatically change status when orders are created/completed.
3. **Payment Processing**: Stock is only deducted when payment is processed, not when order is created.
4. **Security**: Change the JWT secret in production and use strong passwords.

## License

This project is licensed under the MIT License. 