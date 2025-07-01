require('dotenv').config({ path: './config.env' });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { execSync } = require('child_process');
const mysql = require('mysql2/promise');

const prisma = new PrismaClient();

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
    throw error;
  }
}

async function setupDatabase() {
  try {
    console.log('🚀 Setting up Restaurant POS Database...');

    // First create the database
    await createDatabase();

    // Generate Prisma client
    console.log('📦 Generating Prisma client...');
    try {
      execSync('npx prisma generate', { stdio: 'inherit' });
      console.log('✅ Prisma client generated');
    } catch (error) {
      console.log('⚠️  Prisma client generation failed, continuing...');
    }

    // Push database schema
    console.log('🗄️  Setting up database schema...');
    try {
      execSync('npx prisma db push', { stdio: 'inherit' });
      console.log('✅ Database schema created');
    } catch (error) {
      console.error('❌ Database schema setup failed:', error.message);
      console.log('Please ensure:');
      console.log('1. MySQL server is running');
      console.log('2. Database "restaurant_pos" exists');
      console.log('3. Database credentials are correct in config.env');
      process.exit(1);
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    const adminUser = await prisma.user.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        username: 'admin',
        password: hashedPassword,
        name: 'System Administrator',
        role: 'ADMIN',
        email: 'admin@restaurant.com'
      }
    });

    // Create cashier user
    const cashierPassword = await bcrypt.hash('cashier123', 12);
    const cashierUser = await prisma.user.upsert({
      where: { username: 'cashier' },
      update: {},
      create: {
        username: 'cashier',
        password: cashierPassword,
        name: 'Cashier User',
        role: 'CASHIER',
        email: 'cashier@restaurant.com'
      }
    });

    console.log('✅ Users created');

    // Create tables
    const tables = [];
    for (let i = 1; i <= 20; i++) {
      const table = await prisma.table.upsert({
        where: { number: i },
        update: {},
        create: {
          number: i,
          status: 'AVAILABLE',
          capacity: i <= 4 ? 4 : i <= 8 ? 6 : 8
        }
      });
      tables.push(table);
    }

    console.log('✅ Tables created');

    // Create categories
    const categories = await Promise.all([
      prisma.category.upsert({
        where: { name: 'Appetizers' },
        update: {},
        create: {
          name: 'Appetizers',
          description: 'Starters and appetizers'
        }
      }),
      prisma.category.upsert({
        where: { name: 'Main Course' },
        update: {},
        create: {
          name: 'Main Course',
          description: 'Main dishes'
        }
      }),
      prisma.category.upsert({
        where: { name: 'Desserts' },
        update: {},
        create: {
          name: 'Desserts',
          description: 'Sweet treats'
        }
      }),
      prisma.category.upsert({
        where: { name: 'Beverages' },
        update: {},
        create: {
          name: 'Beverages',
          description: 'Drinks and beverages'
        }
      }),
      prisma.category.upsert({
        where: { name: 'Alcoholic Drinks' },
        update: {},
        create: {
          name: 'Alcoholic Drinks',
          description: 'Beer, wine, and spirits'
        }
      })
    ]);

    console.log('✅ Categories created');

    // Create products
    const products = await Promise.all([
      // Appetizers
      prisma.product.upsert({
        where: { name: 'Spring Rolls' },
        update: {},
        create: {
          name: 'Spring Rolls',
          description: 'Fresh vegetable spring rolls with sweet chili sauce',
          price: 8.99,
          categoryId: categories[0].id,
          isDrink: false
        }
      }),
      prisma.product.upsert({
        where: { name: 'Chicken Wings' },
        update: {},
        create: {
          name: 'Chicken Wings',
          description: 'Crispy chicken wings with buffalo sauce',
          price: 12.99,
          categoryId: categories[0].id,
          isDrink: false
        }
      }),

      // Main Course
      prisma.product.upsert({
        where: { name: 'Grilled Salmon' },
        update: {},
        create: {
          name: 'Grilled Salmon',
          description: 'Fresh grilled salmon with seasonal vegetables',
          price: 24.99,
          categoryId: categories[1].id,
          isDrink: false
        }
      }),
      prisma.product.upsert({
        where: { name: 'Beef Steak' },
        update: {},
        create: {
          name: 'Beef Steak',
          description: 'Premium beef steak with mashed potatoes',
          price: 29.99,
          categoryId: categories[1].id,
          isDrink: false
        }
      }),
      prisma.product.upsert({
        where: { name: 'Pasta Carbonara' },
        update: {},
        create: {
          name: 'Pasta Carbonara',
          description: 'Classic pasta with eggs, cheese, and pancetta',
          price: 18.99,
          categoryId: categories[1].id,
          isDrink: false
        }
      }),

      // Desserts
      prisma.product.upsert({
        where: { name: 'Chocolate Cake' },
        update: {},
        create: {
          name: 'Chocolate Cake',
          description: 'Rich chocolate cake with vanilla ice cream',
          price: 9.99,
          categoryId: categories[2].id,
          isDrink: false
        }
      }),
      prisma.product.upsert({
        where: { name: 'Tiramisu' },
        update: {},
        create: {
          name: 'Tiramisu',
          description: 'Classic Italian dessert with coffee and mascarpone',
          price: 11.99,
          categoryId: categories[2].id,
          isDrink: false
        }
      }),

      // Beverages (Drinks with stock)
      prisma.product.upsert({
        where: { name: 'Coca Cola' },
        update: {},
        create: {
          name: 'Coca Cola',
          description: 'Classic Coca Cola 330ml',
          price: 3.99,
          categoryId: categories[3].id,
          isDrink: true
        }
      }),
      prisma.product.upsert({
        where: { name: 'Orange Juice' },
        update: {},
        create: {
          name: 'Orange Juice',
          description: 'Fresh orange juice 250ml',
          price: 4.99,
          categoryId: categories[3].id,
          isDrink: true
        }
      }),
      prisma.product.upsert({
        where: { name: 'Coffee' },
        update: {},
        create: {
          name: 'Coffee',
          description: 'Fresh brewed coffee',
          price: 3.50,
          categoryId: categories[3].id,
          isDrink: true
        }
      }),
      prisma.product.upsert({
        where: { name: 'Tea' },
        update: {},
        create: {
          name: 'Tea',
          description: 'Hot tea with honey',
          price: 2.99,
          categoryId: categories[3].id,
          isDrink: true
        }
      }),

      // Alcoholic Drinks (Drinks with stock)
      prisma.product.upsert({
        where: { name: 'Heineken Beer' },
        update: {},
        create: {
          name: 'Heineken Beer',
          description: 'Heineken lager beer 330ml',
          price: 6.99,
          categoryId: categories[4].id,
          isDrink: true
        }
      }),
      prisma.product.upsert({
        where: { name: 'Red Wine' },
        update: {},
        create: {
          name: 'Red Wine',
          description: 'House red wine 175ml',
          price: 8.99,
          categoryId: categories[4].id,
          isDrink: true
        }
      }),
      prisma.product.upsert({
        where: { name: 'White Wine' },
        update: {},
        create: {
          name: 'White Wine',
          description: 'House white wine 175ml',
          price: 8.99,
          categoryId: categories[4].id,
          isDrink: true
        }
      })
    ]);

    console.log('✅ Products created');

    // Create stock for drinks
    const drinkProducts = products.filter(p => p.isDrink);
    const stockRecords = await Promise.all(
      drinkProducts.map(product =>
        prisma.stock.upsert({
          where: { productId: product.id },
          update: {},
          create: {
            productId: product.id,
            quantity: 50,
            minStock: 10
          }
        })
      )
    );

    console.log('✅ Stock records created');

    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📋 Default Login Credentials:');
    console.log('👤 Admin:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('\n👤 Cashier:');
    console.log('   Username: cashier');
    console.log('   Password: cashier123');
    console.log('\n📊 Summary:');
    console.log(`   - ${tables.length} tables created`);
    console.log(`   - ${categories.length} categories created`);
    console.log(`   - ${products.length} products created`);
    console.log(`   - ${stockRecords.length} stock records created`);

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupDatabase(); 