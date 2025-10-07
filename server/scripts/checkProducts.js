require('dotenv').config({ path: './config.env' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkProducts() {
  try {
    console.log('🔍 Checking current products in database...\n');

    const products = await prisma.product.findMany({
      include: { category: true },
      orderBy: [
        { category: { name: 'asc' } },
        { name: 'asc' }
      ]
    });

    console.log('📋 Current products in database:');
    console.log('=====================================');
    
    let currentCategory = '';
    products.forEach(product => {
      if (product.category.name !== currentCategory) {
        currentCategory = product.category.name;
        console.log(`\n📂 ${currentCategory}:`);
      }
      console.log(`   - ${product.name}`);
    });

    console.log('\n📊 Summary:');
    console.log(`   - Total products: ${products.length}`);
    console.log(`   - Categories: ${new Set(products.map(p => p.category.name)).size}`);

  } catch (error) {
    console.error('❌ Error checking products:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProducts();




















