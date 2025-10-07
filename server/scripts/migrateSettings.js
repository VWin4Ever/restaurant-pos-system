const { PrismaClient } = require('@prisma/client');
const DEFAULT_SETTINGS = require('../config/settingsDefaults');

async function migrateSettings() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🚀 Starting Settings Migration...');
    
    // Get existing settings
    const existingSettings = await prisma.settings.findMany();
    const existingCategories = existingSettings.map(setting => setting.category);
    
    console.log(`📋 Existing categories: ${existingCategories.join(', ') || 'None'}`);
    
    // Define all required categories
    const allCategories = Object.keys(DEFAULT_SETTINGS);
    const missingCategories = allCategories.filter(category => !existingCategories.includes(category));
    
    if (missingCategories.length === 0) {
      console.log('✅ All settings categories already exist!');
      return { success: true, message: 'All settings already initialized' };
    }
    
    console.log(`🆕 Missing categories: ${missingCategories.join(', ')}`);
    
    // Create missing categories with defaults
    const createPromises = missingCategories.map(category => 
      prisma.settings.create({
        data: {
          category,
          data: JSON.stringify(DEFAULT_SETTINGS[category])
        }
      })
    );
    
    await Promise.all(createPromises);
    
    console.log(`🎉 Successfully created ${missingCategories.length} settings categories!`);
    
    // Verify creation
    const finalSettings = await prisma.settings.findMany();
    console.log('\n📊 Final Settings Status:');
    finalSettings.forEach(setting => {
      const data = JSON.parse(setting.data);
      console.log(`✅ ${setting.category}: ${Object.keys(data).length} settings`);
    });
    
    return { 
      success: true, 
      message: `Initialized ${missingCategories.length} settings categories`,
      initialized: missingCategories 
    };
    
  } catch (error) {
    console.error('❌ Settings migration failed:', error);
    return { success: false, message: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  migrateSettings().then(result => {
    if (result.success) {
      console.log(`\n✅ Migration completed: ${result.message}`);
      process.exit(0);
    } else {
      console.log(`\n❌ Migration failed: ${result.message}`);
      process.exit(1);
    }
  });
}

module.exports = migrateSettings;
