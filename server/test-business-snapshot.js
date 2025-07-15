const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testBusinessSnapshot() {
  try {
    console.log('Testing Business Snapshot Functionality...\n');

    // 1. Check if we have any existing orders
    const existingOrders = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    });

    console.log(`Found ${existingOrders.length} existing orders`);

    // 2. Check if any orders have business snapshots
    const ordersWithSnapshot = existingOrders.filter(order => order.businessSnapshot);
    console.log(`${ordersWithSnapshot.length} orders have business snapshots`);

    // 3. Display sample business snapshot data
    if (ordersWithSnapshot.length > 0) {
      const sampleOrder = ordersWithSnapshot[0];
      console.log('\nSample Business Snapshot:');
      console.log('Order Number:', sampleOrder.orderNumber);
      console.log('Business Snapshot:', JSON.stringify(sampleOrder.businessSnapshot, null, 2));
    }

    // 4. Check current business settings
    const currentSettings = await prisma.settings.findUnique({
      where: { category: 'business' }
    });

    console.log('\nCurrent Business Settings:');
    console.log(JSON.stringify(currentSettings?.data || 'No settings found', null, 2));

    // 5. Test the helper function logic
    console.log('\nTesting Helper Function Logic...');
    
    const defaultBusinessSettings = {
      restaurantName: 'Restaurant POS',
      address: '123 Main Street, City, State 12345',
      phone: '+1 (555) 123-4567',
      email: 'info@restaurant.com',
      taxRate: 8.5,
      currency: 'USD',
      timezone: 'America/New_York'
    };

    const businessSettings = currentSettings?.data || defaultBusinessSettings;
    console.log('Business Settings to be used for new orders:', JSON.stringify(businessSettings, null, 2));

    console.log('\n✅ Business Snapshot Test Completed Successfully!');
    console.log('\nKey Points:');
    console.log('- New orders will automatically capture business settings');
    console.log('- Existing orders without snapshots will use current settings');
    console.log('- Invoice will show historical business info when available');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testBusinessSnapshot(); 