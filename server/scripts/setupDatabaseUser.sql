-- Database User Setup Script for Restaurant POS System
-- Run this script as MySQL root user to create a secure database user

-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS restaurant_pos;

-- Create a dedicated user for the POS application
CREATE USER IF NOT EXISTS 'pos_user'@'localhost' IDENTIFIED BY 'your_secure_password_here';

-- Grant necessary permissions to the user
-- Only grant the minimum required permissions for security
GRANT SELECT, INSERT, UPDATE, DELETE ON restaurant_pos.* TO 'pos_user'@'localhost';

-- Grant CREATE, ALTER, DROP permissions for database migrations
GRANT CREATE, ALTER, DROP, INDEX ON restaurant_pos.* TO 'pos_user'@'localhost';

-- Grant EXECUTE permission for stored procedures (if any)
GRANT EXECUTE ON restaurant_pos.* TO 'pos_user'@'localhost';

-- Grant LOCK TABLES permission for Prisma migrations
GRANT LOCK TABLES ON restaurant_pos.* TO 'pos_user'@'localhost';

-- Grant REFERENCES permission for foreign key constraints
GRANT REFERENCES ON restaurant_pos.* TO 'pos_user'@'localhost';

-- Grant TRIGGER permission for any triggers
GRANT TRIGGER ON restaurant_pos.* TO 'pos_user'@'localhost';

-- Grant EVENT permission for scheduled events (if any)
GRANT EVENT ON restaurant_pos.* TO 'pos_user'@'localhost';

-- Grant CREATE TEMPORARY TABLES for temporary operations
GRANT CREATE TEMPORARY TABLES ON restaurant_pos.* TO 'pos_user'@'localhost';

-- Apply the changes
FLUSH PRIVILEGES;

-- Show the granted permissions (for verification)
SHOW GRANTS FOR 'pos_user'@'localhost';

-- Display success message
SELECT 'Database user setup completed successfully!' AS status;
