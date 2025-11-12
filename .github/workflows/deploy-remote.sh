#!/bin/bash

# Remote deployment script executed on the server
# This script is uploaded and run on the production server

set -e  # Exit on error

echo "🚀 Starting deployment on production server..."
echo "📅 Deployment time: $(date)"

# Navigate to project directory
# This will be replaced by the actual path when uploaded
PROJECT_DIR="${DEPLOY_PATH:-/home/ratehonk-crm/htdocs/crm.ratehonk.com/crm-ratehonk}"
cd "$PROJECT_DIR" || exit 1

echo "📂 Current directory: $(pwd)"

# Backup current build (optional)
if [ -d "dist" ]; then
    echo "💾 Backing up current build..."
    cp -r dist dist.backup.$(date +%Y%m%d_%H%M%S) || true
fi

# Install/update dependencies
echo "📦 Installing dependencies..."
npm install --production=false  # Install all deps including devDependencies for build

# Build the project
echo "🔨 Building project..."
npm run build

# Verify build
if [ ! -f "dist/index.js" ]; then
    echo "❌ Build failed! dist/index.js not found."
    exit 1
fi

echo "✅ Build successful"

# Create logs directory if it doesn't exist
mkdir -p logs

# Restart PM2 application
echo "🔄 Restarting PM2 application..."
pm2 restart ratehonk-crm --update-env || pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Show status
echo "📊 PM2 Status:"
pm2 status

# Show recent logs
echo "📋 Recent logs (last 10 lines):"
pm2 logs ratehonk-crm --lines 10 --nostream || true

echo "✅ Deployment completed successfully!"
echo "🌐 Application should be accessible at: https://crm.ratehonk.com"

