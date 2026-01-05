/**
 * Facebook Lead Ads Handler
 * Handles lead syncing from Facebook Lead Ads to CRM
 */

import { Express } from "express";
import { sql } from "../db";
import { FacebookService } from "../facebook-service";
import { SimpleStorage } from "../simple-storage";

const simpleStorage = new SimpleStorage();

/**
 * Extract field value from Facebook lead field_data
 */
function extractFieldValue(fieldData: any[], fieldName: string): string | null {
  const field = fieldData.find(
    (f) => f.name?.toLowerCase().includes(fieldName.toLowerCase())
  );
  return field?.values?.[0] || null;
}

/**
 * Process a single Facebook lead and create/update contact
 */
async function processLead(
  lead: any,
  formId: string,
  formName: string,
  pageId: string,
  pageName: string,
  tenantId: number
): Promise<{ created: boolean; contactId?: number; skipped: boolean }> {
  const fieldData = lead.field_data || [];

  // Extract phone and email
  let phoneNumber =
    extractFieldValue(fieldData, "phone") ||
    extractFieldValue(fieldData, "phone_number") ||
    extractFieldValue(fieldData, "mobile") ||
    extractFieldValue(fieldData, "tel");

  let email =
    extractFieldValue(fieldData, "email") ||
    extractFieldValue(fieldData, "email_address");

  // Skip if no phone or email
  if (!phoneNumber && !email) {
    return { created: false, skipped: true };
  }

  // Extract name
  let firstName = extractFieldValue(fieldData, "first_name");
  let lastName = extractFieldValue(fieldData, "last_name");
  let fullName = extractFieldValue(fieldData, "full_name") || extractFieldValue(fieldData, "name");

  if (fullName && !firstName && !lastName) {
    const nameParts = fullName.split(" ");
    firstName = nameParts[0] || "";
    lastName = nameParts.slice(1).join(" ") || "";
  }

  const name = fullName || `${firstName || ""} ${lastName || ""}`.trim() || "Facebook Lead";

  // Build custom fields object with all form fields
  const customFields: any = {};
  fieldData.forEach((field: any) => {
    const fieldName = field.name?.toLowerCase() || "";
    const fieldValue = field.values?.[0] || "";

    // Skip already extracted fields
    if (
      !fieldName.includes("phone") &&
      !fieldName.includes("email") &&
      !fieldName.includes("name")
    ) {
      customFields[field.name] = fieldValue;
    }
  });

  // Add Facebook metadata
  customFields.facebook_lead_id = lead.id;
  customFields.facebook_form_id = formId;
  customFields.facebook_form_name = formName;
  customFields.facebook_page_id = pageId;
  customFields.facebook_page_name = pageName;
  customFields.synced_at = new Date().toISOString();

  // Check if contact exists (by phone or email)
  let existingContact = null;
  if (phoneNumber) {
    existingContact = await simpleStorage.getCustomerByPhone(phoneNumber, tenantId);
  }
  if (!existingContact && email) {
    existingContact = await simpleStorage.getCustomerByEmail(email, tenantId);
  }

  if (existingContact) {
    // Update existing contact
    const updatedCustomFields = {
      ...(existingContact.customFields || {}),
      ...customFields,
      last_synced_at: new Date().toISOString(),
    };

    // Update notes
    const notes = existingContact.notes || "";
    const syncNote = `\n[Facebook Lead Sync ${new Date().toLocaleString()}] Form: ${formName}, Page: ${pageName}`;
    const updatedNotes = notes + syncNote;

    await sql`
      UPDATE customers 
      SET 
        first_name = COALESCE(${firstName || existingContact.firstName}, first_name),
        last_name = COALESCE(${lastName || existingContact.lastName}, last_name),
        email = COALESCE(${email || existingContact.email}, email),
        phone = COALESCE(${phoneNumber || existingContact.phone}, phone),
        custom_fields = ${JSON.stringify(updatedCustomFields)}::jsonb,
        notes = ${updatedNotes},
        updated_at = NOW()
      WHERE id = ${existingContact.id}
    `;

    return { created: false, contactId: existingContact.id, skipped: false };
  } else {
    // Create new contact (lead)
    // First, get default lead type
    const [defaultLeadType] = await sql`
      SELECT id FROM lead_types WHERE tenant_id = ${tenantId} ORDER BY id LIMIT 1
    `;

    const leadTypeId = defaultLeadType?.id || 1;

    // Create lead using SimpleStorage
    const leadData = {
      tenantId,
      leadTypeId,
      userId: null, // Will be assigned later
      firstName: firstName || name.split(" ")[0] || "Facebook",
      lastName: lastName || name.split(" ").slice(1).join(" ") || "Lead",
      email: email || undefined,
      phone: phoneNumber || email || "",
      source: "facebook",
      status: "new",
      typeSpecificData: customFields,
      notes: `Imported from Facebook Lead Ads\nForm: ${formName}\nPage: ${pageName}\nSynced: ${new Date().toLocaleString()}`,
    };

    const newLead = await simpleStorage.createLead(leadData);

    return { created: true, contactId: newLead.id, skipped: false };
  }
}

/**
 * Register Facebook Lead Ads handler routes
 */
export function registerFacebookLeadAdsRoutes(app: Express) {
  console.log("✅ Registering Facebook Lead Ads handler routes...");
  
  // Get Facebook pages
  app.get("/api/integrations/facebook-lead-ads/pages", async (req, res) => {
    try {
      const tenantId = parseInt(req.query.tenantId as string);
      if (!tenantId) {
        return res.status(400).json({ error: "tenantId is required" });
      }

      // Get integration
      const [integration] = await sql`
        SELECT access_token, token_expires_at FROM social_integrations 
        WHERE tenant_id = ${tenantId} AND platform = 'facebook-lead-ads' AND is_active = true
      `;

      if (!integration?.access_token) {
        return res.status(400).json({
          error: "Facebook Lead Ads integration not connected",
        });
      }

      // Check token expiration
      if (
        integration.token_expires_at &&
        new Date(integration.token_expires_at) < new Date()
      ) {
        return res.status(401).json({
          error: "Facebook access token has expired. Please reconnect.",
        });
      }

      // Get app credentials for FacebookService
      const [appCreds] = await sql`
        SELECT app_id, app_secret FROM social_integrations 
        WHERE tenant_id = ${tenantId} AND platform = 'facebook' AND is_active = true
      `;

      const appId =
        appCreds?.app_id ||
        process.env.FACEBOOK_APP_ID ||
        process.env.FB_APP_ID;
      const appSecret =
        appCreds?.app_secret ||
        process.env.FACEBOOK_APP_SECRET ||
        process.env.FB_APP_SECRET;

      if (!appId || !appSecret) {
        return res.status(400).json({
          error: "Facebook app credentials not configured",
        });
      }

      const facebookService = new FacebookService(appId, appSecret);
      const pages = await facebookService.getUserPages(
        integration.access_token
      );

      res.json({
        success: true,
        pages: pages.map((p: any) => ({
          id: p.id,
          name: p.name,
          category: p.category,
        })),
        count: pages.length,
      });
    } catch (error: any) {
      console.error("Error fetching Facebook pages:", error);
      res.status(500).json({
        error: error.message || "Failed to fetch Facebook pages",
      });
    }
  });

  // Get lead forms for a page
  app.get("/api/integrations/facebook-lead-ads/forms/:pageId", async (req, res) => {
    try {
      const { pageId } = req.params;
      const tenantId = parseInt(req.query.tenantId as string);
      if (!tenantId) {
        return res.status(400).json({ error: "tenantId is required" });
      }

      // Get integration
      const [integration] = await sql`
        SELECT access_token, token_expires_at FROM social_integrations 
        WHERE tenant_id = ${tenantId} AND platform = 'facebook-lead-ads' AND is_active = true
      `;

      if (!integration?.access_token) {
        return res.status(400).json({
          error: "Facebook Lead Ads integration not connected",
        });
      }

      // Get pages to get page access token
      const [appCreds] = await sql`
        SELECT app_id, app_secret FROM social_integrations 
        WHERE tenant_id = ${tenantId} AND platform = 'facebook' AND is_active = true
      `;

      const appId =
        appCreds?.app_id ||
        process.env.FACEBOOK_APP_ID ||
        process.env.FB_APP_ID;
      const appSecret =
        appCreds?.app_secret ||
        process.env.FACEBOOK_APP_SECRET ||
        process.env.FB_APP_SECRET;

      if (!appId || !appSecret) {
        return res.status(400).json({
          error: "Facebook app credentials not configured",
        });
      }

      const facebookService = new FacebookService(appId, appSecret);
      const pages = await facebookService.getUserPages(
        integration.access_token
      );

      const page = pages.find((p: any) => p.id === pageId);
      if (!page) {
        return res.status(404).json({ error: "Page not found" });
      }

      // Get lead forms for this page
      const forms = await facebookService.getPageLeadForms(
        page.access_token,
        pageId
      );

      res.json({
        success: true,
        forms: forms.map((f: any) => ({
          id: f.id,
          name: f.name,
          status: f.status,
          leads_count: f.leads_count || 0,
        })),
        count: forms.length,
      });
    } catch (error: any) {
      console.error("Error fetching lead forms:", error);
      res.status(500).json({
        error: error.message || "Failed to fetch lead forms",
      });
    }
  });

  // Sync leads
  app.post("/api/integrations/facebook-lead-ads/sync-leads", async (req, res) => {
    try {
      const {
        integrationId,
        pageId,
        formId,
        startDate,
        endDate,
        tenantId,
      } = req.body;

      if (!tenantId) {
        return res.status(400).json({ error: "tenantId is required" });
      }

      // Get integration
      const [integration] = await sql`
        SELECT access_token, token_expires_at FROM social_integrations 
        WHERE tenant_id = ${tenantId} AND platform = 'facebook-lead-ads' AND is_active = true
      `;

      if (!integration?.access_token) {
        return res.status(400).json({
          error: "Facebook Lead Ads integration not connected",
        });
      }

      // Check token expiration
      if (
        integration.token_expires_at &&
        new Date(integration.token_expires_at) < new Date()
      ) {
        return res.status(401).json({
          error: "Facebook access token has expired. Please reconnect.",
        });
      }

      // Get app credentials
      const [appCreds] = await sql`
        SELECT app_id, app_secret FROM social_integrations 
        WHERE tenant_id = ${tenantId} AND platform = 'facebook' AND is_active = true
      `;

      const appId =
        appCreds?.app_id ||
        process.env.FACEBOOK_APP_ID ||
        process.env.FB_APP_ID;
      const appSecret =
        appCreds?.app_secret ||
        process.env.FACEBOOK_APP_SECRET ||
        process.env.FB_APP_SECRET;

      if (!appId || !appSecret) {
        return res.status(400).json({
          error: "Facebook app credentials not configured",
        });
      }

      const facebookService = new FacebookService(appId, appSecret);
      const pages = await facebookService.getUserPages(
        integration.access_token
      );

      // Filter pages if pageId is specified
      const pagesToProcess = pageId
        ? pages.filter((p: any) => p.id === pageId)
        : pages;

      if (pagesToProcess.length === 0) {
        return res.status(404).json({ error: "No Facebook pages found" });
      }

      let totalLeads = 0;
      let syncedContactsCount = 0;
      let updatedContactsCount = 0;
      let skippedContactsCount = 0;
      const syncedContactIds: number[] = [];
      const errorDetails: any[] = [];

      // Process each page
      for (const page of pagesToProcess) {
        try {
          // Get lead forms
          const forms = await facebookService.getPageLeadForms(
            page.access_token,
            page.id
          );

          // Filter forms if formId is specified
          const formsToProcess = formId
            ? forms.filter((f: any) => f.id === formId)
            : forms;

          // Process each form
          for (const form of formsToProcess) {
            try {
              // Get leads with pagination
              let allLeads: any[] = [];
              let nextUrl: string | null = `${facebookService['baseUrl']}/${form.id}/leads?fields=id,created_time,field_data&access_token=${page.access_token}`;

              // Add date filters if provided
              if (startDate || endDate) {
                const params = new URLSearchParams();
                if (startDate) params.append("since", new Date(startDate).getTime().toString());
                if (endDate) params.append("until", new Date(endDate).getTime().toString());
                nextUrl += `&${params.toString()}`;
              }

              // Fetch all leads with pagination
              while (nextUrl) {
                const response = await fetch(nextUrl);
                if (!response.ok) {
                  throw new Error(`Failed to fetch leads: ${response.statusText}`);
                }
                const data = await response.json();
                allLeads = allLeads.concat(data.data || []);
                nextUrl = data.paging?.next || null;
              }

              totalLeads += allLeads.length;

              // Process each lead
              for (const lead of allLeads) {
                try {
                  // Lead data already contains field_data from the API call
                  // Use the lead directly (it already has field_data)
                  const result = await processLead(
                    lead,
                    form.id,
                    form.name,
                    page.id,
                    page.name,
                    tenantId
                  );

                  if (result.skipped) {
                    skippedContactsCount++;
                  } else if (result.created) {
                    syncedContactsCount++;
                    if (result.contactId) {
                      syncedContactIds.push(result.contactId);
                    }
                  } else {
                    updatedContactsCount++;
                    if (result.contactId) {
                      syncedContactIds.push(result.contactId);
                    }
                  }
                } catch (leadError: any) {
                  console.error(`Error processing lead ${lead.id}:`, leadError);
                  errorDetails.push({
                    leadId: lead.id,
                    error: leadError.message,
                  });
                }
              }
            } catch (formError: any) {
              console.error(`Error processing form ${form.id}:`, formError);
              errorDetails.push({
                formId: form.id,
                error: formError.message,
              });
            }
          }
        } catch (pageError: any) {
          console.error(`Error processing page ${page.id}:`, pageError);
          errorDetails.push({
            pageId: page.id,
            error: pageError.message,
          });
        }
      }

      // Update last sync time
      await sql`
        UPDATE social_integrations 
        SET last_sync = NOW(), total_leads_imported = COALESCE(total_leads_imported, 0) + ${syncedContactsCount + updatedContactsCount}
        WHERE tenant_id = ${tenantId} AND platform = 'facebook-lead-ads'
      `;

      res.json({
        success: true,
        leads: [], // Don't return all leads for performance
        count: totalLeads,
        syncedContactsCount,
        updatedContactsCount,
        skippedContactsCount,
        syncedContactIds,
        errorDetails: errorDetails.length > 0 ? errorDetails : undefined,
        syncedAt: new Date().toISOString(),
        pagesProcessed: pagesToProcess.length,
      });
    } catch (error: any) {
      console.error("Error syncing Facebook leads:", error);
      res.status(500).json({
        error: error.message || "Failed to sync leads",
      });
    }
  });

  // Webhook verification (GET)
  app.get("/api/integrations/facebook-lead-ads/webhook", (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    const verifyToken =
      process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN || "your_webhook_verify_token";

    if (mode === "subscribe" && token === verifyToken) {
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  });

  // Webhook handler (POST)
  app.post("/api/integrations/facebook-lead-ads/webhook", async (req, res) => {
    try {
      const { object, entry } = req.body;

      if (object !== "page") {
        return res.sendStatus(200);
      }

      // Process webhook entries
      for (const entryItem of entry) {
        for (const change of entryItem.changes || []) {
          if (change.field === "leadgen") {
            const { leadgen_id, form_id, page_id } = change.value;

            console.log("New Facebook lead received:", {
              leadgen_id,
              form_id,
              page_id,
            });

            // TODO: Fetch full lead details and process
            // For now, just log it
            // In production, you would:
            // 1. Get tenant ID from page_id mapping
            // 2. Fetch lead details using Graph API
            // 3. Call processLead function
          }
        }
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("Webhook error:", error);
      res.sendStatus(200); // Always return 200 to Facebook
    }
  });
}

