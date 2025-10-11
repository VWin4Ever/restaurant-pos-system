require('dotenv').config({ path: './config.env' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearData() {
  try {
    console.log('🗑️  Clearing all categories and products...');

    // First, delete all stock records (they reference products)
    console.log('📦 Deleting stock records...');
    await prisma.stockLog.deleteMany({});
    await prisma.stock.deleteMany({});
    console.log('✅ Stock records deleted');

    // Delete all order items (they reference products)
    console.log('🛒 Deleting order items...');
    await prisma.orderItem.deleteMany({});
    console.log('✅ Order items deleted');

    // Delete all products
    console.log('🍽️  Deleting products...');
    await prisma.product.deleteMany({});
    console.log('✅ Products deleted');

    // Delete all categories
    console.log('📂 Deleting categories...');
    await prisma.category.deleteMany({});
    console.log('✅ Categories deleted');

    console.log('\n🎉 All categories and products have been deleted successfully!');
    console.log('\n📊 Summary:');
    console.log('   - All categories deleted');
    console.log('   - All products deleted');
    console.log('   - All stock records deleted');
    console.log('   - All order items deleted');

  } catch (error) {
    console.error('❌ Error clearing data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

clearData();































