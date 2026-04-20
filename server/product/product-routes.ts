import { Express } from "express";
import * as dropdownController from "./dropdown.controller.js";
import * as dynamicDataController from "./dynamic-data.controller.js";
import * as formController from "./form.controller.js";
import * as imageController from "./image.controller.js";
import * as skuController from "./sku.controller.js";

export const registerProductRoutes = (app: Express, authenticate: any, checkTenantAccess: any) => {
  app.get("/api/dummmy",authenticate, (_, res)=>res.send("😁"))

  // Dropdown Sets
  app.get("/api/dropdowns", authenticate, dropdownController.getSets);
  app.get("/api/dropdowns/:id", authenticate, dropdownController.getSet);
  app.post("/api/dropdowns", authenticate, dropdownController.createSet);
  app.put("/api/dropdowns/:id", authenticate, dropdownController.updateSet);
  app.delete("/api/dropdowns/:id", authenticate, dropdownController.deleteSet);

  // Form Templates
  app.get("/api/form-templates", authenticate, formController.listTemplates);
  app.get("/api/form-templates/:id", authenticate, formController.getTemplate);
  app.post("/api/form-templates", authenticate, formController.createTemplate);
  app.patch("/api/form-templates/:id", authenticate, formController.updateTemplate);
  app.delete("/api/form-templates/:id", authenticate, formController.deleteTemplate);


  // Dynamic Data
  app.get("/api/resources/data/all", authenticate, dynamicDataController.getAllData);
  app.get("/api/resources/data/all/public", dynamicDataController.getAllDataPublic);
  app.get("/api/resources/data/:res_id", authenticate, dynamicDataController.getData);
  app.get("/api/resources/data/:res_id/public", dynamicDataController.getDataPublic);
  app.post("/api/resources/data/:res_id", authenticate, dynamicDataController.submitData);
  app.put("/api/resources/data/:id", authenticate, dynamicDataController.updateData);
  app.delete("/api/resources/data/:id", authenticate, dynamicDataController.deleteData);

  // Images
  app.post("/api/images/upload", authenticate, imageController.uploadImage);
  app.get("/api/images/:id", imageController.getImage);

  // SKU
  app.post("/api/sku/next", authenticate, skuController.getNextSku);
};
