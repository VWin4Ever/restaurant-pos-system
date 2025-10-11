require('dotenv').config({ path: './config.env' });
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Product data based on the folder structure
const productData = {
  'Appetizer & Salad': [
    { name: 'Deep Fry Spring Roll', description: 'Crispy deep-fried spring rolls with vegetables', price: 8.99, isDrink: false },
    { name: 'Fresh Shrimp Salad', description: 'Fresh shrimp salad with mixed greens', price: 12.99, isDrink: false },
    { name: 'Seafood Vermicelli Salad', description: 'Vermicelli salad with fresh seafood', price: 14.99, isDrink: false },
    { name: 'Green Mango Salad', description: 'Traditional green mango salad with herbs', price: 9.99, isDrink: false },
    { name: 'Raw Beef Salad', description: 'Traditional raw beef salad with herbs and spices', price: 13.99, isDrink: false },
    { name: 'Fresh Spring Roll', description: 'Fresh vegetable spring rolls with dipping sauce', price: 7.99, isDrink: false }
  ],
  'Appetizers and Snack': [
    { name: 'Pizza', description: 'Classic pizza with tomato sauce and cheese', price: 16.99, isDrink: false },
    { name: 'Burgers', description: 'Juicy beef burger with fresh vegetables', price: 15.99, isDrink: false },
    { name: 'Sandwiches', description: 'Fresh sandwiches with various fillings', price: 11.99, isDrink: false },
    { name: 'French Fries Platter', description: 'Crispy golden french fries', price: 6.99, isDrink: false },
    { name: 'Tempura Prawn', description: 'Crispy tempura prawns with dipping sauce', price: 13.99, isDrink: false },
    { name: 'Calamari Fritters', description: 'Crispy calamari fritters with tartar sauce', price: 12.99, isDrink: false },
    { name: 'Fish Fingers', description: 'Crispy fish fingers with dipping sauce', price: 10.99, isDrink: false },
    { name: 'Fish and Chips', description: 'Classic fish and chips with tartar sauce', price: 14.99, isDrink: false }
  ],
  'Main course': [
    { name: 'Steamed Rice', description: 'Steamed white rice', price: 3.99, isDrink: false },
    { name: 'Work Fried Sweet & Sour', description: 'Stir-fried sweet and sour dish', price: 18.99, isDrink: false },
    { name: 'Kung Pao Chicken', description: 'Spicy kung pao chicken with peanuts', price: 19.99, isDrink: false },
    { name: 'Chicken or Beef Satay', description: 'Grilled satay with peanut sauce', price: 17.99, isDrink: false },
    { name: 'Lok Lac', description: 'Traditional Cambodian lok lac beef', price: 21.99, isDrink: false },
    { name: 'Work Fried Khmer Spicy Paste', description: 'Stir-fried with Khmer spicy paste', price: 20.99, isDrink: false },
    { name: 'Stir-fried Hot Basil', description: 'Stir-fried with hot basil and chili', price: 18.99, isDrink: false },
    { name: 'Steamed Amok Fish', description: 'Traditional steamed fish amok', price: 22.99, isDrink: false }
  ],
  'Rice and Noodle': [
    { name: 'Sweet & Soup Vegetable', description: 'Sweet and sour vegetable dish', price: 12.99, isDrink: false },
    { name: 'Steak & Shrimp Noodle', description: 'Noodles with steak and shrimp', price: 20.99, isDrink: false },
    { name: 'Shrimp Chow Mein', description: 'Stir-fried noodles with shrimp', price: 18.99, isDrink: false },
    { name: 'Pad Thai', description: 'Traditional Thai pad thai', price: 16.99, isDrink: false },
    { name: 'Lad Na', description: 'Stir-fried wide rice noodles', price: 15.99, isDrink: false },
    { name: 'Hookean Noodle', description: 'Traditional hookean noodles', price: 17.99, isDrink: false },
    { name: 'Yellow Fried Rice', description: 'Yellow fried rice with vegetables', price: 13.99, isDrink: false },
    { name: 'Fried Rice', description: 'Classic fried rice with vegetables', price: 12.99, isDrink: false }
  ],
  'Soup': [
    { name: 'Cambodian Curry', description: 'Traditional Cambodian curry soup', price: 15.99, isDrink: false },
    { name: 'Green Curry', description: 'Spicy green curry soup', price: 16.99, isDrink: false },
    { name: 'Khmer Hot Sour Soup', description: 'Traditional Khmer hot and sour soup', price: 14.99, isDrink: false },
    { name: 'Meat Curry', description: 'Rich meat curry soup', price: 17.99, isDrink: false },
    { name: 'Noodle Soup', description: 'Traditional noodle soup', price: 13.99, isDrink: false },
    { name: 'Red Curry', description: 'Spicy red curry soup', price: 16.99, isDrink: false },
    { name: 'Tom Kha Gai', description: 'Coconut milk soup with chicken', price: 15.99, isDrink: false },
    { name: 'Tom Yam Soup', description: 'Spicy and sour tom yam soup', price: 16.99, isDrink: false },
    { name: 'Vegetable Curry', description: 'Vegetable curry soup', price: 14.99, isDrink: false }
  ],
  'Western Soup': [
    { name: 'Bake French Onion Soup', description: 'Classic baked French onion soup', price: 12.99, isDrink: false },
    { name: 'Mushroom Cream Soup', description: 'Creamy mushroom soup', price: 11.99, isDrink: false },
    { name: 'Potato Cream Soup', description: 'Creamy potato soup', price: 10.99, isDrink: false },
    { name: 'Pumpkin Cream Soup', description: 'Creamy pumpkin soup', price: 11.99, isDrink: false },
    { name: 'Tomato Cream Soup', description: 'Creamy tomato soup', price: 10.99, isDrink: false }
  ],
  'Dessert': [
    { name: 'Banana in Coconut Cream', description: 'Sweet banana in coconut cream', price: 8.99, isDrink: false },
    { name: 'Mixed Fruit', description: 'Fresh mixed fruit platter', price: 9.99, isDrink: false },
    { name: 'Seasonal Tropical Fresh Fruit Platter', description: 'Seasonal tropical fruit platter', price: 12.99, isDrink: false }
  ],
  'Soft Drinks': [
    { name: 'Fresh Juice', description: 'Fresh fruit juice', price: 4.99, isDrink: true },
    { name: 'Water', description: 'Bottled water', price: 2.99, isDrink: true },
    { name: 'Soda', description: 'Carbonated soft drink', price: 3.99, isDrink: true },
    { name: 'Sprite', description: 'Lemon-lime soft drink', price: 3.99, isDrink: true },
    { name: 'Fanta', description: 'Orange flavored soft drink', price: 3.99, isDrink: true },
    { name: 'Coca-Cola', description: 'Classic Coca-Cola', price: 3.99, isDrink: true }
  ],
  'Hot&Cold Drinks': [
    { name: 'Whiskey', description: 'Premium whiskey', price: 12.99, isDrink: true },
    { name: 'Cocktail', description: 'House cocktail', price: 10.99, isDrink: true },
    { name: 'Wine', description: 'House wine', price: 9.99, isDrink: true },
    { name: 'Beer', description: 'Draft beer', price: 6.99, isDrink: true },
    { name: 'Jasmine Tea', description: 'Hot jasmine tea', price: 3.99, isDrink: true },
    { name: 'Black Tea', description: 'Hot black tea', price: 3.49, isDrink: true },
    { name: 'Green Tea', description: 'Hot green tea', price: 3.49, isDrink: true },
    { name: 'Latte', description: 'Coffee latte', price: 4.99, isDrink: true },
    { name: 'Cappuccino', description: 'Coffee cappuccino', price: 4.49, isDrink: true },
    { name: 'Espresso', description: 'Single shot espresso', price: 3.99, isDrink: true }
  ]
};

async function addFoodAndBeverageData() {
  try {
    console.log('🍽️  Adding Food and Beverage categories and products...');

    const createdCategories = {};
    const createdProducts = [];
    const stockRecords = [];

    // Create categories and products
    for (const [categoryName, products] of Object.entries(productData)) {
      console.log(`📂 Creating category: ${categoryName}`);
      
      // Create category
      const category = await prisma.category.create({
        data: {
          name: categoryName,
          description: `${categoryName} menu items`
        }
      });
      
      createdCategories[categoryName] = category;
      console.log(`✅ Category "${categoryName}" created with ID: ${category.id}`);

      // Create products for this category
      for (const productInfo of products) {
        console.log(`🍽️  Creating product: ${productInfo.name}`);
        
        const product = await prisma.product.create({
          data: {
            name: productInfo.name,
            description: productInfo.description,
            price: productInfo.price,
            categoryId: category.id,
            isDrink: productInfo.isDrink
          }
        });
        
        createdProducts.push(product);
        console.log(`✅ Product "${productInfo.name}" created with ID: ${product.id}`);

        // Create stock records for drinks
        if (productInfo.isDrink) {
          const stock = await prisma.stock.create({
            data: {
              productId: product.id,
              quantity: 50,
              minStock: 10
            }
          });
          stockRecords.push(stock);
          console.log(`📦 Stock record created for "${productInfo.name}"`);
        }
      }
    }

    console.log('\n🎉 Food and Beverage data added successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - ${Object.keys(createdCategories).length} categories created`);
    console.log(`   - ${createdProducts.length} products created`);
    console.log(`   - ${stockRecords.length} stock records created for drinks`);

    console.log('\n📋 Categories created:');
    Object.keys(createdCategories).forEach(categoryName => {
      console.log(`   - ${categoryName}`);
    });

    console.log('\n🍽️  Sample products created:');
    createdProducts.slice(0, 10).forEach(product => {
      console.log(`   - ${product.name} ($${product.price})`);
    });

    if (createdProducts.length > 10) {
      console.log(`   ... and ${createdProducts.length - 10} more products`);
    }

  } catch (error) {
    console.error('❌ Error adding food and beverage data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addFoodAndBeverageData();































