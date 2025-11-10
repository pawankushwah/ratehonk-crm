# Zoom Phone Smart Embed - Admin Setup Guide

## Overview
This guide helps you set up Zoom Phone Smart Embed in your RateHonk CRM so users can make calls directly from the customer detail pages.

---

## Prerequisites

✅ **Zoom Phone License** - Your Zoom account must have Zoom Phone enabled  
✅ **Account Admin Access** - You must be a Zoom account owner or admin  
✅ **Active Zoom Phone Users** - Each CRM user needs a Zoom Phone license

---

## Step 1: Enable Smart Embed in Zoom Marketplace

### 1.1 Access Zoom Marketplace
1. Go to **https://marketplace.zoom.us/**
2. Sign in with your **Zoom admin account**
3. Click **Manage** → **Installed Apps** (top navigation)

### 1.2 Find and Install Smart Embed
1. Search for **"Smart Embed"** in the search bar
2. Find **"Zoom Phone Smart Embed"** (Official Zoom app)
3. Click **Add** or **Install**

### 1.3 Configure Permissions
1. On the Smart Embed settings page, check the box:
   - ✅ **"Allow this app to use my shared permissions"**
2. Click **Save** or **Authorize**

---

## Step 2: Add Authorized Domains

### 2.1 Configure Your CRM Domain
1. In Smart Embed settings, go to **Manage** → **Configure**
2. Find the **"Authorized domains"** section
3. Add your CRM domain(s):
   ```
   https://yourdomain.com
   https://yourcrm.crm.app
   ```
4. For development/testing, you can also add:
   ```
   https://localhost:3000
   http://localhost:3000
   ```
5. Click **Save**

**Important:** The domain must match exactly where your CRM is hosted. No wildcards are supported.

---

## Step 3: (Optional) Configure User Notifications

By default, users get notified when Smart Embed is approved. To disable:

1. Go to **Admin Portal** → **App Management**
2. Find **Smart Embed** in your apps list
3. Click **Manage** → **Notifications**
4. Toggle **OFF**: *"Notify users when user-level apps are approved"*
5. Click **Save**

---

## Step 4: User Setup

Each CRM user must authorize the Smart Embed app:

### 4.1 First-Time User Flow
1. User clicks **"Call with Zoom"** button in CRM
2. Zoom Phone dialog opens with iframe
3. User sees **"Sign in to Zoom"** prompt
4. User enters their Zoom credentials
5. User accepts: *"Allow this app to use my shared access permissions"*
6. Zoom Phone interface loads - ready to make calls!

### 4.2 Subsequent Usage
- After first authorization, users remain signed in
- They can immediately make calls from any customer page

---

## Step 5: Verify Setup

### 5.1 Test the Integration
1. Log into your CRM
2. Go to any **Customer Detail** page
3. Click the **"Call with Zoom"** button (header or phone icon)
4. Zoom Phone dialog should open
5. If first time:
   - Sign in with Zoom credentials
   - Accept permissions
6. You should see the Zoom Phone interface with:
   - Dial pad
   - Call history
   - Contact list
   - Settings

### 5.2 Troubleshooting

**Problem: Blank iframe / nothing loads**
- ✅ Verify your domain is in authorized domains list
- ✅ Ensure Smart Embed app is installed and active
- ✅ Check that you're using HTTPS (not HTTP) in production

**Problem: "Access Denied" or permission errors**
- ✅ Make sure user has accepted app permissions
- ✅ Confirm user has active Zoom Phone license
- ✅ Verify Smart Embed has "shared permissions" enabled

**Problem: Microphone not working**
- ✅ Check browser permissions for microphone access
- ✅ Ensure iframe has `allow="microphone"` attribute (already configured)
- ✅ Try different browser (Chrome/Edge recommended)

---

## Features Available

Once set up, users can:

✅ **Make Outbound Calls** - Click-to-call or manual dial  
✅ **Receive Inbound Calls** - Answer calls within CRM  
✅ **View Call History** - See past calls and recordings  
✅ **Access Contacts** - Zoom Phone directory  
✅ **Send SMS** - Text messaging (if enabled)  
✅ **Check Voicemail** - Listen to messages  

---

## Security & Compliance

- **Authentication**: Users authenticate with their own Zoom credentials
- **Permissions**: Each user controls their own authorization
- **Data Privacy**: Call data stays within Zoom's secure infrastructure
- **HTTPS Required**: All production environments must use HTTPS

---

## Support

**Need Help?**
- **Zoom Support**: https://support.zoom.us/hc/en-us/articles/360060776051
- **Developer Docs**: https://developers.zoom.us/docs/phone/smart-embed/
- **Community Forum**: https://community.zoom.com/

**Common Questions:**

Q: Do I need to create a Zoom app?  
A: No! Smart Embed is a pre-built Zoom app. Just install and configure it.

Q: Can users make calls without Zoom Phone license?  
A: No, each user must have an active Zoom Phone license assigned by admin.

Q: Does this work on mobile?  
A: Smart Embed is optimized for desktop browsers. Mobile users should use the Zoom Phone mobile app.

---

## Summary Checklist

Before going live, ensure:

- [ ] Smart Embed installed from Zoom Marketplace
- [ ] "Shared permissions" enabled
- [ ] Your CRM domain added to authorized domains
- [ ] HTTPS enabled for production
- [ ] Users have Zoom Phone licenses
- [ ] Test calls successful from CRM

**You're ready to go!** 🎉
