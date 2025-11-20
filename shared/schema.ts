import { pgTable, text, varchar, serial, integer, boolean, timestamp, decimal, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for authentication (supports both tenant admins and users)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("tenant_admin"), // saas_owner, tenant_admin, tenant_user
  tenantId: integer("tenant_id"),
  roleId: integer("role_id"), // For tenant users - references roles table
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone"),
  isActive: boolean("is_active").notNull().default(true),
  isEmailVerified: boolean("is_email_verified").notNull().default(false),
  lastLoginAt: timestamp("last_login_at"),
  passwordResetRequired: boolean("password_reset_required").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Password reset tokens table
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Roles table for tenant-specific roles
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  permissions: json("permissions").$type<Record<string, string[]>>().notNull(), // { "dashboard": ["view"], "customers": ["view", "edit", "delete"] }
  isActive: boolean("is_active").notNull().default(true),
  isDefault: boolean("is_default").notNull().default(false), // Owner role is default for tenant
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tenants table for multi-tenant architecture
export const tenants = pgTable("tenants", {
  id: serial("id").primaryKey(),
  companyName: text("company_name").notNull(),
  subdomain: text("subdomain").unique(),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone"),
  address: text("address"),
  logo: text("logo"), // URL or base64 string for company logo
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});


// Tenant Settings - Invoice and other configurations
export const tenantSettings = pgTable("tenant_settings", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().unique(),
  // Invoice Settings
  invoiceNumberStart: integer("invoice_number_start").default(1),
  defaultCurrency: text("default_currency").default("USD"),
  defaultGstSettingId: integer("default_gst_setting_id"), // Default tax setting for invoices
  // Field visibility toggles for invoice create page
  showTax: boolean("show_tax").default(true),
  showDiscount: boolean("show_discount").default(true),
  showNotes: boolean("show_notes").default(true),
  showVoucherInvoice: boolean("show_voucher_invoice").default(true),
  showProvider: boolean("show_provider").default(true),
  showVendor: boolean("show_vendor").default(true),
  showUnitPrice: boolean("show_unit_price").default(true),
  sendInvoiceViaEmail: boolean("send_invoice_via_email").default(true),
  sendInvoiceViaWhatsapp: boolean("send_invoice_via_whatsapp").default(false),
  // WhatsApp Welcome Messages
  enableLeadWelcomeMessage: boolean("enable_lead_welcome_message").default(true),
  leadWelcomeMessage: text("lead_welcome_message").default("Hello! Thank you for your interest. Our team will get in touch with you shortly."),
  enableCustomerWelcomeMessage: boolean("enable_customer_welcome_message").default(true),
  customerWelcomeMessage: text("customer_welcome_message").default("Welcome! Thank you for choosing us. We're excited to serve you!"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
// Tenant menu preferences for dynamic sidebar
export const tenantMenuPreferences = pgTable("tenant_menu_preferences", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  menuItemId: text("menu_item_id").notNull(), // e.g., "dashboard", "customers", "bookings"
  isVisible: boolean("is_visible").notNull().default(true),
  customOrder: integer("custom_order").default(0),
  customName: text("custom_name"), // Allow tenants to rename menu items
  customIcon: text("custom_icon"), // Allow custom icon selection
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tenant group preferences for menu group ordering
export const tenantGroupPreferences = pgTable("tenant_group_preferences", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  groupKey: text("group_key").notNull(), // e.g., "Customer Management", "Lead Management"
  customOrder: integer("custom_order").default(0),
  isVisible: boolean("is_visible").notNull().default(true),
  customName: text("custom_name"), // Allow tenants to rename menu groups
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Dashboard visibility preferences for customizable dashboard components
export const dashboardPreferences = pgTable("dashboard_preferences", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  componentKey: text("component_key").notNull(), // e.g., "metrics-cards", "bookings-chart", "leads-chart", "recent-activities"
  isVisible: boolean("is_visible").notNull().default(true),
  customOrder: integer("custom_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Subscription plans
export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  monthlyPrice: decimal("monthly_price", { precision: 10, scale: 2 }).notNull(),
  yearlyPrice: decimal("yearly_price", { precision: 10, scale: 2 }).notNull(),
  maxUsers: integer("max_users").notNull(),
  maxCustomers: integer("max_customers").notNull(),
  features: json("features").$type<string[]>().notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tenant subscriptions
export const tenantSubscriptions = pgTable("tenant_subscriptions", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  planId: integer("plan_id").notNull(),
  status: text("status").notNull().default("trial"), // trial, active, cancelled, expired, past_due
  billingCycle: text("billing_cycle").notNull().default("monthly"), // monthly, yearly
  paymentGateway: text("payment_gateway").notNull().default("stripe"), // stripe, razorpay
  gatewaySubscriptionId: text("gateway_subscription_id"), // Stripe/Razorpay subscription ID
  gatewayCustomerId: text("gateway_customer_id"), // Stripe/Razorpay customer ID
  trialEndsAt: timestamp("trial_ends_at"),
  currentPeriodStart: timestamp("current_period_start").defaultNow().notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  cancelledAt: timestamp("cancelled_at"),
  nextBillingDate: timestamp("next_billing_date"),
  lastPaymentDate: timestamp("last_payment_date"),
  failedPaymentAttempts: integer("failed_payment_attempts").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Payment history for subscriptions

// Bookings - Updated for multi-module travel system

// Customers table - reconstructed from database schema
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  country: text("country"),
  postalCode: text("postal_code"),
  pincode: text("pincode"),
  company: text("company"),
  customerType: text("customer_type").default("individual"),
  notes: text("notes"),
  dynamicData: json("dynamic_data").$type<Record<string, any>>(),
  preferences: json("preferences").$type<Record<string, any>>(),
  crmStatus: text("crm_status").default("new"),
  lastActivity: timestamp("last_activity"),
  totalValue: decimal("total_value", { precision: 10, scale: 2 }),
  tags: json("tags").$type<string[]>(),
  assignedUserId: integer("assigned_user_id"),
  assignedAt: timestamp("assigned_at"),
  assignedBy: integer("assigned_by"),
  lastActivityUserId: integer("last_activity_user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Leads table - reconstructed from database schema
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  leadTypeId: integer("lead_type_id").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  source: text("source"),
  status: text("status").notNull().default("new"),
  typeSpecificData: json("type_specific_data").$type<Record<string, any>>(),
  notes: text("notes"),
  convertedToCustomerId: integer("converted_to_customer_id"),
  score: integer("score").default(0),
  lastContactDate: timestamp("last_contact_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Lead Types table
export const leadTypes = pgTable("lead_types", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"),
  color: text("color"),
  isActive: boolean("is_active").default(true),
  displayOrder: integer("display_order").default(0),
  leadTypeCategory: text("lead_type_category"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Service Providers table - linked to lead types
export const serviceProviders = pgTable("service_providers", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  leadTypeId: integer("lead_type_id").notNull(),
  name: text("name").notNull(),
  contactInfo: text("contact_info"),
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Package Types table
export const packageTypes = pgTable("package_types", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"),
  color: text("color"),
  isActive: boolean("is_active").default(true),
  isDeleted: boolean("is_deleted").default(false),
  displayOrder: integer("display_order").default(0),
  packageCategory: text("package_category"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Travel Packages table
export const travelPackages = pgTable("travel_packages", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  packageTypeId: integer("package_type_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  destination: text("destination").notNull(),
  duration: integer("duration").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  maxCapacity: integer("max_capacity").notNull(),
  inclusions: json("inclusions").$type<string[]>(),
  exclusions: json("exclusions").$type<string[]>(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Payment Methods table
export const paymentMethods = pgTable("payment_methods", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});


// Payment History table - for tracking all payment records
export const paymentHistory = pgTable("payment_history", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  bookingId: integer("booking_id").notNull(),
  paymentDate: timestamp("payment_date").defaultNow().notNull(),
  amountPaid: decimal("amount_paid", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(), // cash, card, bank_transfer, online, cheque
  paymentReference: text("payment_reference"), // transaction id, cheque number, etc.
  notes: text("notes"),
  recordedBy: integer("recorded_by").notNull(), // user who recorded the payment
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Bookings table - Updated for multi-module travel system
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  customerId: integer("customer_id").notNull(),
  leadId: integer("lead_id"), // Optional - link to originating lead
  leadTypeId: integer("lead_type_id").notNull(), // Required - travel module (flight, hotel, etc.)
  packageId: integer("package_id"), // Optional - only for package bookings
  vendorId: integer("vendor_id"), // Optional - vendor association for bookings
  bookingNumber: text("booking_number").notNull().unique(),
  status: text("status").notNull().default("pending"), // pending, confirmed, cancelled, completed
  travelers: integer("travelers").notNull(),
  travelDate: timestamp("travel_date").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  amountPaid: decimal("amount_paid", { precision: 10, scale: 2 }).notNull().default("0"),
  paymentStatus: text("payment_status").notNull().default("pending"), // pending, partial, paid
  specialRequests: text("special_requests"),
  bookingData: json("booking_data").$type<Record<string, any>>(), // Module-specific booking details
  dynamicData: json("dynamic_data").$type<Record<string, any>>(), // Dynamic fields data
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Passenger details table for detailed traveler information
export const passengers = pgTable("passengers", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").notNull(),
  tenantId: integer("tenant_id").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  dateOfBirth: timestamp("date_of_birth"),
  gender: text("gender"), // male, female, other
  nationality: text("nationality"),
  passportNumber: text("passport_number"),
  passportExpiry: timestamp("passport_expiry"),
  email: text("email"),
  phone: text("phone"),
  dietaryRestrictions: text("dietary_restrictions"),
  medicalConditions: text("medical_conditions"),
  seatPreference: text("seat_preference"),
  specialRequests: text("special_requests"),
  isMainPassenger: boolean("is_main_passenger").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Invoices - Updated to match actual database schema
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  customerId: integer("customer_id").notNull(),
  bookingId: integer("booking_id"),
  invoiceNumber: text("invoice_number").notNull().unique(),
  status: text("status").notNull().default("draft"), // draft, pending, paid, overdue, cancelled
  invoiceDate: timestamp("invoice_date").notNull(),
  issueDate: timestamp("issue_date"), // Keep both for compatibility
  dueDate: timestamp("due_date").notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  enableReminder: boolean("enable_reminder").default(false),
  reminderFrequency: text("reminder_frequency"),
  reminderSpecificDate: timestamp("reminder_specific_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Invoice items/line items
export const invoiceItems = pgTable("invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull(),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  packageId: integer("package_id"),
});

// Payment Installments - For splitting invoice payments
export const paymentInstallments = pgTable("payment_installments", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull(),
  tenantId: integer("tenant_id").notNull(),
  installmentNumber: integer("installment_number").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  dueDate: timestamp("due_date").notNull(),
  status: text("status").notNull().default("pending"), // pending, paid, overdue, cancelled
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }).default("0"),
  paidDate: timestamp("paid_date"),
  paymentMethod: text("payment_method"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// GST/Tax Settings - Country-agnostic tax configuration
export const gstSettings = pgTable("gst_settings", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  taxName: text("tax_name").notNull(), // GST, VAT, Sales Tax, Service Tax, etc.
  taxNumber: text("tax_number"), // Registration number (GSTIN, VAT number, etc.)
  country: text("country").notNull(), // Country code or name
  state: text("state"), // For region-specific taxes
  taxType: text("tax_type").notNull().default("gst"), // gst, vat, sales_tax, service_tax, custom
  isActive: boolean("is_active").notNull().default(true),
  isDefault: boolean("is_default").notNull().default(false), // Default tax setting for invoices
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// GST/Tax Rates - Multiple rates per tax setting
export const gstRates = pgTable("gst_rates", {
  id: serial("id").primaryKey(),
  gstSettingId: integer("gst_setting_id").notNull(),
  tenantId: integer("tenant_id").notNull(),
  rateName: text("rate_name").notNull(), // Standard Rate, Reduced Rate, Zero Rate, etc.
  ratePercentage: decimal("rate_percentage", { precision: 5, scale: 2 }).notNull(), // 18.00, 5.00, 0.00, etc.
  description: text("description"), // Description of when to use this rate
  isDefault: boolean("is_default").notNull().default(false), // Default rate for this GST setting
  displayOrder: integer("display_order").default(0), // For ordering in dropdowns
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const socialIntegrations = pgTable("social_integrations", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  platform: text("platform").notNull(), // facebook, instagram, linkedin, twitter, tiktok, youtube
  isActive: boolean("is_active").notNull().default(true),
  
  // Tenant-specific app credentials for each platform
  appId: text("app_id"), // Facebook App ID, Instagram App ID
  appSecret: text("app_secret"), // Facebook App Secret, Instagram App Secret
  clientId: text("client_id"), // LinkedIn Client ID, Twitter Client ID, TikTok Client Key
  clientSecret: text("client_secret"), // LinkedIn Client Secret, Twitter Client Secret, TikTok Client Secret
  apiKey: text("api_key"), // TikTok API Key, YouTube API Key
  apiSecret: text("api_secret"), // TikTok API Secret
  
  // User OAuth tokens
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  tokenExpiresAt: timestamp("token_expires_at"),
  
  // Platform-specific additional tokens
  oauthToken: text("oauth_token"), // Twitter OAuth 1.0a
  oauthTokenSecret: text("oauth_token_secret"), // Twitter OAuth 1.0a
  
  // Sync and webhook settings
  lastSync: timestamp("last_sync"),
  totalLeadsImported: integer("total_leads_imported").default(0),
  syncFrequency: text("sync_frequency").default("hourly"),
  webhookUrl: text("webhook_url"),
  webhookSecret: text("webhook_secret"), // For webhook validation
  
  // Platform-specific settings and permissions
  permissions: json("permissions").default([]),
  settings: json("settings").default({}), // Store pages, accounts, business profiles, etc.
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Facebook Business Suite integrations
export const facebookIntegrations = pgTable("facebook_integrations", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  facebookUserId: text("facebook_user_id").notNull(),
  userAccessToken: text("user_access_token").notNull(),
  userTokenExpiresAt: timestamp("user_token_expires_at"),
  businessId: text("business_id"),
  isActive: boolean("is_active").notNull().default(true),
  connectedAt: timestamp("connected_at").defaultNow().notNull(),
  lastSync: timestamp("last_sync"),
  permissions: json("permissions").default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Facebook Pages connected to tenants
export const facebookPages = pgTable("facebook_pages", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  integrationId: integer("integration_id").notNull(),
  pageId: text("page_id").notNull(),
  pageName: text("page_name").notNull(),
  pageAccessToken: text("page_access_token").notNull(),
  pageCategory: text("page_category"),
  followersCount: integer("followers_count").default(0),
  isInstagramConnected: boolean("is_instagram_connected").default(false),
  instagramBusinessAccountId: text("instagram_business_account_id"),
  isActive: boolean("is_active").notNull().default(true),
  lastSync: timestamp("last_sync"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Facebook lead forms and campaigns
export const facebookLeadForms = pgTable("facebook_lead_forms", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  pageId: integer("page_id").notNull(),
  formId: text("form_id").notNull(),
  formName: text("form_name").notNull(),
  status: text("status").notNull(), // active, paused, archived
  leadgenTosAccepted: boolean("leadgen_tos_accepted").default(false),
  fields: json("fields").default([]),
  totalLeads: integer("total_leads").default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Facebook Business Suite posts and content
export const facebookPosts = pgTable("facebook_posts", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  pageId: integer("page_id").notNull(),
  postId: text("post_id").notNull(),
  message: text("message"),
  postType: text("post_type"), // photo, video, link, status
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
  shares: integer("shares").default(0),
  reach: integer("reach").default(0),
  engagement: integer("engagement").default(0),
  publishedAt: timestamp("published_at"),
  isInstagramPost: boolean("is_instagram_post").default(false),
  instagramPostId: text("instagram_post_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const emailCampaigns = pgTable("email_campaigns", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  content: text("content").notNull(), // HTML email content
  type: text("type").notNull(), // welcome, booking_confirmation, follow_up, newsletter
  status: text("status").default("draft").notNull(), // draft, scheduled, sent, paused
  targetAudience: text("target_audience").notNull(), // all_customers, new_leads, specific_segment
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  recipientCount: integer("recipient_count").default(0),
  openRate: text("open_rate").default("0"),
  clickRate: text("click_rate").default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const emailTemplates = pgTable("email_templates", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  name: text("name").notNull(),
  category: text("category").notNull(), // welcome, booking, promotional, newsletter
  subject: text("subject").notNull(),
  content: text("content").notNull(), // HTML template
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true).notNull(),
  previewText: text("preview_text"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const emailSubscribers = pgTable("email_subscribers", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  email: text("email").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  customerId: integer("customer_id").references(() => customers.id),
  leadId: integer("lead_id").references(() => leads.id),
  status: text("status").default("active").notNull(), // active, unsubscribed, bounced
  subscribedAt: timestamp("subscribed_at").defaultNow().notNull(),
  unsubscribedAt: timestamp("unsubscribed_at"),
  tags: text("tags").array().default([]),
  preferences: json("preferences").default({}), // email frequency, topics
});

export const emailLogs = pgTable("email_logs", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  campaignId: integer("campaign_id").references(() => emailCampaigns.id),
  subscriberId: integer("subscriber_id").references(() => emailSubscribers.id),
  customerId: integer("customer_id").references(() => customers.id),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  status: text("status").notNull(), // sent, delivered, opened, clicked, bounced, failed
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  deliveredAt: timestamp("delivered_at"),
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
  errorMessage: text("error_message"),
});

// Email automation workflows
export const emailAutomations = pgTable("email_automations", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  name: text("name").notNull(),
  description: text("description"),
  triggerType: text("trigger_type").notNull(), // customer_signup, booking_confirmed, lead_created, date_based, behavior_based
  triggerConditions: json("trigger_conditions").notNull(), // specific conditions for trigger
  isActive: boolean("is_active").default(true).notNull(),
  emailTemplateId: integer("email_template_id").references(() => emailTemplates.id),
  delayHours: integer("delay_hours").default(0), // delay before sending
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Email segments for advanced targeting
export const emailSegments = pgTable("email_segments", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  name: text("name").notNull(),
  description: text("description"),
  filterConditions: json("filter_conditions").notNull(), // filters for segment criteria
  subscriberCount: integer("subscriber_count").default(0),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// A/B test campaigns
export const emailABTests = pgTable("email_ab_tests", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  name: text("name").notNull(),
  description: text("description"),
  testType: text("test_type").notNull(), // subject_line, content, send_time, sender_name
  variantA: json("variant_a").notNull(), // configuration for variant A
  variantB: json("variant_b").notNull(), // configuration for variant B
  winningVariant: text("winning_variant"), // a, b, or null if ongoing
  testDuration: integer("test_duration").default(24), // hours
  sampleSize: integer("sample_size").default(100), // number of recipients per variant
  status: text("status").default("draft").notNull(), // draft, running, completed
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Email personalization rules
export const emailPersonalizationRules = pgTable("email_personalization_rules", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  name: text("name").notNull(),
  ruleType: text("rule_type").notNull(), // content_block, subject_line, send_time, product_recommendation
  conditions: json("conditions").notNull(), // when to apply this rule
  actions: json("actions").notNull(), // what changes to make
  isActive: boolean("is_active").default(true).notNull(),
  priority: integer("priority").default(1), // order of rule application
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Email deliverability monitoring
export const emailDeliverabilityMetrics = pgTable("email_deliverability_metrics", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  campaignId: integer("campaign_id").references(() => emailCampaigns.id),
  date: timestamp("date").defaultNow().notNull(),
  totalSent: integer("total_sent").default(0),
  delivered: integer("delivered").default(0),
  bounced: integer("bounced").default(0),
  spam: integer("spam").default(0),
  unsubscribed: integer("unsubscribed").default(0),
  deliveryRate: decimal("delivery_rate", { precision: 5, scale: 2 }).default("0"),
  bounceRate: decimal("bounce_rate", { precision: 5, scale: 2 }).default("0"),
  spamRate: decimal("spam_rate", { precision: 5, scale: 2 }).default("0"),
  reputation: text("reputation").default("good"), // excellent, good, fair, poor
});

// Email configuration settings for tenants
export const emailConfigurations = pgTable("email_configurations", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id).unique(),
  senderName: text("sender_name").notNull(),
  senderEmail: text("sender_email").notNull(),
  replyToEmail: text("reply_to_email"),
  smtpHost: text("smtp_host"),
  smtpPort: integer("smtp_port").default(587),
  smtpUsername: text("smtp_username"),
  smtpPassword: text("smtp_password"), // encrypted
  smtpSecurity: text("smtp_security").default("tls"), // tls, ssl, none
  isSmtpEnabled: boolean("is_smtp_enabled").default(false),
  dailySendLimit: integer("daily_send_limit").default(1000),
  bounceHandling: boolean("bounce_handling").default(true),
  trackOpens: boolean("track_opens").default(true),
  trackClicks: boolean("track_clicks").default(true),
  unsubscribeFooter: text("unsubscribe_footer"),
  emailSignature: text("email_signature"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Gmail integration for tenants
export const gmailIntegrations = pgTable("gmail_integrations", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id).unique(),
  gmailAddress: text("gmail_address").notNull(),
  accessToken: text("access_token"), // encrypted OAuth2 access token
  refreshToken: text("refresh_token"), // encrypted OAuth2 refresh token
  tokenExpiryDate: timestamp("token_expiry_date"),
  isConnected: boolean("is_connected").default(false).notNull(),
  lastSyncAt: timestamp("last_sync_at"),
  syncEnabled: boolean("sync_enabled").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Gmail emails cache for quick access
export const gmailEmails = pgTable("gmail_emails", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  gmailMessageId: text("gmail_message_id").notNull(),
  threadId: text("thread_id"),
  fromEmail: text("from_email").notNull(),
  fromName: text("from_name"),
  toEmail: text("to_email").notNull(),
  toName: text("to_name"),
  subject: text("subject"),
  bodyText: text("body_text"),
  bodyHtml: text("body_html"),
  isRead: boolean("is_read").default(false).notNull(),
  isImportant: boolean("is_important").default(false).notNull(),
  hasAttachments: boolean("has_attachments").default(false).notNull(),
  labels: json("labels").$type<string[]>().default([]),
  receivedAt: timestamp("received_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Calendar Events
export const calendarEvents = pgTable("calendar_events", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  location: text("location"),
  attendees: json("attendees").$type<string[]>(),
  color: text("color").notNull().default("#3B82F6"),
  isRecurring: boolean("is_recurring").notNull().default(false),
  recurrencePattern: text("recurrence_pattern"), // daily, weekly, monthly, yearly
  reminders: json("reminders").$type<number[]>(), // minutes before event
  createdBy: integer("created_by").notNull().references(() => users.id),
  timezone: text("timezone").notNull().default("UTC"),
  status: text("status").notNull().default("confirmed"), // confirmed, tentative, cancelled
  visibility: text("visibility").notNull().default("public"), // public, private, confidential
  zoomMeetingLink: text("zoom_meeting_link"), // Zoom meeting URL
  zoomMeetingId: text("zoom_meeting_id"), // Zoom meeting ID for API operations
  zoomMeetingPassword: text("zoom_meeting_password"), // Zoom meeting password
  googleMeetLink: text("google_meet_link"), // Google Meet URL
  meetingProvider: text("meeting_provider"), // zoom, google_meet, teams, or null
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Vendors table for supplier management
export const vendors = pgTable("vendors", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  name: text("name").notNull(),
  contactPersonName: text("contact_person_name"),
  email: text("email"),
  phone: text("phone"),
  website: text("website"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  country: text("country").default("United States"),
  servicesOffered: text("services_offered"), // Description of what they provide
  productCategories: json("product_categories").$type<string[]>().default([]), // Array of categories like ["Transportation", "Accommodation", "Activities"]
  paymentTerms: text("payment_terms").default("Net 30"), // Net 30, Net 15, COD, etc.
  creditLimit: decimal("credit_limit", { precision: 10, scale: 2 }),
  taxId: text("tax_id"), // Tax identification number
  status: text("status").notNull().default("active"), // active, inactive, suspended
  notes: text("notes"),
  preferredContactMethod: text("preferred_contact_method").default("email"), // email, phone, both
  contractStartDate: timestamp("contract_start_date"),
  contractEndDate: timestamp("contract_end_date"),
  rating: integer("rating").default(0), // 1-5 star rating
  isPreferred: boolean("is_preferred").default(false),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User Assignment History Table for tracking assignment changes
export const assignmentHistory = pgTable("assignment_history", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  entityType: text("entity_type").notNull(), // 'lead' | 'customer' | 'task'
  entityId: integer("entity_id").notNull(),
  previousUserId: integer("previous_user_id").references(() => users.id),
  newUserId: integer("new_user_id").notNull().references(() => users.id),
  assignedBy: integer("assigned_by").notNull().references(() => users.id),
  reason: text("reason"), // 'auto_assignment', 'manual_assignment', 'workload_balance', 'reassignment'
  notes: text("notes"), // Additional context about the assignment
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User Performance Metrics Table for tracking user performance
export const userMetrics = pgTable("user_metrics", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  userId: integer("user_id").notNull().references(() => users.id),
  metricType: text("metric_type").notNull(), // 'leads_assigned', 'leads_converted', 'tasks_completed', 'revenue_generated'
  metricValue: decimal("metric_value", { precision: 10, scale: 2 }).notNull(),
  metricDate: timestamp("metric_date").notNull(),
  additionalData: json("additional_data").$type<Record<string, any>>(), // Store extra metric details
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User Notifications Table for assignment and task notifications
export const userNotifications = pgTable("user_notifications", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // 'assignment', 'task_due', 'lead_activity', 'system', 'reminder'
  entityType: text("entity_type"), // 'lead', 'customer', 'task'
  entityId: integer("entity_id"),
  isRead: boolean("is_read").default(false).notNull(),
  priority: text("priority").default("medium"), // 'low', 'medium', 'high', 'urgent'
  actionUrl: text("action_url"), // URL to navigate when notification is clicked
  metadata: json("metadata").$type<Record<string, any>>(), // Additional notification data
  expiresAt: timestamp("expires_at"), // When notification should be automatically removed
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tasks table for comprehensive task management
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("pending"), // pending, in_progress, completed, cancelled, overdue
  priority: text("priority").notNull().default("medium"), // low, medium, high, urgent
  type: text("type").notNull().default("general"), // follow_up, call, email, meeting, quote, booking, general
  dueDate: timestamp("due_date").notNull(),
  completedAt: timestamp("completed_at"),
  assignedTo: text("assigned_to").notNull(), // User full name for display
  assignedToId: integer("assigned_to_id").notNull().references(() => users.id),
  customerId: integer("customer_id").references(() => customers.id),
  leadId: integer("lead_id").references(() => leads.id),
  tags: json("tags").$type<string[]>().default([]),
  notes: text("notes"),
  estimatedDuration: integer("estimated_duration"), // in minutes
  actualDuration: integer("actual_duration"), // in minutes
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const callLogs = pgTable("call_logs", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  customerId: integer("customer_id").references(() => customers.id), // Nullable - if phone doesn't match customer
  userId: integer("user_id").references(() => users.id), // CRM user who made/received call
  zoomAccountId: integer("zoom_account_id").references(() => zoomTokens.id), // Which Zoom account was used
  zoomCallId: text("zoom_call_id").unique(), // Unique ID from Zoom (nullable for manual logs)
  callType: text("call_type").notNull(), // incoming | outgoing | missed (legacy - maps to direction)
  direction: text("direction"), // 'inbound' | 'outbound' (from Zoom)
  callerNumber: text("caller_number"), // Phone number of caller
  calleeNumber: text("callee_number"), // Phone number of callee
  callerName: text("caller_name"), // Name from Zoom or matched customer
  calleeName: text("callee_name"), // Name from Zoom or matched customer
  status: text("status").default("completed"), // completed | missed | voicemail | no-answer | busy | failed
  duration: integer("duration"), // Call duration in seconds
  recordingUrl: text("recording_url"), // URL to call recording (if available)
  recordingDuration: integer("recording_duration"), // Recording duration in seconds
  notes: text("notes"),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  endedAt: timestamp("ended_at"),
  answerTime: timestamp("answer_time"), // When call was answered
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Expenses table for financial management
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  title: text("title").notNull(),
  description: text("description"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("USD"),
  category: text("category").notNull(), // travel, office, marketing, software, etc.
  subcategory: text("subcategory"), // hotel, flight, meals, etc.
  expenseDate: timestamp("expense_date").notNull(),
  paymentMethod: text("payment_method").notNull(), // cash, credit_card, bank_transfer, check
  paymentReference: text("payment_reference"), // transaction ID, check number, etc.
  vendorId: integer("vendor_id").references(() => vendors.id), // Optional vendor association
  leadTypeId: integer("lead_type_id").references(() => leadTypes.id), // Optional lead type association
  expenseType: text("expense_type").default("purchase"), // purchase, lease, rental, subscription, service
  receiptUrl: text("receipt_url"), // URL to receipt image/document
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0"),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("0"),
  isReimbursable: boolean("is_reimbursable").default(false),
  isRecurring: boolean("is_recurring").default(false),
  recurringFrequency: text("recurring_frequency"), // monthly, quarterly, yearly
  status: text("status").notNull().default("pending"), // pending, approved, rejected, paid
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  tags: json("tags").$type<string[]>().default([]), // custom tags for organization
  notes: text("notes"),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Call logs insert schema
export const insertCallLogSchema = createInsertSchema(callLogs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRoleSchema = createInsertSchema(roles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTenantSchema = createInsertSchema(tenants).omit({
  id: true,
  createdAt: true,
});

export const insertTenantSettingsSchema = createInsertSchema(tenantSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDashboardPreferenceSchema = createInsertSchema(dashboardPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
  createdAt: true,
});

export const insertTenantSubscriptionSchema = createInsertSchema(tenantSubscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVendorSchema = createInsertSchema(vendors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAssignmentHistorySchema = createInsertSchema(assignmentHistory).omit({
  id: true,
  createdAt: true,
});

export const insertUserMetricSchema = createInsertSchema(userMetrics).omit({
  id: true,
  createdAt: true,
});

export const insertUserNotificationSchema = createInsertSchema(userNotifications).omit({
  id: true,
  createdAt: true,
});

// Type definitions
export type Vendor = typeof vendors.$inferSelect;
export type InsertVendor = z.infer<typeof insertVendorSchema>;
export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type LeadType = typeof leadTypes.$inferSelect;
export type InsertLeadType = z.infer<typeof insertLeadTypeSchema>;
export type ServiceProvider = typeof serviceProviders.$inferSelect;
export type InsertServiceProvider = z.infer<typeof insertServiceProviderSchema>;

// User Management System Types
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type AssignmentHistory = typeof assignmentHistory.$inferSelect;
export type InsertAssignmentHistory = z.infer<typeof insertAssignmentHistorySchema>;
export type UserMetric = typeof userMetrics.$inferSelect;
export type InsertUserMetric = z.infer<typeof insertUserMetricSchema>;
export type UserNotification = typeof userNotifications.$inferSelect;
export type InsertUserNotification = z.infer<typeof insertUserNotificationSchema>;

export const insertPaymentHistorySchema = createInsertSchema(paymentMethods).omit({
  id: true,
  createdAt: true,
});

export const insertPaymentMethodSchema = createInsertSchema(paymentMethods).omit({
  id: true,
  createdAt: true,
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
});

export const insertTravelPackageSchema = createInsertSchema(travelPackages).omit({
  id: true,
  createdAt: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPassengerSchema = createInsertSchema(passengers).omit({
  id: true,
  createdAt: true,
});

export const insertSocialIntegrationSchema = createInsertSchema(socialIntegrations).omit({
  id: true,
  createdAt: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInvoiceItemSchema = createInsertSchema(invoiceItems).omit({
  id: true,
});

export const insertPaymentInstallmentSchema = createInsertSchema(paymentInstallments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGstSettingSchema = createInsertSchema(gstSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGstRateSchema = createInsertSchema(gstRates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmailCampaignSchema = createInsertSchema(emailCampaigns).omit({
  id: true,
  createdAt: true,
});

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({
  id: true,
  createdAt: true,
});

export const insertEmailSubscriberSchema = createInsertSchema(emailSubscribers).omit({
  id: true,
  subscribedAt: true,
});

export const insertEmailLogSchema = createInsertSchema(emailLogs).omit({
  id: true,
  sentAt: true,
});

// Duplicate type declarations removed - consolidated below

export const insertEmailAutomationSchema = createInsertSchema(emailAutomations).omit({
  id: true,
  createdAt: true,
});

export const insertEmailSegmentSchema = createInsertSchema(emailSegments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmailABTestSchema = createInsertSchema(emailABTests).omit({
  id: true,
  createdAt: true,
});

export const insertEmailPersonalizationRuleSchema = createInsertSchema(emailPersonalizationRules).omit({
  id: true,
  createdAt: true,
});

export const insertEmailDeliverabilityMetricSchema = createInsertSchema(emailDeliverabilityMetrics).omit({
  id: true,
});

export const insertEmailConfigurationSchema = createInsertSchema(emailConfigurations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});


export const insertLeadTypeSchema = createInsertSchema(leadTypes).omit({
  id: true,
  createdAt: true,
});

export const insertServiceProviderSchema = createInsertSchema(serviceProviders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});


// Types - Main type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Role = typeof roles.$inferSelect;
export type InsertRole = z.infer<typeof insertRoleSchema>;

export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = z.infer<typeof insertTenantSchema>;

export type TenantSettings = typeof tenantSettings.$inferSelect;
export type InsertTenantSettings = z.infer<typeof insertTenantSettingsSchema>;

export type InsertDashboardPreference = z.infer<typeof insertDashboardPreferenceSchema>;
export type DashboardPreference = typeof dashboardPreferences.$inferSelect;

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;

export type TenantSubscription = typeof tenantSubscriptions.$inferSelect;
export type InsertTenantSubscription = z.infer<typeof insertTenantSubscriptionSchema>;

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;

export type TravelPackage = typeof travelPackages.$inferSelect;
export type InsertTravelPackage = z.infer<typeof insertTravelPackageSchema>;

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;

export type Invoice = typeof invoices.$inferSelect & {
  customerName?: string;
  customerEmail?: string;
  bookingNumber?: string;
};
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;

export type PaymentInstallment = typeof paymentInstallments.$inferSelect;
export type InsertPaymentInstallment = z.infer<typeof insertPaymentInstallmentSchema>;

export type GstSetting = typeof gstSettings.$inferSelect;
export type InsertGstSetting = z.infer<typeof insertGstSettingSchema>;

export type GstRate = typeof gstRates.$inferSelect;
export type InsertGstRate = z.infer<typeof insertGstRateSchema>;

export type SocialIntegration = typeof socialIntegrations.$inferSelect;
export type InsertSocialIntegration = z.infer<typeof insertSocialIntegrationSchema>;

export type EmailCampaign = typeof emailCampaigns.$inferSelect;
export type InsertEmailCampaign = z.infer<typeof insertEmailCampaignSchema>;

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;

export type EmailSubscriber = typeof emailSubscribers.$inferSelect;
export type InsertEmailSubscriber = z.infer<typeof insertEmailSubscriberSchema>;

export type EmailLog = typeof emailLogs.$inferSelect;
export type InsertEmailLog = z.infer<typeof insertEmailLogSchema>;

export type EmailAutomation = typeof emailAutomations.$inferSelect;
export type InsertEmailAutomation = z.infer<typeof insertEmailAutomationSchema>;

export type EmailSegment = typeof emailSegments.$inferSelect;
export type InsertEmailSegment = z.infer<typeof insertEmailSegmentSchema>;

export type EmailABTest = typeof emailABTests.$inferSelect;
export type InsertEmailABTest = z.infer<typeof insertEmailABTestSchema>;

export type EmailPersonalizationRule = typeof emailPersonalizationRules.$inferSelect;
export type InsertEmailPersonalizationRule = z.infer<typeof insertEmailPersonalizationRuleSchema>;

export type EmailDeliverabilityMetric = typeof emailDeliverabilityMetrics.$inferSelect;
export type InsertEmailDeliverabilityMetric = z.infer<typeof insertEmailDeliverabilityMetricSchema>;

export type EmailConfiguration = typeof emailConfigurations.$inferSelect;
export type InsertEmailConfiguration = z.infer<typeof insertEmailConfigurationSchema>;

export type GmailIntegration = typeof gmailIntegrations.$inferSelect;
export type InsertGmailIntegration = z.infer<typeof insertSocialIntegrationSchema>;

export type GmailEmail = typeof gmailEmails.$inferSelect;
export type InsertGmailEmail = z.infer<typeof insertEmailLogSchema>;

export type CustomerColumn = typeof customers.$inferSelect;
export type InsertCustomerColumn = z.infer<typeof insertCustomerSchema>;
export type InsertLeadType = z.infer<typeof insertLeadTypeSchema>;


export type CallLog = typeof callLogs.$inferSelect;
export type InsertCallLog = z.infer<typeof insertCallLogSchema>;

// Facebook Business Suite schema definitions
export const insertFacebookIntegrationSchema = createInsertSchema(facebookIntegrations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFacebookPageSchema = createInsertSchema(facebookPages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFacebookLeadFormSchema = createInsertSchema(facebookLeadForms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFacebookPostSchema = createInsertSchema(facebookPosts).omit({
  id: true,
  createdAt: true,
});

export type FacebookIntegration = typeof facebookIntegrations.$inferSelect;
export type InsertFacebookIntegration = z.infer<typeof insertFacebookIntegrationSchema>;

export type FacebookPage = typeof facebookPages.$inferSelect;
export type InsertFacebookPage = z.infer<typeof insertFacebookPageSchema>;

export type FacebookLeadForm = typeof facebookLeadForms.$inferSelect;
export type InsertFacebookLeadForm = z.infer<typeof insertFacebookLeadFormSchema>;

export type FacebookPost = typeof facebookPosts.$inferSelect;
export type InsertFacebookPost = z.infer<typeof insertFacebookPostSchema>;

// Dynamic Fields Schema for tenant-specific custom fields
export const dynamicFields = pgTable("dynamic_fields", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  fieldName: varchar("field_name", { length: 100 }).notNull(),
  fieldLabel: varchar("field_label", { length: 200 }).notNull(),
  fieldType: varchar("field_type", { length: 50 }).notNull(), // text, number, select, date, boolean
  fieldOptions: text("field_options"), // JSON string for select options
  isRequired: boolean("is_required").default(false),
  isEnabled: boolean("is_enabled").default(true),
  displayOrder: integer("display_order").default(0),
  // Module visibility controls
  showInLeads: boolean("show_in_leads").default(true),
  showInCustomers: boolean("show_in_customers").default(false),
  showInInvoices: boolean("show_in_invoices").default(false),
  showInBookings: boolean("show_in_bookings").default(false),
  showInPackages: boolean("show_in_packages").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const dynamicFieldInsertSchema = createInsertSchema(dynamicFields).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Estimates table for custom estimates with logo, discounts, deposits, etc.
export const estimates = pgTable("estimates", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  customerId: integer("customer_id").references(() => customers.id),
  estimateNumber: varchar("estimate_number", { length: 50 }).notNull(),
  invoiceNumber: varchar("invoice_number", { length: 50 }), // New field for invoice number
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  currency: varchar("currency", { length: 10 }).notNull().default("USD"), // New currency field
  customerName: varchar("customer_name", { length: 200 }).notNull(),
  customerEmail: varchar("customer_email", { length: 200 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 50 }),
  customerAddress: text("customer_address"),
  
  // Financial details
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull().default("0.00"),
  discountType: varchar("discount_type", { length: 20 }).default("none"), // none, percentage, fixed
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).default("0.00"),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0.00"),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("0.00"),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0.00"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull().default("0.00"),
  
  // Payment terms
  depositRequired: boolean("deposit_required").default(false),
  depositAmount: decimal("deposit_amount", { precision: 10, scale: 2 }).default("0.00"),
  depositPercentage: decimal("deposit_percentage", { precision: 5, scale: 2 }).default("0.00"),
  paymentTerms: text("payment_terms"),
  
  // Design customization
  logoUrl: text("logo_url"),
  brandColor: varchar("brand_color", { length: 7 }).default("#0BBCD6"),
  notes: text("notes"),
  
  // Status and dates
  status: varchar("status", { length: 20 }).notNull().default("draft"), // draft, sent, viewed, accepted, rejected, expired
  validUntil: timestamp("valid_until"),
  sentAt: timestamp("sent_at"),
  viewedAt: timestamp("viewed_at"),
  acceptedAt: timestamp("accepted_at"),
  rejectedAt: timestamp("rejected_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Estimate line items
export const estimateLineItems = pgTable("estimate_line_items", {
  id: serial("id").primaryKey(),
  estimateId: integer("estimate_id").notNull().references(() => estimates.id, { onDelete: 'cascade' }),
  itemName: varchar("item_name", { length: 200 }).notNull(),
  description: text("description"),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull().default("1.00"),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull().default("0.00"),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull().default("0.00"),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Estimate email logs
export const estimateEmailLogs = pgTable("estimate_email_logs", {
  id: serial("id").primaryKey(),
  estimateId: integer("estimate_id").notNull().references(() => estimates.id, { onDelete: 'cascade' }),
  tenantId: integer("tenant_id").notNull(),
  recipientEmail: varchar("recipient_email", { length: 200 }).notNull(),
  subject: varchar("subject", { length: 300 }),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, sent, failed
  errorMessage: text("error_message"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertEstimateSchema = createInsertSchema(estimates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEstimateLineItemSchema = createInsertSchema(estimateLineItems).omit({
  id: true,
  createdAt: true,
});

export const insertEstimateEmailLogSchema = createInsertSchema(estimateEmailLogs).omit({
  id: true,
  createdAt: true,
});

// Types
export type Estimate = typeof estimates.$inferSelect;
export type InsertEstimate = z.infer<typeof insertEstimateSchema>;

export type EstimateLineItem = typeof estimateLineItems.$inferSelect;
export type InsertEstimateLineItem = z.infer<typeof insertEstimateLineItemSchema>;

export type EstimateEmailLog = typeof estimateEmailLogs.$inferSelect;
export type InsertEstimateEmailLog = z.infer<typeof insertEstimateEmailLogSchema>;

export type DynamicField = typeof dynamicFields.$inferSelect;
export type DynamicFieldInsert = z.infer<typeof dynamicFieldInsertSchema>;

// Dynamic Field Values for storing custom field data
export const dynamicFieldValues = pgTable("dynamic_field_values", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  fieldId: integer("field_id").notNull().references(() => dynamicFields.id, { onDelete: "cascade" }),
  fieldValue: text("field_value"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const dynamicFieldValueInsertSchema = createInsertSchema(dynamicFieldValues).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type DynamicFieldValue = typeof dynamicFieldValues.$inferSelect;
export type DynamicFieldValueInsert = z.infer<typeof dynamicFieldValueInsertSchema>;

// Customer Files and Documents table for unified file management
export const customerFiles = pgTable("customer_files", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileType: varchar("file_type", { length: 20 }).notNull(), // image, document, video, file
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  fileSize: integer("file_size").notNull(), // Size in bytes
  objectPath: text("object_path").notNull(), // Path in object storage
  uploadedBy: integer("uploaded_by").notNull().references(() => users.id),
  tags: json("tags").$type<string[]>().default([]), // Tags for categorization
  description: text("description"), // Optional description
  isPublic: boolean("is_public").notNull().default(false), // Public/private access
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const customerFileInsertSchema = createInsertSchema(customerFiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CustomerFile = typeof customerFiles.$inferSelect;
export type InsertCustomerFile = z.infer<typeof customerFileInsertSchema>;

// Lead Activities - Track all activities related to leads  
export const leadActivities = pgTable("lead_activities", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  leadId: integer("lead_id").notNull().references(() => leads.id),
  userId: integer("user_id").notNull().references(() => users.id),
  activityType: integer("activity_type").notNull(), // 1: Lead Created, 2: Email Sent, 3: Call Made, 4: Meeting Scheduled, etc.
  activityTitle: text("activity_title").notNull(),
  activityDescription: text("activity_description"),
  activityStatus: integer("activity_status").notNull(), // 1: Active/Completed, 0: Inactive/Pending
  activityDate: timestamp("activity_date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const leadActivityInsertSchema = createInsertSchema(leadActivities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type LeadActivity = typeof leadActivities.$inferSelect;
export type InsertLeadActivity = z.infer<typeof leadActivityInsertSchema>;

// Lead Notes - Track all notes related to leads  
export const leadNotes = pgTable("lead_notes", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  leadId: integer("lead_id").notNull().references(() => leads.id),
  userId: integer("user_id").notNull().references(() => users.id),
  noteTitle: text("title").notNull(), // Maps to database 'title' column
  noteContent: text("details"), // Maps to database 'details' column
  noteType: text("note_type").default("general"), // general, important, reminder, follow-up
  attachment: text("attachment"), // File path/URL for uploaded files
  reminder: boolean("reminder").default(false), // Checkbox for enabling reminder
  reminderAuto: boolean("reminder_auto").default(true), // true = for self, false = for someone else
  reminderEmail: text("reminder_email"), // Email for reminder when reminder_auto is false
  reminderDate: timestamp("reminder_date"), // When to send the reminder
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const leadNoteInsertSchema = createInsertSchema(leadNotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type LeadNote = typeof leadNotes.$inferSelect;
export type InsertLeadNote = z.infer<typeof leadNoteInsertSchema>;

// Package Types types (missing from exports)
export type PackageType = typeof packageTypes.$inferSelect;
export type InsertPackageType = z.infer<typeof insertPackageTypeSchema>;

// Package Types schema (missing from exports)
export const insertPackageTypeSchema = createInsertSchema(packageTypes).omit({
  id: true,
  createdAt: true,
});

// Travel Packages types (missing from exports)
export type TravelPackage = typeof travelPackages.$inferSelect;
export type InsertTravelPackage = z.infer<typeof insertTravelPackageSchema>;

// Customer Activities - Track all activities related to customers  
export const customerActivities = pgTable("customer_activities", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  userId: integer("user_id").notNull().references(() => users.id),
  activityType: integer("activity_type").notNull(), // 1: Customer Created, 2: Email Sent, 3: Call Made, 4: Meeting Scheduled, etc.
  activityTitle: text("activity_title").notNull(),
  activityDescription: text("activity_description"),
  activityStatus: integer("activity_status").notNull(), // 1: Active/Completed, 0: Inactive/Pending
  activityDate: timestamp("activity_date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const customerActivityInsertSchema = createInsertSchema(customerActivities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CustomerActivity = typeof customerActivities.$inferSelect;
export type InsertCustomerActivity = z.infer<typeof customerActivityInsertSchema>;

// Customer Notes - Track all notes related to customers  
export const customerNotes = pgTable("customer_notes", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  userId: integer("user_id").notNull().references(() => users.id),
  noteTitle: text("title").notNull(), // Maps to database 'title' column
  noteContent: text("details"), // Maps to database 'details' column
  noteType: text("note_type").default("general"), // general, important, reminder, follow-up
  attachment: text("attachment"), // File path/URL for uploaded files
  reminder: boolean("reminder").default(false), // Checkbox for enabling reminder
  reminderAuto: boolean("reminder_auto").default(true), // true = for self, false = for someone else
  reminderEmail: text("reminder_email"), // Email for reminder when reminder_auto is false
  reminderDate: timestamp("reminder_date"), // When to send the reminder
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const customerNoteInsertSchema = createInsertSchema(customerNotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CustomerNote = typeof customerNotes.$inferSelect;
export type InsertCustomerNote = z.infer<typeof customerNoteInsertSchema>;

// Customer Emails - Track all emails sent to customers  
export const customerEmails = pgTable("customer_emails", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  userId: integer("user_id").notNull().references(() => users.id),
  email: text("email").notNull(), // Recipient email address
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  htmlBody: text("html_body"), // HTML version of email body
  attachments: json("attachments").$type<Array<{filename: string; path: string}>>(), // File attachments
  status: text("status").notNull().default("sent"), // sent, delivered, failed, bounced
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  deliveredAt: timestamp("delivered_at"),
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
  bounceReason: text("bounce_reason"),
  errorMessage: text("error_message"),
  campaignId: integer("campaign_id"), // Optional link to email campaign
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const customerEmailInsertSchema = createInsertSchema(customerEmails).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CustomerEmail = typeof customerEmails.$inferSelect;
export type InsertCustomerEmail = z.infer<typeof customerEmailInsertSchema>;

// Zoom OAuth Tokens - Store Zoom access/refresh tokens per tenant
export const zoomTokens = pgTable("zoom_tokens", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  accountLabel: text("account_label").notNull(), // e.g., "Sales Team", "Support Line", "Manager"
  accountEmail: text("account_email"), // Zoom account email for identification
  isPrimary: boolean("is_primary").notNull().default(false), // Mark default account
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  scope: text("scope").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const zoomTokenInsertSchema = createInsertSchema(zoomTokens).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ZoomToken = typeof zoomTokens.$inferSelect;
export type InsertZoomToken = z.infer<typeof zoomTokenInsertSchema>;

// WhatsApp Devices - Multi-device WhatsApp connectivity management
export const whatsappDevices = pgTable("whatsapp_devices", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  number: text("number").notNull(), // WhatsApp number with country code (without +)
  webhookUrl: text("webhook_url"), // Optional webhook URL for notifications
  status: text("status").notNull().default("disconnected"), // connected, disconnected, scanning
  qrCode: text("qr_code"), // Base64 QR code for connection
  deviceName: text("device_name"), // Device name from WhatsApp
  messagesSent: integer("messages_sent").notNull().default(0), // Count of messages sent
  lastConnectedAt: timestamp("last_connected_at"),
  isDefault: boolean("is_default").notNull().default(false), // Default device for live chat
  // Device Options/Settings
  fullResponse: boolean("full_response").notNull().default(false),
  readMessages: boolean("read_messages").notNull().default(false),
  rejectCalls: boolean("reject_calls").notNull().default(false),
  showAvailable: boolean("show_available").notNull().default(false),
  showTyping: boolean("show_typing").notNull().default(false),
  messageDelay: integer("message_delay").notNull().default(0), // Delay in seconds
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const whatsappDeviceInsertSchema = createInsertSchema(whatsappDevices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type WhatsappDevice = typeof whatsappDevices.$inferSelect;
export type InsertWhatsappDevice = z.infer<typeof whatsappDeviceInsertSchema>;

// WhatsApp Configuration - Store tenant WhatsApp API credentials
export const whatsappConfig = pgTable("whatsapp_config", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().unique().references(() => tenants.id),
  username: text("username").notNull(), // Username from external API
  email: text("email").notNull(), // Email used for registration
  apiKey: text("api_key").notNull(), // Critical: API key for all WhatsApp API calls
  chunkBlast: integer("chunk_blast").notNull().default(0),
  subscriptionExpired: timestamp("subscription_expired"), // Nullable for lifetime subscriptions
  activeSubscription: text("active_subscription").notNull().default("active"), // active, inactive, expired, lifetime
  limitDevice: integer("limit_device").notNull().default(10),
  externalUserId: integer("external_user_id").notNull(), // ID from external WhatsApp API
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const whatsappConfigInsertSchema = createInsertSchema(whatsappConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type WhatsappConfig = typeof whatsappConfig.$inferSelect;
export type InsertWhatsappConfig = z.infer<typeof whatsappConfigInsertSchema>;

// WhatsApp Messages - Store all sent WhatsApp messages
export const whatsappMessages = pgTable("whatsapp_messages", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  deviceId: integer("device_id").notNull().references(() => whatsappDevices.id),
  customerId: integer("customer_id").references(() => customers.id), // Nullable - can be lead or customer
  leadId: integer("lead_id").references(() => leads.id), // Nullable - can be lead or customer
  recipientNumber: text("recipient_number").notNull(), // Phone number message was sent to
  recipientName: text("recipient_name"), // Name of recipient for display
  messageType: text("message_type").notNull(), // 'text' or 'media'
  // Text message fields
  textContent: text("text_content"), // Text message content
  // Media message fields
  mediaType: text("media_type"), // 'image', 'video', 'audio', 'document'
  mediaUrl: text("media_url"), // URL of the media file
  mediaCaption: text("media_caption"), // Caption for media
  // Status and metadata
  status: text("status").notNull().default("sent"), // 'sent', 'delivered', 'read', 'failed'
  errorMessage: text("error_message"), // Error details if failed
  externalMessageId: text("external_message_id"), // ID from WhatsApp API
  sentBy: integer("sent_by").references(() => users.id), // User who sent the message
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  deliveredAt: timestamp("delivered_at"),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const whatsappMessageInsertSchema = createInsertSchema(whatsappMessages).omit({
  id: true,
  createdAt: true,
});

export type WhatsappMessage = typeof whatsappMessages.$inferSelect;
export type InsertWhatsappMessage = z.infer<typeof whatsappMessageInsertSchema>;
