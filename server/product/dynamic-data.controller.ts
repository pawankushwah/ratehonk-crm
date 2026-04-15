import { Request, Response } from "express";
import { simpleStorage } from "../simple-storage.js";

export const submitData = async (req: any, res: Response) => {
  try {
    const { template_id, data } = req.body;
    const { res_id } = req.params;
    const userId = req.user?.id;
    const tenantId = req.user?.tenantId;

    const template = await simpleStorage.getFormTemplates(Number(template_id), tenantId);
    if (!template) return res.status(404).json({ success: false, message: "Template not found" });

    // SKU Generation Logic
    const groups = (template.schema as any)?.groups || [];
    for (const group of groups) {
      for (const field of group.fields) {
        if (field.type === "sku") {
          const fieldId = field.id;
          if (!data[fieldId]) {
            const prefix = field.properties?.prefix || "SKU";
            const finalSku = await simpleStorage.generateNextSku(tenantId, prefix);
            data[fieldId] = finalSku;
          }
        }
      }
    }

    const entry = await simpleStorage.submitDynamicData({
      templateId: Number(template_id),
      ownerId: res_id as string,
      tenantId,
      userId,
      data
    });

    return res.status(201).json({ success: true, data: entry, message: "Data submitted successfully" });
  } catch (error) {
    console.error("Data submission failed:", error);
    return res.status(500).json({ success: false, message: "Data submission failed", error });
  }
};

export const getData = async (req: any, res: Response) => {
  try {
    const { res_id } = req.params;
    const tenantId = req.user.tenantId;
    const data = await simpleStorage.getDynamicData(Number(res_id), tenantId);
    if (!data) return res.status(404).json({ success: false, message: "Data not found" });
    return res.json({ success: true, data, message: "Data fetched successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch data", error });
  }
};

export const getDataPublic = async (req: any, res: Response) => {
  try {
    const { res_id } = req.params;
    const { user: tenantId } = req.query;
    const data = await simpleStorage.getDynamicData(Number(res_id), tenantId);
    if (!data) return res.status(404).json({ success: false, message: "Data not found" });
    return res.json({ success: true, data, message: "Data fetched successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch data", error });
  }
};

export const getAllData = async (req: any, res: Response) => {
  try {
    const { template_id, page = 1, limit = 10, search } = req.query as any;
    const tenantId = req.user.tenantId;
    
    const filters = {
      templateId: template_id ? Number(template_id) : undefined,
      search,
      limit: Number(limit),
      offset: (Number(page) - 1) * Number(limit)
    };

    const { data: rows, total } = await simpleStorage.getDynamicDataEntries(tenantId, filters);

    return res.json({
      success: true,
      data: rows,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      },
      message: "Data fetched successfully"
    });
  } catch (error) {
    console.error('Fetch all data error:', error);
    return res.status(500).json({ success: false, message: "Failed to fetch data", error });
  }
};

export const getAllDataPublic = async (req: any, res: Response) => {
  try {
    const { template_id, page = 1, limit = 10, search, user: tenantId } = req.query as any;
    
    const filters = {
      templateId: template_id ? Number(template_id) : undefined,
      search,
      limit: Number(limit),
      offset: (Number(page) - 1) * Number(limit)
    };

    const { data: rows, total } = await simpleStorage.getDynamicDataEntries(tenantId, filters);

    return res.json({
      success: true,
      data: rows,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      },
      message: "Data fetched successfully"
    });
  } catch (error) {
    console.error('Fetch all data error:', error);
    return res.status(500).json({ success: false, message: "Failed to fetch data", error });
  }
};

export const updateData = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { data } = req.body;
    const tenantId = req.user.tenantId;

    const dynamicData = await simpleStorage.updateDynamicData(Number(id), tenantId, data);
    if (!dynamicData) return res.status(404).json({ success: false, message: "Dynamic data not found" });

    return res.json({ success: true, data: dynamicData, message: "Data updated successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Data update failed", error });
  }
};

export const deleteData = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    await simpleStorage.deleteDynamicData(Number(id), tenantId);
    return res.json({ success: true, data: null, message: "Data deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Data deletion failed", error });
  }
};
