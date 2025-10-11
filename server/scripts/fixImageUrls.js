require('dotenv').config({ path: './config.env' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixImageUrls() {
  try {
    console.log('🔧 Fixing product image URLs...');

    const updatedProducts = [];
    const productsWithoutImages = [];

    // Get all products
    const products = await prisma.product.findMany();

    for (const product of products) {
      if (product.imageUrl) {
        // Check if the URL already has the server base URL
        if (!product.imageUrl.startsWith('http://localhost:5000')) {
          // Add the server base URL to the image path
          const newImageUrl = `http://localhost:5000${product.imageUrl}`;
          
          const updatedProduct = await prisma.product.update({
            where: { id: product.id },
            data: { imageUrl: newImageUrl }
          });
          
          updatedProducts.push(updatedProduct);
          console.log(`✅ Fixed image URL for "${product.name}": ${newImageUrl}`);
        } else {
          console.log(`ℹ️  Image URL already correct for "${product.name}"`);
          updatedProducts.push(product);
        }
      } else {
        console.log(`⚠️  No image URL found for "${product.name}"`);
        productsWithoutImages.push(product.name);
      }
    }

    console.log('\n🎉 Product image URLs fixed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - ${updatedProducts.length} products with correct image URLs`);
    console.log(`   - ${productsWithoutImages.length} products without images`);

    if (productsWithoutImages.length > 0) {
      console.log('\n⚠️  Products without images:');
      productsWithoutImages.forEach(productName => {
        console.log(`   - ${productName}`);
      });
    }

    console.log('\n🖼️  Sample products with fixed URLs:');
    updatedProducts.slice(0, 5).forEach(product => {
      console.log(`   - ${product.name}: ${product.imageUrl}`);
    });

  } catch (error) {
    console.error('❌ Error fixing image URLs:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixImageUrls();































