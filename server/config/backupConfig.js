/**
 * Backup Configuration
 * Centralized configuration for backup storage locations and settings
 */

const path = require('path');
const os = require('os');

// Default backup configurations
const BACKUP_CONFIG = {
  // Default backup directory (can be overridden by environment variables)
  defaultDir: 'C:\\xampp\\htdocs\\Theory\\PosRes1\\backups',
  
  // Custom backup locations
  customLocations: {
    // Project backups folder (default)
    project: 'C:\\xampp\\htdocs\\Theory\\PosRes1\\backups',
    
    // Desktop backup folder
    desktop: path.join(os.homedir(), 'Desktop', 'POS-Backups'),
    
    // Documents backup folder
    documents: path.join(os.homedir(), 'Documents', 'POS-Backups'),
    
    // Custom folder (you can change this path)
    custom: 'C:\\POS-Backups', // Change this to your preferred location
    
    // Downloads folder
    downloads: path.join(os.homedir(), 'Downloads', 'POS-Backups')
  },
  
  // Backup settings
  settings: {
    maxBackups: 30, // Keep last 30 backups
    filePrefix: 'pos-backup',
    fileExtension: '.sql',
    includeTimestamp: true
  }
};

// Get backup directory from environment or use default
function getBackupDirectory() {
  // Check for environment variable first
  if (process.env.BACKUP_DIR) {
    return process.env.BACKUP_DIR;
  }
  
  // Check for backup location setting
  if (process.env.BACKUP_LOCATION) {
    const location = process.env.BACKUP_LOCATION.toLowerCase();
    if (BACKUP_CONFIG.customLocations[location]) {
      return BACKUP_CONFIG.customLocations[location];
    }
  }
  
  // Default to server/backups directory
  return BACKUP_CONFIG.defaultDir;
}

// Get backup file name with timestamp
function getBackupFileName() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const prefix = BACKUP_CONFIG.settings.filePrefix;
  const extension = BACKUP_CONFIG.settings.fileExtension;
  
  return `${prefix}-${timestamp}${extension}`;
}

// Ensure backup directory exists
function ensureBackupDirectory(dirPath) {
  const fs = require('fs');
  
  if (!fs.existsSync(dirPath)) {
    try {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`📁 Created backup directory: ${dirPath}`);
    } catch (error) {
      console.error(`❌ Failed to create backup directory: ${error.message}`);
      throw error;
    }
  }
  
  return dirPath;
}

module.exports = {
  BACKUP_CONFIG,
  getBackupDirectory,
  getBackupFileName,
  ensureBackupDirectory
};
