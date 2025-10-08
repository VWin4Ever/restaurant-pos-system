require('dotenv').config({ path: './config.env' });
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Product data based on the folder structure (what we should have)
const expectedProducts = {
  'Appetizer & Salad': [
    'Deep Fry Spring Roll',
    'Fresh Shrimp Salad', 
    'Seafood Vermicelli Salad',
    'Green Mango Salad',
    'Raw Beef Salad',
    'Fresh Spring Roll'
  ],
  'Appetizers and Snack': [
    'Pizza',
    'Burgers',
    'Sandwiches',
    'French Fries Platter',
    'Tempura Prawn',
    'Calamari Fritters',
    'Fish Fingers',
    'Fish and Chips'
  ],
  'Main course': [
    'Steamed Rice',
    'Work Fried Sweet & Sour',
    'Kung Pao Chicken',
    'Chicken or Beef Satay',
    'Lok Lac',
    'Work Fried Khmer Spicy Paste',
    'Stir-fried Hot Basil',
    'Steamed Amok Fish'
  ],
  'Rice and Noodle': [
    'Sweet & Soup Vegetable',
    'Steak & Shrimp Noodle',
    'Shrimp Chow Mein',
    'Pad Thai',
    'Lad Na',
    'Hookean Noodle',
    'Yellow Fried Rice',
    'Fried Rice'
  ],
  'Soup': [
    'Cambodian Curry',
    'Green Curry',
    'Khmer Hot Sour Soup',
    'Meat Curry',
    'Noodle Soup',
    'Red Curry',
    'Tom Kha Gai',
    'Tom Yam Soup',
    'Vegetable Curry'
  ],
  'Western Soup': [
    'Bake French Onion Soup',
    'Mushroom Cream Soup',
    'Potato Cream Soup',
    'Pumpkin Cream Soup',
    'Tomato Cream Soup'
  ],
  'Dessert': [
    'Banana in Coconut Cream',
    'Mixed Fruit',
    'Seasonal Tropical Fresh Fruit Platter'
  ],
  'Soft Drinks': [
    'Fresh Juice',
    'Water',
    'Soda',
    'Sprite',
    'Fanta',
    'Coca-Cola'
  ],
  'Hot&Cold Drinks': [
    'Whiskey',
    'Cocktail',
    'Wine',
    'Beer',
    'Jasmine Tea',
    'Black Tea',
    'Green Tea',
    'Latte',
    'Cappuccino',
    'Espresso'
  ]
};

async function analyzeMissingProducts() {
  try {
    console.log('🔍 Analyzing missing products...\n');

    // Get current products from database
    const dbProducts = await prisma.product.findMany({
      include: { category: true }
    });

    console.log('📊 COMPARISON RESULTS:');
    console.log('=====================================\n');

    let totalExpected = 0;
    let totalInDatabase = 0;
    let missingProducts = [];

    for (const [categoryName, expectedProductList] of Object.entries(expectedProducts)) {
      console.log(`📂 ${categoryName}:`);
      
      const dbCategoryProducts = dbProducts.filter(p => p.category.name === categoryName);
      const dbProductNames = dbCategoryProducts.map(p => p.name);
      
      console.log(`   Expected: ${expectedProductList.length} products`);
      console.log(`   In Database: ${dbCategoryProducts.length} products`);
      
      // Check for missing products
      const missing = expectedProductList.filter(name => !dbProductNames.includes(name));
      if (missing.length > 0) {
        console.log(`   ❌ Missing: ${missing.join(', ')}`);
        missingProducts.push(...missing.map(name => ({ name, category: categoryName })));
      } else {
        console.log(`   ✅ All products present`);
      }
      
      // Check for extra products
      const extra = dbProductNames.filter(name => !expectedProductList.includes(name));
      if (extra.length > 0) {
        console.log(`   ⚠️  Extra: ${extra.join(', ')}`);
      }
      
      console.log('');
      
      totalExpected += expectedProductList.length;
      totalInDatabase += dbCategoryProducts.length;
    }

    console.log('📋 SUMMARY:');
    console.log('=====================================');
    console.log(`Total expected products: ${totalExpected}`);
    console.log(`Total in database: ${totalInDatabase}`);
    
    if (missingProducts.length > 0) {
      console.log(`\n❌ MISSING PRODUCTS (${missingProducts.length}):`);
      missingProducts.forEach(product => {
        console.log(`   - ${product.name} (${product.category})`);
      });
    } else {
      console.log('\n✅ ALL PRODUCTS ARE PRESENT! No missing products found.');
    }

  } catch (error) {
    console.error('❌ Error analyzing products:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeMissingProducts();






















