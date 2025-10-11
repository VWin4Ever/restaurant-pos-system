const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearSettings() {
  try {
    console.log('Clearing all settings...');
    await prisma.settings.deleteMany();
    console.log('Settings cleared successfully!');
  } catch (error) {
    console.error('Error clearing settings:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearSettings();






























