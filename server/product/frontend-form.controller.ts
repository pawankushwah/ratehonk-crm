import { Request, Response } from "express";
import { simpleStorage } from "../simple-storage";

export const getForms = async (req: Request, res: Response) => {
  try {
    const forms = await simpleStorage.getFrontendForms();
    res.json({ success: true, data: forms, message: "Frontend forms fetched successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch frontend forms", error });
  }
};

export const createForms = async (req: Request, res: Response) => {
  try {
    const { name, formKey } = req.body;
    // check name and formKey
    
    const data = { name, formKey }
    const forms = await simpleStorage.createFrontendForms(data);
    res.json({ success: true, data: forms, message: "Frontend form created successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create frontend form", error });  }
};