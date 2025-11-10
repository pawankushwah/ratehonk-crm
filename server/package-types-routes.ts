import type { Express } from "express";
import { z } from "zod";

// Validation schema for package type data
const packageTypeSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  packageCategory: z.string().optional(),
  displayOrder: z.number().int().min(0).optional(),
}).strict(); // Prevent additional properties

// Simple package types data for demonstration
const DEMO_PACKAGE_TYPES = [
  {
    id: 1,
    name: "Adventure Tours",
    description: "Exciting adventure and outdoor travel packages",
    icon: "mountain",
    color: "#10B981",
    packageCategory: "Adventure Tours",
    displayOrder: 1,
    isActive: true,
    tenantId: 10, // Demo data for tenant 10
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    name: "Family Packages", 
    description: "Perfect travel packages for families with children",
    icon: "users",
    color: "#3B82F6",
    packageCategory: "Family Packages",
    displayOrder: 2,
    isActive: true,
    tenantId: 10, // Demo data for tenant 10
    createdAt: new Date().toISOString()
  },
  {
    id: 3,
    name: "Business Travel",
    description: "Professional business travel arrangements",
    icon: "briefcase", 
    color: "#8B5CF6",
    packageCategory: "Business Travel",
    displayOrder: 3,
    isActive: true,
    tenantId: 11, // Demo data for different tenant to test isolation
    createdAt: new Date().toISOString()
  }
];

// In-memory storage for demo purposes
let packageTypesStore = [...DEMO_PACKAGE_TYPES];
let nextId = 4;

export function registerPackageTypesRoutes(app: Express, authenticate: any, checkTenantAccess: any) {
  // Package Types - GET all
  app.get("/api/tenants/:tenantId/package-types", authenticate, checkTenantAccess, async (req: any, res) => {
    try {
      const tenantId = parseInt(req.params.tenantId);
      console.log("📦 Fetching package types for tenant:", tenantId);
      
      // SECURITY FIX: Filter by both tenant AND active status
      const packageTypes = packageTypesStore.filter(pt => pt.isActive && pt.tenantId === tenantId);
      console.log("📦 Found package types:", packageTypes.length);
      
      res.json(packageTypes);
    } catch (error) {
      console.error("Error fetching package types:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Package Types - POST create
  app.post("/api/tenants/:tenantId/package-types", authenticate, checkTenantAccess, async (req: any, res) => {
    try {
      const tenantId = parseInt(req.params.tenantId);
      console.log("📦 Creating package type for tenant:", tenantId);
      console.log("📦 Request body:", req.body);
      
      // SECURITY FIX: Validate request body
      const validatedData = packageTypeSchema.parse(req.body);
      
      // Create new package type
      const newPackageType = {
        id: nextId++,
        ...validatedData,
        tenantId,
        isActive: true,
        createdAt: new Date().toISOString()
      };
      
      packageTypesStore.push(newPackageType);
      console.log("📦 Created package type:", newPackageType);
      
      res.status(201).json(newPackageType);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      console.error("Error creating package type:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Package Types - PUT update
  app.put("/api/tenants/:tenantId/package-types/:id", authenticate, checkTenantAccess, async (req: any, res) => {
    try {
      const tenantId = parseInt(req.params.tenantId);
      const packageTypeId = parseInt(req.params.id);
      console.log("📦 Updating package type:", packageTypeId, "for tenant:", tenantId);
      console.log("📦 Update data:", req.body);
      
      // SECURITY FIX: Validate request body
      const validatedData = packageTypeSchema.parse(req.body);
      
      // SECURITY FIX: Find package type and verify tenant ownership
      const index = packageTypesStore.findIndex(pt => pt.id === packageTypeId && pt.tenantId === tenantId && pt.isActive);
      if (index === -1) {
        return res.status(404).json({ message: "Package type not found or access denied" });
      }
      
      // Update package type (prevent tenantId override)
      packageTypesStore[index] = {
        ...packageTypesStore[index],
        ...validatedData,
        tenantId, // Ensure tenantId remains unchanged
        updatedAt: new Date().toISOString()
      };
      
      console.log("📦 Updated package type:", packageTypesStore[index]);
      res.json(packageTypesStore[index]);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      console.error("Error updating package type:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Package Types - DELETE
  app.delete("/api/tenants/:tenantId/package-types/:id", authenticate, checkTenantAccess, async (req: any, res) => {
    try {
      const tenantId = parseInt(req.params.tenantId);
      const packageTypeId = parseInt(req.params.id);
      console.log("📦 Deleting package type:", packageTypeId, "for tenant:", tenantId);
      
      // SECURITY FIX: Find package type and verify tenant ownership
      const index = packageTypesStore.findIndex(pt => pt.id === packageTypeId && pt.tenantId === tenantId && pt.isActive);
      if (index === -1) {
        return res.status(404).json({ message: "Package type not found or access denied" });
      }
      
      // Soft delete - mark as inactive
      packageTypesStore[index].isActive = false;
      console.log("📦 Deleted package type:", packageTypeId);
      
      res.json({ message: "Package type deleted successfully" });
    } catch (error) {
      console.error("Error deleting package type:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
}