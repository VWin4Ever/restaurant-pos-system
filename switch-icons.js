#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const iconPath = path.join(__dirname, 'client/src/components/common/Icon.js');
const customIconPath = path.join(__dirname, 'client/src/components/common/CustomIcon.js');
const backupPath = path.join(__dirname, 'client/src/components/common/Icon.js.backup');

function switchToCustomIcons() {
  try {
    // Backup original Icon.js if it doesn't exist
    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(iconPath, backupPath);
      console.log('✅ Backed up original Icon.js');
    }
    
    // Replace Icon.js with CustomIcon.js
    fs.copyFileSync(customIconPath, iconPath);
    console.log('✅ Switched to custom icons!');
    console.log('📁 Add your icon files to: client/public/icons/');
    console.log('🔄 To switch back: node switch-icons.js --default');
    
  } catch (error) {
    console.error('❌ Error switching to custom icons:', error.message);
  }
}

function switchToDefaultIcons() {
  try {
    if (!fs.existsSync(backupPath)) {
      console.log('❌ No backup found. Cannot switch to default icons.');
      return;
    }
    
    // Restore original Icon.js
    fs.copyFileSync(backupPath, iconPath);
    console.log('✅ Switched back to default icons!');
    
  } catch (error) {
    console.error('❌ Error switching to default icons:', error.message);
  }
}

function showStatus() {
  try {
    const iconContent = fs.readFileSync(iconPath, 'utf8');
    const isCustom = iconContent.includes('customIcons');
    
    console.log('📊 Current Icon Status:');
    console.log(isCustom ? '🎨 Using Custom Icons' : '🔧 Using Default Icons');
    console.log('');
    console.log('Available commands:');
    console.log('  node switch-icons.js --custom   (switch to custom icons)');
    console.log('  node switch-icons.js --default  (switch to default icons)');
    console.log('  node switch-icons.js --status   (show current status)');
    
  } catch (error) {
    console.error('❌ Error reading icon status:', error.message);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case '--custom':
    switchToCustomIcons();
    break;
  case '--default':
    switchToDefaultIcons();
    break;
  case '--status':
    showStatus();
    break;
  default:
    console.log('🎨 Icon Switcher Tool');
    console.log('');
    showStatus();
    break;
}



