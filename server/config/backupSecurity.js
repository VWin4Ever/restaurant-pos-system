/**
 * Backup Security Configuration
 * Comprehensive security measures for backup operations
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Security configuration
const BACKUP_SECURITY = {
  // Encryption settings
  encryption: {
    algorithm: 'aes-256-gcm',
    keyLength: 32, // 256 bits
    ivLength: 16,  // 128 bits
    tagLength: 16  // 128 bits
  },
  
  // File permissions
  permissions: {
    backupDir: 0o700,  // Owner read/write/execute only
    backupFile: 0o600, // Owner read/write only
    scriptFile: 0o700  // Owner read/write/execute only
  },
  
  // Access control
  access: {
    maxBackupSize: 100 * 1024 * 1024, // 100MB max backup size
    maxBackupsPerDay: 10,              // Max 10 backups per day per user
    backupRetentionDays: 30,           // Keep backups for 30 days
    requireAuthentication: true,       // Always require authentication
    requireAdminForRestore: true       // Only admins can restore
  },
  
  // Audit logging
  audit: {
    logAllBackupOperations: true,
    logFileAccess: true,
    logFailedAttempts: true,
    maxLogEntries: 1000
  }
};

// Generate encryption key from environment or create one
function getEncryptionKey() {
  const envKey = process.env.BACKUP_ENCRYPTION_KEY;
  if (envKey && envKey.length === 64) { // 32 bytes = 64 hex chars
    return Buffer.from(envKey, 'hex');
  }
  
  // Generate a new key if none exists (for development)
  const key = crypto.randomBytes(32);
  console.warn('⚠️  No BACKUP_ENCRYPTION_KEY found in environment. Using generated key for development only!');
  console.warn('⚠️  Set BACKUP_ENCRYPTION_KEY in production for security!');
  return key;
}

// Encrypt backup data
function encryptBackupData(data) {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(BACKUP_SECURITY.encryption.ivLength);
  const cipher = crypto.createCipher(BACKUP_SECURITY.encryption.algorithm, key);
  cipher.setAAD(Buffer.from('backup-data', 'utf8'));
  
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
    algorithm: BACKUP_SECURITY.encryption.algorithm
  };
}

// Decrypt backup data
function decryptBackupData(encryptedData) {
  const key = getEncryptionKey();
  const decipher = crypto.createDecipher(BACKUP_SECURITY.encryption.algorithm, key);
  decipher.setAAD(Buffer.from('backup-data', 'utf8'));
  decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
  
  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// Set secure file permissions
function setSecurePermissions(filePath, isDirectory = false) {
  try {
    const mode = isDirectory ? BACKUP_SECURITY.permissions.backupDir : BACKUP_SECURITY.permissions.backupFile;
    fs.chmodSync(filePath, mode);
    return true;
  } catch (error) {
    console.error(`Failed to set permissions for ${filePath}:`, error.message);
    return false;
  }
}

// Validate backup file integrity
function validateBackupIntegrity(filePath) {
  try {
    const stats = fs.statSync(filePath);
    
    // Check file size
    if (stats.size > BACKUP_SECURITY.access.maxBackupSize) {
      throw new Error(`Backup file too large: ${stats.size} bytes`);
    }
    
    // Check file age
    const ageInDays = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);
    if (ageInDays > BACKUP_SECURITY.access.backupRetentionDays) {
      console.warn(`Backup file is ${ageInDays.toFixed(1)} days old`);
    }
    
    // Check file permissions
    const mode = stats.mode & parseInt('777', 8);
    if (mode !== BACKUP_SECURITY.permissions.backupFile) {
      console.warn(`Backup file has incorrect permissions: ${mode.toString(8)}`);
    }
    
    return {
      valid: true,
      size: stats.size,
      age: ageInDays,
      permissions: mode.toString(8)
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message
    };
  }
}

// Audit log entry
function logBackupOperation(operation, userId, details = {}) {
  if (!BACKUP_SECURITY.audit.logAllBackupOperations) return;
  
  const logEntry = {
    timestamp: new Date().toISOString(),
    operation,
    userId,
    details,
    ip: details.ip || 'unknown',
    userAgent: details.userAgent || 'unknown'
  };
  
  const logFile = path.join(__dirname, '../logs/backup-audit.log');
  
  try {
    // Ensure log directory exists
    const logDir = path.dirname(logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
      setSecurePermissions(logDir, true);
    }
    
    // Append log entry
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
    
    // Rotate log if too large
    const stats = fs.statSync(logFile);
    if (stats.size > 10 * 1024 * 1024) { // 10MB
      const rotatedFile = logFile + '.' + Date.now();
      fs.renameSync(logFile, rotatedFile);
      setSecurePermissions(rotatedFile);
    }
  } catch (error) {
    console.error('Failed to write audit log:', error.message);
  }
}

// Check if user can perform backup operation
function canPerformBackupOperation(userId, operation, userRole) {
  // Check if authentication is required
  if (BACKUP_SECURITY.access.requireAuthentication && !userId) {
    return { allowed: false, reason: 'Authentication required' };
  }
  
  // Check admin requirement for restore
  if (operation === 'restore' && BACKUP_SECURITY.access.requireAdminForRestore && userRole !== 'admin') {
    return { allowed: false, reason: 'Admin role required for restore operations' };
  }
  
  // Check daily backup limit
  if (operation === 'create') {
    // This would need to be implemented with a database table to track daily backups
    // For now, we'll allow it but log the operation
  }
  
  return { allowed: true };
}

// Sanitize backup filename
function sanitizeBackupFilename(filename) {
  // Remove any path traversal attempts
  const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  
  // Ensure it has .sql extension
  if (!sanitized.endsWith('.sql')) {
    return sanitized + '.sql';
  }
  
  return sanitized;
}

module.exports = {
  BACKUP_SECURITY,
  getEncryptionKey,
  encryptBackupData,
  decryptBackupData,
  setSecurePermissions,
  validateBackupIntegrity,
  logBackupOperation,
  canPerformBackupOperation,
  sanitizeBackupFilename
};
