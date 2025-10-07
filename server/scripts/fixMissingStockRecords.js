const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixMissingStockRecords() {
  try {
    console.log('🔍 Checking for drink products without stock records...');

    // Find all drink products that don't have stock records
    const drinksWithoutStock = await prisma.product.findMany({
      where: {
        isDrink: true,
        stock: null
      },
      select: {
        id: true,
        name: true,
        productId: true
      }
    });

    console.log(`📊 Found ${drinksWithoutStock.length} drink products without stock records`);

    if (drinksWithoutStock.length === 0) {
      console.log('✅ All drink products already have stock records!');
      return;
    }

    // Create stock records for drinks without stock
    const createdStockRecords = [];
    
    for (const drink of drinksWithoutStock) {
      try {
        const stockRecord = await prisma.stock.create({
          data: {
            productId: drink.id,
            quantity: 0,
            minStock: 10
          }
        });

        createdStockRecords.push({
          productId: drink.productId,
          productName: drink.name,
          stockId: stockRecord.id
        });

        console.log(`✅ Created stock record for ${drink.productId} - ${drink.name}`);
      } catch (error) {
        console.error(`❌ Failed to create stock record for ${drink.productId} - ${drink.name}:`, error.message);
      }
    }

    console.log(`\n🎉 Successfully created ${createdStockRecords.length} stock records!`);
    console.log('\n📋 Created stock records:');
    createdStockRecords.forEach(record => {
      console.log(`  - ${record.productId}: ${record.productName} (Stock ID: ${record.stockId})`);
    });

  } catch (error) {
    console.error('❌ Error fixing missing stock records:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixMissingStockRecords();


