# Flexible Permission System Guide

## Overview

The restaurant POS system now supports a flexible permission system where **Admins can create Cashiers and assign specific permissions to them**. This allows for granular control over what each cashier can do within the system.

## Key Features

### 🔐 **Role-Based + Custom Permissions**
- **Admins**: Have all permissions by default
- **Cashiers**: Start with basic permissions, but can be granted additional custom permissions
- **Custom Permissions**: Admins can assign specific permissions to individual cashiers

### 👥 **User Management**
- Admins can create new cashier accounts
- Admins can assign/revoke specific permissions to cashiers
- Admins can view all user permissions
- Admins can edit user information and permissions

### 🎯 **Granular Permission Control**
- 35+ available permissions across all modules
- Support for wildcard permissions (e.g., `orders.*`)
- Individual action permissions (e.g., `orders.create`, `products.view`)

## Available Permissions

### 📋 **Orders Module**
- `orders.create` - Create new orders
- `orders.read` - View orders
- `orders.update` - Modify existing orders
- `orders.delete` - Delete orders
- `orders.*` - All order permissions

### 🍽️ **Products Module**
- `products.create` - Add new products
- `products.read` - View products
- `products.update` - Edit products
- `products.delete` - Remove products
- `products.*` - All product permissions

### 📂 **Categories Module**
- `categories.create` - Create categories
- `categories.read` - View categories
- `categories.update` - Edit categories
- `categories.delete` - Delete categories
- `categories.*` - All category permissions

### 🪑 **Tables Module**
- `tables.create` - Add new tables
- `tables.read` - View tables
- `tables.update` - Edit table status
- `tables.delete` - Remove tables
- `tables.*` - All table permissions

### 📦 **Stock Module**
- `stock.create` - Add stock entries
- `stock.read` - View stock levels
- `stock.update` - Update stock quantities
- `stock.delete` - Remove stock entries
- `stock.*` - All stock permissions

### 📊 **Reports Module**
- `reports.read` - View reports
- `reports.*` - All report permissions

### ⚙️ **Settings Module**
- `settings.read` - View settings
- `settings.update` - Modify settings
- `settings.*` - All settings permissions

### 👤 **Users Module**
- `users.read` - View user list
- `users.create` - Create new users
- `users.update` - Edit users and permissions
- `users.delete` - Delete users
- `users.*` - All user management permissions

## How to Use

### For Admins

#### 1. **Creating a New Cashier**
1. Go to **Users** section
2. Click **"Add User"**
3. Fill in user details:
   - Username (required)
   - Password (required, min 6 characters)
   - Full Name (required)
   - Email (optional)
   - Role: Select "Cashier"
4. **Assign Custom Permissions** (optional):
   - Check the permissions you want to grant
   - Permissions are grouped by module for easy selection
5. Click **"Create User"**

#### 2. **Managing Existing User Permissions**
1. Go to **Users** section
2. Find the user you want to manage
3. Click **"Permissions"** button (only available for cashiers)
4. Check/uncheck permissions as needed
5. Click **"Update Permissions"**

#### 3. **Editing User Information**
1. Go to **Users** section
2. Click **"Edit"** next to the user
3. Modify user details and permissions
4. Click **"Update User"**

### For Cashiers

#### **Default Permissions**
Cashiers start with these basic permissions:
- `orders.create` - Create orders
- `orders.read` - View orders
- `orders.update` - Modify orders
- `products.view` - View products
- `categories.view` - View categories
- `tables.read` - View tables
- `tables.update` - Update table status
- `stock.read` - View stock levels
- `stock.update` - Update stock quantities
- `reports.view` - View reports

#### **Additional Permissions**
Admins can grant cashiers additional permissions such as:
- Product management (create, edit, delete products)
- Category management
- User management (view users)
- Settings access
- Advanced reporting

## Technical Implementation

### Database Schema

```prisma
model User {
  id        Int      @id @default(autoincrement())
  username  String   @unique
  password  String
  role      UserRole @default(CASHIER)
  name      String
  email     String?  @unique
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  orders    Order[]
  stockLogs StockLog[]
  permissions UserPermission[]
}

model UserPermission {
  id        Int      @id @default(autoincrement())
  userId    Int
  permission String  // e.g., 'orders.create', 'products.view'
  createdAt DateTime @default(now())

  // Relations
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, permission])
}
```

### API Endpoints

#### **Get Available Permissions**
```
GET /api/users/permissions/available
```
Returns all available permissions for assignment.

#### **Update User Permissions**
```
PATCH /api/users/:id/permissions
Body: { "permissions": ["orders.create", "products.view"] }
```
Updates permissions for a specific user.

#### **Create User with Permissions**
```
POST /api/users
Body: {
  "username": "cashier1",
  "password": "password123",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "CASHIER",
  "permissions": ["products.create", "reports.read"]
}
```

### Frontend Components

#### **Users Component Features**
- User list with permission indicators
- Add/Edit user modal with permission selection
- Dedicated permissions management modal
- Permission count display for each user
- Bulk operations support

#### **Permission Selection UI**
- Grouped by module (Orders, Products, etc.)
- Checkbox-based selection
- Visual indicators for selected permissions
- Easy-to-use interface

## Security Considerations

### **Permission Inheritance**
1. **Admins**: Always have all permissions (cannot be restricted)
2. **Cashiers**: Start with basic permissions + any custom permissions assigned
3. **Custom Permissions**: Override default role permissions

### **Permission Validation**
- Backend validates all permission checks
- Frontend permission checks are for UI only
- Database-level constraints prevent unauthorized access

### **User Protection**
- Users cannot delete their own accounts
- Users cannot deactivate their own accounts
- Permission changes require admin privileges

## Best Practices

### **Permission Assignment**
1. **Principle of Least Privilege**: Only grant necessary permissions
2. **Regular Review**: Periodically review user permissions
3. **Documentation**: Keep track of why specific permissions were granted
4. **Testing**: Test user access after permission changes

### **User Management**
1. **Strong Passwords**: Enforce strong password policies
2. **Regular Updates**: Keep user information current
3. **Activity Monitoring**: Monitor user activity for security
4. **Backup**: Regular backups of user and permission data

## Troubleshooting

### **Common Issues**

#### **User Can't Access Feature**
1. Check if user has the required permission
2. Verify permission is correctly assigned in database
3. Check if user role allows the action
4. Ensure user account is active

#### **Permission Not Saving**
1. Verify admin has `users.update` permission
2. Check for validation errors in request
3. Ensure permission format is correct
4. Check database connection

#### **Permission Check Failing**
1. Verify user is authenticated
2. Check if user permissions are loaded
3. Ensure permission middleware is working
4. Check for typos in permission names

### **Debug Commands**

#### **Check User Permissions**
```javascript
// In browser console
const user = JSON.parse(localStorage.getItem('user'));
console.log('User permissions:', user.permissions);
```

#### **Test Permission Check**
```javascript
// In React component
const { hasPermission } = useAuth();
console.log('Can create orders:', hasPermission('orders.create'));
```

## Migration Notes

### **From Old System**
- Existing users retain their current permissions
- New permission system is backward compatible
- Custom permissions are additive to role-based permissions
- No data loss during migration

### **Database Migration**
The system automatically creates the `user_permissions` table when you run:
```bash
npx prisma migrate dev --name add-user-permissions
```

## Support

For technical support or questions about the permission system:
1. Check this documentation
2. Review the API endpoints
3. Test with the provided examples
4. Contact system administrator

---

**Note**: This permission system provides granular control while maintaining security and ease of use. Always follow security best practices when managing user permissions.


