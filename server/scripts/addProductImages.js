require('dotenv').config({ path: './config.env' });
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Map product names to their corresponding image files
const productImageMap = {
  // Appetizer & Salad
  'Deep Fry Spring Roll': '/food_and_berverage/Appetizer & Salad/Deep fry sping roll.jpg',
  'Fresh Shrimp Salad': '/food_and_berverage/Appetizer & Salad/fresh shrimp salad.jpg',
  'Seafood Vermicelli Salad': '/food_and_berverage/Appetizer & Salad/Seafood Vermicelli Salad.jpg',
  'Green Mango Salad': '/food_and_berverage/Appetizer & Salad/green mango salad.jpg',
  'Raw Beef Salad': '/food_and_berverage/Appetizer & Salad/raw beef salad.jpg',
  'Fresh Spring Roll': '/food_and_berverage/Appetizer & Salad/fresh spring roll.jpg',

  // Appetizers and Snack
  'Pizza': '/food_and_berverage/Appetizers and Snack/Pizza.jpg',
  'Burgers': '/food_and_berverage/Appetizers and Snack/Burgers.jpg',
  'Sandwiches': '/food_and_berverage/Appetizers and Snack/Sandwiches.jpg',
  'French Fries Platter': '/food_and_berverage/Appetizers and Snack/French Fries Platter.jpg',
  'Tempura Prawn': '/food_and_berverage/Appetizers and Snack/Tempura Prawn.jpg',
  'Calamari Fritters': '/food_and_berverage/Appetizers and Snack/Calamari Fritters.jpg',
  'Fish Fingers': '/food_and_berverage/Appetizers and Snack/Fish Fingers.webp',
  'Fish and Chips': '/food_and_berverage/Appetizers and Snack/Fish and Chips.jpg',

  // Main course
  'Steamed Rice': '/food_and_berverage/Main course/Steamed Rice.jpg',
  'Work Fried Sweet & Sour': '/food_and_berverage/Main course/Work fried Sweet & Sour.jpg',
  'Kung Pao Chicken': '/food_and_berverage/Main course/Kung Pao Chicken.jpg',
  'Chicken or Beef Satay': '/food_and_berverage/Main course/Chicken or Beef Satay.webp',
  'Lok Lac': '/food_and_berverage/Main course/Lok Lac.jpg',
  'Work Fried Khmer Spicy Paste': '/food_and_berverage/Main course/Work Fried Khmer Spicy paste.webp',
  'Stir-fried Hot Basil': '/food_and_berverage/Main course/Stir-fried Hot Basil.jpg',
  'Steamed Amok Fish': '/food_and_berverage/Main course/Steamed Amok Fish.webp',

  // Rice and Noodle
  'Sweet & Soup Vegetable': '/food_and_berverage/Rice and Noodle/Sweet & Soup Vegetable.jpg',
  'Steak & Shrimp Noodle': '/food_and_berverage/Rice and Noodle/Steak & Shrimp Noodle.webp',
  'Shrimp Chow Mein': '/food_and_berverage/Rice and Noodle/Shrimp Chow Mein.jpg',
  'Pad Thai': '/food_and_berverage/Rice and Noodle/Pad Thai.jpg',
  'Lad Na': '/food_and_berverage/Rice and Noodle/Lad Na.jpg',
  'Hookean Noodle': '/food_and_berverage/Rice and Noodle/Hookean Noodle.jpg',
  'Yellow Fried Rice': '/food_and_berverage/Rice and Noodle/Yellow Fried Rice.jpg',
  'Fried Rice': '/food_and_berverage/Rice and Noodle/Fried Rice.jpg',

  // Soup
  'Cambodian Curry': '/food_and_berverage/Soup/Cambodian Curry.jpg',
  'Green Curry': '/food_and_berverage/Soup/green curry.jpg',
  'Khmer Hot Sour Soup': '/food_and_berverage/Soup/khmer hot sour soup.jpg',
  'Meat Curry': '/food_and_berverage/Soup/meat curry.webp',
  'Noodle Soup': '/food_and_berverage/Soup/noodle soup.jpg',
  'Red Curry': '/food_and_berverage/Soup/Red Curry.jpg',
  'Tom Kha Gai': '/food_and_berverage/Soup/Tom Kha Gai.jpg',
  'Tom Yam Soup': '/food_and_berverage/Soup/Tom Yam Soup.jpg',
  'Vegetable Curry': '/food_and_berverage/Soup/Vegetable Curry.jpg',

  // Western Soup
  'Bake French Onion Soup': '/food_and_berverage/Western Soup/Bake French Onion Soup.jpg',
  'Mushroom Cream Soup': '/food_and_berverage/Western Soup/Mushroom Cream Soup.jpg',
  'Potato Cream Soup': '/food_and_berverage/Western Soup/Potato Cream Soup.jpg',
  'Pumpkin Cream Soup': '/food_and_berverage/Western Soup/Pumpkin Cream Soup.jpg',
  'Tomato Cream Soup': '/food_and_berverage/Western Soup/Tomato Cream Soup.jpg',

  // Dessert
  'Banana in Coconut Cream': '/food_and_berverage/Dessert/Banana in coconut cream.jpg',
  'Mixed Fruit': '/food_and_berverage/Dessert/Mixed Fruit.jpg',
  'Seasonal Tropical Fresh Fruit Platter': '/food_and_berverage/Dessert/Seasonal Tropical Fresh Fruit platter.webp',

  // Soft Drinks
  'Fresh Juice': '/food_and_berverage/Soft Drinks/Fresh Juice.jpg',
  'Water': '/food_and_berverage/Soft Drinks/Water.jpg',
  'Soda': '/food_and_berverage/Soft Drinks/Soda.jpg',
  'Sprite': '/food_and_berverage/Soft Drinks/Sprite.jpg',
  'Fanta': '/food_and_berverage/Soft Drinks/Fanta.jpg',
  'Coca-Cola': '/food_and_berverage/Soft Drinks/Coca-Cola.jpg',

  // Hot&Cold Drinks
  'Whiskey': '/food_and_berverage/Hot&Cold Drinks/Whiskey.webp',
  'Cocktail': '/food_and_berverage/Hot&Cold Drinks/Cocktail.webp',
  'Wine': '/food_and_berverage/Hot&Cold Drinks/Wine.webp',
  'Beer': '/food_and_berverage/Hot&Cold Drinks/Beer.jpg',
  'Jasmine Tea': '/food_and_berverage/Hot&Cold Drinks/Jasmine tea.jpg',
  'Black Tea': '/food_and_berverage/Hot&Cold Drinks/Black tea.jpg',
  'Green Tea': '/food_and_berverage/Hot&Cold Drinks/Green tea.jpg',
  'Latte': '/food_and_berverage/Hot&Cold Drinks/Latte.jpg',
  'Cappuccino': '/food_and_berverage/Hot&Cold Drinks/Cappuccino.jpg',
  'Espresso': '/food_and_berverage/Hot&Cold Drinks/Espresso.jpg'
};

async function addProductImages() {
  try {
    console.log('🖼️  Adding product images...');

    const updatedProducts = [];
    const productsWithoutImages = [];

    // Get all products
    const products = await prisma.product.findMany();

    for (const product of products) {
      const imagePath = productImageMap[product.name];
      
      if (imagePath) {
        // Check if the image file exists
        const fullImagePath = path.join(__dirname, '..', imagePath);
        
        if (fs.existsSync(fullImagePath)) {
          // Update product with image URL
          const updatedProduct = await prisma.product.update({
            where: { id: product.id },
            data: { imageUrl: imagePath }
          });
          
          updatedProducts.push(updatedProduct);
          console.log(`✅ Added image for "${product.name}": ${imagePath}`);
        } else {
          console.log(`⚠️  Image file not found for "${product.name}": ${fullImagePath}`);
          productsWithoutImages.push(product.name);
        }
      } else {
        console.log(`⚠️  No image mapping found for "${product.name}"`);
        productsWithoutImages.push(product.name);
      }
    }

    console.log('\n🎉 Product images updated successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - ${updatedProducts.length} products updated with images`);
    console.log(`   - ${productsWithoutImages.length} products without images`);

    if (productsWithoutImages.length > 0) {
      console.log('\n⚠️  Products without images:');
      productsWithoutImages.forEach(productName => {
        console.log(`   - ${productName}`);
      });
    }

    console.log('\n🖼️  Sample products with images:');
    updatedProducts.slice(0, 10).forEach(product => {
      console.log(`   - ${product.name}: ${product.imageUrl}`);
    });

  } catch (error) {
    console.error('❌ Error adding product images:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addProductImages();































