import type { Express } from "express";
import { createGoogleMeetLink } from "./google-calendar-service.js";
import { createZoomMeeting } from "./zoom-meeting-service.js";
import { createMicrosoftTeamsMeeting, generateTeamsMeetingLink } from "./microsoft-teams-service.js";

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
        needsConfiguration: result.needsConfiguration || false,
        message: result.needsConfiguration 
          ? "Manual Google Meet link generated. For full integration, please configure Google Calendar API credentials in Settings."
          : undefined,
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

      // Get Zoom credentials from environment variables
      const zoomAccountId = process.env.ZOOM_ACCOUNT_ID;
      const zoomClientId = process.env.ZOOM_CLIENT_ID;
      const zoomClientSecret = process.env.ZOOM_CLIENT_SECRET;

      if (!zoomAccountId || !zoomClientId || !zoomClientSecret) {
        return res.status(400).json({
          success: false,
          message: "Zoom credentials not configured. Please set ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, and ZOOM_CLIENT_SECRET in your .env file.",
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
          accountId: zoomAccountId,
          clientId: zoomClientId,
          clientSecret: zoomClientSecret,
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

  // Generate Microsoft Teams meeting link endpoint
  app.post("/api/tenants/:tenantId/calendar/generate-teams", async (req, res) => {
    try {
      const { tenantId } = req.params;
      const { title, description, startDateTime, endDateTime, timezone, attendees } = req.body;

      console.log(`📅 Generating Microsoft Teams meeting for tenant: ${tenantId}`);
      console.log(`📅 Request data:`, req.body);

      // Validate required fields
      if (!title || !startDateTime || !endDateTime) {
        return res.status(400).json({
          message: "Missing required fields",
          required: ["title", "startDateTime", "endDateTime"],
        });
      }

      // Get Microsoft Teams credentials from environment variables
      const teamsClientId = process.env.MICROSOFT_TEAMS_CLIENT_ID;
      const teamsClientSecret = process.env.MICROSOFT_TEAMS_CLIENT_SECRET;
      const teamsTenantId = process.env.MICROSOFT_TEAMS_TENANT_ID;

      if (!teamsClientId || !teamsClientSecret || !teamsTenantId) {
        // If credentials are not configured, generate a manual Teams link
        console.log("⚠️ Microsoft Teams credentials not configured, generating manual link");
        const teamsLink = generateTeamsMeetingLink();
        
        return res.status(200).json({
          success: true,
          teamsMeetingLink: teamsLink,
          meetingId: teamsLink.split('/').pop() || '',
          needsConfiguration: true,
          message: "Teams link generated. For full integration, please set MICROSOFT_TEAMS_CLIENT_ID, MICROSOFT_TEAMS_CLIENT_SECRET, and MICROSOFT_TEAMS_TENANT_ID in your .env file."
        });
      }

      // Generate Teams meeting using API
      const result = await createMicrosoftTeamsMeeting(
        {
          clientId: teamsClientId,
          clientSecret: teamsClientSecret,
          tenantId: teamsTenantId,
        },
        {
          subject: title,
          description,
          startDateTime,
          endDateTime,
          timezone: timezone || 'UTC',
          attendees: attendees || [],
        }
      );

      console.log(`✅ Microsoft Teams meeting created:`, result.joinUrl);

      res.status(200).json({
        success: true,
        teamsMeetingLink: result.joinUrl,
        meetingId: result.meetingId,
        onlineMeetingId: result.onlineMeetingId,
      });
    } catch (error: any) {
      console.error("❌ Error generating Microsoft Teams meeting:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to generate Microsoft Teams meeting",
        error: error.toString(),
      });
    }
  });

  console.log("✅ Meeting generation routes registered successfully");
}
