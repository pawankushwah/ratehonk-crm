#!/usr/bin/env node

/**
 * Generate self-signed SSL certificate for local HTTPS development
 * Run: node scripts/generate-ssl-cert.js
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const certsDir = path.join(process.cwd(), 'certs');
const keyPath = path.join(certsDir, 'localhost-key.pem');
const certPath = path.join(certsDir, 'localhost.pem');

// Create certs directory if it doesn't exist
if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir, { recursive: true });
  console.log('✅ Created certs directory');
}

// Check if certificates already exist
if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
  console.log('✅ SSL certificates already exist');
  console.log(`   Key: ${keyPath}`);
  console.log(`   Cert: ${certPath}`);
  console.log('\n💡 To regenerate, delete the certs directory and run this script again.');
  process.exit(0);
}

console.log('🔐 Generating self-signed SSL certificate for localhost...\n');

// Check if OpenSSL is available
let opensslAvailable = false;
try {
  execSync('openssl version', { stdio: 'ignore' });
  opensslAvailable = true;
} catch {
  opensslAvailable = false;
}

if (!opensslAvailable) {
  console.error('❌ OpenSSL is not installed or not in PATH');
  console.log('\n📝 Installation options:');
  console.log('\n**Option 1: Install OpenSSL for Windows**');
  console.log('   1. Download from: https://slproweb.com/products/Win32OpenSSL.html');
  console.log('   2. Install and add to PATH');
  console.log('   3. Restart terminal and run this script again');
  console.log('\n**Option 2: Use Git Bash (if you have Git installed)**');
  console.log('   1. Open Git Bash');
  console.log('   2. Navigate to project directory');
  console.log('   3. Run: npm run generate-cert');
  console.log('\n**Option 3: Use WSL (Windows Subsystem for Linux)**');
  console.log('   1. Open WSL terminal');
  console.log('   2. Navigate to project directory');
  console.log('   3. Run: npm run generate-cert');
  console.log('\n**Option 4: Use PowerShell to generate certificate**');
  console.log('   Run this PowerShell command as Administrator:');
  console.log(`   $cert = New-SelfSignedCertificate -DnsName "localhost", "*.localhost" -CertStoreLocation "cert:\\LocalMachine\\My" -NotAfter (Get-Date).AddYears(1) -FriendlyName "Localhost Dev Certificate"`);
  console.log(`   Export-Certificate -Cert $cert -FilePath "${certPath}" -Type CERT`);
  console.log(`   $pwd = ConvertTo-SecureString -String "password" -Force -AsPlainText`);
  console.log(`   Export-PfxCertificate -Cert $cert -FilePath "${path.join(certsDir, 'localhost.pfx')}" -Password $pwd`);
  console.log('   Then convert .pfx to .pem using OpenSSL or online converter');
  process.exit(1);
}

try {
  // Generate private key and certificate
  // Valid for 365 days, for localhost and 127.0.0.1
  const opensslCommand = process.platform === 'win32' 
    ? `openssl req -x509 -newkey rsa:2048 -keyout "${keyPath}" -out "${certPath}" -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost" -addext "subjectAltName=DNS:localhost,DNS:*.localhost,IP:127.0.0.1,IP:::1"`
    : `openssl req -x509 -newkey rsa:2048 -keyout "${keyPath}" -out "${certPath}" -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost" -addext "subjectAltName=DNS:localhost,DNS:*.localhost,IP:127.0.0.1,IP:::1"`;
  
  execSync(opensslCommand, { stdio: 'inherit' });

  console.log('\n✅ SSL certificate generated successfully!');
  console.log(`   Key: ${keyPath}`);
  console.log(`   Cert: ${certPath}`);
  console.log('\n📝 Next steps:');
  console.log('   1. Trust the certificate in your browser/OS');
  console.log('   2. Run: npm run dev:https');
  console.log('   3. Access: https://localhost:5000');
} catch (error) {
  console.error('❌ Error generating certificate:', error.message);
  console.log('\n💡 Troubleshooting:');
  console.log('   - Make sure OpenSSL is in your PATH');
  console.log('   - Try running in Git Bash or WSL');
  console.log('   - Or install OpenSSL for Windows');
  process.exit(1);
}

