#!/usr/bin/env node

/**
 * Database Backup Script for Restaurant POS System
 * Creates MySQL database dumps for backup purposes
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { 
  getBackupDirectory, 
  getBackupFileName, 
  ensureBackupDirectory,
  BACKUP_CONFIG 
} = require('../config/backupConfig');

const BACKUP_DIR = getBackupDirectory();
const MAX_BACKUPS = BACKUP_CONFIG.settings.maxBackups;

// Ensure backup directory exists
ensureBackupDirectory(BACKUP_DIR);

async function createBackup() {
  const backupFileName = getBackupFileName();
  const backupFile = path.join(BACKUP_DIR, backupFileName);
  
  // Parse DATABASE_URL to get connection details
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌ DATABASE_URL not found in environment variables');
    process.exit(1);
  }

  // Extract connection details from DATABASE_URL
  // Format: mysql://username:password@host:port/database
  const url = new URL(dbUrl);
  const host = url.hostname;
  const port = url.port || 3306;
  const user = url.username;
  const password = url.password;
  const database = url.pathname.substring(1);

  console.log(`🔄 Creating backup for database: ${database}`);
  console.log(`📁 Backup file: ${backupFile}`);

  // Use fast, simple mysqldump command for local MySQL
  const mysqldumpCommand = `mysqldump -u root --single-transaction --add-drop-table --quick --extended-insert ${database} > "${backupFile}"`;

  return new Promise((resolve, reject) => {
    exec(mysqldumpCommand, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Backup failed:', error.message);
        console.error('❌ Full error:', error);
        
        // Remove empty backup file if it was created
        if (fs.existsSync(backupFile)) {
          fs.unlinkSync(backupFile);
          console.log('🗑️  Removed empty backup file');
        }
        
        reject(error);
        return;
      }

      if (stderr && !stderr.includes('Warning')) {
        console.error('❌ Backup warning:', stderr);
      }

      // Check if backup file was created and has content
      if (fs.existsSync(backupFile)) {
        const stats = fs.statSync(backupFile);
        if (stats.size > 0) {
          console.log(`✅ Backup created successfully: ${backupFile}`);
          console.log(`📊 Backup size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
          resolve(backupFile);
        } else {
          console.error('❌ Backup file is empty - removing it');
          fs.unlinkSync(backupFile);
          reject(new Error('Backup file is empty - database may not exist or be accessible'));
        }
      } else {
        console.error('❌ Backup file was not created');
        reject(new Error('Backup file was not created'));
      }
    });
  });
}

async function cleanupOldBackups() {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith('backup-') && file.endsWith('.sql'))
      .map(file => ({
        name: file,
        path: path.join(BACKUP_DIR, file),
        time: fs.statSync(path.join(BACKUP_DIR, file)).mtime
      }))
      .sort((a, b) => b.time - a.time);

    if (files.length > MAX_BACKUPS) {
      const filesToDelete = files.slice(MAX_BACKUPS);
      console.log(`🧹 Cleaning up ${filesToDelete.length} old backup(s)`);
      
      for (const file of filesToDelete) {
        fs.unlinkSync(file.path);
        console.log(`🗑️  Deleted: ${file.name}`);
      }
    }
  } catch (error) {
    console.error('⚠️  Error during cleanup:', error.message);
  }
}

async function main() {
  try {
    console.log('🚀 Starting database backup process...');
    
    await createBackup();
    await cleanupOldBackups();
    
    console.log('✅ Backup process completed successfully');
  } catch (error) {
    console.error('❌ Backup process failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { createBackup, cleanupOldBackups };










