const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupIncorrectStockRecords() {
  try {
    console.log('🔍 Checking for products with incorrect stock records...');

    // Find all products that have stock records but shouldn't (based on common patterns)
    const productsWithStock = await prisma.product.findMany({
      where: {
        stock: {
          isNot: null
        }
      },
      include: {
        stock: true
      },
      select: {
        id: true,
        name: true,
        productId: true,
        isDrink: true,
        stock: {
          select: {
            id: true,
            quantity: true
          }
        }
      }
    });

    console.log(`📊 Found ${productsWithStock.length} products with stock records`);

    // Define patterns for products that shouldn't have stock records
    const noStockPatterns = [
      /coffee/i,
      /tea/i,
      /juice/i,
      /smoothie/i,
      /cocktail/i,
      /fresh/i,
      /hot/i,
      /cold/i,
      /prepared/i,
      /made to order/i
    ];

    const productsToCleanup = productsWithStock.filter(product => {
      return noStockPatterns.some(pattern => pattern.test(product.name));
    });

    console.log(`🧹 Found ${productsToCleanup.length} products that should not have stock records:`);
    productsToCleanup.forEach(product => {
      console.log(`  - ${product.productId}: ${product.name} (Stock ID: ${product.stock.id}, Qty: ${product.stock.quantity})`);
    });

    if (productsToCleanup.length === 0) {
      console.log('✅ No products need cleanup!');
      return;
    }

    // Ask for confirmation (in a real scenario, you might want to add a confirmation prompt)
    console.log('\n⚠️  This will delete stock records for the above products.');
    console.log('   Only proceed if you are sure these products should not have stock tracking.');

    // Delete stock records for products that shouldn't have them
    const deletedStockRecords = [];
    
    for (const product of productsToCleanup) {
      try {
        // Delete the stock record
        await prisma.stock.delete({
          where: { id: product.stock.id }
        });

        // Also delete any associated stock logs
        await prisma.stockLog.deleteMany({
          where: { stockId: product.stock.id }
        });

        deletedStockRecords.push({
          productId: product.productId,
          productName: product.name,
          stockId: product.stock.id
        });

        console.log(`✅ Deleted stock record for ${product.productId} - ${product.name}`);
      } catch (error) {
        console.error(`❌ Failed to delete stock record for ${product.productId} - ${product.name}:`, error.message);
      }
    }

    console.log(`\n🎉 Successfully cleaned up ${deletedStockRecords.length} stock records!`);
    console.log('\n📋 Deleted stock records:');
    deletedStockRecords.forEach(record => {
      console.log(`  - ${record.productId}: ${record.productName} (Stock ID: ${record.stockId})`);
    });

    console.log('\n💡 Going forward, use the "Need Stock" checkbox when creating products to control stock tracking.');

  } catch (error) {
    console.error('❌ Error cleaning up stock records:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupIncorrectStockRecords();


