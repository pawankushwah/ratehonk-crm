import { Request, Response } from "express";
import { simpleStorage } from "../simple-storage.js";
import { STATIC_TEMPLATES } from "./static-templates.js";
import { mergeTemplate } from "./template-merger.js";

export const submitData = async (req: any, res: Response) => {
  try {
    const { template_id, data } = req.body;
    const { res_id } = req.params;
    const userId = req.user?.id;
    const tenantId = req.user?.tenantId;

    let template;
    if (isNaN(Number(template_id))) {
      const results = await simpleStorage.getFormTemplateByKey(Number(tenantId), template_id);
      const dbT = results[0];
      const staticT = STATIC_TEMPLATES.find(t => t.formKey === template_id);
      
      if (dbT && staticT) {
        template = mergeTemplate(staticT, dbT);
      } else {
        template = dbT || staticT;
      }
    } else {
      const results = await simpleStorage.getFormTemplatebyId(Number(tenantId), Number(template_id));
      template = results[0];
      if (template && template.formKey) {
        const staticT = STATIC_TEMPLATES.find(st => st.formKey === template.formKey);
        if (staticT) {
          template = mergeTemplate(staticT, template);
        }
      }
    }

    if (!template) return res.status(404).json({ success: false, message: "Template not found" });

    // SKU Generation Logic (same as before)
    const groups = (template.schema as any)?.groups || [];
    // Also handle flat items list if schema is array
    const allFields: any[] = [];
    const traverse = (items: any[]) => (items || []).forEach(it => {
        if (it.kind === 'field') allFields.push(it);
        if (it.items) traverse(it.items);
        if (it.fields) traverse(it.fields);
    });
    
    if (Array.isArray(template.schema)) {
      traverse(template.schema);
    } else {
      traverse((template.schema as any)?.groups || []);
    }

    for (const field of allFields) {
      if (field.type === "sku") {
        const fieldId = field.id;
        if (!data[fieldId]) {
          const prefix = field.properties?.prefix || "SKU";
          const finalSku = await simpleStorage.generateNextSku(tenantId, prefix);
          data[fieldId] = finalSku;
        }
      }
    }

    const entry = await simpleStorage.submitDynamicData({
      templateId: template.id || template_id, // If static, it might not have numeric ID yet
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
    const data = await simpleStorage.getDynamicData(Number(res_id), Number(tenantId));
    if (!data) return res.status(404).json({ success: false, message: "Data not found" });

    // Merge template if it exists
    if (data.FormTemplate && data.FormTemplate.formKey) {
      const staticT = STATIC_TEMPLATES.find(st => st.formKey === data.FormTemplate.formKey);
      if (staticT) {
        data.FormTemplate = mergeTemplate(staticT, data.FormTemplate);
      }
    }

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

    // Merge template if it exists
    if (data.FormTemplate && data.FormTemplate.formKey) {
      const staticT = STATIC_TEMPLATES.find(st => st.formKey === data.FormTemplate.formKey);
      if (staticT) {
        data.FormTemplate = mergeTemplate(staticT, data.FormTemplate);
      }
    }

    return res.json({ success: true, data, message: "Data fetched successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch data", error });
  }
};

export const getAllData = async (req: any, res: Response) => {
  try {
    const { template_id, page = 1, limit = 10, search, ...otherFilters } = req.query as any;
    const tenantId = req.user.tenantId;
    
    const filters = {
      templateId: template_id ? Number(template_id) : undefined,
      search,
      limit: Number(limit),
      offset: (Number(page) - 1) * Number(limit),
      jsonFilters: otherFilters
    };

    const { data: rows, total } = await simpleStorage.getDynamicDataEntries(tenantId, filters);

    // Merge templates for all rows
    const mergedRows = (rows || []).map(row => {
      if (row.FormTemplate && row.FormTemplate.formKey) {
        const staticT = STATIC_TEMPLATES.find(st => st.formKey === row.FormTemplate.formKey);
        if (staticT) {
          row.FormTemplate = mergeTemplate(staticT, row.FormTemplate);
        }
      }
      return row;
    });

    return res.json({
      success: true,
      data: mergedRows,
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
    const { template_id, page = 1, limit = 10, search, user: tenantId, ...otherFilters } = req.query as any;
    
    const filters = {
      templateId: template_id ? Number(template_id) : undefined,
      search,
      limit: Number(limit),
      offset: (Number(page) - 1) * Number(limit),
      jsonFilters: otherFilters
    };

    const { data: rows, total } = await simpleStorage.getDynamicDataEntries(tenantId, filters);

    // Merge templates for all rows
    const mergedRows = (rows || []).map(row => {
      if (row.FormTemplate && row.FormTemplate.formKey) {
        const staticT = STATIC_TEMPLATES.find(st => st.formKey === row.FormTemplate.formKey);
        if (staticT) {
          row.FormTemplate = mergeTemplate(staticT, row.FormTemplate);
        }
      }
      return row;
    });

    return res.json({
      success: true,
      data: mergedRows,
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
