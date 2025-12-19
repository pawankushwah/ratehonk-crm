#!/usr/bin/env node

/**
 * Ngrok Tunnel Script
 * Creates a secure tunnel to localhost:5000
 * 
 * Usage:
 *   npm run ngrok
 *   or
 *   node scripts/start-ngrok.js
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5000;
const NGROK_AUTH_TOKEN = process.env.NGROK_AUTH_TOKEN;

console.log('🚀 Starting ngrok tunnel...');
console.log(`📡 Port: ${PORT}`);
console.log('');

// Check if ngrok is installed
const ngrokProcess = spawn('ngrok', ['--version'], { shell: true });

ngrokProcess.on('error', (error) => {
  console.error('❌ Error: ngrok is not installed or not in PATH');
  console.error('');
  console.error('📦 To install ngrok:');
  console.error('   1. Download from: https://ngrok.com/download');
  console.error('   2. Or use package manager:');
  console.error('      - Windows (choco): choco install ngrok');
  console.error('      - macOS (brew): brew install ngrok/ngrok/ngrok');
  console.error('      - Linux: Download from ngrok.com');
  console.error('');
  console.error('🔑 After installation, get your auth token from: https://dashboard.ngrok.com/get-started/your-authtoken');
  console.error('   Then run: ngrok config add-authtoken YOUR_TOKEN');
  console.error('');
  process.exit(1);
});

ngrokProcess.on('close', (code) => {
  if (code === 0) {
    // ngrok is installed, start the tunnel
    console.log('✅ ngrok found');
    
    if (NGROK_AUTH_TOKEN) {
      console.log('🔑 Using NGROK_AUTH_TOKEN from environment');
    } else {
      console.log('⚠️  NGROK_AUTH_TOKEN not set. Using default ngrok config.');
      console.log('   Set NGROK_AUTH_TOKEN in .env for better control');
    }
    
    console.log('');
    console.log('🌐 Starting tunnel...');
    console.log(`   Local: http://localhost:${PORT}`);
    console.log('   Public URL will be displayed below');
    console.log('');
    console.log('💡 Press Ctrl+C to stop ngrok');
    console.log('');
    
    // Start ngrok
    const args = ['http', PORT.toString()];
    
    // Add auth token if provided
    if (NGROK_AUTH_TOKEN) {
      args.push('--authtoken', NGROK_AUTH_TOKEN);
    }
    
    const tunnel = spawn('ngrok', args, {
      stdio: 'inherit',
      shell: true
    });
    
    tunnel.on('error', (error) => {
      console.error('❌ Error starting ngrok:', error.message);
      process.exit(1);
    });
    
    tunnel.on('close', (code) => {
      console.log(`\n👋 ngrok tunnel closed (code: ${code})`);
      process.exit(code || 0);
    });
    
    // Handle Ctrl+C gracefully
    process.on('SIGINT', () => {
      console.log('\n🛑 Stopping ngrok...');
      tunnel.kill();
      process.exit(0);
    });
  }
});

