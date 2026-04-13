import { Response } from "express";
import { simpleStorage } from "../simple-storage";

export const getNextSku = async (req: any, res: Response) => {
  try {
    const { prefix = "SKU" } = req.query as any;
    const tenantId = req.user.tenantId;
    
    const sku = await simpleStorage.generateNextSku(tenantId, prefix);
    return res.json({ success: true, data: { sku }, message: "SKU generated successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to generate SKU", error });
  }
};
