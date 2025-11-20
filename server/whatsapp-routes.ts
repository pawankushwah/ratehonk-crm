import type { Express } from "express";
import { simpleStorage as storage } from "./simple-storage";
import { authenticate } from "./simple-routes";
import type { InsertWhatsappConfig } from "@shared/schema";
import { spawn } from "child_process";
import { z } from "zod";

// WhatsApp Business API base URL
const WHATSAPP_API_BASE = "https://whatsappbusiness.ratehonk.com";

// Helper function to send WhatsApp welcome messages
export async function sendWhatsAppWelcomeMessage(
  tenantId: number,
  phoneNumber: string,
  messageType: "lead" | "customer",
  entityId?: number,
  userId?: number,
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    console.log("Attempting to send WhatsApp welcome message:", {
      tenantId,
      phoneNumber,
      messageType,
    });

    // Get tenant settings to check if welcome messages are enabled
    const settings = await storage.getTenantSettings(tenantId);
    if (!settings) {
      return {
        success: false,
        error: "Tenant settings not found",
      };
    }

    // Check if welcome messages are enabled for this type
    const isEnabled =
      messageType === "lead"
        ? settings.enableLeadWelcomeMessage
        : settings.enableCustomerWelcomeMessage;

    if (!isEnabled) {
      return {
        success: false,
        message: `${messageType} welcome messages are disabled`,
      };
    }

    // Get the welcome message template
    const welcomeMessage =
      messageType === "lead"
        ? settings.leadWelcomeMessage
        : settings.customerWelcomeMessage;

    if (!welcomeMessage) {
      return {
        success: false,
        error: "Welcome message template not configured",
      };
    }

    // Get WhatsApp config
    const config = await storage.getWhatsAppConfigByTenant(tenantId);
    if (!config) {
      return {
        success: false,
        error: "WhatsApp is not configured",
      };
    }

    // Get default WhatsApp device
    const devices = await storage.getWhatsAppDevicesByTenant(tenantId);
    const defaultDevice = devices.find(
      (d: any) => d.isDefault === true && d.status === "connected",
    );

    if (!defaultDevice) {
      return {
        success: false,
        error: "No default WhatsApp device configured or device is not connected",
      };
    }

    // Validate phone number
    if (!phoneNumber || phoneNumber.trim() === "") {
      return {
        success: false,
        error: "Phone number is required",
      };
    }

    // Build request body for WhatsApp API
    const requestBody = {
      api_key: config.apiKey,
      sender: defaultDevice.number,
      number: phoneNumber.trim(),
      message: welcomeMessage,
    };

    console.log("Sending welcome message via WhatsApp API:", {
      sender: defaultDevice.number,
      recipient: phoneNumber,
      messageLength: welcomeMessage.length,
    });

    // Call WhatsApp Business API to send message
    const response = await fetch(`${WHATSAPP_API_BASE}/send-message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const responseData = await response.json();
    console.log("WhatsApp API welcome message response:", responseData);

    if (responseData.status === true) {
      // Update message count for the device
      await storage.incrementDeviceMessageCount(defaultDevice.id);

      // Log activity in lead_activities or customer_activities table
      if (entityId && userId) {
        try {
          const activityData = {
            tenantId,
            userId,
            activityType: 5, // 5 = WhatsApp message sent
            activityTitle: `WhatsApp Welcome Message Sent`,
            activityDescription: `Automated welcome message sent to ${phoneNumber}: "${welcomeMessage.substring(0, 100)}${welcomeMessage.length > 100 ? '...' : ''}"`,
            activityStatus: 1, // 1 = Completed
            activityDate: new Date().toISOString(),
          };

          if (messageType === "lead") {
            await storage.createLeadActivity({
              ...activityData,
              leadId: entityId,
            });
            console.log(`✅ Lead activity logged for lead ${entityId}`);
          } else {
            await storage.createCustomerActivity({
              ...activityData,
              customerId: entityId,
            });
            console.log(`✅ Customer activity logged for customer ${entityId}`);
          }
        } catch (activityError) {
          // Don't fail the whole operation if activity logging fails
          console.error("⚠️ Failed to log WhatsApp activity:", activityError);
        }
      }

      return {
        success: true,
        message: "Welcome message sent successfully",
      };
    } else {
      return {
        success: false,
        error: responseData.msg || "Failed to send welcome message",
      };
    }
  } catch (error: any) {
    console.error("Error sending WhatsApp welcome message:", error);
    return {
      success: false,
      error: error.message || "Failed to send welcome message",
    };
  }
}

// Zod schema for validating external WhatsApp API response
const WhatsAppAPIResponseSchema = z.object({
  status: z.boolean(),
  message: z.string().optional(),
  data: z.object({
    id: z.union([z.string(), z.number()]),
    username: z.string().min(1),
    email: z.string().email(),
    api_key: z.string().min(1),
    chunk_blast: z.number().optional().default(0),
    subscription_expired: z
      .string()
      .nullable()
      .refine(
        (date) => {
          // Allow null for lifetime subscriptions
          if (date === null) return true;
          return !isNaN(Date.parse(date));
        },
        {
          message: "Invalid date format for subscription_expired",
        },
      ),
    active_subscription: z.string().optional().default("active"),
    limit_device: z.number().min(1),
  }),
});

export function registerWhatsAppRoutes(app: Express) {
  // Setup WhatsApp tenant - Call external API and save credentials
  app.post("/api/whatsapp/setup", authenticate, async (req: any, res) => {
    try {
      const tenantId = req.user.tenantId;
      const { email, expire = 30, limitDevice = 10 } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      // Check if WhatsApp is already configured for this tenant
      const existingConfig = await storage.getWhatsAppConfigByTenant(tenantId);
      if (existingConfig) {
        return res.status(400).json({
          error:
            "WhatsApp is already configured for this tenant. Please delete the existing configuration first.",
        });
      }

      // Call external WhatsApp API to create tenant using cURL
      const requestBody = JSON.stringify({
        email,
        tenant_id: tenantId,
        expire,
        limit_device: limitDevice,
      });

      console.log("Calling WhatsApp API to create tenant for email:", email);

      // Use spawn for safer execution (prevents command injection)
      const data: any = await new Promise((resolve, reject) => {
        const curl = spawn("curl", [
          "-X",
          "POST",
          `${WHATSAPP_API_BASE}/create-tenant`,
          "-H",
          "Content-Type: application/json",
          "-d",
          requestBody,
          "-s",
          "-w",
          "\n%{http_code}",
          "--max-time",
          "30", // 30 second timeout
        ]);

        let stdout = "";
        let stderr = "";

        // Set a safety timeout
        const timeout = setTimeout(() => {
          curl.kill();
          reject(new Error("WhatsApp API request timed out after 30 seconds"));
        }, 31000); // Slightly longer than curl's max-time

        curl.stdout.on("data", (data) => {
          stdout += data.toString();
        });

        curl.stderr.on("data", (data) => {
          stderr += data.toString();
        });

        curl.on("close", (code) => {
          clearTimeout(timeout); // Clear the timeout when process completes

          if (code !== 0) {
            console.error("cURL stderr:", stderr);
            reject(new Error(`cURL process exited with code ${code}`));
            return;
          }

          try {
            // Parse response - last line is HTTP status code
            const lines = stdout.trim().split("\n");
            const httpCode = lines[lines.length - 1];
            const responseBody = lines.slice(0, -1).join("\n");

            console.log("WhatsApp API HTTP Status:", httpCode);

            if (!httpCode.match(/^2\d{2}$/)) {
              const errorData = responseBody
                ? JSON.parse(responseBody)
                : { message: "Unknown error" };
              reject(
                new Error(
                  errorData.message ||
                    `API request failed with status ${httpCode}`,
                ),
              );
              return;
            }

            const parsedData = JSON.parse(responseBody);

            // Validate response structure using Zod schema
            const validationResult =
              WhatsAppAPIResponseSchema.safeParse(parsedData);

            if (!validationResult.success) {
              console.error(
                "WhatsApp API response validation failed:",
                validationResult.error.format(),
              );
              reject(
                new Error(
                  `Invalid response from WhatsApp API: ${validationResult.error.errors.map((e) => e.message).join(", ")}`,
                ),
              );
              return;
            }

            const data = validationResult.data;

            if (!data.status || !data.data) {
              reject(
                new Error(data.message || "Failed to create WhatsApp tenant"),
              );
              return;
            }

            resolve(data);
          } catch (error) {
            reject(error);
          }
        });

        curl.on("error", (error) => {
          clearTimeout(timeout); // Clear the timeout on error
          console.error("cURL spawn error:", error);
          reject(error);
        });
      });

      // Save configuration to database
      const whatsappConfig: InsertWhatsappConfig = {
        tenantId,
        username: data.data.username,
        email: data.data.email,
        apiKey: data.data.api_key,
        chunkBlast: data.data.chunk_blast || 0,
        subscriptionExpired: data.data.subscription_expired
          ? new Date(data.data.subscription_expired)
          : null,
        activeSubscription: data.data.active_subscription || "active",
        limitDevice: data.data.limit_device,
        externalUserId: data.data.id,
      };

      console.log("Saving WhatsApp config for tenant:", tenantId);
      const savedConfig = await storage.createWhatsAppConfig(whatsappConfig);

      res.json({
        success: true,
        message: "WhatsApp integration configured successfully",
        config: {
          id: savedConfig.id,
          username: savedConfig.username,
          email: savedConfig.email,
          subscriptionExpired: savedConfig.subscriptionExpired,
          activeSubscription: savedConfig.activeSubscription,
          limitDevice: savedConfig.limitDevice,
        },
      });
    } catch (error: any) {
      console.error("WhatsApp setup error:", error);
      res.status(500).json({
        error: error.message || "Failed to configure WhatsApp integration",
      });
    }
  });

  // Get WhatsApp configuration for current tenant
  app.get("/api/whatsapp/config", authenticate, async (req: any, res) => {
    try {
      const tenantId = req.user.tenantId;
      const config = await storage.getWhatsAppConfigByTenant(tenantId);

      if (!config) {
        return res.json({ configured: false, config: null });
      }

      // Don't expose API key in response
      res.json({
        configured: true,
        config: {
          id: config.id,
          username: config.username,
          email: config.email,
          subscriptionExpired: config.subscriptionExpired,
          activeSubscription: config.activeSubscription,
          limitDevice: config.limitDevice,
          chunkBlast: config.chunkBlast,
          createdAt: config.createdAt,
        },
      });
    } catch (error: any) {
      console.error("Error fetching WhatsApp config:", error);

      // If table doesn't exist, return unconfigured status
      if (
        error.message?.includes("relation") &&
        error.message?.includes("does not exist")
      ) {
        console.warn(
          "⚠️ WhatsApp config table not found - returning unconfigured. Run 'npm run db:push' to create the table.",
        );
        return res.json({ configured: false, config: null });
      }

      res.status(500).json({ error: "Failed to fetch WhatsApp configuration" });
    }
  });

  // Delete WhatsApp configuration
  app.delete("/api/whatsapp/config", authenticate, async (req: any, res) => {
    try {
      const tenantId = req.user.tenantId;

      const config = await storage.getWhatsAppConfigByTenant(tenantId);
      if (!config) {
        return res
          .status(404)
          .json({ error: "WhatsApp configuration not found" });
      }

      await storage.deleteWhatsAppConfig(config.id);

      res.json({
        success: true,
        message: "WhatsApp configuration deleted successfully",
      });
    } catch (error: any) {
      console.error("Error deleting WhatsApp config:", error);
      res
        .status(500)
        .json({ error: "Failed to delete WhatsApp configuration" });
    }
  });

  // Get all WhatsApp devices for current tenant
  app.get("/api/whatsapp-devices", authenticate, async (req: any, res) => {
    try {
      const tenantId = req.user.tenantId;
      const devices = await storage.getWhatsAppDevicesByTenant(tenantId);
      res.json(devices);
    } catch (error: any) {
      console.error("Error fetching WhatsApp devices:", error);
      res.status(500).json({ error: "Failed to fetch WhatsApp devices" });
    }
  });

  // Add a new WhatsApp device - Calls external API then stores in DB
  app.post("/api/whatsapp-devices", authenticate, async (req: any, res) => {
    try {
      const tenantId = req.user.tenantId;
      const { number, webhookUrl } = req.body;

      if (!number) {
        return res.status(400).json({ error: "Phone number is required" });
      }

      // Get tenant's WhatsApp API key
      const config = await storage.getWhatsAppConfigByTenant(tenantId);
      if (!config) {
        return res.status(400).json({
          error: "WhatsApp is not configured. Please complete the setup first.",
        });
      }

      // Call external WhatsApp API to create device
      const requestBody = JSON.stringify({
        number: number,
        api_key: config.apiKey,
        webhook_url: webhookUrl || "",
      });

      console.log("Calling WhatsApp create-device API for number:", number);

      const deviceData: any = await new Promise((resolve, reject) => {
        const curl = spawn("curl", [
          "-X",
          "POST",
          `${WHATSAPP_API_BASE}/create-device`,
          "-H",
          "Content-Type: application/json",
          "-d",
          requestBody,
          "-s",
          "-w",
          "\n%{http_code}",
          "--max-time",
          "30",
        ]);

        let stdout = "";
        let stderr = "";

        const timeout = setTimeout(() => {
          curl.kill();
          reject(new Error("WhatsApp API request timed out after 30 seconds"));
        }, 31000);

        curl.stdout.on("data", (data) => {
          stdout += data.toString();
        });

        curl.stderr.on("data", (data) => {
          stderr += data.toString();
        });

        curl.on("close", (code) => {
          clearTimeout(timeout);

          if (code !== 0) {
            console.error("cURL stderr:", stderr);
            reject(new Error(`cURL process exited with code ${code}`));
            return;
          }

          try {
            const lines = stdout.trim().split("\n");
            const httpCode = lines[lines.length - 1];
            const responseBody = lines.slice(0, -1).join("\n");

            console.log("WhatsApp info-devices API HTTP Status:", httpCode);

            if (!httpCode.match(/^2\d{2}$/)) {
              let errorMessage = `API request failed with status ${httpCode}`;
              try {
                const errorData = responseBody
                  ? JSON.parse(responseBody)
                  : null;
                if (errorData && errorData.error) {
                  // WhatsApp API returns error in "error" field
                  errorMessage = errorData.error;
                  console.log("WhatsApp API error:", errorMessage);
                } else if (errorData && errorData.message) {
                  errorMessage = errorData.message;
                  console.log("WhatsApp API error:", errorMessage);
                } else if (errorData && errorData.msg) {
                  errorMessage = errorData.msg;
                  console.log("WhatsApp API error:", errorMessage);
                } else if (responseBody) {
                  console.log("WhatsApp API error response:", responseBody);
                  errorMessage = responseBody;
                }
              } catch (e) {
                console.log("WhatsApp API raw error response:", responseBody);
                errorMessage = responseBody || errorMessage;
              }
              reject(new Error(errorMessage));
              return;
            }

            const parsedData = JSON.parse(responseBody);

            if (!parsedData.status || !parsedData.data) {
              reject(
                new Error(parsedData.message || "Failed to create device"),
              );
              return;
            }

            resolve(parsedData);
          } catch (error) {
            reject(error);
          }
        });

        curl.on("error", (error) => {
          clearTimeout(timeout);
          console.error("cURL spawn error:", error);
          reject(error);
        });
      });

      // Extract device info from response
      const deviceInfo = deviceData.data;

      // Check if this is the first device for this tenant
      const existingDevices = await storage.getWhatsAppDevicesByTenant(tenantId);
      const isFirstDevice = existingDevices.length === 0;

      console.log(`📱 Creating ${isFirstDevice ? 'FIRST' : 'additional'} device for tenant ${tenantId}`);

      // Save device to database
      const device = await storage.createWhatsAppDevice({
        tenantId,
        number: deviceInfo.body,
        externalDeviceId: deviceInfo.id,
        webhookUrl: deviceInfo.webhook,
        status: "disconnected", // New devices start as disconnected
        isDefault: isFirstDevice, // Automatically set first device as default
        fullResponse: false,
        readMessages: false,
        rejectCalls: false,
        showAvailable: false,
        showTyping: false,
        messageDelay: 0,
        messagesSent: 0,
      });

      res.json({
        success: true,
        message: "Device added successfully",
        device,
      });
    } catch (error: any) {
      console.error("Error adding WhatsApp device:", error);
      res.status(500).json({
        error: error.message || "Failed to add WhatsApp device",
      });
    }
  });

  // Update device options
  app.patch(
    "/api/whatsapp-devices/:id/options",
    authenticate,
    async (req: any, res) => {
      try {
        const deviceId = parseInt(req.params.id);
        const options = req.body;

        const updatedDevice = await storage.updateWhatsAppDeviceOptions(
          deviceId,
          options,
        );

        res.json({
          success: true,
          message: "Device options updated successfully",
          device: updatedDevice,
        });
      } catch (error: any) {
        console.error("Error updating device options:", error);
        res.status(500).json({ error: "Failed to update device options" });
      }
    },
  );

  // Logout WhatsApp device
  app.post(
    "/api/whatsapp-devices/:id/logout",
    authenticate,
    async (req: any, res) => {
      try {
        const tenantId = req.user.tenantId;
        const deviceId = parseInt(req.params.id);

        // Get device from database
        const devices = await storage.getWhatsAppDevicesByTenant(tenantId);
        const device = devices.find((d: any) => d.id === deviceId);

        if (!device) {
          return res.status(404).json({
            error: "Device not found or you don't have permission to access it",
          });
        }

        // Get tenant's WhatsApp API key
        const config = await storage.getWhatsAppConfigByTenant(tenantId);
        if (!config) {
          return res.status(400).json({
            error:
              "WhatsApp is not configured. Please complete the setup first.",
          });
        }

        // Call third-party API to logout device
        const requestBody = JSON.stringify({
          api_key: config.apiKey,
          sender: device.number,
        });

        console.log("Calling WhatsApp API to logout device:", device.number);
        console.log("DEBUG - Logout Request Body:", requestBody);
        console.log("DEBUG - API Key:", config.apiKey);
        console.log("DEBUG - Sender (device number):", device.number);

        const logoutData: any = await new Promise((resolve, reject) => {
          const curl = spawn("curl", [
            "-X",
            "POST",
            "https://whatsappbusiness.ratehonk.com/logout-device",
            "-H",
            "Content-Type: application/json",
            "-d",
            requestBody,
            "-s",
            "-w",
            "\n%{http_code}",
            "--max-time",
            "30",
          ]);

          let stdout = "";
          let stderr = "";

          const timeout = setTimeout(() => {
            curl.kill();
            reject(
              new Error("WhatsApp API request timed out after 30 seconds"),
            );
          }, 31000);

          curl.stdout.on("data", (data) => {
            stdout += data.toString();
          });

          curl.stderr.on("data", (data) => {
            stderr += data.toString();
          });

          curl.on("close", (code) => {
            clearTimeout(timeout);

            if (code !== 0) {
              console.error("cURL exited with code:", code);
              console.error("stderr:", stderr);
              reject(new Error(`cURL process exited with code ${code}`));
              return;
            }

            try {
              const lines = stdout.trim().split("\n");
              const httpCode = lines[lines.length - 1];
              const responseBody = lines.slice(0, -1).join("\n");

              console.log("WhatsApp logout API HTTP Status:", httpCode);
              console.log(
                "WhatsApp logout API Response:",
                responseBody.substring(0, 500),
              );

              if (!httpCode.match(/^2\d{2}$/)) {
                try {
                  const errorData = JSON.parse(responseBody);
                  console.error("WhatsApp API Error Response:", errorData);
                  reject(
                    new Error(
                      errorData.message ||
                        errorData.msg ||
                        `API request failed with status ${httpCode}`,
                    ),
                  );
                } catch (parseError) {
                  console.error(
                    "WhatsApp API Error (non-JSON):",
                    responseBody.substring(0, 200),
                  );
                  reject(
                    new Error(`API request failed with status ${httpCode}`),
                  );
                }
                return;
              }

              const parsedData = JSON.parse(responseBody);
              console.log(
                "WhatsApp logout API Response:",
                JSON.stringify(parsedData),
              );
              resolve(parsedData);
            } catch (error) {
              reject(error);
            }
          });

          curl.on("error", (error) => {
            clearTimeout(timeout);
            console.error("cURL spawn error:", error);
            reject(error);
          });
        });

        // Validate the response status before updating database
        if (logoutData.status === false) {
          throw new Error(
            logoutData.message ||
              logoutData.msg ||
              "Logout failed on WhatsApp API",
          );
        }

        // Update device status to disconnected in database
        await storage.updateWhatsAppDeviceStatus(
          deviceId,
          "disconnected",
          null,
        );

        res.json({
          success: true,
          message:
            logoutData.message ||
            logoutData.msg ||
            "Device logged out successfully",
          data: logoutData,
        });
      } catch (error: any) {
        console.error("Error logging out device:", error);
        res.status(500).json({
          error: error.message || "Failed to logout device",
        });
      }
    },
  );

  // Delete WhatsApp device
  app.delete(
    "/api/whatsapp-devices/:id",
    authenticate,
    async (req: any, res) => {
      try {
        const tenantId = req.user.tenantId;
        const deviceId = parseInt(req.params.id);

        // Get device from database
        const devices = await storage.getWhatsAppDevicesByTenant(tenantId);
        const device = devices.find((d: any) => d.id === deviceId);

        if (!device) {
          return res.status(404).json({ error: "Device not found" });
        }

        // Get tenant's WhatsApp API key
        const config = await storage.getWhatsAppConfigByTenant(tenantId);
        if (!config) {
          return res.status(400).json({
            error:
              "WhatsApp is not configured. Please complete the setup first.",
          });
        }

        // Call third-party API to delete device
        const requestBody = JSON.stringify({
          api_key: config.apiKey,
          sender: device.number,
        });

        console.log("Calling WhatsApp API to delete device:", device.number);

        try {
          const deleteData: any = await new Promise((resolve, reject) => {
            const curl = spawn("curl", [
              "-X",
              "POST",
              "https://whatsappbusiness.ratehonk.com/delete-device",
              "-H",
              "Content-Type: application/json",
              "-d",
              requestBody,
              "-s",
              "-w",
              "\n%{http_code}",
              "--max-time",
              "30",
            ]);

            let stdout = "";
            let stderr = "";

            const timeout = setTimeout(() => {
              curl.kill();
              reject(
                new Error("WhatsApp API request timed out after 30 seconds"),
              );
            }, 31000);

            curl.stdout.on("data", (data) => {
              stdout += data.toString();
            });

            curl.stderr.on("data", (data) => {
              stderr += data.toString();
            });

            curl.on("close", (code) => {
              clearTimeout(timeout);

              if (code !== 0) {
                console.error("cURL exited with code:", code);
                console.error("stderr:", stderr);
                reject(new Error(`cURL process exited with code ${code}`));
                return;
              }

              try {
                const lines = stdout.trim().split("\n");
                const httpCode = lines[lines.length - 1];
                const responseBody = lines.slice(0, -1).join("\n");

                console.log("WhatsApp delete API HTTP Status:", httpCode);
                console.log(
                  "WhatsApp delete API Response:",
                  responseBody.substring(0, 500),
                );

                if (!httpCode.match(/^2\d{2}$/)) {
                  try {
                    const errorData = JSON.parse(responseBody);
                    console.error("WhatsApp API Error Response:", errorData);
                    reject(
                      new Error(
                        errorData.message ||
                          errorData.msg ||
                          `API request failed with status ${httpCode}`,
                      ),
                    );
                  } catch (parseError) {
                    console.error(
                      "WhatsApp API Error (non-JSON):",
                      responseBody.substring(0, 200),
                    );
                    reject(
                      new Error(`API request failed with status ${httpCode}`),
                    );
                  }
                  return;
                }

                const parsedData = JSON.parse(responseBody);
                console.log(
                  "WhatsApp delete API Response:",
                  JSON.stringify(parsedData),
                );
                resolve(parsedData);
              } catch (error) {
                reject(error);
              }
            });

            curl.on("error", (error) => {
              clearTimeout(timeout);
              console.error("cURL spawn error:", error);
              reject(error);
            });
          });

          // Validate the response status before proceeding with database deletion
          if (deleteData.status === false) {
            throw new Error(
              deleteData.message ||
                deleteData.msg ||
                "Delete failed on WhatsApp API",
            );
          }

          console.log("Third-party delete API successful:", deleteData);
        } catch (apiError: any) {
          console.error("Third-party delete API failed:", apiError.message);
          throw new Error(
            apiError.message || "Failed to delete device from WhatsApp API",
          );
        }

        // Delete from database (only reached if API call was successful)
        await storage.deleteWhatsAppDevice(deviceId);

        res.json({
          success: true,
          message: "Device deleted successfully",
        });
      } catch (error: any) {
        console.error("Error deleting device:", error);
        res.status(500).json({ error: "Failed to delete device" });
      }
    },
  );

  // Generate QR code for WhatsApp device connection
  app.post(
    "/api/whatsapp-devices/:id/generate-qr",
    authenticate,
    async (req: any, res) => {
      try {
        const tenantId = req.user.tenantId;
        const deviceId = parseInt(req.params.id);
        const { force = false } = req.body;

        // Get device from database
        const devices = await storage.getWhatsAppDevicesByTenant(tenantId);
        const device = devices.find((d: any) => d.id === deviceId);

        if (!device) {
          return res.status(404).json({ error: "Device not found" });
        }

        // Get tenant's WhatsApp API key
        const config = await storage.getWhatsAppConfigByTenant(tenantId);
        if (!config) {
          return res.status(400).json({
            error:
              "WhatsApp is not configured. Please complete the setup first.",
          });
        }

        // Call external WhatsApp API to generate QR code (POST request with JSON body)
        const requestBody = JSON.stringify({
          device: device.number,
          api_key: config.apiKey,
          force: force,
        });

        console.log(
          "Calling WhatsApp generate-qr API for device:",
          device.number,
        );

        const qrData: any = await new Promise((resolve, reject) => {
          const curl = spawn("curl", [
            "-X",
            "POST",
            `${WHATSAPP_API_BASE}/generate-qr`,
            "-H",
            "Content-Type: application/json",
            "-d",
            requestBody,
            "-s",
            "-w",
            "\n%{http_code}",
            "--max-time",
            "30",
          ]);

          let stdout = "";
          let stderr = "";

          const timeout = setTimeout(() => {
            curl.kill();
            reject(
              new Error("WhatsApp API request timed out after 30 seconds"),
            );
          }, 31000);

          curl.stdout.on("data", (data) => {
            stdout += data.toString();
          });

          curl.stderr.on("data", (data) => {
            stderr += data.toString();
          });

          curl.on("close", (code) => {
            clearTimeout(timeout);

            if (code !== 0) {
              console.error("cURL stderr:", stderr);
              reject(new Error(`cURL process exited with code ${code}`));
              return;
            }

            try {
              const lines = stdout.trim().split("\n");
              const httpCode = lines[lines.length - 1];
              const responseBody = lines.slice(0, -1).join("\n");

              console.log("WhatsApp generate-qr API HTTP Status:", httpCode);

              if (!httpCode.match(/^2\d{2}$/)) {
                // Log the actual response body for debugging
                console.error(
                  "WhatsApp API error response (first 500 chars):",
                  responseBody.substring(0, 500),
                );

                // Try to parse as JSON, but handle HTML responses
                try {
                  const errorData = JSON.parse(responseBody);
                  reject(
                    new Error(
                      errorData.message ||
                        `API request failed with status ${httpCode}`,
                    ),
                  );
                } catch (parseError) {
                  // Response is not JSON (likely HTML error page)
                  reject(
                    new Error(
                      `API request failed with status ${httpCode}. Response is not JSON (likely HTML error page). Check endpoint and request format.`,
                    ),
                  );
                }
                return;
              }

              const parsedData = JSON.parse(responseBody);
              console.log(
                "WhatsApp generate-qr API Response:",
                JSON.stringify(parsedData).substring(0, 200),
              );
              resolve(parsedData);
            } catch (error) {
              reject(error);
            }
          });

          curl.on("error", (error) => {
            clearTimeout(timeout);
            console.error("cURL spawn error:", error);
            reject(error);
          });
        });

        console.log("QR API Response - Status:", qrData.status);
        console.log(
          "QR API Response - Message/Msg:",
          qrData.message || qrData.msg,
        );
        console.log("QR API Response - Has QR Code:", !!qrData.qrcode);

        // Check if device is already connected (exact match for connected state)
        const isConnected =
          qrData.status === false && qrData.msg === "Device already connected!";

        if (isConnected) {
          console.log(
            "Device already connected! Updating status to 'connected'",
          );
          await storage.updateWhatsAppDeviceStatus(deviceId, "connected", null);

          res.json({
            success: true,
            qrCode: null,
            message: qrData.msg,
            alreadyConnected: true,
          });
          return;
        }

        // If QR code is returned (status is false and qrcode field exists)
        // The WhatsApp API returns status: false with qrcode data URL when QR is generated
        if (qrData.qrcode) {
          console.log("Updating device status to 'scanning' with QR code");
          await storage.updateWhatsAppDeviceStatus(
            deviceId,
            "scanning",
            qrData.qrcode,
          );

          res.json({
            success: true,
            qrCode: qrData.qrcode,
            message:
              qrData.message || "Please scan this QR code with your WhatsApp",
            alreadyConnected: false,
          });
          return;
        }

        // Handle error responses (status === false but not connected and no QR code)
        if (qrData.status === false) {
          console.error("WhatsApp API error:", qrData.msg || qrData.message);
          throw new Error(
            qrData.msg || qrData.message || "Unknown error from WhatsApp API",
          );
        }

        // Fallback for unexpected response format
        console.warn(
          "Unexpected WhatsApp API response format:",
          JSON.stringify(qrData).substring(0, 200),
        );
        res.json({
          success: true,
          qrCode: qrData.qrcode || null,
          message: qrData.message || qrData.msg || "Unknown status",
          alreadyConnected: false,
        });
      } catch (error: any) {
        console.error("Error generating QR code:", error);
        res.status(500).json({
          error: error.message || "Failed to generate QR code",
        });
      }
    },
  );

  // Get QR code iframe URL for device connection
  app.get(
    "/api/whatsapp-devices/:id/qr-iframe-url",
    authenticate,
    async (req: any, res) => {
      try {
        const tenantId = req.user.tenantId;
        const deviceId = parseInt(req.params.id);

        // Get device from database
        const devices = await storage.getWhatsAppDevicesByTenant(tenantId);
        const device = devices.find((d: any) => d.id === deviceId);

        if (!device) {
          return res.status(404).json({ error: "Device not found" });
        }

        // Get tenant's WhatsApp API key
        const config = await storage.getWhatsAppConfigByTenant(tenantId);
        if (!config) {
          return res.status(400).json({
            error:
              "WhatsApp is not configured. Please complete the setup first.",
          });
        }

        // Generate QR iframe URL with auto-login parameters
        // The redirect URL is a relative path to the scan page with the device number
        const redirectUrl = `scan`;
        const qrIframeUrl = `${WHATSAPP_API_BASE}/en/auto-login?api_key=${encodeURIComponent(config.apiKey)}&redirect_url=${encodeURIComponent(redirectUrl)}&device_number=${encodeURIComponent(device.number)}`;

        res.json({
          success: true,
          url: qrIframeUrl,
        });
      } catch (error: any) {
        console.error("Error generating QR iframe URL:", error);
        res.status(500).json({
          error: error.message || "Failed to generate QR iframe URL",
        });
      }
    },
  );

  // Check device connection status
  app.get(
    "/api/whatsapp-devices/:id/check-status",
    authenticate,
    async (req: any, res) => {
      try {
        const tenantId = req.user.tenantId;
        const deviceId = parseInt(req.params.id);

        // Get device from database
        const devices = await storage.getWhatsAppDevicesByTenant(tenantId);
        const device = devices.find((d: any) => d.id === deviceId);

        if (!device) {
          return res.status(404).json({ error: "Device not found" });
        }

        // Get tenant's WhatsApp API key
        const config = await storage.getWhatsAppConfigByTenant(tenantId);
        if (!config) {
          return res.status(400).json({
            error:
              "WhatsApp is not configured. Please complete the setup first.",
          });
        }

        // Call WhatsApp API to check device status
        // Use GET /generate-qr endpoint - if device is connected, it returns "already connected" message
        console.log("Checking device status for:", device.number);

        const statusData: any = await new Promise((resolve, reject) => {
          const statusUrl = `${WHATSAPP_API_BASE}/generate-qr?device=${encodeURIComponent(device.number)}&api_key=${encodeURIComponent(config.apiKey)}`;
          const curl = spawn("curl", [
            "-X",
            "GET",
            statusUrl,
            "-s",
            "-w",
            "\n%{http_code}",
            "--max-time",
            "30",
          ]);

          let stdout = "";
          let stderr = "";

          const timeout = setTimeout(() => {
            curl.kill();
            reject(
              new Error("WhatsApp API request timed out after 30 seconds"),
            );
          }, 31000);

          curl.stdout.on("data", (data) => {
            stdout += data.toString();
          });

          curl.stderr.on("data", (data) => {
            stderr += data.toString();
          });

          curl.on("close", (code) => {
            clearTimeout(timeout);

            if (code !== 0) {
              console.error("cURL stderr:", stderr);
              reject(new Error(`cURL process exited with code ${code}`));
              return;
            }

            try {
              const lines = stdout.trim().split("\n");
              const httpCode = lines[lines.length - 1];
              const responseBody = lines.slice(0, -1).join("\n");

              console.log("WhatsApp check-status API HTTP Status:", httpCode);
              console.log(
                "WhatsApp check-status API Response Body:",
                responseBody.substring(0, 500),
              );

              if (!httpCode.match(/^2\d{2}$/)) {
                try {
                  const errorData = JSON.parse(responseBody);
                  console.error("WhatsApp API Error Response:", errorData);
                  console.log("DEBUG - httpCode:", httpCode);
                  console.log("DEBUG - errorData.msg:", errorData.msg);
                  console.log("DEBUG - errorData.message:", errorData.message);
                  console.log("DEBUG - errorData.error:", errorData.error);
                  console.log(
                    "DEBUG - typeof errorData.msg:",
                    typeof errorData.msg,
                  );

                  // Special case: If it's a 500 error with "Device already connected!",
                  // treat it as success (device is connected)
                  const msgCheck =
                    errorData.msg &&
                    String(errorData.msg).includes("Device already connected");
                  const messageCheck =
                    errorData.message &&
                    String(errorData.message).includes(
                      "Device already connected",
                    );
                  const errorCheck =
                    errorData.error &&
                    String(errorData.error).includes(
                      "Device already connected",
                    );
                  const isAlreadyConnected =
                    msgCheck || messageCheck || errorCheck;

                  console.log("DEBUG - msgCheck:", msgCheck);
                  console.log("DEBUG - messageCheck:", messageCheck);
                  console.log("DEBUG - errorCheck:", errorCheck);
                  console.log(
                    "DEBUG - isAlreadyConnected:",
                    isAlreadyConnected,
                  );

                  // Check for both 400 and 500 status codes with "Device already connected" message
                  if (
                    (httpCode === "400" || httpCode === "500") &&
                    isAlreadyConnected
                  ) {
                    console.log(
                      "✅ Device already connected (HTTP",
                      httpCode,
                      ") - treating as success",
                    );
                    console.log("✅ Error data:", JSON.stringify(errorData));
                    resolve(errorData);
                    return;
                  }

                  reject(
                    new Error(
                      errorData.message ||
                        errorData.msg ||
                        errorData.error ||
                        `API request failed with status ${httpCode}`,
                    ),
                  );
                } catch (parseError) {
                  console.error(
                    "WhatsApp API Error (non-JSON):",
                    responseBody.substring(0, 200),
                  );
                  reject(
                    new Error(
                      `API request failed with status ${httpCode}. Response: ${responseBody.substring(0, 100)}`,
                    ),
                  );
                }
                return;
              }

              const parsedData = JSON.parse(responseBody);
              console.log(
                "WhatsApp check-status API Response:",
                JSON.stringify(parsedData).substring(0, 200),
              );
              resolve(parsedData);
            } catch (error) {
              reject(error);
            }
          });

          curl.on("error", (error) => {
            clearTimeout(timeout);
            console.error("cURL spawn error:", error);
            reject(error);
          });
        });

        // Check if device is connected
        // Handle different response formats from the scan endpoint
        const hasConnectedMessage =
          (statusData.msg &&
            statusData.msg.includes("Device already connected")) ||
          (statusData.message &&
            statusData.message.includes("Device already connected")) ||
          (statusData.error &&
            statusData.error.includes("Device already connected"));

        const isConnected =
          hasConnectedMessage ||
          (statusData.status === true && statusData.connected === true) ||
          statusData.connected === true ||
          statusData.device_status === "connected";

        if (isConnected) {
          console.log(
            "  � Device is connected! Updating status to 'connected' for device ID:",
            deviceId,
          );
          await storage.updateWhatsAppDeviceStatus(deviceId, "connected", null);
          console.log("✅ Status updated successfully in database");

          res.json({
            success: true,
            connected: true,
            status: "connected",
            message:
              statusData.msg ||
              statusData.message ||
              statusData.error ||
              "Device connected successfully",
          });
          return;
        }

        // Device is not connected yet
        console.log(
          "Device is not connected yet. Response:",
          JSON.stringify(statusData).substring(0, 200),
        );
        res.json({
          success: true,
          connected: false,
          status: device.status,
          message:
            statusData.msg ||
            statusData.message ||
            statusData.error ||
            "Device not connected yet",
        });
      } catch (error: any) {
        console.error("Error checking device status:", error);
        res.status(500).json({
          error: error.message || "Failed to check device status",
        });
      }
    },
  );

  // Get live chat URL for a device
  app.get(
    "/api/whatsapp-devices/:id/live-chat-url",
    authenticate,
    async (req: any, res) => {
      try {
        const tenantId = req.user.tenantId;
        const deviceId = parseInt(req.params.id);

        // Get device from database
        const devices = await storage.getWhatsAppDevicesByTenant(tenantId);
        const device = devices.find((d: any) => d.id === deviceId);

        if (!device) {
          return res.status(404).json({ error: "Device not found" });
        }

        // Get tenant's WhatsApp API key
        const config = await storage.getWhatsAppConfigByTenant(tenantId);
        if (!config) {
          return res.status(400).json({
            error:
              "WhatsApp is not configured. Please complete the setup first.",
          });
        }

        // Generate the live chat URL
        const liveChatUrl = `https://whatsappbusiness.ratehonk.com/en/auto-login?api_key=${config.apiKey}&redirect_url=chat&device_number=${device.number}`;

        res.json({
          success: true,
          url: liveChatUrl,
        });
      } catch (error: any) {
        console.error("Error generating live chat URL:", error);
        res.status(500).json({
          error: error.message || "Failed to generate live chat URL",
        });
      }
    },
  );

  // Get customers with phone numbers for messaging
  app.get(
    "/api/whatsapp/customers-with-phone",
    authenticate,
    async (req: any, res) => {
      try {
        const tenantId = req.user.tenantId;

        const customersWithPhone =
          await storage.getCustomersWithPhone(tenantId);

        res.json({
          success: true,
          customers: customersWithPhone,
        });
      } catch (error: any) {
        console.error("Error fetching customers with phone:", error);
        res.status(500).json({
          error: error.message || "Failed to fetch customers",
        });
      }
    },
  );

  // Get leads with phone numbers for messaging
  app.get(
    "/api/whatsapp/leads-with-phone",
    authenticate,
    async (req: any, res) => {
      try {
        const tenantId = req.user.tenantId;

        const leadsWithPhone = await storage.getLeadsWithPhone(tenantId);

        res.json({
          success: true,
          leads: leadsWithPhone,
        });
      } catch (error: any) {
        console.error("Error fetching leads with phone:", error);
        res.status(500).json({
          error: error.message || "Failed to fetch leads",
        });
      }
    },
  );

  // Get upload URL for media files
  app.post(
    "/api/whatsapp/media/upload-url",
    authenticate,
    async (req: any, res) => {
      try {
        const { ObjectStorageService } = await import("./objectStorage.js");
        const objectStorageService = new ObjectStorageService();
        const uploadURL = await objectStorageService.getObjectEntityUploadURL();
        res.json({ uploadURL });
      } catch (error: any) {
        console.error("Error getting upload URL:", error);
        res.status(500).json({
          error: error.message || "Failed to get upload URL",
        });
      }
    },
  );

  // Confirm media upload and get public URL
  app.post(
    "/api/whatsapp/media/confirm-upload",
    authenticate,
    async (req: any, res) => {
      try {
        const { uploadURL } = req.body;

        if (!uploadURL) {
          return res.status(400).json({ error: "uploadURL is required" });
        }

        const { ObjectStorageService } = await import("./objectStorage.js");
        const objectStorageService = new ObjectStorageService();

        // Normalize the path to get the public URL
        const objectPath =
          objectStorageService.normalizeObjectEntityPath(uploadURL);

        // Convert to full public URL
        const publicURL = `${req.protocol}://${req.get("host")}/objects${objectPath.replace("/objects", "")}`;

        res.json({ publicURL });
      } catch (error: any) {
        console.error("Error confirming upload:", error);
        res.status(500).json({
          error: error.message || "Failed to confirm upload",
        });
      }
    },
  );

  // Serve uploaded media files
  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const { ObjectStorageService, ObjectNotFoundError } = await import(
        "./objectStorage.js"
      );
      const objectStorageService = new ObjectStorageService();

      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path,
      );
      objectStorageService.downloadObject(objectFile, res);
    } catch (error: any) {
      console.error("Error serving object:", error);
      if (error.name === "ObjectNotFoundError") {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Send media message via WhatsApp
  app.post(
    "/api/whatsapp/send-media-message",
    authenticate,
    async (req: any, res) => {
      try {
        const tenantId = req.user.tenantId;
        const {
          sender,
          number,
          media_type,
          url,
          caption,
          footer,
          msgid,
          full,
        } = req.body;

        // Validate required fields
        if (!sender || !number || !media_type || !url) {
          return res.status(400).json({
            error: "Missing required fields: sender, number, media_type, url",
          });
        }

        // Validate media type
        const validMediaTypes = ["image", "video", "audio", "document"];
        if (!validMediaTypes.includes(media_type)) {
          return res.status(400).json({
            error: `Invalid media_type. Must be one of: ${validMediaTypes.join(", ")}`,
          });
        }

        // Get WhatsApp config for this tenant
        const config = await storage.getWhatsAppConfigByTenant(tenantId);
        if (!config) {
          return res.status(404).json({
            error:
              "WhatsApp not configured. Please set up WhatsApp integration first.",
          });
        }

        // Get the device to verify ownership and connection status
        const devices = await storage.getWhatsAppDevicesByTenant(tenantId);
        const device = devices.find((d: any) => d.number === sender);
        if (!device) {
          return res.status(404).json({
            error: "Device not found or does not belong to your account",
          });
        }

        if (device.status !== "connected") {
          return res.status(400).json({
            error: `Device ${sender} is not connected. Current status: ${device.status}`,
          });
        }

        // Prepare API request
        const apiUrl = "https://whatsappbusiness.ratehonk.com/send-media";
        const payload: any = {
          api_key: config.apiKey,
          sender,
          number,
          media_type,
          url,
        };

        // Add optional fields
        if (caption) payload.caption = caption;
        if (footer) payload.footer = footer;
        if (msgid) payload.msgid = msgid;
        if (full) payload.full = full;

        // Make API call
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
          return res.status(response.status).json({
            error: data.msg || data.error || "Failed to send media message",
            details: data,
          });
        }

        // Increment message count for the device
        await storage.incrementDeviceMessageCount(device.id);

        // Try to find customer by phone number
        let customerId: number | undefined;
        let customerName: string | undefined;
        try {
          const result = await storage.getCustomersByTenant(tenantId, { limit: 1000 });
          const customers = result && typeof result === "object" && "data" in result ? result.data : result;
          // Normalize phone numbers for comparison (remove ALL non-digits)
          const normalizePhone = (phone: string) => phone?.replace(/\D/g, '') || '';
          const normalizedNumber = normalizePhone(number);
          const customer = customers.find((c: any) => normalizePhone(c.phone) === normalizedNumber);
          
          if (customer) {
            customerId = customer.id;
            customerName = customer.name;
            
            // Log activity for customer
            if (req.user?.id) {
              await storage.createCustomerActivity({
                tenantId,
                customerId: customer.id,
                userId: req.user.id,
                activityType: 5, // 5 = WhatsApp message sent
                activityTitle: `WhatsApp Media Sent (${media_type})`,
                activityDescription: `Media type: ${media_type}${caption ? `, Caption: "${caption.substring(0, 100)}${caption.length > 100 ? '...' : ''}"` : ''}`,
                activityStatus: 1, // 1 = Completed
                activityDate: new Date().toISOString(),
              });
              console.log(`✅ Customer activity logged for customer ${customer.id}`);
            }
          }
        } catch (activityError) {
          // Don't fail the whole operation if activity logging fails
          console.error("⚠️ Failed to log WhatsApp activity:", activityError);
        }

        // Save message to database
        try {
          await storage.createWhatsAppMessage({
            tenantId,
            deviceId: device.id,
            customerId,
            recipientNumber: number,
            recipientName: customerName,
            messageType: 'media',
            mediaType: media_type,
            mediaUrl: url,
            mediaCaption: caption,
            status: 'sent',
            externalMessageId: data?.msgid || data?.id,
            sentBy: req.user?.id,
          });
          console.log(`✅ WhatsApp media message saved to database`);
        } catch (dbError) {
          // Don't fail the whole operation if database logging fails
          console.error("⚠️ Failed to save WhatsApp message to database:", dbError);
        }

        res.json({
          success: true,
          message: "Media message sent successfully",
          data,
        });
      } catch (error: any) {
        console.error("Error sending media message:", error);
        res.status(500).json({
          error: error.message || "Failed to send media message",
        });
      }
    },
  );

  // Send text message via WhatsApp
  app.post(
    "/api/whatsapp/send-text-message",
    authenticate,
    async (req: any, res) => {
      try {
        const tenantId = req.user.tenantId;
        const { sender, number, message, footer, msgid, full } = req.body;

        // Validate required fields
        if (!sender) {
          return res
            .status(400)
            .json({ error: "Sender device number is required" });
        }
        if (!number) {
          return res.status(400).json({ error: "Receiver number is required" });
        }
        if (!message) {
          return res.status(400).json({ error: "Message text is required" });
        }

        // Get tenant's WhatsApp API key
        const config = await storage.getWhatsAppConfigByTenant(tenantId);
        if (!config) {
          return res.status(400).json({
            error:
              "WhatsApp is not configured. Please complete the setup first.",
          });
        }

        // Verify sender device belongs to this tenant
        const devices = await storage.getWhatsAppDevicesByTenant(tenantId);
        const senderDevice = devices.find((d: any) => d.number === sender);
        if (!senderDevice) {
          return res.status(404).json({
            error: "Sender device not found or doesn't belong to your account",
          });
        }

        // Check if device is connected
        if (senderDevice.status !== "connected") {
          return res.status(400).json({
            error: "Sender device is not connected. Please connect it first.",
          });
        }

        console.log("Sending WhatsApp text message:", {
          sender,
          number,
          messageLength: message.length,
          hasFooter: !!footer,
          hasMsgId: !!msgid,
        });

        // Build request body for WhatsApp API
        const requestBody: any = {
          api_key: config.apiKey,
          sender,
          number,
          message,
        };

        if (footer) requestBody.footer = footer;
        if (msgid) requestBody.msgid = msgid;
        if (full) requestBody.full = full;

        // Call WhatsApp Business API to send message
        const response = await fetch(`${WHATSAPP_API_BASE}/send-message`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        const responseData = await response.json();
        console.log("WhatsApp API response:", responseData);

        if (responseData.status === true) {
          // Update message count for the device
          await storage.incrementDeviceMessageCount(senderDevice.id);

          // Try to find customer by phone number
          let customerId: number | undefined;
          let customerName: string | undefined;
          try {
            const result = await storage.getCustomersByTenant(tenantId, { limit: 1000 });
            const customers = result && typeof result === "object" && "data" in result ? result.data : result;
            // Normalize phone numbers for comparison (remove ALL non-digits)
            const normalizePhone = (phone: string) => phone?.replace(/\D/g, '') || '';
            const normalizedNumber = normalizePhone(number);
            const customer = customers.find((c: any) => normalizePhone(c.phone) === normalizedNumber);
            
            if (customer) {
              customerId = customer.id;
              customerName = customer.name;
              
              // Log activity for customer
              if (req.user?.id) {
                await storage.createCustomerActivity({
                  tenantId,
                  customerId: customer.id,
                  userId: req.user.id,
                  activityType: 5, // 5 = WhatsApp message sent
                  activityTitle: "WhatsApp Message Sent",
                  activityDescription: `Message: "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"`,
                  activityStatus: 1, // 1 = Completed
                  activityDate: new Date().toISOString(),
                });
                console.log(`✅ Customer activity logged for customer ${customer.id}`);
              }
            }
          } catch (activityError) {
            // Don't fail the whole operation if activity logging fails
            console.error("⚠️ Failed to log WhatsApp activity:", activityError);
          }

          // Save message to database
          try {
            await storage.createWhatsAppMessage({
              tenantId,
              deviceId: senderDevice.id,
              customerId,
              recipientNumber: number,
              recipientName: customerName,
              messageType: 'text',
              textContent: message,
              status: 'sent',
              externalMessageId: responseData.data?.msgid || responseData.data?.id,
              sentBy: req.user?.id,
            });
            console.log(`✅ WhatsApp text message saved to database`);
          } catch (dbError) {
            // Don't fail the whole operation if database logging fails
            console.error("⚠️ Failed to save WhatsApp message to database:", dbError);
          }

          res.json({
            success: true,
            message: responseData.msg || "Message sent successfully!",
            data: responseData.data,
          });
        } else {
          res.status(400).json({
            success: false,
            error: responseData.msg || "Failed to send message",
          });
        }
      } catch (error: any) {
        console.error("Error sending WhatsApp message:", error);
        res.status(500).json({
          error: error.message || "Failed to send message",
        });
      }
    },
  );

  // Check WhatsApp integration status and default device
  app.get(
    "/api/whatsapp/check-integration",
    authenticate,
    async (req: any, res) => {
      try {
        const tenantId = req.user.tenantId;

        // Check if WhatsApp is configured
        const config = await storage.getWhatsAppConfigByTenant(tenantId);
        if (!config) {
          return res.json({
            hasIntegration: false,
            hasDefaultDevice: false,
          });
        }

        // Get devices to check for default
        const devices = await storage.getWhatsAppDevicesByTenant(tenantId);
        const defaultDevice = devices.find(
          (d: any) => d.isDefault === true && d.status === "connected",
        );

        res.json({
          hasIntegration: true,
          hasDefaultDevice: !!defaultDevice,
          defaultDevice: defaultDevice || null,
          apiKey: config.apiKey,
        });
      } catch (error: any) {
        console.error("Error checking WhatsApp integration:", error);
        res.status(500).json({
          error: error.message || "Failed to check integration status",
        });
      }
    },
  );

  // Set default WhatsApp device
  app.post(
    "/api/whatsapp/set-default-device",
    authenticate,
    async (req: any, res) => {
      try {
        const tenantId = req.user.tenantId;
        const { deviceId } = req.body;

        if (!deviceId) {
          return res.status(400).json({ error: "Device ID is required" });
        }

        // Verify device belongs to tenant
        const devices = await storage.getWhatsAppDevicesByTenant(tenantId);
        const device = devices.find((d: any) => d.id === deviceId);
        if (!device) {
          return res.status(404).json({ error: "Device not found" });
        }

        // Unset all other devices as default for this tenant
        await storage.unsetAllDefaultDevices(tenantId);

        // Set this device as default
        await storage.setDefaultDevice(deviceId);

        res.json({
          success: true,
          message: `Device ${device.number} set as default`,
        });
      } catch (error: any) {
        console.error("Error setting default device:", error);
        res.status(500).json({
          error: error.message || "Failed to set default device",
        });
      }
    },
  );

  // Get booking URL with WhatsApp credentials (secure - doesn't expose API key to frontend)
  app.get("/api/whatsapp/booking-url", authenticate, async (req: any, res) => {
    try {
      const tenantId = req.user.tenantId;

      // Get WhatsApp config (includes API key)
      const config = await storage.getWhatsAppConfigByTenant(tenantId);

      // Get default device
      const devices = await storage.getWhatsAppDevicesByTenant(tenantId);
      const defaultDevice = devices.find((d: any) => d.isDefault === true);

      // Get tenant info
      const tenant = await storage.getTenantById(tenantId);

      console.log("📧 Booking URL - Tenant Info:", {
        tenantId,
        contactEmail: tenant?.contact_email,
        contactPhone: tenant?.contact_phone,
        companyName: tenant?.company_name,
      });

      // Construct booking URL with all parameters
      const baseUrl = "https://booking.ratehonk.com/auth/auto_login";
      const params = new URLSearchParams();

      // Add tenant info (database returns snake_case columns)
      if (tenant?.contact_email) params.append("email", tenant.contact_email);
      if (tenant?.contact_phone) params.append("phone", tenant.contact_phone);
      params.append("tenant_id", tenantId.toString());

      console.log("🔗 Booking URL params:", params.toString());

      // Add WhatsApp credentials if available
      if (config?.apiKey) params.append("api_key", config.apiKey);
      if (defaultDevice?.number) params.append("sender", defaultDevice.number);

      const bookingUrl = `${baseUrl}?${params.toString()}`;

      res.json({
        success: true,
        url: bookingUrl,
        hasWhatsAppConfig: !!config?.apiKey,
        hasDefaultDevice: !!defaultDevice?.number,
      });
    } catch (error: any) {
      console.error("Error generating booking URL:", error);
      res.status(500).json({
        error: error.message || "Failed to generate booking URL",
      });
    }
  });
}
