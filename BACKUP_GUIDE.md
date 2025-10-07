# Backup Guide for Restaurant POS System

## Overview
This guide covers all backup solutions available for the Restaurant POS System, including database backups, application data backups, and automated backup strategies.

## Backup Solutions

### 1. Application-Level Backup (Built-in)
**Endpoint**: `POST /api/settings/backup`

**What it backs up**:
- Users (without passwords)
- Categories
- Products (with stock information)
- Tables
- Orders (with order items and business snapshots)
- Stock logs

**Usage**:
```bash
curl -X POST http://localhost:5000/api/settings/backup \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Database-Level Backup (Recommended)

#### Manual Backup
```bash
cd server
npm run backup
```

#### Automated Backup
```bash
cd server
npm run backup:auto
```

#### Restore Database
```bash
cd server
npm run restore
```

### 3. MySQL Native Backup
```bash
# Create backup
mysqldump -h localhost -u username -p database_name > backup.sql

# Restore backup
mysql -h localhost -u username -p database_name < backup.sql
```

## Backup Strategies

### 1. **Daily Automated Backups**
Set up a cron job to run daily backups:

```bash
# Edit crontab
crontab -e

# Add this line for daily backup at 2 AM
0 2 * * * cd /path/to/your/server && npm run backup:auto
```

### 2. **Before Major Updates**
Always backup before:
- System updates
- Database migrations
- Configuration changes
- Deployments

### 3. **Weekly Full Backups**
- Database backup
- Application files backup
- Configuration files backup

## Backup Locations

### Database Backups
- **Location**: `server/backups/`
- **Format**: `backup-YYYY-MM-DDTHH-mm-ss-sssZ.sql`
- **Retention**: Last 30 backups (configurable)

### Application Backups
- **Location**: `server/logs/backup.log`
- **Format**: JSON response from API

### File Backups
- **Database**: `server/prisma/schema.prisma`
- **Config**: `server/config.env`
- **Uploads**: `server/uploads/`
- **Scripts**: `server/scripts/`

## Restore Procedures

### 1. **Database Restore**
```bash
cd server
npm run restore
# Follow the interactive prompts
```

### 2. **Application Data Restore**
Use the built-in backup data to restore specific records through the admin interface.

### 3. **Full System Restore**
1. Restore database from backup
2. Restore application files
3. Restore configuration files
4. Restart services

## Backup Verification

### 1. **Check Backup Integrity**
```bash
# Verify backup file exists and has content
ls -la server/backups/
head -n 10 server/backups/backup-*.sql
```

### 2. **Test Restore Process**
Regularly test restore procedures on a development environment.

### 3. **Monitor Backup Logs**
```bash
tail -f server/logs/backup.log
```

## Cloud Backup Options

### 1. **AWS S3**
```bash
# Install AWS CLI
aws s3 cp server/backups/ s3://your-bucket/backups/ --recursive
```

### 2. **Google Cloud Storage**
```bash
# Install gsutil
gsutil -m cp -r server/backups/ gs://your-bucket/backups/
```

### 3. **Dropbox/OneDrive**
Sync the backup directory to cloud storage.

## Security Considerations

### 1. **Backup Encryption**
- Encrypt sensitive backup files
- Use secure transfer methods
- Store encryption keys separately

### 2. **Access Control**
- Limit backup file access
- Use secure authentication
- Monitor backup access logs

### 3. **Offsite Storage**
- Store backups in multiple locations
- Use different storage providers
- Test restore from offsite backups

## Monitoring and Alerts

### 1. **Backup Success/Failure**
Set up monitoring to alert on:
- Backup failures
- Backup size anomalies
- Missing backups

### 2. **Storage Monitoring**
Monitor:
- Available disk space
- Backup file sizes
- Storage costs

## Best Practices

### 1. **3-2-1 Rule**
- 3 copies of data
- 2 different storage types
- 1 offsite backup

### 2. **Regular Testing**
- Test restore procedures monthly
- Verify backup integrity
- Document restore times

### 3. **Documentation**
- Keep backup procedures documented
- Update documentation with changes
- Train staff on restore procedures

## Troubleshooting

### Common Issues

#### 1. **Backup Fails**
- Check database connection
- Verify disk space
- Check file permissions

#### 2. **Restore Fails**
- Verify backup file integrity
- Check database permissions
- Ensure database is empty or backed up

#### 3. **Large Backup Files**
- Consider incremental backups
- Compress backup files
- Archive old backups

## Emergency Procedures

### 1. **Database Corruption**
1. Stop application
2. Restore from latest backup
3. Verify data integrity
4. Restart application

### 2. **Complete System Failure**
1. Restore database
2. Restore application files
3. Restore configuration
4. Test system functionality

### 3. **Data Loss**
1. Identify data loss scope
2. Restore from appropriate backup
3. Verify data integrity
4. Document incident

---

**Last Updated**: $(date)
**Version**: 1.0
**Maintained By**: Restaurant POS Team


















