import { Request, Response } from "express";
import { simpleStorage } from "../simple-storage";

export const uploadImage = async (req: any, res: Response) => {
  try {
    const tenantId = req.user.tenantId;
    const { data, original_data, name, mime_type } = req.body;
    
    if (!data || !name || !mime_type) {
      return res.status(400).json({ success: false, message: "Missing image data, name or mime_type" });
    }

    const image = await simpleStorage.createImageLog({
      tenantId,
      url: "db-stored", // Indicating data is in DB
      filename: name,
      data,
      originalData: original_data,
      mimeType: mime_type
    });

    return res.status(201).json({ success: true, data: { id: image.id }, message: "Image uploaded successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Image upload failed", error });
  }
};

export const getImage = async (req: any, res: Response) => {
  try {
    const id = req.params.id;
    const tenantId = req.user?.tenantId;
    const isOriginal = req.query.original === "true";
    
    const image = await simpleStorage.getImageLog(Number(id), tenantId);
    console.log("Image:", image);
    if (!image) return res.status(404).json({ success: false, message: "Image not found" });
    
    // Choose between cropped data (default) and original data
    const chosenData = (isOriginal && image.original_data) ? image.original_data : image.data;
    console.log("Chosen Data:", chosenData);
    if (!chosenData) return res.status(404).json({ success: false, message: "Image data not found" });

    // Extract base64 without prefix if it exists
    const base64Data = chosenData.split(",").pop() || "";
    const buffer = Buffer.from(base64Data, "base64");
    console.log("Buffer:", buffer);
    
    res.set("Content-Type", image.mimeType || "image/jpeg");
    return res.send(buffer);
  } catch (error) {
    console.error("Failed to fetch image:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch image", error });
  }
};
