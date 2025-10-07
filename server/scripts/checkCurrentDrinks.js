const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCurrentDrinks() {
  try {
    console.log('🔍 Checking current drink products...');

    const drinks = await prisma.product.findMany({
      where: { isDrink: true },
      select: {
        productId: true,
        name: true,
        stock: {
          select: {
            id: true,
            quantity: true
          }
        }
      }
    });

    console.log(`📊 Found ${drinks.length} drink products:`);
    console.log('\n📋 Drink Products:');
    drinks.forEach(drink => {
      const hasStock = drink.stock ? '✅ Has Stock' : '❌ No Stock';
      console.log(`  - ${drink.productId}: ${drink.name} (${hasStock})`);
    });

  } catch (error) {
    console.error('❌ Error checking drinks:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCurrentDrinks();


