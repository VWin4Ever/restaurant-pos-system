const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedShifts() {
  try {
    console.log('🌱 Seeding default shifts...');

    // Check if shifts already exist
    const existingShifts = await prisma.shift.findMany();
    if (existingShifts.length > 0) {
      console.log('✅ Shifts already exist, skipping seed');
      return;
    }

    // Create default shifts
    const defaultShifts = [
      {
        name: 'Morning Shift',
        startTime: '07:00',
        endTime: '15:00',
        gracePeriod: 10,
        description: 'Early morning shift for breakfast and lunch service'
      },
      {
        name: 'Afternoon Shift',
        startTime: '15:00',
        endTime: '23:00',
        gracePeriod: 10,
        description: 'Afternoon shift for lunch and dinner service'
      },
      {
        name: 'Night Shift',
        startTime: '23:00',
        endTime: '07:00',
        gracePeriod: 15,
        description: 'Overnight shift for late night service and closing'
      }
    ];

    for (const shiftData of defaultShifts) {
      const shift = await prisma.shift.create({
        data: shiftData
      });
      console.log(`✅ Created shift: ${shift.name} (${shift.startTime} - ${shift.endTime})`);
    }

    console.log('🎉 Default shifts seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding shifts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
if (require.main === module) {
  seedShifts();
}

module.exports = { seedShifts };


