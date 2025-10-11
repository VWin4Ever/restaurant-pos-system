const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { requirePermission } = require('../middleware/permissions');

const router = express.Router();
const prisma = new PrismaClient();

// Get all categories
router.get('/', requirePermission('categories.read'), async (req, res) => {
  try {
    const { includeInactive = 'false' } = req.query;
    
    const where = {};
    if (includeInactive !== 'true') {
      where.isActive = true;
    }

    const categories = await prisma.category.findMany({
      where,
      include: {
        _count: {
          select: {
            products: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get categories'
    });
  }
});

// Get category by ID
router.get('/:id', requirePermission('categories.read'), async (req, res) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        products: {
          where: { isActive: true },
          include: { stock: true }
        }
      }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get category'
    });
  }
});

// Create new category
router.post('/', requirePermission('categories.create'), [
  body('name').notEmpty().withMessage('Category name is required'),
  body('description').optional().isString()
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

    const { name, description } = req.body;

    const category = await prisma.category.create({
      data: {
        name,
        description
      }
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    console.error('Create category error:', error);
    
    // Handle duplicate name error
    if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
      return res.status(400).json({
        success: false,
        message: 'A category with this name already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create category'
    });
  }
});

// Update category
router.put('/:id', requirePermission('categories.update'), [
  body('name').notEmpty().withMessage('Category name is required'),
  body('description').optional().isString()
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

    const { name, description } = req.body;
    const categoryId = parseInt(req.params.id);

    const category = await prisma.category.update({
      where: { id: categoryId },
      data: {
        name,
        description
      }
    });

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    console.error('Update category error:', error);
    
    // Handle duplicate name error
    if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
      return res.status(400).json({
        success: false,
        message: 'A category with this name already exists'
      });
    }
    
    // Handle category not found error
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update category'
    });
  }
});

// Toggle category active status
router.patch('/:id', requirePermission('categories.update'), [
  body('isActive').isBoolean().withMessage('isActive must be a boolean')
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

    const { isActive } = req.body;
    const categoryId = parseInt(req.params.id);

    const category = await prisma.category.update({
      where: { id: categoryId },
      data: { isActive }
    });

    res.json({
      success: true,
      message: `Category ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: category
    });
  } catch (error) {
    console.error('Toggle category status error:', error);
    
    // Handle category not found error
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update category status'
    });
  }
});

// Delete category (soft delete)
router.delete('/:id', requirePermission('categories.delete'), async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);

    // Check if category has products (any products, not just active ones)
    const productsCount = await prisma.product.count({
      where: { 
        categoryId
      }
    });

    if (productsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category with ${productsCount} product(s). Please deactivate the category instead.`
      });
    }

    // Hard delete the category since it has no products
    await prisma.category.delete({
      where: { id: categoryId }
    });

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    
    // Handle category not found error
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to delete category'
    });
  }
});

module.exports = router; 