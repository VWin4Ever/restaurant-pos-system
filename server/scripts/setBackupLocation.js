#!/usr/bin/env node

/**
 * Set Backup Location Script
 * Helps configure where backup files are stored
 */

const { BACKUP_CONFIG } = require('../config/backupConfig');
const path = require('path');

console.log('📁 Current Backup Configuration:');
console.log('================================');

console.log('\n🎯 Available Backup Locations:');
Object.entries(BACKUP_CONFIG.customLocations).forEach(([key, location]) => {
  console.log(`  ${key.toUpperCase().padEnd(12)}: ${location}`);
});

console.log('\n⚙️  How to Set Backup Location:');
console.log('==============================');

console.log('\n1. Using Environment Variable:');
console.log('   Set BACKUP_DIR environment variable to your desired path');
console.log('   Example: BACKUP_DIR="C:\\MyBackups"');

console.log('\n2. Using Location Name:');
console.log('   Set BACKUP_LOCATION environment variable to one of:');
Object.keys(BACKUP_CONFIG.customLocations).forEach(key => {
  console.log(`   - ${key}`);
});

console.log('\n3. Current Settings:');
console.log(`   Max Backups: ${BACKUP_CONFIG.settings.maxBackups}`);
console.log(`   File Prefix: ${BACKUP_CONFIG.settings.filePrefix}`);
console.log(`   File Extension: ${BACKUP_CONFIG.settings.fileExtension}`);

console.log('\n💡 Examples:');
console.log('============');
console.log('To save backups to Desktop:');
console.log('  BACKUP_LOCATION=desktop npm run dev');

console.log('\nTo save backups to Documents:');
console.log('  BACKUP_LOCATION=documents npm run dev');

console.log('\nTo save backups to custom folder:');
console.log('  BACKUP_DIR="D:\\Restaurant-Backups" npm run dev');

console.log('\n🔧 To change the custom location permanently:');
console.log('Edit server/config/backupConfig.js and change the "custom" path');
console.log(`Current custom path: ${BACKUP_CONFIG.customLocations.custom}`);
