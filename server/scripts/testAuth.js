require('dotenv').config({ path: './config.env' });
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAuth() {
  try {
    console.log('🔍 Testing authentication...\n');

    // Check JWT secret
    if (!process.env.JWT_SECRET) {
      console.log('❌ JWT_SECRET not found in environment variables');
      return;
    }
    console.log('✅ JWT_SECRET found');

    // Get a user
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log('❌ No users found in database');
      return;
    }
    console.log(`✅ User found: ${user.name} (ID: ${user.id})`);

    // Create a test token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    console.log('✅ Test token created');

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(`✅ Token verified, user ID: ${decoded.userId}`);

    // Test user lookup
    const userFromToken = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        role: true,
        name: true,
        isActive: true
      }
    });

    if (userFromToken) {
      console.log(`✅ User lookup successful: ${userFromToken.name}`);
    } else {
      console.log('❌ User lookup failed');
    }

    console.log('\n🎉 Authentication test completed successfully!');

  } catch (error) {
    console.error('❌ Error testing authentication:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testAuth();

