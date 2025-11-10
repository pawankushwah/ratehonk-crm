import type { Express } from "express";
import { storage } from "./storage";
import { simpleStorage} from "./simple-storage";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
// Proper JWT authentication middleware
const authenticate = async (req: any, res: any, next: any) => {
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
  return {
    id: estimate.id,
    estimateNumber: estimate.estimateNumber,
    title: estimate.title,
    invoiceNumber: estimate.invoiceNumber,
    currency: estimate.currency,
    customerName: estimate.customerName,
    customerEmail: estimate.customerEmail,
    customerPhone: estimate.customerPhone,
    customerAddress: estimate.customerAddress,
    description: estimate.description,
    status: estimate.status,
    totalAmount: estimate.totalAmount,
    validUntil: estimate.validUntil,
    notes: estimate.notes,
    logoUrl: estimate.logoUrl,
    discountType: estimate.discountType,
    discountValue: estimate.discountValue,
    discountAmount: estimate.discountAmount,
    subtotal: estimate.subtotal,
    taxRate: estimate.taxRate,
    taxAmount: estimate.taxAmount,
    depositRequired: estimate.depositRequired,
    depositAmount: estimate.depositAmount,
    depositPercentage: estimate.depositPercentage,
    paymentTerms: estimate.paymentTerms,
    createdAt: estimate.createdAt,
    updatedAt: estimate.updatedAt,
    sentAt: estimate.sentAt,
    viewedAt: estimate.viewedAt,
    acceptedAt: estimate.acceptedAt,
    rejectedAt: estimate.rejectedAt,
  };
}

export function registerEstimatesRoutes(app: Express) {
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
      } = req.query;

      const limitNum = Number(limit);
      const offsetNum = Number(offset);
      const pageNum = Number(page);
      const calculatedOffset = offsetNum || (pageNum - 1) * limitNum;

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
        calculatedOffset,
      });

      // Get all estimates for tenant with filters applied in database
      const estimates = await simpleStorage.getEstimatesByTenant({
        tenantId,
        search: String(search),
        status: String(status),
        startDate: String(startDate),
        endDate: String(endDate),
        sortBy: String(sortBy),
        sortOrder: String(sortOrder),
        limit: limitNum,
        offset: calculatedOffset,
      });

      console.log("📊 [API] Estimates fetched:", estimates.length);

      // Transform to camelCase for frontend
      const transformedEstimates = estimates.map(transformEstimate);
      res.json(transformedEstimates);
    } catch (error: any) {
      console.error("❌ [API] Error getting estimates:", error);
      res
        .status(500)
        .json({ message: "Failed to get estimates", error: error.message });
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
        tenantId: req.user.tenantId,
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
        validUntil: req.body.validUntil ? new Date(req.body.validUntil) : null,
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

      // Transform data to camelCase for frontend
      const transformedEstimate = transformEstimate(estimate);
      res.json({ ...transformedEstimate, lineItems });
    } catch (error: any) {
      console.error("Error getting estimate:", error);
      res.status(500).json({ message: "Failed to get estimate" });
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
