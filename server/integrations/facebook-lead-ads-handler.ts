/**
 * Facebook Lead Ads Handler
 * Handles lead syncing from Facebook Lead Ads to CRM
 */

import { Express } from "express";
import { sql } from "../db";
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
 * Process a single Facebook lead and create/update lead in leads table
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

  // Check if lead exists in leads table (by email)
  let existingLead = null;
  if (email) {
    const [leadResult] = await sql`
      SELECT id, first_name, last_name, email, phone, notes, type_specific_data, created_at
      FROM leads 
      WHERE tenant_id = ${tenantId} AND LOWER(email) = LOWER(${email})
      ORDER BY created_at DESC
      LIMIT 1
    `;
    existingLead = leadResult;
  }

  if (existingLead) {
    // Update existing lead - add previous lead info to notes
    const existingNotes = existingLead.notes || "";
    const createdDate = existingLead.created_at 
      ? new Date(existingLead.created_at).toLocaleString() 
      : "Unknown";
    const previousLeadInfo = `\n\n--- Previous Lead Information ---\nLead ID: ${existingLead.id}\nName: ${existingLead.first_name || ""} ${existingLead.last_name || ""}\nEmail: ${existingLead.email || ""}\nPhone: ${existingLead.phone || ""}\nCreated: ${createdDate}`;
    
    const syncNote = `\n\n[Facebook Lead Sync ${new Date().toLocaleString()}]\nForm: ${formName}\nPage: ${pageName}\nFacebook Lead ID: ${lead.id}`;
    const updatedNotes = existingNotes + previousLeadInfo + syncNote;

    // Merge custom fields
    const existingCustomFields = existingLead.type_specific_data || {};
    const updatedCustomFields = {
      ...existingCustomFields,
      ...customFields,
      last_synced_at: new Date().toISOString(),
    };

    await sql`
      UPDATE leads 
      SET 
        first_name = COALESCE(${firstName || existingLead.first_name}, first_name),
        last_name = COALESCE(${lastName || existingLead.last_name}, last_name),
        email = COALESCE(${email || existingLead.email}, email),
        phone = COALESCE(${phoneNumber || existingLead.phone}, phone),
        source = 'facebook',
        type_specific_data = ${JSON.stringify(updatedCustomFields)}::jsonb,
        notes = ${updatedNotes},
        updated_at = NOW()
      WHERE id = ${existingLead.id}
    `;

    return { created: false, contactId: existingLead.id, skipped: false };
  } else {
    // Create new lead in leads table
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
      notes: `Imported from Facebook Lead Ads\nForm: ${formName}\nPage: ${pageName}\nFacebook Lead ID: ${lead.id}\nSynced: ${new Date().toLocaleString()}`,
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

      // Get user's pages using Graph API directly
      const pagesResponse = await fetch(
        `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,category,access_token&access_token=${integration.access_token}`
      );

      if (!pagesResponse.ok) {
        const errorData = await pagesResponse.json().catch(() => ({}));
        throw new Error(errorData.error?.message || "Failed to fetch pages");
      }

      const pagesData = await pagesResponse.json();
      const pages = pagesData.data || [];

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
      const tenantId = parseInt(req.query.tenantId as string);
      const { pageId } = req.params;
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

      // Get page access token
      const pageResponse = await fetch(
        `https://graph.facebook.com/v18.0/${pageId}?fields=id,name,access_token&access_token=${integration.access_token}`
      );

      if (!pageResponse.ok) {
        const errorData = await pageResponse.json().catch(() => ({}));
        throw new Error(errorData.error?.message || "Failed to fetch page");
      }

      const pageData = await pageResponse.json();
      const pageAccessToken = pageData.access_token || integration.access_token;

      // Get lead forms for the page
      const formsResponse = await fetch(
        `https://graph.facebook.com/v18.0/${pageId}/leadgen_forms?fields=id,name,status,leads_count&access_token=${pageAccessToken}`
      );

      if (!formsResponse.ok) {
        const errorData = await formsResponse.json().catch(() => ({}));
        throw new Error(errorData.error?.message || "Failed to fetch lead forms");
      }

      const formsData = await formsResponse.json();
      const forms = formsData.data || [];

      res.json({
        success: true,
        forms,
        count: forms.length,
      });
    } catch (error: any) {
      console.error("Error fetching Facebook lead forms:", error);
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

      // Get user's pages using Graph API directly
      const pagesResponse = await fetch(
        `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token&access_token=${integration.access_token}`
      );

      if (!pagesResponse.ok) {
        const errorData = await pagesResponse.json().catch(() => ({}));
        throw new Error(errorData.error?.message || "Failed to fetch pages");
      }

      const pagesData = await pagesResponse.json();
      const pages = pagesData.data || [];

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
      let allLeads: any[] = []; // Initialize allLeads array

      // Process each page
      for (const page of pagesToProcess) {
        try {
          // Get lead forms for this page
          const formsResponse = await fetch(
            `https://graph.facebook.com/v18.0/${page.id}/leadgen_forms?fields=id,name,status&access_token=${page.access_token || integration.access_token}`
          );

          let forms: any[] = [];
          if (formsResponse.ok) {
            const formsData = await formsResponse.json();
            forms = formsData.data || [];
          } else {
            const errorData = await formsResponse.json().catch(() => ({}));
            console.error(`Failed to fetch forms for page ${page.id}:`, errorData);
          }

          // Filter forms if formId is specified
          const formsToProcess = formId
            ? forms.filter((f: any) => f.id === formId)
            : forms;

          // Process each form
          for (const form of formsToProcess) {
            try {
              // Build query parameters for leads
              const params = new URLSearchParams({
                access_token: page.access_token || integration.access_token,
              });

              if (startDate) {
                params.append("time_created[gte]", new Date(startDate).getTime().toString());
              }
              if (endDate) {
                params.append("time_created[lte]", new Date(endDate).getTime().toString());
              }

              // Get leads for this form (include field_data to get form field values)
              // Handle pagination to get ALL leads
              let leadsUrl = `https://graph.facebook.com/v18.0/${form.id}/leads?fields=id,created_time,field_data&${params.toString()}`;
              let formLeads: any[] = [];

              while (leadsUrl) {
                const leadsResponse = await fetch(leadsUrl);

                if (leadsResponse.ok) {
                  const leadsData = await leadsResponse.json();
                  const leads = leadsData.data || [];

                  // Enrich leads with form and page info
                  const enrichedLeads = leads.map((lead: any) => ({
                    ...lead,
                    form_id: form.id,
                    form_name: form.name,
                    page_id: page.id,
                    page_name: page.name,
                  }));

                  formLeads = formLeads.concat(enrichedLeads);

                  // Check for next page
                  const paging = leadsData.paging;
                  if (paging && paging.next) {
                    leadsUrl = paging.next;
                    console.log(`[Facebook Leads] Fetching next page for form ${form.id}, total so far: ${formLeads.length}`);
                  } else {
                    leadsUrl = ''; // No more pages
                  }
                } else {
                  const errorData = await leadsResponse.json().catch(() => ({}));
                  console.error(`Failed to fetch leads for form ${form.id}:`, errorData);
                  leadsUrl = ''; // Stop pagination on error
                }
              }

              console.log(`[Facebook Leads] Fetched ${formLeads.length} total leads from form ${form.id}`);
              allLeads = allLeads.concat(formLeads);

              // Process each lead
              for (let i = 0; i < formLeads.length; i++) {
                const lead = formLeads[i];
                
                // Log progress every 50 leads
                if (i % 50 === 0 && i > 0) {
                  console.log(`[Facebook Leads] Processing lead ${i + 1}/${formLeads.length}...`);
                }

                try {
                  // Get form and page info from enriched lead data
                  const formId = lead.form_id || form.id;
                  const formName = lead.form_name || form.name;
                  const pageId = lead.page_id || page.id;
                  const pageName = lead.page_name || page.name;
                  
                  const result = await processLead(
                    lead,
                    formId,
                    formName,
                    pageId,
                    pageName,
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

              totalLeads += formLeads.length;
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

      console.log(`[Facebook Leads] Sync completed: ${syncedContactsCount} created, ${updatedContactsCount} updated, ${skippedContactsCount} skipped`);

      res.json({
        success: true,
        leads: allLeads,
        count: allLeads.length,
        syncedContactsCount,
        updatedContactsCount,
        skippedContactsCount,
        syncedContactIds,
        errorDetails: errorDetails.length > 0 ? errorDetails : undefined,
        syncedAt: new Date().toISOString(),
        pagesProcessed: pagesToProcess.length,
      });
    } catch (error: any) {
      console.error("Facebook Lead Ads sync error:", error);
      res.status(500).json({
        error: error.message || "Failed to sync leads from Facebook Lead Ads",
      });
    }
  });

  // Webhook endpoint for Facebook Lead Ads (for real-time lead notifications)
  app.get("/api/integrations/facebook-lead-ads/webhook", async (req, res) => {
    try {
      // Facebook webhook verification
      const mode = req.query["hub.mode"];
      const token = req.query["hub.verify_token"];
      const challenge = req.query["hub.challenge"];

      // Verify the webhook token (set this in your Facebook App settings)
      const VERIFY_TOKEN = process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN || "your_webhook_verify_token";

      if (mode === "subscribe" && token === VERIFY_TOKEN) {
        console.log("Facebook webhook verified");
        res.status(200).send(challenge);
      } else {
        res.status(403).json({ message: "Forbidden" });
      }
    } catch (error: any) {
      console.error("Facebook webhook verification error:", error);
      res.status(500).json({ message: "Failed to verify webhook" });
    }
  });

  // Handle incoming lead webhook events
  app.post("/api/integrations/facebook-lead-ads/webhook", async (req, res) => {
    try {
      const body = req.body;

      // Facebook sends webhook data in a specific format
      if (body.object === "page") {
        const entries = body.entry || [];
        for (const entry of entries) {
          const changes = entry.changes || [];
          for (const change of changes) {
            if (change.field === "leadgen") {
              const leadId = change.value.leadgen_id;
              const formId = change.value.form_id;
              const pageId = change.value.page_id;

              console.log(`New lead received: ${leadId} from form ${formId} on page ${pageId}`);

              // TODO: Fetch full lead details and process
              // You can fetch lead details using:
              // GET /{lead-id}?access_token={page-access-token}

              // TODO: Store lead in managed contacts or trigger webhooks
            }
          }
        }
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("Webhook error:", error);
      res.sendStatus(200); // Always return 200 to Facebook
    }
  });

  // Disconnect Facebook Lead Ads integration
  app.delete("/api/integrations/facebook-lead-ads/disconnect", async (req, res) => {
    try {
      const tenantId = parseInt(req.query.tenantId as string);
      if (!tenantId) {
        return res.status(400).json({ error: "tenantId is required" });
      }

      // Remove access token and mark as inactive
      await sql`
        UPDATE social_integrations 
        SET 
          access_token = NULL,
          token_expires_at = NULL,
          is_active = false,
          updated_at = NOW()
        WHERE tenant_id = ${tenantId} AND platform = 'facebook-lead-ads'
      `;

      res.json({
        success: true,
        message: "Facebook Lead Ads integration disconnected successfully",
      });
    } catch (error: any) {
      console.error("Error disconnecting Facebook Lead Ads:", error);
      res.status(500).json({
        error: error.message || "Failed to disconnect Facebook Lead Ads integration",
      });
    }
  });
}
