# RateHonk CRM - Project Documentation

## Overview
RateHonk CRM is a comprehensive, multi-tenant SaaS CRM system designed for travel agencies and tour operators. Its primary purpose is to streamline operations, enhance customer engagement, and boost revenue through integrated customer, lead, booking, travel package, email marketing, and WhatsApp communication management. The project leverages AI and automation, aiming to provide enterprise-level CRM capabilities tailored for the travel industry.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The system features a modern design inspired by Odoo, utilizing gradient backgrounds, professional card layouts, enhanced typography, and animated elements. It includes a Microsoft Teams-style dashboard calendar and a Kanban-style CRM pipeline. Branding consistently uses RateHonk's cyan colors (#0BBCD6). The header displays the tenant company logo, and the sidebar is streamlined for navigation with an expandable/collapsible design. UI elements extensively use searchable Combobox components and slide panels for inline record creation.

### Technical Implementations
**Frontend:**
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui and Radix UI
- **Build Tool**: Vite
- **State Management**: TanStack Query
- **Routing**: Wouter
- **Form Handling**: React Hook Form with Zod

**Backend:**
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript (ES modules)
- **API Design**: RESTful API
- **Authentication**: JWT-based with bcrypt
- **File Upload**: Multer
- **OCR**: Tesseract.js

**Database:**
- **Primary Database**: Neon PostgreSQL
- **ORM**: Drizzle ORM
- **Connection Pool**: PostgreSQL connection pooling with SSL.

### Feature Specifications
- **Multi-Tenant System**: Supports tenant isolation, customizable branding, role-based access control, and dynamic menu preferences.
- **Customer & Lead Management**: Comprehensive profiles, advanced lead scoring, source tracking, automated qualification, and dynamic custom fields. Lead listing page includes "Lead Category" column with interactive tooltip showing all type-specific field data on hover.
- **Travel Package & Booking System**: Facilitates package creation, booking management, invoice generation, revenue analytics, and AI-powered booking recommendations.
- **Email Marketing Platform**: Enables campaign creation, automation workflows, A/B testing, audience segmentation, dual-layer SMTP, and AI-powered email writing.
- **Social Media Integration**: Comprehensive multi-platform management for lead capture and automated posting via a unified service architecture with OAuth 2.0.
- **Subscription Management**: Manages multiple plans, feature restrictions, and usage tracking.
- **Data Visualization**: Utilizes Recharts for analytics, enhanced tables with pagination, sorting, and filtering.
- **Workflow Automation**: Supports trigger-based email sequences and real-time lead nurturing.
- **Invoice & Expense Management**: Handles multi-format import, intelligent parsing, inline editing, and dedicated full-screen pages for creation.
- **Authentication & Authorization**: Features JWT-based authentication and role-based user management with granular permissions.
- **AI-Powered Email Intelligence**: AI email writing assistant powered by OpenAI GPT-4o.
- **Calendar System**: Offers comprehensive event management, multiple views, real-time data integration, and auto-generated meeting links for Zoom, Google Meet, and Microsoft Teams. Features include:
    - **Auto-Generate Meeting Links**: One-click meeting creation via "Auto-generate" buttons that automatically create meetings using provider APIs and populate link fields.
    - **Google Meet Integration**: Uses CRM Google Calendar connector for OAuth authentication. Automatically creates Google Calendar events with embedded Meet links.
    - **Zoom Integration**: Supports Zoom Server-to-Server OAuth with tenant-specific credentials (Account ID, Client ID, Client Secret). Auto-generates Zoom meetings with join URLs, meeting IDs, and passwords.
    - **Microsoft Teams Integration**: (Pending implementation) Will support Microsoft Graph API for Teams meeting creation.
    - **Manual Entry Supported**: Users can still manually enter meeting links for all providers or when auto-generation is not configured.
    - **Meeting Display**: Events display meeting links with copy-to-clipboard functionality, meeting IDs, and passwords. Links are clickable external links that open in new tabs.
    - **Database Storage**: Meeting credentials stored securely in tenants table (zoom_account_id, zoom_client_id, zoom_client_secret).
- **Dynamic Field System**: Allows tenant-specific custom field management.
- **Vendor Management**: Comprehensive supplier and vendor relationship management module.
- **Travel Search**: B2C and B2B pages with iframe embedding for external booking platforms.
- **GST/Tax Settings System**: Country-agnostic tax management supporting various tax types with tenant-specific configurations.
- **Service Provider Management System**: Manages service providers linked to lead types (e.g., Airlines for Flight Booking).
- **Zoom Phone Integration**: Embedded Zoom Phone functionality for direct calling, call logging, and multi-account management within customer detail pages. Supports OAuth token management, real-time webhooks, and call history display.
- **Payment Installments System**: Flexible payment scheduling for invoices allowing pending amounts to be split into multiple installments with automatic date calculation, status tracking, and individual payment recording.
- **Customer Email System**: Full-featured email functionality directly from customer detail pages with actual SMTP sending (not just logging). Supports both plain text and HTML emails via ReactQuill rich text editor. File attachment support (up to 5 files, 10MB each) stored in CRM Object Storage. Email history tracking with sent/failed status, error logging, and activity feed integration. Uses TenantEmailService with priority: tenant SMTP > SaaS owner SMTP > environment variables. Endpoints available in both routes.ts and simple-routes.ts with identical functionality.
- **WhatsApp Business API Integration**: Tenant-level WhatsApp Business API integration for messaging and device management.
    - **Setup & Device Connection**: Secure provisioning of WhatsApp API credentials and QR code-based device connection. Avoids iframes for QR code and Live Chat due to cookie restrictions. After successful setup on /whatsapp-setup page, automatically redirects to /whatsapp-devices page after 1.5 seconds. Device status updates automatically after QR scan - backend checks connection status via WhatsApp API and updates database, frontend refetches devices list and updates selected device state for immediate UI refresh. Handles 500 error with "Device already connected!" message as successful connection.
    - **Live Chat Interface**: Opens WhatsApp chat interface in a popup window using auto-login for connected devices.
    - **Text Messaging**: Send text messages to multiple customer/lead recipients with formatting and emoji support.
    - **Media Messaging**: Send media messages (image, video, audio, document) with file upload to CRM Object Storage, supporting direct URLs and optional captions.
    - **Device Management**: Full lifecycle management including logout and delete operations with third-party API integration. Logout marks device as disconnected, delete removes device from both WhatsApp API and database. Both operations validate third-party API response status before proceeding with database updates. **First device added is automatically set as default** for simplified onboarding.
    - **Global Floating Button**: Intelligent routing for a global WhatsApp floating button (green MessageCircle icon at bottom-24 right-6), directing users to /whatsapp-setup page (no integration), /whatsapp-devices page (no default device), or live chat popup (default device configured). Button appears globally on all pages via App.tsx.
    - **Default Device Management**: Allows setting a default WhatsApp device for quick live chat access.
    - **Automatic Welcome Messages**: When leads or customers are created with phone numbers, automatic WhatsApp welcome messages are sent via the default device (if enabled in tenant settings). Messages are customizable per tenant with enable/disable toggles available in Settings → WhatsApp tab. Defaults to enabled with professional templates.
    - **Activity Logging**: All WhatsApp messages (including automated welcome messages) are logged in lead_activities or customer_activities tables with activity type 5 (WhatsApp Message Sent). Activities include message content preview and appear in the Activity tab of lead/customer detail pages for complete communication tracking.
    - **Message Database Storage**: All sent WhatsApp messages (both text and media) are permanently stored in the whatsapp_messages database table with comprehensive logging including: tenant/device/customer/lead associations, message type and content, delivery status tracking, external message IDs, sent-by user attribution, and timestamps for sent/delivered/read status. Messages are saved using createWhatsAppMessage storage function in simple-storage.ts with non-blocking error handling to prevent message sending failures. Supports retrieval via getWhatsAppMessagesByCustomer and getWhatsAppMessagesByLead functions.
    - **Customer Detail Page Integration**: Full WhatsApp messaging capabilities integrated directly into customer detail pages (customer-detail.tsx). Features include: dedicated "Messages" tab displaying complete WhatsApp message history (text and media) with status indicators, sender attribution, and device information; "Send WhatsApp" button in page header opening WhatsAppMessageDialog for sending text/media messages; real-time message history with automatic refetch on tab click; timeline-style message display with color-coded status (green=sent, red=failed); support for viewing media attachments via direct links; comprehensive message metadata (recipient, sender, device, timestamps). API endpoint: GET /api/tenants/:tenantId/customers/:customerId/whatsapp-messages.
    - **Lead Detail Slide Panel Integration**: Complete WhatsApp messaging functionality integrated into lead detail slide panel (LeadDetails.tsx). Features include: "Messages" tab alongside notes, activity, email, and call tabs displaying full WhatsApp message history; "Send WhatsApp" button (cyan-colored) opening WhatsAppMessageDialog for lead messaging; unified activity logging showing all communication types (email, call, WhatsApp) with activity type 5 for WhatsApp messages; support for both text and media messages with proper display differentiation; automatic message history refresh when messages tab is clicked; recipient phone number auto-populated from lead.mobile or lead.phone fields. API endpoint: GET /api/tenants/:tenantId/leads/:leadId/whatsapp-messages. Activity types updated to include: Type 5 (WhatsApp Message Sent), Type 11 (Booking Created), Type 12 (Invoice Created).
- **Comprehensive Automatic Activity Logging System**: All major customer interactions are automatically tracked in the customer_activities table with appropriate activity types. The system uses non-blocking try-catch error handling to ensure main operations never fail due to logging issues.
    - **Email Activities (Type 2)**: Logged when emails are sent via createCustomerEmail in simple-storage.ts. Includes email subject and recipient.
    - **Call Activities (Type 3)**: Logged when calls are made via createCustomerCall in simple-storage.ts. Includes call duration and outcome.
    - **WhatsApp Message Activities (Type 5)**: Logged when WhatsApp messages are sent via send-text-message or send-media-message endpoints in whatsapp-routes.ts. Uses digits-only phone number normalization (removes ALL non-digit characters with /\D/g regex) to correctly match customers across different phone number formats (+14151234567, (415) 123-4567, etc.). Includes message preview or media type in activity description.
    - **Booking Creation Activities (Type 11)**: Logged when bookings are created via both storage function (simple-storage.ts createBooking) and direct SQL routes (simple-routes.ts). Requires authenticated user (req.user.id). Includes booking number, travelers count, amount, and status.
    - **Invoice Creation Activities (Type 12)**: Logged when invoices are created via storage function (simple-storage.ts createInvoice). Routes automatically pass userId to storage function for activity logging. Includes invoice number, total amount, and status.
    - **Frontend Display**: Customer detail page (customer-detail.tsx) maps all activity types to human-readable labels and icons. Activities display in Activity tab sorted chronologically with newest first. Each activity shows icon, type label, title, description, status badge, and timestamp.

## External Dependencies

- **Payment Processing**: Stripe, Razorpay.
- **Email Services**: SendGrid, Hostinger SMTP, Nodemailer.
- **Database Hosting**: Neon PostgreSQL, Supabase.
- **Social Media APIs**: Facebook Graph API.
- **Email APIs**: Google APIs, Gmail API.
- **AI Services**: OpenAI GPT-4o.
- **UI Components**: Radix UI, shadcn/ui.
- **Charting**: Recharts.
- **Object Storage**: CRM Object Storage (for WhatsApp media).
- **Video Conferencing**: Zoom (for Zoom Phone integration).