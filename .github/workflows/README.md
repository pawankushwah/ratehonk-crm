# GitHub Actions Workflows

This directory contains CI/CD workflows for automated deployment.

## Available Workflows

### 1. `deploy-simple.yml` (Recommended)

**Git Pull Method** - Simpler and faster

- Pulls latest code from GitHub
- Installs dependencies
- Builds project
- Restarts PM2

**Best for:** When your server has Git access to the repository

### 2. `deploy.yml`

**SCP Upload Method** - More control

- Builds project on GitHub Actions
- Uploads files via SCP
- Runs deployment script on server

**Best for:** When server doesn't have Git access or you need more control

## Setup

See `GITHUB_CI_CD_SETUP.md` in the root directory for complete setup instructions.

## Required GitHub Secrets

- `SERVER_HOST` - Server IP or domain
- `SERVER_USER` - SSH username  
- `SSH_PRIVATE_KEY` - Private SSH key
- `SERVER_PATH` - Project path on server
- `SERVER_PORT` - SSH port (optional)

## Usage

**Automatic:** Push to `main` or `master` branch

**Manual:** Go to Actions tab → Select workflow → Run workflow

