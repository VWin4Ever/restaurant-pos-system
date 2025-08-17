#!/usr/bin/env node

/**
 * Environment Validation Script
 * Validates that all required environment variables are set correctly
 */

require('dotenv').config({ path: './config.env' });

const requiredEnvVars = {
  DATABASE_URL: {
    required: true,
    description: 'Database connection string',
    validate: (value) => value && value.includes('mysql://'),
    example: 'mysql://user:password@host:3306/database'
  },
  JWT_SECRET: {
    required: true,
    description: 'JWT signing secret',
    validate: (value) => value && value.length >= 32,
    example: 'your-secure-jwt-secret-here'
  },
  JWT_EXPIRES_IN: {
    required: false,
    description: 'JWT token expiration time',
    validate: (value) => !value || /^\d+[h|d|m]$/.test(value),
    example: '24h'
  },
  PORT: {
    required: false,
    description: 'Server port',
    validate: (value) => !value || (parseInt(value) > 0 && parseInt(value) < 65536),
    example: '5000'
  },
  NODE_ENV: {
    required: false,
    description: 'Environment mode',
    validate: (value) => !value || ['development', 'production', 'test'].includes(value),
    example: 'development'
  }
};

function validateEnvironment() {
  console.log('🔍 Validating environment configuration...\n');
  
  let hasErrors = false;
  const results = [];
  
  for (const [key, config] of Object.entries(requiredEnvVars)) {
    const value = process.env[key];
    const isSet = value !== undefined && value !== '';
    const isValid = isSet && config.validate ? config.validate(value) : true;
    
    results.push({
      key,
      isSet,
      isValid,
      value: isSet ? (key.includes('SECRET') || key.includes('PASSWORD') ? '***HIDDEN***' : value) : 'NOT SET',
      required: config.required,
      description: config.description,
      example: config.example
    });
    
    if (config.required && !isSet) {
      hasErrors = true;
    }
    
    if (isSet && !isValid) {
      hasErrors = true;
    }
  }
  
  // Display results
  console.log('📋 Environment Variables Status:\n');
  
  results.forEach(result => {
    const status = result.isSet && result.isValid ? '✅' : 
                   result.isSet && !result.isValid ? '⚠️' : 
                   result.required ? '❌' : 'ℹ️';
    
    console.log(`${status} ${result.key}`);
    console.log(`   Description: ${result.description}`);
    console.log(`   Value: ${result.value}`);
    console.log(`   Required: ${result.required ? 'Yes' : 'No'}`);
    if (result.example) {
      console.log(`   Example: ${result.example}`);
    }
    console.log('');
  });
  
  // Security warnings
  console.log('🔒 Security Checks:\n');
  
  const jwtSecret = process.env.JWT_SECRET;
  if (jwtSecret && jwtSecret.includes('your-super-secret')) {
    console.log('❌ WARNING: Using default JWT secret! Please change this immediately.');
    hasErrors = true;
  } else if (jwtSecret && jwtSecret.length < 32) {
    console.log('⚠️  WARNING: JWT secret is too short. Use at least 32 characters.');
    hasErrors = true;
  } else if (jwtSecret) {
    console.log('✅ JWT secret is properly configured.');
  }
  
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl && dbUrl.includes('root:@localhost')) {
    console.log('⚠️  WARNING: Using root database access. Consider creating a dedicated user.');
  } else if (dbUrl) {
    console.log('✅ Database URL is configured.');
  }
  
  // Environment-specific checks
  console.log('\n🌍 Environment-Specific Checks:\n');
  
  const nodeEnv = process.env.NODE_ENV || 'development';
  console.log(`Current environment: ${nodeEnv}`);
  
  if (nodeEnv === 'production') {
    if (!process.env.FRONTEND_URL) {
      console.log('⚠️  WARNING: FRONTEND_URL not set for production environment.');
    }
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('⚠️  WARNING: NODE_ENV should be set to "production" in production.');
    }
  }
  
  // Final result
  console.log('\n' + '='.repeat(50));
  if (hasErrors) {
    console.log('❌ Environment validation FAILED');
    console.log('Please fix the issues above before proceeding.');
    process.exit(1);
  } else {
    console.log('✅ Environment validation PASSED');
    console.log('Your environment is properly configured!');
  }
  console.log('='.repeat(50));
}

// Run validation
if (require.main === module) {
  validateEnvironment();
}

module.exports = validateEnvironment;









