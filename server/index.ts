// Load environment variables from .env file first
import dotenv from "dotenv";
dotenv.config();

import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import https from "https";
import http from "http";
import fs from "fs";
import path from "path";
import { registerSimpleRoutes } from "./simple-routes";
import { registerSubscriptionRoutes } from "./subscription-routes";
import { setupVite, serveStatic, log } from "./vite";
import { config, validateConfig } from "./config";
import { registerProductRoutes } from "./product/product-routes";
import { checkTenantAccess } from "./routes"

// Validate configuration and display status
console.log("🔧 Initializing RateHonk CRM Server...");
validateConfig();
console.log(`🗄️  Database: ${new URL(config.database.url).hostname}`);
console.log(`🌍 Environment: ${config.server.nodeEnv}`);
console.log(`🚀 Port: ${config.server.port}`);

// Graceful shutdown handlers (only for production)
if (config.server.nodeEnv === 'production') {
  process.on('SIGTERM', () => {
    console.log('Server shutting down gracefully');
    process.exit(0);
  });
}

const app = express();

// Trust proxy for Vercel/proxies
app.set("trust proxy", true);

// Configure CORS
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow all origins in development and production
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin', 'Accept'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar']
}));

// Increase JSON payload limit to handle base64 encoded images
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// CRITICAL: Register invoice import routes EARLY to avoid routing conflicts
import multer from "multer";
import * as XLSX from "xlsx";
import { authenticate } from "./estimates-routes";
registerProductRoutes(app, authenticate, checkTenantAccess);


// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Multi-format file parsing functions
async function parseExcelFile(buffer: Buffer): Promise<any[]> {
  console.log("📊 INDEX.TS PARSING: parseExcelFile function called with buffer size:", buffer.length);
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Get data as array of arrays to handle the specific format
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
  console.log(`📊 DEBUGGING: Excel parsed: ${data.length} total rows`);
  console.log(`📊 DEBUGGING: First 5 rows:`, data.slice(0, 5));
  
  const invoices = [];
  
  // Process each row starting from row 2 (skip headers)
  for (let i = 2; i < data.length; i++) {
    const row = data[i] as any[];
    
    console.log(`📊 DEBUGGING: Processing row ${i}:`, row);
    
    if (row && row.length >= 6) {
      const type = row[1]?.toString() || '';
      const amount = parseFloat(String(row[5]).replace(/[^0-9.-]/g, '')) || 0;
      
      console.log(`📊 DEBUGGING: Row ${i} - Type: "${type}", Amount: ${amount}`);
      
      // Only process Invoice types with positive amounts
      console.log(`📊 DEBUGGING: Checking conditions - type.toLowerCase(): "${type.toLowerCase()}", amount > 0: ${amount > 0}`);
      if (type.toLowerCase() === 'invoice' && amount > 0) {
        console.log(`📊 DEBUGGING: Row ${i} passed checks, creating invoice...`);  
        const customerName = row[3]?.toString() || 'Unknown Customer';
        const invoiceNumber = row[2]?.toString() || `IMP-${Date.now()}-${i}`;
        const status = mapExcelStatus(row[6]?.toString());
        const invoiceDate = parseExcelDate(row[0]?.toString()) || new Date().toISOString().split('T')[0];
        
        invoices.push({
          invoiceNumber,
          customerName,
          totalAmount: amount,
          subtotal: amount,
          taxAmount: 0,
          status,
          invoiceDate,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          notes: `Imported from Excel - ${row[4]?.toString() || 'No memo'}`,
          currency: 'USD'
        });
      }
    }
  }
  
  console.log(`📊 Extracted ${invoices.length} invoices from Excel file`);
  return invoices;
}

function mapExcelStatus(excelStatus: string): string {
  if (!excelStatus) return 'pending';
  
  const status = excelStatus.toLowerCase();
  if (status.includes('paid')) return 'paid';
  if (status.includes('overdue')) return 'overdue';
  if (status.includes('draft')) return 'draft';
  return 'pending';
}

function parseExcelDate(dateStr: string): string | null {
  if (!dateStr) return null;
  
  try {
    // Handle DD/MM/YYYY format
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        return `${year}-${month}-${day}`;
      }
    }
    
    // Fallback to Date parsing
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch (error) {
    console.log('Date parsing error:', error);
  }
  
  return null;
}

async function parseCsvFile(buffer: Buffer): Promise<any[]> {
  console.log("📄 Parsing CSV file...");
  const csvText = buffer.toString('utf-8');
  const lines = csvText.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    throw new Error('CSV file must have at least header and one data row');
  }
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    data.push(row);
  }
  
  console.log(`📄 CSV parsed: ${data.length} rows`);
  return data;
}

async function parseXmlFile(buffer: Buffer): Promise<any[]> {
  console.log("🔖 Parsing XML file...");
  const xmlText = buffer.toString('utf-8');
  
  // Simple XML parsing for invoice data
  const invoiceMatches = xmlText.match(/<invoice[^>]*>[\s\S]*?<\/invoice>/gi) || [];
  const data = [];
  
  for (const invoiceXml of invoiceMatches) {
    const invoice: any = {};
    
    // Extract common fields using regex
    const extractField = (fieldName: string) => {
      const regex = new RegExp(`<${fieldName}[^>]*>([^<]*)<\/${fieldName}>`, 'i');
      const match = invoiceXml.match(regex);
      return match ? match[1].trim() : '';
    };
    
    invoice.number = extractField('number') || extractField('id') || extractField('invoice_number');
    invoice.customer_name = extractField('customer') || extractField('client') || extractField('customer_name');
    invoice.total_amount = extractField('amount') || extractField('total') || extractField('total_amount');
    invoice.issue_date = extractField('date') || extractField('issue_date') || extractField('created_date');
    invoice.due_date = extractField('due_date') || extractField('payment_due');
    invoice.status = extractField('status') || extractField('payment_status');
    
    data.push(invoice);
  }
  
  console.log(`🔖 XML parsed: ${data.length} invoices`);
  return data;
}

// Field extraction helpers
function extractField(row: any, patterns: string[]): string {
  for (const pattern of patterns) {
    const normalizedKey = pattern.toLowerCase().replace(/\s+/g, '_');
    if (row[normalizedKey] || row[pattern]) {
      return String(row[normalizedKey] || row[pattern]).trim();
    }
  }
  return '';
}

function processInvoiceData(parsedData: any[], existingCustomers: any[], tenantId: string): any[] {
  const processedInvoices = [];
  
  for (const row of parsedData) {
    const invoice: any = {};
    
    // Extract invoice number
    invoice.invoiceNumber = extractField(row, [
      'invoice_number', 'number', 'id', 'invoice_id', 'invoice_no', 'No.'
    ]);
    
    // Extract customer name
    invoice.customerName = extractField(row, [
      'customer_name', 'customer', 'client_name', 'client', 'name'
    ]);
    
    // Extract amount
    const amountStr = extractField(row, [
      'total_amount', 'amount', 'total', 'price', 'value'
    ]);
    invoice.totalAmount = parseFloat(amountStr.replace(/[,$]/g, '')) || 0;
    
    // Extract dates
    invoice.issueDate = extractField(row, [
      'issue_date', 'date', 'created_date', 'invoice_date'
    ]);
    
    invoice.dueDate = extractField(row, [
      'due_date', 'payment_due', 'due'
    ]);
    
    // Extract status
    invoice.status = extractField(row, [
      'status', 'payment_status', 'state'
    ]) || 'pending';
    
    // Extract currency
    invoice.currency = extractField(row, [
      'currency', 'curr'
    ]) || 'USD';
    
    // Extract notes
    invoice.notes = extractField(row, [
      'notes', 'description', 'memo', 'comments'
    ]);
    
    // Customer matching
    if (invoice.customerName && existingCustomers) {
      const match = existingCustomers.find(customer => 
        customer.name && customer.name.toLowerCase().includes(invoice.customerName.toLowerCase())
      );
      invoice.customerMatch = match || null;
      invoice.customerId = match?.id || null;
    }
    
    // Only add if we have essential data
    if (invoice.invoiceNumber || invoice.customerName || invoice.totalAmount > 0) {
      processedInvoices.push(invoice);
    }
  }
  
  return processedInvoices;
}

// CRITICAL EARLY REGISTRATION: Multi-format invoice import parser
app.post("/api/parse-invoice-file", upload.single('file'), async (req, res) => {
  console.log("🚀 INDEX.TS ENDPOINT HIT! (EARLY REGISTERED PARSER ENDPOINT)");
  console.log("📁 File received:", req.file?.originalname);
  console.log("📋 File size:", req.file?.size);
  
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const { tenantId } = req.body;
    if (!tenantId) {
      return res.status(400).json({ success: false, message: "Tenant ID required" });
    }

    const fileExtension = req.file.originalname.toLowerCase().split('.').pop();
    console.log(`📄 Processing ${fileExtension} file: ${req.file.originalname}`);

    let parsedData = [];
    
    // Parse based on file type
    switch (fileExtension) {
      case 'xls':
      case 'xlsx':
      case 'xl':
        parsedData = await parseExcelFile(req.file.buffer);
        break;
      case 'csv':
        parsedData = await parseCsvFile(req.file.buffer);
        break;
      case 'xml':
        parsedData = await parseXmlFile(req.file.buffer);
        break;
      default:
        return res.status(400).json({ 
          success: false, 
          message: `Unsupported file format: ${fileExtension}. Supported formats: .xls, .xlsx, .xl, .csv, .xml` 
        });
    }

    // Process and validate invoice data (skip processing for Excel as it's already processed)
    let processedInvoices = parsedData;
    
    // Add customer matching for non-Excel files
    if (!['xls', 'xlsx', 'xl'].includes(fileExtension)) {
      processedInvoices = processInvoiceData(parsedData, [], tenantId);
    }
    
    console.log("📊 INDEX.TS: Final processedInvoices count:", processedInvoices.length);
    console.log("📊 INDEX.TS: Sample invoice:", processedInvoices[0]);
    
    return res.json({
      success: true,
      message: `Successfully parsed ${processedInvoices.length} invoice records`,
      data: {
        fileInfo: {
          name: req.file.originalname,
          type: fileExtension,
          size: req.file.size
        },
        invoices: processedInvoices,
        summary: {
          total: processedInvoices.length,
          matchedCustomers: 0,
          unmatchedCustomers: processedInvoices.length,
          totalAmount: processedInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0)
        }
      }
    });

  } catch (error: unknown) {
    console.error("📄 Invoice parse error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to parse invoice file";
    return res.status(500).json({ 
      success: false, 
      message: errorMessage
    });
  }
});

console.log("✅ EARLY REGISTRATION: Invoice parser route registered at /api/parse-invoice-file");

// Simple test endpoint to verify server logs
app.get("/api/test-logs", (req, res) => {
  console.log("🧪 TEST ENDPOINT HIT - Server logs are working!");
  res.json({ message: "Test endpoint working", timestamp: new Date().toISOString() });
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Force reload timestamp
  console.log('Server reloaded at:', new Date().toISOString());

  // Add middleware to log all requests BEFORE routes
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      console.log(`🔍 API Request: ${req.method} ${req.path}`);
    }
    next();
  });

  // Test API route to confirm routing works
  app.get('/api/test-routing', (req, res) => {
    res.json({ success: true, message: 'API routing is working!', timestamp: new Date().toISOString() });
  });


  // Register subscription routes first
  registerSubscriptionRoutes(app);
  
  // Register ALL API routes BEFORE Vite setup and BEFORE catch-all
  console.log('🔧 Registering simple routes...');
  
  // Vercel Cron Job Endpoints
  // These allow Vercel to trigger background tasks via HTTP requests
  app.get('/api/cron/process-all', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.error('❌ Unauthorized cron attempt');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('📅 Cron: Processing all background tasks...');
    try {
      // Import schedulers dynamically to avoid startup overhead if not needed
      const { campaignScheduler } = await import("./campaign-scheduler");
      const { processLeadFollowUpAutomations } = await import("./lead-follow-up-scheduler");
      const { processInvoicePaymentReminders } = await import("./invoice-reminder-scheduler");
      const { processInvoiceStatusAutomations } = await import("./invoice-automation-scheduler");
      const { processWhatsAppContactSync } = await import("./whatsapp-contact-sync-scheduler");

      // Run all tasks (non-blocking or awaiting depends on desired behavior)
      // We await them here so the cron request stays open until finished (Vercel allows up to 10s-60s)
      await Promise.allSettled([
        campaignScheduler.processScheduledCampaigns(),
        processLeadFollowUpAutomations(),
        processInvoicePaymentReminders(),
        processInvoiceStatusAutomations(),
        processWhatsAppContactSync()
      ]);

      res.json({ success: true, message: 'All background tasks processed' });
    } catch (error: any) {
      console.error('❌ Cron execution failed:', error);
      res.status(500).json({ error: 'Cron execution failed', details: error.message });
    }
  });

  app.get('/api/cron/campaigns', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) return res.status(401).send('Unauthorized');
    
    const { campaignScheduler } = await import("./campaign-scheduler");
    await campaignScheduler.processScheduledCampaigns();
    res.json({ success: true });
  });

  app.get('/api/cron/lead-follow-ups', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) return res.status(401).send('Unauthorized');
    
    const { processLeadFollowUpAutomations } = await import("./lead-follow-up-scheduler");
    await processLeadFollowUpAutomations();
    res.json({ success: true });
  });
  let server;
  try {
    // Add a direct Facebook configure route in index.ts as a test
    app.post('/api/tenants/:tenantId/facebook/configure', async (req, res) => {
      console.log('🔵 DIRECT Facebook configure route hit!', req.params, req.body);
      try {
        res.json({ 
          success: true, 
          message: 'Facebook credentials configured successfully (DIRECT ROUTE)' 
        });
      } catch (error: unknown) {
        console.error('❌ Error in direct Facebook configure:', error);
        res.status(500).json({ error: 'Failed to configure Facebook credentials' });
      }
    });
    
    server = await registerSimpleRoutes(app);
    console.log('✅ Simple routes registered successfully');
    
    // Register estimates routes
    console.log('🔧 Registering estimates routes...');
    const { registerEstimatesRoutes } = await import("./estimates-routes");
    registerEstimatesRoutes(app);
    console.log('✅ Estimates routes registered successfully');

    // Register WhatsApp routes (includes QR code generation)
    console.log('🔧 Registering WhatsApp routes...');
    const { registerWhatsAppRoutes } = await import("./whatsapp-routes");
    registerWhatsAppRoutes(app);
    console.log('✅ WhatsApp routes registered successfully');

    // Reports routes have been moved to main routes.ts file
    
  } catch (error: unknown) {
    console.error('❌ ERROR registering simple routes:', error);
    if (error instanceof Error) {
      console.error('❌ Error stack:', error.stack);
    }
    process.exit(1);
  }

  // Add health check endpoint BEFORE Vite setup
  app.get('/health', (_, res) => res.status(200).send('ok'));
  
  // Start HTTP/HTTPS server immediately to ensure it binds to port
  const port = process.env.PORT || config.server.port || 5000;
  const useHttps = process.env.USE_HTTPS === 'true';
  
  // Check for SSL certificates
  const certsDir = path.join(process.cwd(), 'certs');
  const keyPath = path.join(certsDir, 'localhost-key.pem');
  const certPath = path.join(certsDir, 'localhost.pem');
  const hasCertificates = fs.existsSync(keyPath) && fs.existsSync(certPath);
  
  // Setup Vite in development or serve static files in production (non-blocking)
  console.log(`🔧 NODE_ENV: ${config.server.nodeEnv} - Using ${config.server.nodeEnv === "development" ? 'Vite dev server' : 'static files'}`);
  
  if (useHttps && hasCertificates) {
    // Create HTTPS server
    const httpsOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };
    
    const httpsServer = https.createServer(httpsOptions, app);
    
    // Setup Vite with HTTPS server if in development
    if (config.server.nodeEnv === "development") {
      setupVite(app, httpsServer).catch((error) => {
        console.error('❌ Vite setup failed:', error);
      });
    } else {
      serveStatic(app);
    }
    
    httpsServer.listen(port, "0.0.0.0", () => {
      console.log(`✅ HTTPS Server listening on https://localhost:${port}`);
      console.log(`🏥 Health check: https://localhost:${port}/health`);
      console.log(`🔒 Using SSL certificates from: ${certsDir}`);
    });
    
    // Also start HTTP server on port + 1 for redirect (optional)
    const httpPort = port + 1;
    http.createServer((req, res) => {
      res.writeHead(301, { Location: `https://${req.headers.host?.replace(`:${httpPort}`, `:${port}`)}${req.url}` });
      res.end();
    }).listen(httpPort, () => {
      console.log(`ℹ️  HTTP redirect server on http://localhost:${httpPort} (redirects to HTTPS)`);
    });
  } else {
    // Start HTTP server
    if (config.server.nodeEnv === "development") {
      setupVite(app, server).catch((error) => {
        console.error('❌ Vite setup failed:', error);
      });
    } else {
      serveStatic(app);
    }
    
    if (!process.env.VERCEL) {
      server.listen(port, "0.0.0.0", () => {
        const protocol = useHttps && !hasCertificates ? 'https (certificates missing)' : 'http';
        console.log(`✅ Server listening on ${protocol}://localhost:${port}`);
        console.log(`🏥 Health check: ${protocol}://localhost:${port}/health`);
        if (useHttps && !hasCertificates) {
          console.log(`⚠️  HTTPS requested but certificates not found. Run: npm run generate-cert`);
        }
      });
    }
  }

  // Add catch-all for unhandled API routes (MUST be after all route registration)
  app.use('/api/*', (req, res) => {
    console.log(`🔍 Unhandled API route: ${req.method} ${req.originalUrl}`);
    console.log(`🔍 Full request details:`, {
      path: req.path,
      url: req.url,
      originalUrl: req.originalUrl,
      params: req.params,
      query: req.query
    });
    res.status(404).json({ message: `API route not found: ${req.originalUrl}` });
  });

  // Error handling middleware (must be last)
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Start schedulers ONLY if NOT running on Vercel
  // Vercel handles these via Cron Job endpoints defined above
  if (!process.env.VERCEL) {
    // Start campaign scheduler
    try {
      const { campaignScheduler } = await import("./campaign-scheduler");
      campaignScheduler.start();
    } catch (error) {
      console.error("Failed to start campaign scheduler:", error);
    }

    // Start lead follow-up automation scheduler
    try {
      const { startLeadFollowUpScheduler } = await import("./lead-follow-up-scheduler");
      startLeadFollowUpScheduler();
    } catch (error) {
      console.error("Failed to start lead follow-up scheduler:", error);
    }

    // Start invoice payment reminder scheduler
    try {
      const { startInvoiceReminderScheduler } = await import("./invoice-reminder-scheduler");
      startInvoiceReminderScheduler();
      const { startInvoiceAutomationScheduler } = await import("./invoice-automation-scheduler");
      startInvoiceAutomationScheduler();
    } catch (error) {
      console.error("Failed to start invoice reminder scheduler:", error);
    }

    // Start WhatsApp contact sync scheduler
    try {
      const { startWhatsAppContactSyncScheduler } = await import("./whatsapp-contact-sync-scheduler");
      startWhatsAppContactSyncScheduler();
    } catch (error) {
      console.error("Failed to start WhatsApp contact sync scheduler:", error);
    }
  } else {
    console.log("🚀 Running on Vercel: Standard schedulers disabled (using Cron Job endpoints)");
  }

  // Server already started above before Vite setup
})();

export default app;
