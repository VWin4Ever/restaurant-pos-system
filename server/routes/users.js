const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { requirePermission, getUserPermissions, getAvailablePermissions } = require('../middleware/permissions');

const router = express.Router();
const prisma = new PrismaClient();

// Get all users
router.get('/', requirePermission('users.view'), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      role = '', 
      status = '' 
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where = {};

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Role filter
    if (role) {
      where.role = role;
    }

    // Status filter
    if (status) {
      where.isActive = status === 'active';
    }

    // Get total count
    const total = await prisma.user.count({ where });

    // Get users with pagination
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        permissions: {
          select: {
            permission: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limitNum
    });

    // Get permissions for each user
    const usersWithPermissions = await Promise.all(
      users.map(async (user) => {
        const permissions = await getUserPermissions(user.id, user.role);
        return {
          ...user,
          permissions: permissions
        };
      })
    );

    const pages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: usersWithPermissions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users'
    });
  }
});

// Get user by ID
router.get('/:id', requirePermission('users.view'), async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.params.id) },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        permissions: {
          select: {
            permission: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get full permissions list
    const permissions = await getUserPermissions(user.id, user.role);

    res.json({
      success: true,
      data: {
        ...user,
        permissions: permissions
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user'
    });
  }
});

// Get available permissions
router.get('/permissions/available', requirePermission('users.update'), async (req, res) => {
  try {
    const permissions = getAvailablePermissions();
    res.json({
      success: true,
      data: permissions
    });
  } catch (error) {
    console.error('Get available permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get available permissions'
    });
  }
});

// Create new user
router.post('/', requirePermission('users.create'), [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').notEmpty().withMessage('Name is required'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('role').isIn(['ADMIN', 'CASHIER']).withMessage('Invalid role'),
  body('permissions').optional().isArray().withMessage('Permissions must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { username, password, name, email, role, permissions = [] } = req.body;

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with permissions
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name,
        email,
        role,
        permissions: {
          create: permissions.map(permission => ({
            permission: permission
          }))
        }
      },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        permissions: {
          select: {
            permission: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user'
    });
  }
});

// Update user
router.put('/:id', requirePermission('users.update'), [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('role').isIn(['ADMIN', 'CASHIER']).withMessage('Invalid role'),
  body('permissions').optional().isArray().withMessage('Permissions must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { name, email, role, password, permissions } = req.body;
    const userId = parseInt(req.params.id);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prepare update data
    const updateData = {
      name,
      email,
      role
    };

    // Update password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    // Update user and permissions in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update user
      const user = await tx.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          updatedAt: true
        }
      });

      // Update permissions if provided
      if (permissions !== undefined) {
        // Delete existing permissions
        await tx.userPermission.deleteMany({
          where: { userId }
        });

        // Create new permissions
        if (permissions.length > 0) {
          await tx.userPermission.createMany({
            data: permissions.map(permission => ({
              userId,
              permission
            }))
          });
        }
      }

      return user;
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      data: result
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user'
    });
  }
});

// Update user permissions
router.patch('/:id/permissions', requirePermission('users.update'), [
  body('permissions').isArray().withMessage('Permissions must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { permissions } = req.body;
    const userId = parseInt(req.params.id);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update permissions in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete existing permissions
      await tx.userPermission.deleteMany({
        where: { userId }
      });

      // Create new permissions
      if (permissions.length > 0) {
        await tx.userPermission.createMany({
          data: permissions.map(permission => ({
            userId,
            permission
          }))
        });
      }
    });

    res.json({
      success: true,
      message: 'User permissions updated successfully'
    });
  } catch (error) {
    console.error('Update user permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user permissions'
    });
  }
});

// Toggle user active status
router.patch('/:id/toggle-active', requirePermission('users.update'), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      message: `User ${updatedUser.isActive ? 'activated' : 'deactivated'} successfully`,
      data: updatedUser
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status'
    });
  }
});

// Delete user
router.delete('/:id', requirePermission('users.delete'), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has any orders
    const userOrders = await prisma.order.findFirst({
      where: { userId }
    });

    if (userOrders) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete user with existing orders'
      });
    }

    // Delete user (permissions will be deleted automatically due to cascade)
    await prisma.user.delete({
      where: { id: userId }
    });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
});

module.exports = router; 