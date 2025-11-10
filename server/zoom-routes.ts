import type { Express } from "express";
import crypto from "crypto";
import { zoomService } from "./zoom";
import { simpleStorage as storage } from "./simple-storage";
import { authenticate } from "./simple-routes";

// Helper function to match phone number to customer
async function matchCustomerByPhone(phoneNumber: string, tenantId: number): Promise<number | undefined> {
  // Clean phone number (remove spaces, dashes, etc.)
  const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
  
  // Get all customers for tenant
  const customers = await storage.getCustomersByTenant({ tenantId });
  
  // Find customer with matching phone number
  const customer = customers.find((c: any) => {
    if (!c.phone) return false;
    const cleanCustomerPhone = c.phone.replace(/[\s\-\(\)]/g, '');
    return cleanCustomerPhone.includes(cleanPhone) || cleanPhone.includes(cleanCustomerPhone);
  });
  
  return customer?.id;
}

export function registerZoomRoutes(app: Express) {
  
  // OAuth callback - Exchange authorization code for access token
  app.get("/api/zoom/oauth/callback", authenticate, async (req: any, res) => {
    try {
      const { code, label, email } = req.query;
      const tenantId = req.user.tenantId;

      if (!code) {
        return res.status(400).json({ error: "Authorization code is required" });
      }

      const accountLabel = (label as string) || "Main Account";
      const accountEmail = email as string | undefined;

      // Build dynamic redirect URI from request headers
      const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
      const host = req.headers['x-forwarded-host'] || req.headers.host;
      const dynamicRedirectUri = `${protocol}://${host}/api/zoom/oauth/callback`;
      
      console.log(`🔍 Using dynamic Zoom redirect URI: ${dynamicRedirectUri}`);

      // Exchange code for tokens with dynamic redirect URI
      const tokenData = await zoomService.exchangeCodeForTokens(code as string, dynamicRedirectUri);
      
      // Save tokens to database with label
      await zoomService.saveTokenWithLabel(tenantId, tokenData, accountLabel, accountEmail);

      res.json({ 
        success: true, 
        message: `Zoom account "${accountLabel}" connected successfully` 
      });
    } catch (error: any) {
      console.error("Zoom OAuth error:", error);
      res.status(500).json({ error: error.message || "Failed to connect Zoom integration" });
    }
  });

  // Get all Zoom accounts for tenant
  app.get("/api/zoom/accounts", authenticate, async (req: any, res) => {
    try {
      const tenantId = req.user.tenantId;
      const accounts = await zoomService.getAllTokens(tenantId);

      res.json({
        accounts: accounts.map(acc => ({
          id: acc.id,
          label: acc.accountLabel,
          email: acc.accountEmail,
          isPrimary: acc.isPrimary,
          expiresAt: acc.expiresAt,
          createdAt: acc.createdAt,
        })),
      });
    } catch (error: any) {
      console.error("Error fetching Zoom accounts:", error);
      
      // If table doesn't exist, return empty accounts array instead of error
      if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        console.warn("⚠️ Zoom tokens table not found - returning empty accounts. Run 'npm run db:push' to create the table.");
        return res.json({ accounts: [] });
      }
      
      res.status(500).json({ error: "Failed to fetch Zoom accounts" });
    }
  });

  // Get Zoom integration status (for backward compatibility)
  app.get("/api/zoom/status", authenticate, async (req: any, res) => {
    try {
      const tenantId = req.user.tenantId;
      const accounts = await zoomService.getAllTokens(tenantId);

      res.json({
        connected: accounts.length > 0,
        accountCount: accounts.length,
        accounts: accounts.map(acc => ({
          id: acc.id,
          label: acc.accountLabel,
          isPrimary: acc.isPrimary,
        })),
      });
    } catch (error: any) {
      console.error("Error fetching Zoom status:", error);
      
      // If table doesn't exist, return disconnected status instead of error
      if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        console.warn("⚠️ Zoom tokens table not found - returning disconnected status. Run 'npm run db:push' to create the table.");
        return res.json({
          connected: false,
          accountCount: 0,
          accounts: [],
        });
      }
      
      res.status(500).json({ error: "Failed to fetch integration status" });
    }
  });

  // Set primary account
  app.post("/api/zoom/accounts/:accountId/set-primary", authenticate, async (req: any, res) => {
    try {
      const tenantId = req.user.tenantId;
      const accountId = parseInt(req.params.accountId);

      await zoomService.setPrimaryAccount(accountId, tenantId);

      res.json({ success: true, message: "Primary account updated" });
    } catch (error: any) {
      console.error("Error setting primary account:", error);
      res.status(500).json({ error: "Failed to set primary account" });
    }
  });

  // Delete Zoom account by ID
  app.delete("/api/zoom/accounts/:accountId", authenticate, async (req: any, res) => {
    try {
      const tenantId = req.user.tenantId;
      const accountId = parseInt(req.params.accountId);
      
      if (isNaN(accountId)) {
        return res.status(400).json({ error: "Invalid account ID" });
      }
      
      await zoomService.deleteTokenById(accountId, tenantId);

      res.json({ success: true, message: "Zoom account disconnected" });
    } catch (error: any) {
      console.error("Error disconnecting Zoom account:", error);
      
      if (error.message.includes('not found') || error.message.includes('access denied')) {
        return res.status(404).json({ error: "Account not found" });
      }
      
      res.status(500).json({ error: "Failed to disconnect account" });
    }
  });

  // Webhook endpoint - Receive call events from Zoom
  app.post("/api/zoom/webhook", async (req: any, res) => {
    try {
      const event = req.body;

      console.log("📞 Zoom webhook event received:", event.event);

      // Handle webhook URL validation
      if (event.event === 'endpoint.url_validation') {
        const plainToken = event.payload?.plainToken;
        
        if (!plainToken) {
          return res.status(400).json({ error: 'Missing plainToken' });
        }

        // Get Zoom Secret Token from environment
        const secretToken = process.env.ZOOM_SECRET_TOKEN;
        
        if (!secretToken) {
          console.error('ZOOM_SECRET_TOKEN not configured');
          return res.status(500).json({ error: 'Webhook secret not configured' });
        }

        // Generate encrypted token using HMAC SHA256
        const encryptedToken = crypto
          .createHmac('sha256', secretToken)
          .update(plainToken)
          .digest('hex');

        console.log('✅ Zoom webhook URL validation successful');
        
        return res.status(200).json({
          plainToken: plainToken,
          encryptedToken: encryptedToken
        });
      }

      // Only process phone call events
      if (!event.event?.startsWith('phone.')) {
        return res.status(200).send('OK');
      }

      // Extract phone numbers
      const callerNumber = event.payload?.object?.caller?.phone_number;
      const calleeNumber = event.payload?.object?.callee?.phone_number;

      if (!callerNumber || !calleeNumber) {
        console.warn("Missing caller or callee phone number in webhook");
        return res.status(200).send('OK');
      }

      // Note: Zoom webhooks don't include tenant context
      // For proper tenant matching, configure webhook URL per tenant or use webhook validation
      // For now, log the event and return success
      console.log("📞 Zoom call event received:", {
        event: event.event,
        caller: callerNumber,
        callee: calleeNumber,
      });

      // TODO: Implement proper tenant matching for webhook events
      // This requires either:
      // 1. Tenant-specific webhook URLs
      // 2. Tenant identification in webhook payload
      // 3. Phone number matching across all tenants (performance concern)

      res.status(200).send('OK');
    } catch (error: any) {
      console.error("Zoom webhook error:", error);
      // Still return 200 to prevent Zoom from retrying
      res.status(200).send('OK');
    }
  });

  // Fetch call history from Zoom API
  app.post("/api/zoom/sync-history", authenticate, async (req: any, res) => {
    try {
      const tenantId = req.user.tenantId;
      const { from, to, page_size } = req.body;

      // Fetch call history from Zoom
      const history = await zoomService.fetchCallHistory(tenantId, {
        from,
        to,
        page_size: page_size || 100,
      });

      // Process each call and save to database
      const savedCalls = [];
      for (const call of history.call_logs || []) {
        // Match customer by phone number
        const customerId = await matchCustomerByPhone(call.caller.phone_number, tenantId) || 
                          await matchCustomerByPhone(call.callee.phone_number, tenantId);

        // Convert call to event format and save
        const callEvent = {
          event: 'phone.call_ended',
          payload: {
            object: {
              id: call.id,
              caller: call.caller,
              callee: call.callee,
              direction: call.direction,
              duration: call.duration,
              start_time: call.date_time,
              end_time: call.end_time,
              answer_time: call.answer_time,
              call_status: call.result,
              recording_url: call.recording_url,
              recording_duration: call.recording_duration,
            },
          },
        };

        const saved = await zoomService.processCallEvent(tenantId, callEvent, customerId);
        savedCalls.push(saved);
      }

      res.json({
        success: true,
        synced: savedCalls.length,
        next_page_token: history.next_page_token || null,
      });
    } catch (error: any) {
      console.error("Error syncing call history:", error);
      res.status(500).json({ error: error.message || "Failed to sync call history" });
    }
  });

  // Get call logs for a customer
  app.get("/api/zoom/call-logs/customer/:customerId", authenticate, async (req: any, res) => {
    try {
      const customerId = parseInt(req.params.customerId);
      const tenantId = req.user.tenantId;

      if (isNaN(customerId)) {
        return res.status(400).json({ error: "Invalid customer ID" });
      }

      const callLogs = await zoomService.getCallLogsByCustomer(customerId, tenantId);
      res.json(callLogs);
    } catch (error: any) {
      console.error("Error fetching customer call logs:", error);
      res.status(500).json({ error: "Failed to fetch call logs" });
    }
  });

  // Get all call logs for tenant
  app.get("/api/zoom/call-logs", authenticate, async (req: any, res) => {
    try {
      const tenantId = req.user.tenantId;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;

      const callLogs = await zoomService.getCallLogsByTenant(tenantId, limit);
      res.json(callLogs);
    } catch (error: any) {
      console.error("Error fetching call logs:", error);
      res.status(500).json({ error: "Failed to fetch call logs" });
    }
  });

  // Update call log notes
  app.patch("/api/zoom/call-logs/:callLogId/notes", authenticate, async (req: any, res) => {
    try {
      const callLogId = parseInt(req.params.callLogId);
      const tenantId = req.user.tenantId;
      const { notes } = req.body;

      if (isNaN(callLogId)) {
        return res.status(400).json({ error: "Invalid call log ID" });
      }

      // updateCallLog signature: (id, status?, duration?, notes?, endedAt?)
      const updated = await storage.updateCallLog(callLogId, undefined, undefined, notes);

      if (!updated) {
        return res.status(404).json({ error: "Call log not found" });
      }

      res.json(updated);
    } catch (error: any) {
      console.error("Error updating call log notes:", error);
      res.status(500).json({ error: "Failed to update call log" });
    }
  });
}
