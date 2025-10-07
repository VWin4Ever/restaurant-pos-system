#!/usr/bin/env node

/**
 * Database Restore Script for Restaurant POS System
 * Restores MySQL database from backup files
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
require('dotenv').config();

const BACKUP_DIR = path.join(__dirname, '../backups');

function listBackups() {
  if (!fs.existsSync(BACKUP_DIR)) {
    console.log('❌ No backup directory found');
    return [];
  }

  const files = fs.readdirSync(BACKUP_DIR)
    .filter(file => file.startsWith('backup-') && file.endsWith('.sql'))
    .map(file => ({
      name: file,
      path: path.join(BACKUP_DIR, file),
      time: fs.statSync(path.join(BACKUP_DIR, file)).mtime,
      size: fs.statSync(path.join(BACKUP_DIR, file)).size
    }))
    .sort((a, b) => b.time - a.time);

  return files;
}

function displayBackups(backups) {
  console.log('\n📋 Available Backups:');
  console.log('─'.repeat(80));
  backups.forEach((backup, index) => {
    const size = (backup.size / 1024 / 1024).toFixed(2);
    const date = backup.time.toLocaleString();
    console.log(`${index + 1}. ${backup.name}`);
    console.log(`   📅 Date: ${date}`);
    console.log(`   📊 Size: ${size} MB`);
    console.log('');
  });
}

async function askForConfirmation(message) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(`${message} (y/N): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

async function restoreDatabase(backupFile) {
  // Parse DATABASE_URL to get connection details
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌ DATABASE_URL not found in environment variables');
    process.exit(1);
  }

  const url = new URL(dbUrl);
  const host = url.hostname;
  const port = url.port || 3306;
  const user = url.username;
  const password = url.password;
  const database = url.pathname.substring(1);

  console.log(`🔄 Restoring database: ${database}`);
  console.log(`📁 From backup: ${backupFile}`);

  const mysqlCommand = `mysql -h ${host} -P ${port} -u ${user} -p${password} ${database} < "${backupFile}"`;

  return new Promise((resolve, reject) => {
    exec(mysqlCommand, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Restore failed:', error.message);
        reject(error);
        return;
      }

      if (stderr && !stderr.includes('Warning')) {
        console.error('❌ Restore warning:', stderr);
      }

      console.log('✅ Database restored successfully');
      resolve();
    });
  });
}

async function main() {
  try {
    console.log('🚀 Starting database restore process...');
    
    const backups = listBackups();
    
    if (backups.length === 0) {
      console.log('❌ No backup files found');
      process.exit(1);
    }

    displayBackups(backups);

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const selectedIndex = await new Promise((resolve) => {
      rl.question(`\nSelect backup to restore (1-${backups.length}): `, (answer) => {
        rl.close();
        const index = parseInt(answer) - 1;
        if (index >= 0 && index < backups.length) {
          resolve(index);
        } else {
          console.log('❌ Invalid selection');
          process.exit(1);
        }
      });
    });

    const selectedBackup = backups[selectedIndex];
    
    console.log(`\n📋 Selected backup: ${selectedBackup.name}`);
    console.log(`📅 Date: ${selectedBackup.time.toLocaleString()}`);
    console.log(`📊 Size: ${(selectedBackup.size / 1024 / 1024).toFixed(2)} MB`);

    const confirmed = await askForConfirmation('\n⚠️  WARNING: This will overwrite the current database. Continue?');
    
    if (!confirmed) {
      console.log('❌ Restore cancelled');
      process.exit(0);
    }

    await restoreDatabase(selectedBackup.path);
    
    console.log('✅ Restore process completed successfully');
    console.log('💡 You may need to restart your application server');
    
  } catch (error) {
    console.error('❌ Restore process failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { restoreDatabase, listBackups };


















