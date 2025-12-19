# Ngrok Setup Guide

This guide will help you set up ngrok to create a secure tunnel to your local development server.

## What is Ngrok?

Ngrok creates secure tunnels to localhost, allowing you to:
- Share your local development server with others
- Test webhooks from external services
- Access your local app from mobile devices
- Test HTTPS features locally

## Installation

### Option 1: Download from Website (Recommended)
1. Visit [https://ngrok.com/download](https://ngrok.com/download)
2. Download ngrok for your operating system
3. Extract the executable to a folder in your PATH

### Option 2: Package Manager

**Windows (Chocolatey):**
```bash
choco install ngrok
```

**macOS (Homebrew):**
```bash
brew install ngrok/ngrok/ngrok
```

**Linux:**
```bash
# Download and extract
wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
tar -xzf ngrok-v3-stable-linux-amd64.tgz
sudo mv ngrok /usr/local/bin/
```

## Authentication Setup

1. Sign up for a free account at [https://dashboard.ngrok.com/signup](https://dashboard.ngrok.com/signup)
2. Get your authtoken from [https://dashboard.ngrok.com/get-started/your-authtoken](https://dashboard.ngrok.com/get-started/your-authtoken)
3. Configure ngrok with your token:
   ```bash
   ngrok config add-authtoken YOUR_AUTH_TOKEN
   ```

## Usage

### Quick Start

1. Make sure your server is running on port 5000:
   ```bash
   npm run dev
   ```

2. In a new terminal, start ngrok:
   ```bash
   npm run ngrok
   ```

3. Ngrok will display a public URL like:
   ```
   Forwarding   https://abc123.ngrok-free.app -> http://localhost:5000
   ```

4. Use the HTTPS URL to access your application from anywhere!

### Using Environment Variable (Optional)

You can set your ngrok auth token in a `.env` file:

```env
NGROK_AUTH_TOKEN=your_auth_token_here
PORT=5000
```

Then the script will use it automatically.

### Custom Port

If your server runs on a different port, you can specify it:

```bash
PORT=3000 npm run ngrok
```

Or modify the `PORT` variable in `scripts/start-ngrok.js`.

## Features

- **Free Plan**: Includes basic tunneling with random URLs
- **Paid Plans**: Custom domains, reserved URLs, and more features
- **Web Interface**: Visit `http://127.0.0.1:4040` to see request inspection dashboard

## Troubleshooting

### "ngrok is not installed"
- Make sure ngrok is installed and in your PATH
- Try running `ngrok --version` to verify installation

### "authtoken not found"
- Run `ngrok config add-authtoken YOUR_TOKEN`
- Or set `NGROK_AUTH_TOKEN` in your `.env` file

### Port Already in Use
- Make sure port 5000 is not already being used by another process
- Change the PORT in your `.env` or `scripts/start-ngrok.js`

### Connection Refused
- Ensure your local server is running before starting ngrok
- Check that your server is listening on the correct port

## Webhook Testing

Ngrok is perfect for testing webhooks:

1. Start ngrok: `npm run ngrok`
2. Copy the HTTPS URL (e.g., `https://abc123.ngrok-free.app`)
3. Use this URL as your webhook endpoint in external services
4. View incoming requests at `http://127.0.0.1:4040`

## Security Notes

- Free ngrok URLs are public - anyone with the URL can access your app
- Use ngrok's authentication features for production-like testing
- Don't expose sensitive data through ngrok tunnels
- Consider using ngrok's reserved domains for more control

## Additional Resources

- [Ngrok Documentation](https://ngrok.com/docs)
- [Ngrok Dashboard](https://dashboard.ngrok.com)
- [Ngrok API Reference](https://ngrok.com/docs/api)

