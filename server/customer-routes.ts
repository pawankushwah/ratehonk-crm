import express from "express";
import { simpleStorage } from "./simple-storage.js";

const router = express.Router();

// Test route
router.get("/test", (req, res) => {
  console.log("🔍 ✅ CUSTOMER ROUTER TEST ROUTE HIT");
  res.json({ message: "Customer router working", timestamp: new Date().toISOString() });
});

// Individual customer GET route
router.get("/:customerId", async (req, res) => {
  const { tenantId, customerId } = req.params;
  console.log("🔍 ✅ INDIVIDUAL CUSTOMER ROUTER HIT - ID:", customerId, "Tenant:", tenantId);
  
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "No authorization header" });
    }
    
    const customer = await simpleStorage.getCustomerById(parseInt(customerId), parseInt(tenantId));
    
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    
    console.log("🔍 Customer found via router:", customer.id, customer.name);
    res.json(customer);
  } catch (error: any) {
    console.error("🔍 Customer router GET error:", error);
    res.status(500).json({ 
      message: "Internal server error", 
      error: error.message 
    });
  }
});

// Customer list GET route
router.get("/", async (req, res) => {
  const { tenantId } = req.params;
  console.log("🔍 ✅ CUSTOMERS LIST ROUTER HIT - Tenant:", tenantId);
  
  try {
    const customers = await simpleStorage.getCustomersByTenant(parseInt(tenantId));
    console.log("🔍 Router found customers:", customers.length);
    res.json(customers);
  } catch (error: any) {
    console.error("🔍 Customer router list error:", error);
    res.status(500).json({ 
      message: "Internal server error", 
      error: error.message 
    });
  }
});

// Customer PATCH route
router.patch("/:customerId", async (req, res) => {
  const { tenantId, customerId } = req.params;
  console.log("🔍 ✅ CUSTOMER ROUTER PATCH HIT - ID:", customerId, "Tenant:", tenantId);
  console.log("🔍 Update data:", req.body);
  
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "No authorization header" });
    }
    
    const customer = await simpleStorage.updateCustomer(parseInt(customerId), parseInt(tenantId), req.body);
    
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    
    console.log("🔍 Customer updated via router:", customer.id);
    res.json(customer);
  } catch (error: any) {
    console.error("🔍 Customer router PATCH error:", error);
    res.status(500).json({ 
      message: "Internal server error", 
      error: error.message 
    });
  }
});

// Customer POST route
router.post("/", async (req, res) => {
  const { tenantId } = req.params;
  console.log("🔍 ✅ CUSTOMER ROUTER POST HIT - Tenant:", tenantId);
  console.log("🔍 Request body:", req.body);
  
  try {
    const customerData = { ...req.body, tenantId: parseInt(tenantId) };
    const customer = await simpleStorage.createCustomer(customerData);
    console.log("🔍 Customer created via router:", customer.id);
    res.status(201).json(customer);
  } catch (error: any) {
    console.error("🔍 Customer router POST error:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

export { router as customerRouter };