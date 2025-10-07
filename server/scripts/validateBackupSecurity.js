#!/usr/bin/env node

/**
 * Backup Security Validation Script
 * Validates backup security configuration and file permissions
 */

const fs = require('fs');
const path = require('path');
const { 
  BACKUP_SECURITY, 
  validateBackupIntegrity,
  setSecurePermissions 
} = require('../config/backupSecurity');
const { getBackupDirectory } = require('../config/backupConfig');

function validateBackupSecurity() {
  console.log('🔒 Backup Security Validation');
  console.log('============================\n');
  
  let issues = [];
  let warnings = [];
  
  // 1. Check backup directory permissions
  console.log('📁 Checking backup directory...');
  const backupDir = getBackupDirectory();
  
  if (!fs.existsSync(backupDir)) {
    issues.push(`Backup directory does not exist: ${backupDir}`);
  } else {
    const stats = fs.statSync(backupDir);
    const mode = stats.mode & parseInt('777', 8);
    const expectedMode = BACKUP_SECURITY.permissions.backupDir;
    
    if (mode !== expectedMode) {
      issues.push(`Backup directory has incorrect permissions: ${mode.toString(8)} (expected: ${expectedMode.toString(8)})`);
    } else {
      console.log(`✅ Backup directory permissions: ${mode.toString(8)}`);
    }
  }
  
  // 2. Check backup files
  console.log('\n📄 Checking backup files...');
  if (fs.existsSync(backupDir)) {
    const files = fs.readdirSync(backupDir)
      .filter(file => file.endsWith('.sql'));
    
    if (files.length === 0) {
      warnings.push('No backup files found');
    } else {
      console.log(`Found ${files.length} backup files`);
      
      files.forEach(file => {
        const filePath = path.join(backupDir, file);
        const validation = validateBackupIntegrity(filePath);
        
        if (!validation.valid) {
          issues.push(`Backup file ${file}: ${validation.error}`);
        } else {
          console.log(`✅ ${file}: ${validation.size} bytes, ${validation.age.toFixed(1)} days old`);
          
          // Check for old backups
          if (validation.age > BACKUP_SECURITY.access.backupRetentionDays) {
            warnings.push(`Backup file ${file} is ${validation.age.toFixed(1)} days old (retention: ${BACKUP_SECURITY.access.backupRetentionDays} days)`);
          }
        }
      });
    }
  }
  
  // 3. Check environment variables
  console.log('\n🔑 Checking environment variables...');
  const encryptionKey = process.env.BACKUP_ENCRYPTION_KEY;
  
  if (!encryptionKey) {
    warnings.push('BACKUP_ENCRYPTION_KEY not set - using generated key (development only)');
  } else if (encryptionKey.length !== 64) {
    issues.push('BACKUP_ENCRYPTION_KEY must be 64 characters (32 bytes in hex)');
  } else {
    console.log('✅ BACKUP_ENCRYPTION_KEY is configured');
  }
  
  // 4. Check log directory
  console.log('\n📝 Checking audit logs...');
  const logDir = path.join(__dirname, '../logs');
  const logFile = path.join(logDir, 'backup-audit.log');
  
  if (!fs.existsSync(logDir)) {
    warnings.push('Audit log directory does not exist');
  } else {
    console.log('✅ Audit log directory exists');
    
    if (fs.existsSync(logFile)) {
      const stats = fs.statSync(logFile);
      console.log(`✅ Audit log file: ${(stats.size / 1024).toFixed(2)} KB`);
    } else {
      warnings.push('No audit log file found');
    }
  }
  
  // 5. Check security configuration
  console.log('\n⚙️ Checking security configuration...');
  console.log(`Max backup size: ${(BACKUP_SECURITY.access.maxBackupSize / 1024 / 1024).toFixed(0)} MB`);
  console.log(`Retention days: ${BACKUP_SECURITY.access.backupRetentionDays}`);
  console.log(`Require authentication: ${BACKUP_SECURITY.access.requireAuthentication}`);
  console.log(`Admin required for restore: ${BACKUP_SECURITY.access.requireAdminForRestore}`);
  
  // 6. Summary
  console.log('\n📊 Security Validation Summary');
  console.log('==============================');
  
  if (issues.length === 0 && warnings.length === 0) {
    console.log('✅ All security checks passed!');
    return true;
  }
  
  if (issues.length > 0) {
    console.log('❌ Security Issues Found:');
    issues.forEach(issue => console.log(`  - ${issue}`));
  }
  
  if (warnings.length > 0) {
    console.log('\n⚠️ Security Warnings:');
    warnings.forEach(warning => console.log(`  - ${warning}`));
  }
  
  console.log('\n💡 Recommendations:');
  console.log('  - Set BACKUP_ENCRYPTION_KEY environment variable');
  console.log('  - Review and fix file permissions');
  console.log('  - Clean up old backup files');
  console.log('  - Monitor audit logs regularly');
  
  return issues.length === 0;
}

// Auto-fix function
function autoFixSecurity() {
  console.log('\n🔧 Attempting to auto-fix security issues...');
  
  const backupDir = getBackupDirectory();
  
  // Fix directory permissions
  if (fs.existsSync(backupDir)) {
    try {
      setSecurePermissions(backupDir, true);
      console.log('✅ Fixed backup directory permissions');
    } catch (error) {
      console.log(`❌ Failed to fix directory permissions: ${error.message}`);
    }
  }
  
  // Fix file permissions
  if (fs.existsSync(backupDir)) {
    const files = fs.readdirSync(backupDir)
      .filter(file => file.endsWith('.sql'));
    
    files.forEach(file => {
      const filePath = path.join(backupDir, file);
      try {
        setSecurePermissions(filePath);
        console.log(`✅ Fixed permissions for ${file}`);
      } catch (error) {
        console.log(`❌ Failed to fix permissions for ${file}: ${error.message}`);
      }
    });
  }
  
  // Create log directory
  const logDir = path.join(__dirname, '../logs');
  if (!fs.existsSync(logDir)) {
    try {
      fs.mkdirSync(logDir, { recursive: true });
      setSecurePermissions(logDir, true);
      console.log('✅ Created audit log directory');
    } catch (error) {
      console.log(`❌ Failed to create log directory: ${error.message}`);
    }
  }
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--fix')) {
    autoFixSecurity();
  }
  
  const isValid = validateBackupSecurity();
  process.exit(isValid ? 0 : 1);
}

module.exports = { validateBackupSecurity, autoFixSecurity };
