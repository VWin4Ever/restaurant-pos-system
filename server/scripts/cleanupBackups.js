#!/usr/bin/env node

/**
 * Cleanup Script for Excessive Backup Files
 * This script removes old backup files that were created due to the backup spam issue
 */

const fs = require('fs');
const path = require('path');

const BACKUP_DIR = path.join(__dirname, '../backups');

function cleanupBackups() {
  try {
    console.log('🧹 Starting backup cleanup...');
    
    if (!fs.existsSync(BACKUP_DIR)) {
      console.log('📁 No backup directory found');
      return;
    }
    
    const files = fs.readdirSync(BACKUP_DIR);
    console.log(`📊 Found ${files.length} backup files`);
    
    if (files.length === 0) {
      console.log('✅ No files to clean up');
      return;
    }
    
    // Keep only the 5 most recent backup files
    const backupFiles = files
      .filter(file => file.startsWith('backup-') && file.endsWith('.sql'))
      .map(file => ({
        name: file,
        path: path.join(BACKUP_DIR, file),
        stats: fs.statSync(path.join(BACKUP_DIR, file))
      }))
      .sort((a, b) => b.stats.mtime - a.stats.mtime); // Sort by modification time, newest first
    
    const filesToKeep = 5;
    const filesToDelete = backupFiles.slice(filesToKeep);
    
    console.log(`🗑️ Deleting ${filesToDelete.length} old backup files...`);
    
    let deletedCount = 0;
    let errorCount = 0;
    
    for (const file of filesToDelete) {
      try {
        fs.unlinkSync(file.path);
        deletedCount++;
        if (deletedCount % 100 === 0) {
          console.log(`🗑️ Deleted ${deletedCount} files...`);
        }
      } catch (error) {
        errorCount++;
        console.error(`❌ Failed to delete ${file.name}: ${error.message}`);
      }
    }
    
    console.log(`✅ Cleanup completed: ${deletedCount} files deleted, ${errorCount} errors`);
    console.log(`📊 Kept ${Math.min(backupFiles.length, filesToKeep)} most recent backup files`);
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  }
}

// Run cleanup
cleanupBackups();
