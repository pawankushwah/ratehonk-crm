import { Response } from "express";
import { simpleStorage } from "../simple-storage.js";
import { STATIC_TEMPLATES } from "./static-templates.js";
import { mergeTemplate } from "./template-merger.js";

export const listTemplates = async (req: any, res: Response) => {
  try {
    const tenantId = req.user.tenantId;
    const { resourceType } = req.query;

    const dbTemplates = await simpleStorage.getFormTemplates(tenantId, resourceType as string);
    
    // We want to ensure all STATIC_TEMPLATES are present
    // Merged if DB record exists, otherwise use raw static
    const mergedStatic = STATIC_TEMPLATES
      .map(staticT => {
        const dbMatched = dbTemplates.find(dbT => dbT.formKey === staticT.formKey);
        if (dbMatched) return mergeTemplate(staticT, dbMatched);
        return staticT;
      });

    // Add any purely custom DB templates (those WITHOUT formKey matching any static)
    const customTemplates = dbTemplates.filter(dbT => 
      !STATIC_TEMPLATES.some(st => st.formKey === dbT.formKey)
    );

    const allTemplates = [...mergedStatic, ...customTemplates];

    return res.json({ success: true, data: allTemplates, message: "Templates fetched successfully" });
  } catch (error) {
    console.error("List templates error:", error);
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
    
    let template;
    if (isNaN(Number(id))) {
      // If id is not a number, it's a formKey
      const results = await simpleStorage.getFormTemplateByKey(Number(tenantId), id);
      template = results[0];

      // Fallback to static templates if not found in DB
      if (!template) {
        template = STATIC_TEMPLATES.find(t => t.formKey === id);
      }
    } else {
      const results = await simpleStorage.getFormTemplatebyId(Number(tenantId), Number(id));
      template = results[0];
    }
    
    if (template && template.formKey) {
      const staticT = STATIC_TEMPLATES.find(st => st.formKey === template.formKey);
      if (staticT) {
        template = mergeTemplate(staticT, template);
      }
    } else if (!template && isNaN(Number(id))) {
       // Only fallback to raw static if no DB record at all for this key
       template = STATIC_TEMPLATES.find(t => t.formKey === id);
    }
    
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
    const userId = req.user.id;
    const { name, schema, design, formKey, resourceType } = req.body;

    let template;
    if (isNaN(Number(id))) {
      // If id is not a number, it's a formKey. Try to find existing first.
      const results = await simpleStorage.getFormTemplateByKey(Number(tenantId), id);
      if (results[0]) {
        template = await simpleStorage.updateFormTemplate(Number(results[0].id), tenantId, {
          name,
          schema,
          design,
          formKey,
          resourceType
        });
      } else {
        // Create new template in DB from the static one being saved
        template = await simpleStorage.createFormTemplate({
          name,
          schema,
          design,
          userId,
          tenantId,
          formKey: formKey || id,
          resourceType
        });
      }
    } else {
      template = await simpleStorage.updateFormTemplate(Number(id), tenantId, {
        name,
        schema,
        design,
        formKey,
        resourceType
      });
    }

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
