#!/usr/bin/env node

/**
 * Cleanup Empty Backup Files Script
 * Removes all empty backup files from the backup directory
 */

const fs = require('fs');
const path = require('path');
const { getBackupDirectory } = require('../config/backupConfig');

async function cleanupEmptyBackups() {
  try {
    // Use the actual server/backups directory instead of the configured one
    const backupDir = path.join(__dirname, '../backups');
    console.log(`🧹 Cleaning up empty backup files in: ${backupDir}`);
    
    if (!fs.existsSync(backupDir)) {
      console.log('📁 Backup directory does not exist');
      return;
    }
    
    const files = fs.readdirSync(backupDir);
    let emptyFilesCount = 0;
    let totalSize = 0;
    
    for (const file of files) {
      if (file.startsWith('backup-') && file.endsWith('.sql')) {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.size === 0) {
          console.log(`🗑️  Removing empty file: ${file}`);
          fs.unlinkSync(filePath);
          emptyFilesCount++;
        } else {
          totalSize += stats.size;
        }
      }
    }
    
    console.log(`✅ Cleanup completed!`);
    console.log(`🗑️  Removed ${emptyFilesCount} empty backup files`);
    console.log(`📊 Remaining backups total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    
    // List remaining backup files
    const remainingFiles = fs.readdirSync(backupDir)
      .filter(file => file.startsWith('backup-') && file.endsWith('.sql'))
      .sort((a, b) => {
        const statA = fs.statSync(path.join(backupDir, a));
        const statB = fs.statSync(path.join(backupDir, b));
        return statB.mtime - statA.mtime;
      });
    
    if (remainingFiles.length > 0) {
      console.log(`📋 Remaining backup files (${remainingFiles.length}):`);
      remainingFiles.slice(0, 5).forEach(file => {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        const size = (stats.size / 1024).toFixed(2);
        const date = stats.mtime.toISOString();
        console.log(`   📄 ${file} (${size} KB) - ${date}`);
      });
      
      if (remainingFiles.length > 5) {
        console.log(`   ... and ${remainingFiles.length - 5} more files`);
      }
    } else {
      console.log('📋 No backup files remaining');
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  cleanupEmptyBackups();
}

module.exports = { cleanupEmptyBackups };
