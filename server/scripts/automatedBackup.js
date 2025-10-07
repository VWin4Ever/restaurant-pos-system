#!/usr/bin/env node

/**
 * Automated Backup Script for Restaurant POS System
 * Runs scheduled backups and can be used with cron jobs
 */

const { createBackup, cleanupOldBackups } = require('./backupDatabase');
const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '../logs');
const LOG_FILE = path.join(LOG_DIR, 'backup.log');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  
  console.log(message);
  fs.appendFileSync(LOG_FILE, logMessage);
}

async function runAutomatedBackup() {
  try {
    log('🚀 Starting automated backup...');
    
    const backupFile = await createBackup();
    log(`✅ Backup created: ${path.basename(backupFile)}`);
    
    await cleanupOldBackups();
    log('🧹 Old backups cleaned up');
    
    log('✅ Automated backup completed successfully');
    
  } catch (error) {
    log(`❌ Automated backup failed: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runAutomatedBackup();
}

module.exports = { runAutomatedBackup };


















