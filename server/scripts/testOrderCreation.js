require('dotenv').config({ path: './config.env' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testOrderCreation() {
  try {
    console.log('🔍 Testing order creation...\n');

    // Check if we have tables
    const tables = await prisma.table.findMany();
    console.log(`📋 Tables found: ${tables.length}`);
    if (tables.length === 0) {
      console.log('❌ No tables found. Creating a test table...');
      await prisma.table.create({
        data: {
          number: 1,
          status: 'AVAILABLE',
          capacity: 4
        }
      });
      console.log('✅ Test table created');
    }

    // Check if we have products
    const products = await prisma.product.findMany();
    console.log(`📦 Products found: ${products.length}`);
    if (products.length === 0) {
      console.log('❌ No products found. Cannot test order creation.');
      return;
    }

    // Check if we have users
    const users = await prisma.user.findMany();
    console.log(`👥 Users found: ${users.length}`);
    if (users.length === 0) {
      console.log('❌ No users found. Cannot test order creation.');
      return;
    }

    // Get first available table
    const table = await prisma.table.findFirst({
      where: { status: 'AVAILABLE' }
    });

    if (!table) {
      console.log('❌ No available tables found.');
      return;
    }

    // Get first product
    const product = products[0];

    // Get first user
    const user = users[0];

    console.log(`\n📝 Testing order creation with:`);
    console.log(`   Table: ${table.number} (ID: ${table.id})`);
    console.log(`   Product: ${product.name} (ID: ${product.id})`);
    console.log(`   User: ${user.name} (ID: ${user.id})`);

    // Test order creation
    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber: `TEST-${Date.now()}`,
          tableId: table.id,
          userId: user.id,
          subtotal: product.price,
          tax: 0,
          discount: 0,
          total: product.price,
          status: 'PENDING'
        }
      });

      // Create order item
      await tx.orderItem.create({
        data: {
          orderId: newOrder.id,
          productId: product.id,
          quantity: 1,
          price: product.price,
          subtotal: product.price
        }
      });

      // Update table status
      await tx.table.update({
        where: { id: table.id },
        data: { status: 'OCCUPIED' }
      });

      return newOrder;
    });

    console.log('\n✅ Order created successfully!');
    console.log(`   Order ID: ${order.id}`);
    console.log(`   Order Number: ${order.orderNumber}`);
    console.log(`   Total: $${order.total}`);

    // Clean up - delete the test order and reset table
    await prisma.$transaction(async (tx) => {
      await tx.orderItem.deleteMany({
        where: { orderId: order.id }
      });
      await tx.order.delete({
        where: { id: order.id }
      });
      await tx.table.update({
        where: { id: table.id },
        data: { status: 'AVAILABLE' }
      });
    });

    console.log('\n🧹 Test order cleaned up successfully!');

  } catch (error) {
    console.error('❌ Error testing order creation:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testOrderCreation();































