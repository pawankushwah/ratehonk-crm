import type { Express } from "express";
import { createGoogleMeetLink } from "./google-calendar-service";
import { createZoomMeeting } from "./zoom-meeting-service";
import { sql } from "./db";

export function registerMeetingRoutes(app: Express) {
  // Generate Google Meet link endpoint
  app.post("/api/tenants/:tenantId/calendar/generate-google-meet", async (req, res) => {
    try {
      const { tenantId } = req.params;
      const { title, description, startDateTime, endDateTime, timezone, attendees } = req.body;

      console.log(`📅 Generating Google Meet link for tenant: ${tenantId}`);
      console.log(`📅 Request data:`, req.body);

      // Validate required fields
      if (!title || !startDateTime || !endDateTime) {
        return res.status(400).json({
          message: "Missing required fields",
          required: ["title", "startDateTime", "endDateTime"],
        });
      }

      // Generate Google Meet link
      const result = await createGoogleMeetLink({
        title,
        description,
        startDateTime,
        endDateTime,
        timezone,
        attendees,
      });

      console.log(`✅ Google Meet link generated:`, result.meetLink);

      res.status(200).json({
        success: true,
        googleMeetLink: result.meetLink,
        eventId: result.eventId,
      });
    } catch (error: any) {
      console.error("❌ Error generating Google Meet link:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to generate Google Meet link",
        error: error.toString(),
      });
    }
  });

  // Generate Zoom meeting link endpoint
  app.post("/api/tenants/:tenantId/calendar/generate-zoom", async (req, res) => {
    try {
      const { tenantId } = req.params;
      const { title, description, startDateTime, endDateTime, timezone } = req.body;

      console.log(`📅 Generating Zoom meeting for tenant: ${tenantId}`);
      console.log(`📅 Request data:`, req.body);

      // Validate required fields
      if (!title || !startDateTime || !endDateTime) {
        return res.status(400).json({
          message: "Missing required fields",
          required: ["title", "startDateTime", "endDateTime"],
        });
      }

      // Get Zoom credentials from tenant settings
      const [tenant] = await sql`
        SELECT zoom_account_id, zoom_client_id, zoom_client_secret 
        FROM tenants 
        WHERE id = ${parseInt(tenantId)}
      `;

      if (!tenant || !tenant.zoom_account_id || !tenant.zoom_client_id || !tenant.zoom_client_secret) {
        return res.status(400).json({
          success: false,
          message: "Zoom credentials not configured. Please add your Zoom API credentials in Settings.",
          needsConfiguration: true
        });
      }

      // Calculate meeting duration in minutes
      const start = new Date(startDateTime);
      const end = new Date(endDateTime);
      const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60));

      // Generate Zoom meeting
      const result = await createZoomMeeting(
        {
          accountId: tenant.zoom_account_id,
          clientId: tenant.zoom_client_id,
          clientSecret: tenant.zoom_client_secret,
        },
        {
          topic: title,
          agenda: description,
          startTime: startDateTime,
          duration,
          timezone: timezone || 'UTC',
        }
      );

      console.log(`✅ Zoom meeting created:`, result.joinUrl);

      res.status(200).json({
        success: true,
        zoomMeetingLink: result.joinUrl,
        zoomMeetingId: result.meetingId,
        zoomMeetingPassword: result.password,
      });
    } catch (error: any) {
      console.error("❌ Error generating Zoom meeting:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to generate Zoom meeting",
        error: error.toString(),
      });
    }
  });

  console.log("✅ Meeting generation routes registered successfully");
}
