import type { Express } from "express";
import { storage } from "./storage.js";
import { simpleStorage} from "./simple-storage.js";
import { sql } from "./db.js";
import jwt from "jsonwebtoken";
import multer from "multer";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Configure multer for estimate attachments
const estimateAttachmentUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp",
      "application/pdf",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`) as any, false);
    }
  },
});

// Proper JWT authentication middleware
export const authenticate = async (req: any, res: any, next: any) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await simpleStorage.getUser(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: "Invalid token" });
    }

    // Map snake_case to camelCase for compatibility
    req.user = { ...user, tenantId: user.tenant_id };
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({ message: "Invalid token" });
  }
};

// Transform database result to camelCase for frontend
function transformEstimate(estimate: any) {
  // Handle both snake_case (from DB) and camelCase (already transformed) formats
  return {
    id: estimate.id,
    estimateNumber: estimate.estimate_number || estimate.estimateNumber,
    title: estimate.title,
    invoiceNumber: estimate.invoice_number || estimate.invoiceNumber,
    currency: estimate.currency,
    customerId: estimate.customer_id || estimate.customerId,
    leadId: estimate.lead_id || estimate.leadId,
    customerName: estimate.customer_name || estimate.customerName,
    customerEmail: estimate.customer_email || estimate.customerEmail,
    customerPhone: estimate.customer_phone || estimate.customerPhone,
    customerAddress: estimate.customer_address || estimate.customerAddress,
    description: estimate.description,
    status: estimate.status,
    totalAmount: estimate.total_amount || estimate.totalAmount,
    validUntil: estimate.valid_until || estimate.validUntil,
    notes: estimate.notes,
    logoUrl: estimate.logo_url || estimate.logoUrl,
    discountType: estimate.discount_type || estimate.discountType,
    discountValue: estimate.discount_value || estimate.discountValue,
    discountAmount: estimate.discount_amount || estimate.discountAmount,
    subtotal: estimate.subtotal,
    taxRate: estimate.tax_rate || estimate.taxRate,
    taxAmount: estimate.tax_amount || estimate.taxAmount,
    depositRequired: estimate.deposit_required || estimate.depositRequired,
    depositAmount: estimate.deposit_amount || estimate.depositAmount,
    depositPercentage: estimate.deposit_percentage || estimate.depositPercentage,
    paymentTerms: estimate.payment_terms || estimate.paymentTerms,
    createdAt: estimate.created_at || estimate.createdAt,
    updatedAt: estimate.updated_at || estimate.updatedAt,
    sentAt: estimate.sent_at || estimate.sentAt,
    viewedAt: estimate.viewed_at || estimate.viewedAt,
    acceptedAt: estimate.accepted_at || estimate.acceptedAt,
    rejectedAt: estimate.rejected_at || estimate.rejectedAt,
    attachments: (() => {
      try {
        if (typeof estimate.attachments === 'string') {
          return JSON.parse(estimate.attachments);
        }
        return estimate.attachments || [];
      } catch {
        return [];
      }
    })(),
  };
}

export function registerEstimatesRoutes(app: Express) {
  // Estimate attachments upload endpoint
  app.post(
    "/api/estimate-attachments/upload",
    authenticate,
    estimateAttachmentUpload.array('attachments', 10),
    async (req: any, res) => {
      try {
        if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
          return res.status(400).json({ message: "No files uploaded" });
        }

        const { ObjectStorageService } = await import("./objectStorage");
        const objectStorage = new ObjectStorageService();

        const uploadedFiles = [];

        for (const file of req.files) {
          const fileName = `estimate-attachments/${Date.now()}-${file.originalname}`;
          
          try {
            const url = await objectStorage.uploadFile(
              fileName,
              file.buffer,
              file.mimetype
            );

            uploadedFiles.push({
              filename: file.originalname,
              path: url,
              size: file.size,
              mimetype: file.mimetype,
            });
          } catch (uploadError) {
            console.error(`Error uploading file ${file.originalname}:`, uploadError);
            throw uploadError;
          }
        }

        res.json({ files: uploadedFiles });
      } catch (error: any) {
        console.error("Error uploading estimate attachments:", error);
        res.status(500).json({ message: error.message || "Failed to upload attachments" });
      }
    }
  );

  // Tenant-based routes (matching frontend API calls)
  app.get(
    "/api/tenants/:tenantId/estimates",
    authenticate,
    async (req: any, res) => {
      try {
        const tenantId = parseInt(req.params.tenantId);
        console.log("📊 Getting estimates for tenant:", tenantId);
        const estimates = await storage.getEstimatesByTenant(tenantId);
        console.log("📊 Found estimates:", estimates.length);
        console.log(
          "📊 Raw estimate sample:",
          estimates[0] ? JSON.stringify(estimates[0], null, 2) : "No estimates",
        );

        // Transform data to camelCase for frontend
        const transformedEstimates = estimates.map(transformEstimate);
        console.log(
          "📊 Transformed estimate sample:",
          transformedEstimates[0]
            ? JSON.stringify(transformedEstimates[0], null, 2)
            : "No estimates",
        );
        res.json(transformedEstimates);
      } catch (error: any) {
        console.error("Error getting estimates:", error);
        res.status(500).json({ message: "Failed to get estimates" });
      }
    },
  );

  app.post(
    "/api/tenants/:tenantId/estimates",
    authenticate,
    async (req: any, res) => {
      try {
        const tenantId = parseInt(req.params.tenantId);
        console.log("📊 Creating estimate for tenant:", tenantId);
        console.log("📊 Estimate data:", req.body);

        // Validate required fields
        if (
          !req.body.title ||
          !req.body.customerName ||
          !req.body.customerEmail
        ) {
          return res.status(400).json({
            message:
              "Missing required fields: title, customerName, and customerEmail are required",
          });
        }

        // Calculate totals from line items
        let subtotal = 0;
        if (req.body.lineItems && Array.isArray(req.body.lineItems)) {
          subtotal = req.body.lineItems.reduce((sum: number, item: any) => {
            return sum + (parseFloat(item.totalPrice) || 0);
          }, 0);
        }

        const taxRate = parseFloat(req.body.taxRate) || 0;
        const taxAmount = subtotal * (taxRate / 100);
        const discountAmount = parseFloat(req.body.discountAmount) || 0;
        const totalAmount = subtotal + taxAmount - discountAmount;

        const estimateData = {
          tenantId: tenantId,
          customerId: req.body.customerId || null,
          estimateNumber: req.body.estimateNumber || `EST-${Date.now()}`,
          invoiceNumber: req.body.invoiceNumber || null,
          title: req.body.title,
          description: req.body.description || "",
          currency: req.body.currency || "USD",
          customerName: req.body.customerName,
          customerEmail: req.body.customerEmail,
          customerPhone: req.body.customerPhone || null,
          customerAddress: req.body.customerAddress || null,

          // Financial calculations
          subtotal: subtotal.toFixed(2),
          discountType: req.body.discountType || "none",
          discountValue: (parseFloat(req.body.discountValue) || 0).toString(),
          discountAmount: discountAmount.toFixed(2),
          taxRate: taxRate.toFixed(2),
          taxAmount: taxAmount.toFixed(2),
          totalAmount: totalAmount.toFixed(2),

          // Additional fields
          depositRequired: req.body.depositRequired || false,
          depositAmount: (parseFloat(req.body.depositAmount) || 0).toString(),
          depositPercentage: (
            parseFloat(req.body.depositPercentage) || 0
          ).toString(),
          paymentTerms: req.body.paymentTerms || "Due on receipt",
          logoUrl: req.body.logoUrl || null,
          brandColor: req.body.brandColor || "#0BBCD6",
          notes: req.body.notes || null,
          status: req.body.status || "draft",
          validUntil: req.body.validUntil
            ? new Date(req.body.validUntil)
            : null,
        };

        console.log("📊 Processed estimate data:", estimateData);

        const estimate = await storage.createEstimate(estimateData);
        console.log("📊 Created estimate:", estimate);

        // Create line items if provided
        if (req.body.lineItems && Array.isArray(req.body.lineItems)) {
          console.log("📊 Creating line items:", req.body.lineItems.length);
          for (const [index, item] of req.body.lineItems.entries()) {
            await storage.createEstimateLineItem({
              estimateId: estimate.id,
              itemName: item.itemName || "Item",
              description: item.description || "",
              quantity: (parseFloat(item.quantity) || 1).toString(),
              unitPrice: (parseFloat(item.unitPrice) || 0).toString(),
              totalPrice: (parseFloat(item.totalPrice) || 0).toString(),
              displayOrder: index,
              category: item.leadCategory || item.category || null,
              taxRateId: item.taxRateId ? parseInt(item.taxRateId) : null,
              tax: item.tax ? parseFloat(item.tax).toString() : null,
              discount: item.discount ? parseFloat(item.discount).toString() : null,
            });
          }
        }

        res.status(201).json(estimate);
      } catch (error: any) {
        console.error("Error creating estimate:", error);
        console.error("Error details:", error.stack);
        res
          .status(500)
          .json({ message: "Failed to create estimate", error: error.message });
      }
    },
  );

  app.get(
    "/api/tenants/:tenantId/estimates/:id/pdf",
    authenticate,
    async (req: any, res) => {
      try {
        const tenantId = parseInt(req.params.tenantId);
        const estimateId = parseInt(req.params.id);
        console.log("📄 Generating PDF for estimate:", estimateId);

        const estimate = await storage.getEstimate(estimateId, tenantId);
        if (!estimate) {
          return res.status(404).json({ message: "Estimate not found" });
        }

        // Get line items
        const lineItems = await storage.getEstimateLineItems(estimateId);

        // Generate a simple HTML-to-PDF conversion
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Estimate ${estimate.estimateNumber}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f5f5f5; }
        .total-section { text-align: right; margin-top: 20px; }
        .total-line { margin: 5px 0; }
        .balance-due { font-weight: bold; font-size: 18px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>RateHonk Travel Services</h1>
        <p>123 Travel Lane, Suite 100<br>Travel City, TC 12345<br>(555) 123-4567</p>
    </div>
    
    <h2>ESTIMATE</h2>
    
    <div>
        <strong>ESTIMATE #:</strong> ${estimate.estimateNumber}<br>
        <strong>DATE:</strong> ${new Date(estimate.createdAt).toLocaleDateString()}<br>
        <strong>VALID UNTIL:</strong> ${estimate.validUntil ? new Date(estimate.validUntil).toLocaleDateString() : "N/A"}
    </div>
    
    <div style="margin: 20px 0;">
        <strong>BILL TO:</strong><br>
        ${estimate.customerName}<br>
        ${estimate.customerEmail}<br>
        ${estimate.customerPhone || ""}<br>
        ${estimate.customerAddress || ""}
    </div>
    
    <table>
        <thead>
            <tr>
                <th>ITEM</th>
                <th>QTY</th>
                <th>RATE</th>
                <th>AMOUNT</th>
            </tr>
        </thead>
        <tbody>
            ${lineItems
              .map(
                (item: any) => `
                <tr>
                    <td>${item.itemName}</td>
                    <td>${item.quantity}</td>
                    <td>$${parseFloat(item.unitPrice).toFixed(2)}</td>
                    <td>$${parseFloat(item.totalPrice).toFixed(2)}</td>
                </tr>
            `,
              )
              .join("")}
        </tbody>
    </table>
    
    <div class="total-section">
        <div class="total-line">SUBTOTAL: $${estimate.subtotal}</div>
        <div class="total-line">DISCOUNT: -$${estimate.discountAmount}</div>
        <div class="total-line">TAX: $${estimate.taxAmount}</div>
        <div class="total-line balance-due">BALANCE DUE: $${estimate.totalAmount}</div>
    </div>
    
    ${estimate.notes ? `<div style="margin-top: 30px;"><strong>NOTES:</strong><br>${estimate.notes}</div>` : ""}
</body>
</html>
      `;

        res.setHeader("Content-Type", "text/html");
        res.setHeader(
          "Content-Disposition",
          `inline; filename=estimate-${estimate.estimateNumber}.html`,
        );
        res.send(htmlContent);
      } catch (error: any) {
        console.error("Error generating PDF:", error);
        res.status(500).json({ message: "Failed to generate PDF" });
      }
    },
  );
  // Get all estimates for a tenant
  app.get("/api/estimates", authenticate, async (req: any, res) => {
    try {
      // ✅ Ensure tenantId is a number
      const tenantId = Number(req.user?.tenantId);
      console.log("📊 [API] tenantId after casting:", tenantId);
      if (isNaN(tenantId)) {
        console.error("❌ Invalid tenant ID:", req.user?.tenantId);
        return res.status(400).json({ message: "Invalid tenant ID" });
      }

      // Extract query params with safe defaults
      const {
        search = "",
        status = "",
        startDate = "",
        endDate = "",
        filterType = "",
        sortBy = "created_at",
        sortOrder = "desc",
        limit = "50",
        offset = "0",
        page = "1",
        pageSize = "10",
      } = req.query;

      const limitNum = Number(limit);
      const offsetNum = Number(offset);
      const pageNum = Number(page);
      const pageSizeNum = Number(pageSize);

      console.log("📊 Estimate [API] Query params:", {
        search,
        status,
        startDate,
        endDate,
        filterType,
        sortBy,
        sortOrder,
        limitNum,
        offsetNum,
        pageNum,
        pageSizeNum,
      });

      // Get all estimates for tenant with filters applied in database
      const result = await simpleStorage.getEstimatesByTenant({
        tenantId,
        search: String(search),
        status: String(status),
        startDate: String(startDate),
        endDate: String(endDate),
        sortBy: String(sortBy),
        sortOrder: String(sortOrder),
        limit: limitNum,
        offset: offsetNum,
        page: pageNum,
        pageSize: pageSizeNum,
      });

      console.log("📊 [API] Estimates fetched:", result.data.length, "Total:", result.pagination.total);

      // Transform to camelCase for frontend
      const transformedEstimates = result.data.map(transformEstimate);
      
      // Return pagination format
      res.json({
        data: transformedEstimates,
        pagination: result.pagination,
      });
    } catch (error: any) {
      console.error("❌ [API] Error getting estimates:", error);
      res
        .status(500)
        .json({ message: "Failed to get estimates", error: error.message });
    }
  });

  app.get("/api/estimates/all", authenticate, async (req: any, res) => {
  try {
    const tenantId = Number(req.user?.tenantId);
    console.log("📊 [API - ALL] tenantId:", tenantId);

    if (isNaN(tenantId)) {
      return res.status(400).json({ message: "Invalid tenant ID" });
    }
    const {
      search = "",
      status = "",
      startDate = "",
      endDate = "",
      filterType = "",
      sortBy = "created_at",
      sortOrder = "desc",
    } = req.query;

    console.log("📊 [API - ALL] Query params:", {
      search,
      status,
      startDate,
      endDate,
      filterType,
      sortBy,
      sortOrder,
    });
    const result = await simpleStorage.getAllEstimatesByTenant({
      tenantId,
      search: String(search),
      status: String(status),
      startDate: String(startDate),
      endDate: String(endDate),
    });

    console.log("📊 [API - ALL] Total estimates fetched:", result.data.length);

   
    const transformedEstimates = result.data.map(transformEstimate);
    res.json({
      data: transformedEstimates,
    });

  } catch (error: any) {
    console.error("❌ [API - ALL] Error:", error);
    res.status(500).json({
      message: "Failed to fetch all estimates",
      error: error.message,
    });
  }
});

  // Create new estimate
  app.post("/api/estimates", authenticate, async (req: any, res) => {
    try {
      console.log("📊 Creating estimate for tenant:", req.user.tenantId);
      console.log("📊 Estimate data:", req.body);

      // Validate required fields
      if (
        !req.body.title ||
        !req.body.customerName ||
        !req.body.customerEmail
      ) {
        return res.status(400).json({
          message:
            "Missing required fields: title, customerName, and customerEmail are required",
        });
      }

      // Calculate totals from line items
      let subtotal = 0;
      let taxAmount = 0;
      
      if (req.body.lineItems && Array.isArray(req.body.lineItems)) {
        // Calculate subtotal (sum of unitPrice * quantity - discount for each item)
        subtotal = req.body.lineItems.reduce((sum: number, item: any) => {
          const unitPrice = parseFloat(item.unitPrice) || 0;
          const quantity = parseFloat(item.quantity) || 1;
          const discount = parseFloat(item.discount) || 0;
          const itemSubtotal = (unitPrice * quantity) - discount;
          return sum + itemSubtotal;
        }, 0);
        
        // Calculate tax from line items (sum of tax from each item)
        taxAmount = req.body.lineItems.reduce((sum: number, item: any) => {
          return sum + (parseFloat(item.tax) || 0);
        }, 0);
      } else if (req.body.manualTotalPrice) {
        // Use manual total price if no line items
        subtotal = parseFloat(req.body.manualTotalPrice) || 0;
      }

      // Apply discount percentage if provided
      const discountPercentage = parseFloat(req.body.discountPercentage) || 0;
      const discountAmount = (subtotal * discountPercentage) / 100;
      const afterDiscount = subtotal - discountAmount;
      
      // Total amount = subtotal after discount + tax
      const totalAmount = afterDiscount + taxAmount;
      
      // Calculate deposit amount if deposit is required
      let depositAmount = 0;
      if (req.body.depositRequired && req.body.depositPercentage) {
        const depositPercentage = parseFloat(req.body.depositPercentage) || 0;
        depositAmount = (totalAmount * depositPercentage) / 100;
      }

      // Determine customerId from selectedCustomerId or selectedLeadId
      let customerId = null;
      let leadId = null;
      if (req.body.selectedCustomerId) {
        customerId = parseInt(req.body.selectedCustomerId);
      } else if (req.body.selectedLeadId) {
        leadId = parseInt(req.body.selectedLeadId);
        // Try to find if this lead has been converted to a customer
        try {
          const lead = await simpleStorage.getLeadById(leadId, req.user.tenantId);
          if (lead && lead.customerId) {
            customerId = lead.customerId;
          }
        } catch (error) {
          console.log("Could not find lead or customer link:", error);
        }
      }

      const estimateData = {
        tenantId: req.user.tenantId,
        customerId: customerId,
        leadId: leadId,
        estimateNumber: req.body.estimateNumber || `EST-${Date.now()}`,
        invoiceNumber: req.body.invoiceNumber || null,
        title: req.body.title,
        description: req.body.description || "",
        currency: req.body.currency || "USD",
        customerName: req.body.customerName,
        customerEmail: req.body.customerEmail,
        customerPhone: req.body.customerPhone || null,
        customerAddress: req.body.customerAddress || null,

        // Financial calculations
        subtotal: subtotal.toFixed(2),
        discountType: req.body.discountType || (discountPercentage > 0 ? "percentage" : "none"),
        discountValue: discountPercentage.toString(),
        discountAmount: discountAmount.toFixed(2),
        taxRate: taxAmount > 0 ? ((taxAmount / subtotal) * 100).toFixed(2) : "0.00",
        taxAmount: taxAmount.toFixed(2),
        totalAmount: totalAmount.toFixed(2),

        // Additional fields
        depositRequired: req.body.depositRequired || false,
        depositAmount: depositAmount.toFixed(2),
        depositPercentage: (
          parseFloat(req.body.depositPercentage) || 0
        ).toString(),
        paymentTerms: req.body.paymentTerms || "Due on receipt",
        logoUrl: req.body.logoUrl || null,
        brandColor: req.body.brandColor || "#0BBCD6",
        notes: req.body.notes || null,
        status: req.body.status || "draft",
        validUntil: req.body.validUntil ? new Date(req.body.validUntil) : null,
        attachments: req.body.attachments ? JSON.stringify(req.body.attachments) : JSON.stringify([]),
      };

      console.log("📊 Processed estimate data:", estimateData);

      const estimate = await storage.createEstimate(estimateData);
      console.log("📊 Created estimate:", estimate);

      // Create line items if provided
      if (req.body.lineItems && Array.isArray(req.body.lineItems)) {
        console.log("📊 Creating line items:", req.body.lineItems.length);
        for (const [index, item] of req.body.lineItems.entries()) {
          await simpleStorage.createEstimateLineItem({
            estimateId: estimate.id,
            itemName: item.itemName || "Item",
            description: item.description || "",
            quantity: (parseFloat(item.quantity) || 1).toString(),
            unitPrice: (parseFloat(item.unitPrice) || 0).toString(),
            totalPrice: (parseFloat(item.totalPrice) || 0).toString(),
            displayOrder: index,
            category: item.leadCategory || item.category || null,
            taxRateId: item.taxRateId ? parseInt(item.taxRateId) : null,
            tax: item.tax ? parseFloat(item.tax).toString() : null,
            discount: item.discount ? parseFloat(item.discount).toString() : null,
          });
        }
      }

      // Create activity entries for customer or lead
      try {
        const estimateId = estimate.id || estimate.estimate_id;
        const estimateNumber = estimate.estimate_number || estimateData.estimateNumber;
        const estimateTitle = estimateData.title;
        const estimateTotal = estimateData.totalAmount;
        const estimateCurrency = estimateData.currency || "USD";
        const estimateStatus = estimateData.status || "draft";
        
        if (customerId && req.user?.id) {
          await simpleStorage.createCustomerActivity({
            tenantId: req.user.tenantId,
            customerId: customerId,
            userId: req.user.id,
            activityType: 13, // Estimate Created
            activityTitle: `Estimate Created: ${estimateNumber}`,
            activityDescription: `New estimate "${estimateTitle}" created. Total amount: ${estimateCurrency}${estimateTotal}. Status: ${estimateStatus}`,
            activityStatus: 1,
            activityDate: new Date().toISOString(),
          });
          console.log(`✅ Customer activity logged for estimate ${estimateId}`);
        }
        
        if (leadId && req.user?.id) {
          await simpleStorage.saveLeadActivity({
            tenant_id: req.user.tenantId,
            lead_id: leadId,
            user_id: req.user.id,
            activity_type: 13, // Estimate Created
            activity_title: `Estimate Created: ${estimateNumber}`,
            activity_description: `New estimate "${estimateTitle}" created. Total amount: ${estimateCurrency}${estimateTotal}. Status: ${estimateStatus}`,
            activity_status: 1,
          });
          console.log(`✅ Lead activity logged for estimate ${estimateId}`);
        }
      } catch (activityError) {
        // Don't fail the whole operation if activity logging fails
        console.error("⚠️ Failed to log estimate activity:", activityError);
      }

      res.status(201).json(estimate);
    } catch (error: any) {
      console.error("Error creating estimate:", error);
      console.error("Error details:", error.stack);
      res
        .status(500)
        .json({ message: "Failed to create estimate", error: error.message });
    }
  });

  // Get single estimate
  app.get("/api/estimates/:id", authenticate, async (req: any, res) => {
    try {
      const estimateId = parseInt(req.params.id);
      const estimate = await storage.getEstimate(estimateId, req.user.tenantId);

      if (!estimate) {
        return res.status(404).json({ message: "Estimate not found" });
      }

      // Get line items
      const lineItems = await storage.getEstimateLineItems(estimateId);

      // Transform line items to camelCase and enrich with tax rate info
      const transformedLineItems = await Promise.all(
        lineItems.map(async (item: any) => {
          const transformed: any = {
            id: item.id,
            itemName: item.item_name || item.itemName,
            description: item.description || "",
            quantity: parseFloat(item.quantity || 1),
            unitPrice: parseFloat(item.unit_price || item.unitPrice || 0),
            totalPrice: parseFloat(item.total_price || item.totalPrice || 0),
            category: item.category || null,
            discount: (item.discount !== undefined && item.discount !== null) ? parseFloat(item.discount) : null,
            tax: (item.tax !== undefined && item.tax !== null) ? parseFloat(item.tax) : null,
            taxRateId: item.tax_rate_id || item.taxRateId || null,
          };

          // Fetch tax rate information if taxRateId exists
          if (transformed.taxRateId) {
            try {
              const [taxRate] = await sql`
                SELECT rate_name, rate_percentage, rate 
                FROM gst_rates 
                WHERE id = ${transformed.taxRateId}
              `;
              if (taxRate) {
                const ratePercentage = parseFloat(taxRate.rate_percentage || taxRate.rate || "0");
                transformed.taxRate = taxRate.rate_name || `${ratePercentage}%`;
              }
            } catch (error) {
              console.error("Error fetching tax rate:", error);
            }
          }

          return transformed;
        })
      );

      // Transform data to camelCase for frontend
      const transformedEstimate = transformEstimate(estimate);
      res.json({ ...transformedEstimate, lineItems: transformedLineItems });
    } catch (error: any) {
      console.error("Error getting estimate:", error);
      res.status(500).json({ message: "Failed to get estimate" });
    }
  });

  // Update estimate
  app.put("/api/estimates/:id", authenticate, async (req: any, res) => {
    try {
      const estimateId = parseInt(req.params.id);
      const estimate = await storage.getEstimate(estimateId, req.user.tenantId);

      if (!estimate) {
        return res.status(404).json({ message: "Estimate not found" });
      }

      // Calculate totals from line items
      let subtotal = 0;
      let taxAmount = 0;
      if (req.body.lineItems && Array.isArray(req.body.lineItems)) {
        subtotal = req.body.lineItems.reduce((sum: number, item: any) => {
          const itemSubtotal = (parseFloat(item.unitPrice) || 0) * (parseFloat(item.quantity) || 1);
          const itemDiscount = parseFloat(item.discount) || 0;
          const itemAfterDiscount = itemSubtotal - itemDiscount;
          const itemTax = parseFloat(item.tax) || 0;
          taxAmount += itemTax;
          return sum + (parseFloat(item.totalPrice) || (itemAfterDiscount + itemTax));
        }, 0);
      }

      const discountPercentage = parseFloat(req.body.discountPercentage || "0");
      const discountAmount = (subtotal * discountPercentage) / 100;
      const totalAmount = subtotal + taxAmount - discountAmount;

      const depositPercentage = parseFloat(req.body.depositPercentage || "0");
      const depositAmount = (totalAmount * depositPercentage) / 100;

      const updateData: any = {
        title: req.body.title,
        description: req.body.description || "",
        currency: req.body.currency || "USD",
        customerName: req.body.customerName,
        customerEmail: req.body.customerEmail,
        customerPhone: req.body.customerPhone || null,
        customerAddress: req.body.customerAddress || null,
        subtotal: subtotal.toFixed(2),
        discountType: req.body.discountType || "none",
        discountValue: discountPercentage.toString(),
        discountAmount: discountAmount.toFixed(2),
        taxRate: req.body.taxPercentage || "0",
        taxAmount: taxAmount.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
        depositRequired: req.body.depositRequired || false,
        depositAmount: depositAmount.toFixed(2),
        depositPercentage: depositPercentage.toString(),
        paymentTerms: req.body.paymentTerms || "net30",
        notes: req.body.notes || null,
        validUntil: req.body.validUntil ? new Date(req.body.validUntil) : null,
        customerId: req.body.selectedCustomerId ? parseInt(req.body.selectedCustomerId) : null,
        leadId: req.body.selectedLeadId ? parseInt(req.body.selectedLeadId) : null,
        attachments: req.body.attachments ? JSON.stringify(req.body.attachments) : JSON.stringify([]),
      };

      const updatedEstimate = await storage.updateEstimate(estimateId, req.user.tenantId, updateData);

      if (!updatedEstimate) {
        return res.status(404).json({ message: "Estimate not found" });
      }

      // Delete existing line items and create new ones
      await sql`DELETE FROM estimate_line_items WHERE estimate_id = ${estimateId}`;

      if (req.body.lineItems && Array.isArray(req.body.lineItems)) {
        for (const [index, item] of req.body.lineItems.entries()) {
          await storage.createEstimateLineItem({
            estimateId: estimateId,
            itemName: item.itemName || item.description || "Item",
            description: item.description || "",
            quantity: (parseFloat(item.quantity) || 1).toString(),
            unitPrice: (parseFloat(item.unitPrice) || 0).toString(),
            totalPrice: (parseFloat(item.totalPrice) || 0).toString(),
            displayOrder: index,
            category: item.leadCategory || item.category || null,
            taxRateId: item.taxRateId ? parseInt(item.taxRateId) : null,
            tax: item.tax ? parseFloat(item.tax).toString() : null,
            discount: item.discount ? parseFloat(item.discount).toString() : null,
          });
        }
      }

      // Get updated line items
      const lineItems = await storage.getEstimateLineItems(estimateId);

      // Transform data to camelCase for frontend
      const transformedEstimate = transformEstimate(updatedEstimate);
      res.json({ ...transformedEstimate, lineItems, estimate: transformedEstimate });
    } catch (error: any) {
      console.error("Error updating estimate:", error);
      res.status(500).json({ message: "Failed to update estimate" });
    }
  });

  // Update estimate status
  app.patch("/api/estimates/:id/status", authenticate, async (req: any, res) => {
    try {
      const estimateId = parseInt(req.params.id);
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({
          message: "Status is required",
        });
      }

      const validStatuses = ["draft", "sent", "viewed", "accepted", "rejected"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        });
      }

      const estimate = await storage.getEstimate(estimateId, req.user.tenantId);
      if (!estimate) {
        return res.status(404).json({ message: "Estimate not found" });
      }

      // Prepare update data
      const updateData: any = { status };
      
      // Update timestamp based on status
      if (status === "sent" && !estimate.sentAt) {
        updateData.sentAt = new Date();
      } else if (status === "viewed" && !estimate.viewedAt) {
        updateData.viewedAt = new Date();
      } else if (status === "accepted" && !estimate.acceptedAt) {
        updateData.acceptedAt = new Date();
      } else if (status === "rejected" && !estimate.rejectedAt) {
        updateData.rejectedAt = new Date();
      }

      const updatedEstimate = await storage.updateEstimate(estimateId, req.user.tenantId, updateData);
      
      if (!updatedEstimate) {
        return res.status(404).json({ message: "Estimate not found" });
      }

      const transformedEstimate = transformEstimate(updatedEstimate);
      res.json(transformedEstimate);
    } catch (error: any) {
      console.error("Error updating estimate status:", error);
      res.status(500).json({ message: "Failed to update estimate status" });
    }
  });

  // Email estimate to customer
  app.post("/api/estimates/:id/email", authenticate, async (req: any, res) => {
    try {
      const estimateId = parseInt(req.params.id);
      const { to, subject, message } = req.body;

      console.log("📧 Emailing estimate:", estimateId, "to:", to);

      if (!to || !subject) {
        return res.status(400).json({
          message: "Email address and subject are required",
        });
      }

      const estimate = await storage.getEstimate(estimateId, req.user.tenantId);
      if (!estimate) {
        return res.status(404).json({ message: "Estimate not found" });
      }

      // For now, we'll log the email details and mark the estimate as sent
      // In production, you would integrate with an email service like SendGrid
      console.log("📧 Email Details:");
      console.log("To:", to);
      console.log("Subject:", subject);
      console.log("Message:", message);
      console.log("Estimate:", estimate.estimateNumber);

      // Update estimate status to "sent" and set sentAt timestamp
      const updateData: any = {
        status: "sent",
        sentAt: new Date(),
      };
      
      await storage.updateEstimate(estimateId, req.user.tenantId, updateData);

      res.json({
        message: "Estimate email sent successfully",
        emailSent: true,
        estimateId,
        recipient: to,
      });
    } catch (error: any) {
      console.error("Error emailing estimate:", error);
      res.status(500).json({ message: "Failed to email estimate" });
    }
  });

  // Generate PDF for estimate
  app.get("/api/estimates/:id/pdf", authenticate, async (req: any, res) => {
    try {
      const estimateId = parseInt(req.params.id);
      console.log("📄 Generating PDF for estimate:", estimateId);

      const estimate = await storage.getEstimate(estimateId, req.user.tenantId);
      if (!estimate) {
        return res.status(404).json({ message: "Estimate not found" });
      }

      // Get line items
      const lineItems = await storage.getEstimateLineItems(estimateId);

      // Generate a simple HTML-to-PDF conversion
      // In production, you would use a library like Puppeteer, jsPDF, or PDFKit
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Estimate ${estimate.estimateNumber}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .company-info { margin-bottom: 20px; }
        .estimate-info { margin-bottom: 20px; }
        .customer-info { margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f5f5f5; }
        .total-section { text-align: right; margin-top: 20px; }
        .total-line { margin: 5px 0; }
        .balance-due { font-weight: bold; font-size: 18px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>RateHonk Travel Services</h1>
        <p>123 Travel Lane, Suite 100<br>Travel City, TC 12345<br>(555) 123-4567</p>
    </div>
    
    <h2>ESTIMATE</h2>
    
    <div class="estimate-info">
        <strong>ESTIMATE #:</strong> ${estimate.estimateNumber}<br>
        <strong>DATE:</strong> ${new Date(estimate.createdAt).toLocaleDateString()}<br>
        <strong>VALID UNTIL:</strong> ${estimate.validUntil ? new Date(estimate.validUntil).toLocaleDateString() : "N/A"}<br>
        <strong>TERMS:</strong> ${estimate.paymentTerms || "Net 30"}
    </div>
    
    <div class="customer-info">
        <strong>BILL TO:</strong><br>
        ${estimate.customerName}<br>
        ${estimate.customerEmail}<br>
        ${estimate.customerPhone || ""}<br>
        ${estimate.customerAddress || ""}
    </div>
    
    <table>
        <thead>
            <tr>
                <th>ACTIVITY</th>
                <th>QTY</th>
                <th>RATE</th>
                <th>AMOUNT</th>
            </tr>
        </thead>
        <tbody>
            ${lineItems
              .map(
                (item: any) => `
                <tr>
                    <td>${item.itemName}</td>
                    <td>${item.quantity}</td>
                    <td>$${parseFloat(item.unitPrice).toFixed(2)}</td>
                    <td>$${parseFloat(item.totalPrice).toFixed(2)}</td>
                </tr>
            `,
              )
              .join("")}
        </tbody>
    </table>
    
    <div class="total-section">
        <div class="total-line">SUBTOTAL: $${estimate.subtotal}</div>
        <div class="total-line">DISCOUNT: -$${estimate.discountAmount}</div>
        <div class="total-line">TAX: $${estimate.taxAmount}</div>
        <div class="total-line balance-due">BALANCE DUE: $${estimate.totalAmount}</div>
    </div>
    
    ${estimate.notes ? `<div style="margin-top: 30px;"><strong>NOTES:</strong><br>${estimate.notes}</div>` : ""}
</body>
</html>
      `;

      // For now, return HTML that browsers can interpret
      // This provides a better user experience than broken PDF
      res.setHeader("Content-Type", "text/html");
      res.setHeader(
        "Content-Disposition",
        `inline; filename=estimate-${estimate.estimateNumber}.html`,
      );
      res.send(htmlContent);
    } catch (error: any) {
      console.error("Error generating PDF:", error);
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  });

  // Send estimate via email (legacy endpoint)
  app.post("/api/estimates/:id/send", authenticate, async (req: any, res) => {
    try {
      const estimateId = parseInt(req.params.id);
      const estimate = await storage.getEstimate(estimateId, req.user.tenantId);

      if (!estimate) {
        return res.status(404).json({ message: "Estimate not found" });
      }

      res.json({
        success: true,
        message: "Estimate sent successfully",
      });
    } catch (error: any) {
      console.error("Error sending estimate:", error);
      res.status(500).json({ message: "Failed to send estimate" });
    }
  });
}
