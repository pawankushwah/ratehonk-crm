import { Response } from "express";
import { simpleStorage } from "../simple-storage.js";

export const listTemplates = async (req: any, res: Response) => {
  try {
    const tenantId = req.user.tenantId;
    const { resourceType } = req.query;

    const templates = await simpleStorage.getFormTemplates(tenantId, resourceType as string);
    return res.json({ success: true, data: templates, message: "Templates fetched successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch templates", error });
  }
};

export const createTemplate = async (req: any, res: Response) => {
  try {
    const tenantId = req.user.tenantId;
    const userId = req.user.id;
    const { name, schema, design, mappedTo, resourceType } = req.body;

    const template = await simpleStorage.createFormTemplate({
      name,
      schema,
      design,
      userId,
      tenantId,
      mappedTo,
      resourceType
    });

    return res.status(201).json({ success: true, data: template, message: "Template created successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to create template", error });
  }
};

export const getTemplate = async (req: any, res: Response) => {
  try {
    const id = req.params.id;
    const tenantId = req.user.tenantId;
    const template = await simpleStorage.getFormTemplates(Number(id), tenantId);
    
    if (!template) return res.status(404).json({ success: false, message: "Template not found" });
    
    return res.json({ success: true, data: template, message: "Template fetched successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch template", error });
  }
};

export const updateTemplate = async (req: any, res: Response) => {
  try {
    const id = req.params.id;
    const tenantId = req.user.tenantId;
    const { name, schema, design, mappedTo, resourceType } = req.body;

    const template = await simpleStorage.updateFormTemplate(Number(id), tenantId, {
      name,
      schema,
      design,
      mappedTo,
      resourceType
    });

    if (!template) return res.status(404).json({ success: false, message: "Template not found or unauthorized" });

    return res.json({ success: true, data: template, message: "Template updated successfully" });
  } catch (error) {
    console.error("Failed to update template:", error);
    return res.status(500).json({ success: false, message: "Failed to update template", error });
  }
};

export const deleteTemplate = async (req: any, res: Response) => {
  try {
    const id = req.params.id;
    const tenantId = req.user.tenantId;

    await simpleStorage.deleteFormTemplate(Number(id), tenantId);
    return res.json({ success: true, data: {}, message: "Template deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to delete template", error });
  }
};
