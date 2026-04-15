import type { Express } from "express";
import jwt from "jsonwebtoken";
import { storage } from "./storage.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Middleware to verify JWT token and extract user
const authenticate = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    console.log("🔐 Auth header:", authHeader ? "Present" : "Missing");
    
    if (!authHeader) {
      return res.status(401).json({ message: "Access token required" });
    }
    
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ message: "Access token required" });
    }

    console.log("🔐 Verifying token...");
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    console.log("🔐 Token decoded, userId:", decoded.userId);
    
    const user = await storage.getUser(decoded.userId);
    if (!user) {
      console.log("🔐 User not found for userId:", decoded.userId);
      return res.status(401).json({ message: "Invalid token" });
    }

    console.log("🔐 User found:", { id: user.id, tenantId: user.tenant_id });
    req.user = { ...user, tenantId: user.tenant_id };
    next();
  } catch (error) {
    console.error("🔐 Auth error:", error);
    res.status(401).json({ message: "Invalid token" });
  }
};

// Register the enhanced lead creation endpoint
export function registerLeadCreateEndpoint(app: Express) {
  // ENHANCED LEAD CREATION ENDPOINT WITH CURRENT USER_ID
  app.post("/api/leads/create-with-user", authenticate, async (req: any, res) => {
    try {
      console.log("🔍👤 ENHANCED LEAD CREATE WITH USER_ID ENDPOINT HIT!");
      
      // Get current user_id from authentication middleware
      const currentUserId = req.user.id;
      const currentTenantId = req.user.tenantId;
      
      console.log("🔍👤 Current User ID:", currentUserId);
      console.log("🔍👤 Current Tenant ID:", currentTenantId);
      console.log("🔍 Request body:", JSON.stringify(req.body, null, 2));

      // Use tenant from authenticated user if not provided in body
      const tenantId = req.body.tenantId || currentTenantId;

      // Create lead data with current user_id included
      const leadData = {
        ...req.body,
        tenantId: parseInt(tenantId),
        assignedUserId: currentUserId, // Assign lead to current user
        createdBy: currentUserId, // Track who created the lead
      };

      console.log("🔍👤 Creating lead with user data:", {
        assignedUserId: currentUserId,
        createdBy: currentUserId,
        tenantId: leadData.tenantId,
        firstName: leadData.firstName,
        lastName: leadData.lastName,
        email: leadData.email
      });

      const newLead = await storage.createLead(leadData);
      
      return res.status(201).json({
        success: true,
        id: newLead.id,
        assignedUserId: currentUserId,
        createdBy: currentUserId,
        tenantId: newLead.tenantId,
        firstName: newLead.firstName,
        lastName: newLead.lastName,
        email: newLead.email,
        ...newLead,
        message: "Lead created successfully with current user_id"
      });

    } catch (error: any) {
      console.error("🔍❌ Enhanced lead creation error:", error);
      return res.status(500).json({
        message: "Internal server error",
        error: error.message
      });
    }
  });

  console.log("✅ Enhanced lead creation endpoint registered: POST /api/leads/create-with-user");
}