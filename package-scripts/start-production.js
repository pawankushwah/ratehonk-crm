#!/usr/bin/env node

/**
 * Production startup script for RateHonk CRM
 * This script ensures proper environment configuration and starts the server
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Starting RateHonk CRM in Production Mode...');
console.log('📍 Working directory:', process.cwd());

// Set production environment if not already set
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
  console.log('🔧 Set NODE_ENV to production');
}

// Set default port if not specified
if (!process.env.PORT) {
  process.env.PORT = '5000';
  console.log('🔧 Set PORT to 5000');
}

// Validate critical environment variables
const requiredVars = ['DATABASE_URL'];
const missingVars = [];

for (const varName of requiredVars) {
  if (!process.env[varName]) {
    missingVars.push(varName);
  }
}

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('\n📚 See PRODUCTION_ENV_SETUP.md for complete setup guide');
  process.exit(1);
}

// Display configuration status
console.log('✅ Environment validation passed');
console.log(`🗄️  Database: ${new URL(process.env.DATABASE_URL).hostname}`);
console.log(`🚀 Port: ${process.env.PORT}`);
console.log(`🌍 Environment: ${process.env.NODE_ENV}`);

// Build the application if needed
try {
  console.log('🔨 Building application...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

// Start the server
try {
  console.log('🚀 Starting server...');
  execSync('node server/index.js', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Server failed to start:', error.message);
  process.exit(1);
}