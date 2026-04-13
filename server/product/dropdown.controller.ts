import { Request, Response } from "express";
import { simpleStorage } from "../simple-storage";

export const getSets = async (req: any, res: Response) => {
  try {
    const tenantId = req.user.tenantId;
    const sets = await simpleStorage.getDropdownSets(tenantId);
    res.json({ success: true, data: sets, message: "Dropdown sets fetched successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch dropdown sets", error });
  }
};

export const getSet = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;
    const set = await simpleStorage.getDropdownSetWithOptions(Number(id), tenantId);
    if (!set) {
      return res.status(404).json({ success: false, message: "Dropdown set not found" });
    }
    res.json({ success: true, data: set, message: "Dropdown set fetched successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch dropdown set", error });
  }
};

export const createSet = async (req: any, res: Response) => {
  try {
    const { name, options } = req.body;
    const tenantId = req.user.tenantId;

    if (!name) {
      return res.status(400).json({ success: false, message: "Name is required" });
    }

    const set = await simpleStorage.createDropdownSet(tenantId, name);
    
    // Create options if provided
    if (options && Array.isArray(options)) {
      for (const [index, opt] of options.entries()) {
        await simpleStorage.createDropdownOption(set.id, opt.label, opt.value);
      }
    }

    const finalSet = await simpleStorage.getDropdownSetWithOptions(set.id, tenantId);
    res.status(201).json({ success: true, data: finalSet, message: "Dropdown set created successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create dropdown set", error });
  }
};

export const updateSet = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { name, options } = req.body;
    const tenantId = req.user.tenantId;

    const updated = await simpleStorage.updateDropdownSet(Number(id), tenantId, name, options);
    if (!updated) {
      return res.status(404).json({ success: false, message: "Dropdown set not found or unauthorized" });
    }

    res.json({ success: true, data: updated, message: "Dropdown set updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update dropdown set", error });
  }
};

export const deleteSet = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    const deleted = await simpleStorage.deleteDropdownSet(Number(id), tenantId);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Dropdown set not found or unauthorized" });
    }

    res.json({ success: true, data: {}, message: "Dropdown set deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete dropdown set", error });
  }
};
