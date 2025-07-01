require('dotenv').config({ path: './config.env' });
const mysql = require('mysql2/promise');

async function createDatabase() {
  try {
    console.log('🗄️  Creating database if it doesn\'t exist...');
    
    // Connect to MySQL without specifying a database
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      port: 3306
    });

    // Create database if it doesn't exist
    await connection.execute('CREATE DATABASE IF NOT EXISTS restaurant_pos');
    console.log('✅ Database "restaurant_pos" is ready');
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Failed to create database:', error.message);
    console.log('\nPlease ensure:');
    console.log('1. MySQL server is running');
    console.log('2. MySQL root user has no password (or update config.env)');
    console.log('3. MySQL is accessible on localhost:3306');
    process.exit(1);
  }
}

createDatabase(); 