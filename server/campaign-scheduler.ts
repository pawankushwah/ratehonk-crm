/**
 * Campaign Scheduler Service
 * Handles scheduled campaign execution
 */

import { sql } from "./db";
import { campaignTracker } from "./campaign-tracker";
import { emailService } from "./email-service";
import { simpleStorage } from "./simple-storage";

export class CampaignScheduler {
  /**
   * Process scheduled campaigns that are due
   */
  async processScheduledCampaigns(): Promise<void> {
    try {
      // Get all campaigns scheduled for now or in the past
      const scheduledCampaigns = await sql`
        SELECT * FROM email_campaigns
        WHERE status = 'scheduled'
          AND scheduled_at <= NOW()
          AND scheduled_at IS NOT NULL
      `;

      console.log(`📅 Processing ${scheduledCampaigns.length} scheduled campaigns`);

      for (const campaign of scheduledCampaigns) {
        try {
          await this.sendCampaign(campaign);
        } catch (error) {
          console.error(`Error processing scheduled campaign ${campaign.id}:`, error);
        }
      }
    } catch (error) {
      console.error("Error processing scheduled campaigns:", error);
    }
  }

  /**
   * Send a campaign
   */
  private async sendCampaign(campaign: any): Promise<void> {
    try {
      console.log(`📧 Sending campaign: ${campaign.name} (ID: ${campaign.id})`);

      // Extract links for tracking
      await campaignTracker.extractAndTrackLinks(campaign.id, campaign.content);

      // Get recipients
      let recipients: any[] = [];

      if (campaign.target_audience === "manual_selection") {
        // Get manually selected recipients
        const metadata = campaign.metadata ? JSON.parse(campaign.metadata) : {};
        const selectedRecipients = metadata.selectedRecipients || [];

        for (const recipient of selectedRecipients) {
          if (recipient.type === "customer") {
            const [customer] = await sql`
              SELECT * FROM customers WHERE id = ${recipient.id} AND tenant_id = ${campaign.tenant_id}
            `;
            if (customer) recipients.push({ ...customer, type: "customer" });
          } else if (recipient.type === "lead") {
            const [lead] = await sql`
              SELECT * FROM leads WHERE id = ${recipient.id} AND tenant_id = ${campaign.tenant_id}
            `;
            if (lead) recipients.push({ ...lead, type: "lead" });
          }
        }
      } else if (campaign.target_audience?.startsWith("segment_")) {
        // Get segment recipients
        const segmentId = parseInt(campaign.target_audience.replace("segment_", ""));
        const segmentRecipients = await sql`
          SELECT DISTINCT c.*, 'customer' as type
          FROM customers c
          WHERE c.tenant_id = ${campaign.tenant_id} AND c.email IS NOT NULL
          LIMIT 500
        `;
        recipients = segmentRecipients;
      } else {
        // All customers
        const allCustomers = await sql`
          SELECT *, 'customer' as type FROM customers 
          WHERE tenant_id = ${campaign.tenant_id} AND email IS NOT NULL
        `;
        recipients = allCustomers;
      }

      let successCount = 0;
      let failureCount = 0;

      // Send to each recipient
      for (const recipient of recipients) {
        try {
          const email = recipient.email;
          if (!email) continue;

          // Personalize content
          let personalizedContent = campaign.content;
          let personalizedSubject = campaign.subject;

          const firstName = recipient.first_name || recipient.name?.split(" ")[0] || "";
          const lastName = recipient.last_name || recipient.name?.split(" ")[1] || "";
          
          personalizedContent = personalizedContent
            .replace(/\{\{FirstName\}\}/g, firstName)
            .replace(/\{\{LastName\}\}/g, lastName)
            .replace(/\{\{Email\}\}/g, email)
            .replace(/\{\{CompanyName\}\}/g, "Vani Technologies Travel")
            .replace(/\{\{AgentName\}\}/g, "Travel Agent")
            .replace(/\{\{BookingLink\}\}/g, `${process.env.APP_URL || "http://localhost:5000"}/bookings`);

          personalizedSubject = personalizedSubject
            .replace(/\{\{FirstName\}\}/g, firstName)
            .replace(/\{\{LastName\}\}/g, lastName);

          // Send email
          const sent = await emailService.sendEmail({
            to: email,
            subject: personalizedSubject,
            html: personalizedContent,
            tenantId: campaign.tenant_id,
          });

          if (sent) {
            successCount++;
            await campaignTracker.trackSent({
              campaignId: campaign.id,
              tenantId: campaign.tenant_id,
              recipientType: recipient.type || "customer",
              recipientId: recipient.id,
              email: email,
            });
          } else {
            failureCount++;
            await campaignTracker.trackFailed(
              campaign.id,
              recipient.id,
              recipient.type || "customer",
              "Failed to send email"
            );
          }
        } catch (error: any) {
          console.error(`Error sending to ${recipient.email}:`, error);
          failureCount++;
          await campaignTracker.trackFailed(
            campaign.id,
            recipient.id,
            recipient.type || "customer",
            error.message || "Unknown error"
          );
        }
      }

      // Update campaign status
      const stats = await campaignTracker.getCampaignStats(campaign.id);
      
      await simpleStorage.updateEmailCampaign(campaign.id, {
        status: "sent",
        recipientCount: successCount + failureCount,
        openRate: stats.openRate.toFixed(2),
        clickRate: stats.clickRate.toFixed(2),
        sentAt: new Date().toISOString(),
        deliveredCount: stats.totalDelivered,
        failedCount: failureCount,
      });

      console.log(`✅ Campaign ${campaign.id} sent: ${successCount} success, ${failureCount} failed`);
    } catch (error) {
      console.error(`Error sending campaign ${campaign.id}:`, error);
      throw error;
    }
  }

  /**
   * Start scheduler (call this on server startup)
   */
  start(): void {
    // Process scheduled campaigns every minute
    setInterval(() => {
      this.processScheduledCampaigns();
    }, 60000); // Every 60 seconds

    // Also process immediately on startup
    this.processScheduledCampaigns();

    console.log("📅 Campaign scheduler started");
  }
}

export const campaignScheduler = new CampaignScheduler();

