/**
 * Campaign Tracking Service
 * Tracks all campaign metrics: sent, delivered, opened, clicked, etc.
 */

import { sql } from "./db.js";

export interface CampaignTrackingData {
  campaignId: number;
  recipientId: number;
  recipientType: "customer" | "lead";
  email?: string;
  phone?: string;
  status: "pending" | "sent" | "delivered" | "failed" | "bounced" | "opened" | "clicked" | "replied" | "unsubscribed";
  sentAt?: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  repliedAt?: Date;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export class CampaignTracker {
  /**
   * Track when a campaign is sent to a recipient
   */
  async trackSent(data: {
    campaignId: number;
    tenantId: number;
    recipientType: "customer" | "lead";
    recipientId: number;
    email?: string;
    phone?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      await sql`
        INSERT INTO campaign_recipients (
          campaign_id, tenant_id, recipient_type, recipient_id,
          email, phone, status, sent_at, metadata, created_at
        ) VALUES (
          ${data.campaignId},
          ${data.tenantId},
          ${data.recipientType},
          ${data.recipientId},
          ${data.email || null},
          ${data.phone || null},
          'sent',
          NOW(),
          ${data.metadata ? JSON.stringify(data.metadata) : null},
          NOW()
        )
        ON CONFLICT (campaign_id, recipient_type, recipient_id) 
        DO UPDATE SET
          status = 'sent',
          sent_at = NOW(),
          email = COALESCE(${data.email || null}, campaign_recipients.email),
          phone = COALESCE(${data.phone || null}, campaign_recipients.phone)
      `;
    } catch (error) {
      console.error("Error tracking sent:", error);
      throw error;
    }
  }

  /**
   * Track when email is delivered
   */
  async trackDelivered(campaignId: number, recipientId: number, recipientType: "customer" | "lead"): Promise<void> {
    try {
      await sql`
        UPDATE campaign_recipients
        SET status = 'delivered', delivered_at = NOW()
        WHERE campaign_id = ${campaignId}
          AND recipient_id = ${recipientId}
          AND recipient_type = ${recipientType}
      `;
    } catch (error) {
      console.error("Error tracking delivered:", error);
      throw error;
    }
  }

  /**
   * Track when email is opened
   */
  async trackOpened(campaignId: number, recipientId: number, recipientType: "customer" | "lead", metadata?: Record<string, any>): Promise<void> {
    try {
      await sql`
        UPDATE campaign_recipients
        SET 
          status = CASE WHEN status = 'clicked' THEN 'clicked' ELSE 'opened' END,
          opened_at = COALESCE(opened_at, NOW()),
          metadata = COALESCE(${metadata ? JSON.stringify(metadata) : null}, metadata)
        WHERE campaign_id = ${campaignId}
          AND recipient_id = ${recipientId}
          AND recipient_type = ${recipientType}
      `;
    } catch (error) {
      console.error("Error tracking opened:", error);
      throw error;
    }
  }

  /**
   * Track when link is clicked
   */
  async trackClicked(campaignId: number, recipientId: number, recipientType: "customer" | "lead", linkUrl: string, metadata?: Record<string, any>): Promise<void> {
    try {
      // Update recipient status
      await sql`
        UPDATE campaign_recipients
        SET 
          status = 'clicked',
          clicked_at = COALESCE(clicked_at, NOW()),
          metadata = COALESCE(${metadata ? JSON.stringify(metadata) : null}, metadata)
        WHERE campaign_id = ${campaignId}
          AND recipient_id = ${recipientId}
          AND recipient_type = ${recipientType}
      `;

      // Track link click
      const [link] = await sql`
        SELECT id FROM campaign_links
        WHERE campaign_id = ${campaignId} AND url = ${linkUrl}
        LIMIT 1
      `;

      if (link) {
        await sql`
          UPDATE campaign_links
          SET click_count = click_count + 1
          WHERE id = ${link.id}
        `;

        const [recipient] = await sql`
          SELECT id FROM campaign_recipients
          WHERE campaign_id = ${campaignId}
            AND recipient_id = ${recipientId}
            AND recipient_type = ${recipientType}
          LIMIT 1
        `;

        if (recipient) {
          // Check if already clicked this link
          const [existingClick] = await sql`
            SELECT id FROM campaign_link_clicks
            WHERE link_id = ${link.id} AND recipient_id = ${recipient.id}
            LIMIT 1
          `;

          if (!existingClick) {
            await sql`
              UPDATE campaign_links
              SET unique_clicks = unique_clicks + 1
              WHERE id = ${link.id}
            `;

            await sql`
              INSERT INTO campaign_link_clicks (
                link_id, recipient_id, clicked_at, ip_address, user_agent
              ) VALUES (
                ${link.id},
                ${recipient.id},
                NOW(),
                ${metadata?.ipAddress || null},
                ${metadata?.userAgent || null}
              )
            `;
          }
        }
      }
    } catch (error) {
      console.error("Error tracking clicked:", error);
      throw error;
    }
  }

  /**
   * Track when email bounces
   */
  async trackBounced(campaignId: number, recipientId: number, recipientType: "customer" | "lead", errorMessage: string): Promise<void> {
    try {
      await sql`
        UPDATE campaign_recipients
        SET 
          status = 'bounced',
          error_message = ${errorMessage}
        WHERE campaign_id = ${campaignId}
          AND recipient_id = ${recipientId}
          AND recipient_type = ${recipientType}
      `;
    } catch (error) {
      console.error("Error tracking bounced:", error);
      throw error;
    }
  }

  /**
   * Track when email fails to send
   */
  async trackFailed(campaignId: number, recipientId: number, recipientType: "customer" | "lead", errorMessage: string): Promise<void> {
    try {
      await sql`
        UPDATE campaign_recipients
        SET 
          status = 'failed',
          error_message = ${errorMessage}
        WHERE campaign_id = ${campaignId}
          AND recipient_id = ${recipientId}
          AND recipient_type = ${recipientType}
      `;
    } catch (error) {
      console.error("Error tracking failed:", error);
      throw error;
    }
  }

  /**
   * Track when recipient replies
   */
  async trackReplied(campaignId: number, recipientId: number, recipientType: "customer" | "lead"): Promise<void> {
    try {
      await sql`
        UPDATE campaign_recipients
        SET 
          status = 'replied',
          replied_at = NOW()
        WHERE campaign_id = ${campaignId}
          AND recipient_id = ${recipientId}
          AND recipient_type = ${recipientType}
      `;
    } catch (error) {
      console.error("Error tracking replied:", error);
      throw error;
    }
  }

  /**
   * Get campaign statistics
   */
  async getCampaignStats(campaignId: number): Promise<{
    totalSent: number;
    totalDelivered: number;
    totalOpened: number;
    totalClicked: number;
    totalReplied: number;
    totalBounced: number;
    totalFailed: number;
    openRate: number;
    clickRate: number;
    replyRate: number;
    bounceRate: number;
  }> {
    try {
      const [stats] = await sql`
        SELECT 
          COUNT(*) FILTER (WHERE status IN ('sent', 'delivered', 'opened', 'clicked', 'replied')) as total_sent,
          COUNT(*) FILTER (WHERE status IN ('delivered', 'opened', 'clicked', 'replied')) as total_delivered,
          COUNT(*) FILTER (WHERE status IN ('opened', 'clicked', 'replied')) as total_opened,
          COUNT(*) FILTER (WHERE status IN ('clicked', 'replied')) as total_clicked,
          COUNT(*) FILTER (WHERE status = 'replied') as total_replied,
          COUNT(*) FILTER (WHERE status = 'bounced') as total_bounced,
          COUNT(*) FILTER (WHERE status = 'failed') as total_failed
        FROM campaign_recipients
        WHERE campaign_id = ${campaignId}
      `;

      const totalSent = parseInt(stats.total_sent || 0);
      const totalDelivered = parseInt(stats.total_delivered || 0);
      const totalOpened = parseInt(stats.total_opened || 0);
      const totalClicked = parseInt(stats.total_clicked || 0);
      const totalReplied = parseInt(stats.total_replied || 0);
      const totalBounced = parseInt(stats.total_bounced || 0);
      const totalFailed = parseInt(stats.total_failed || 0);

      return {
        totalSent,
        totalDelivered,
        totalOpened,
        totalClicked,
        totalReplied,
        totalBounced,
        totalFailed,
        openRate: totalSent > 0 ? (totalOpened / totalSent) * 100 : 0,
        clickRate: totalSent > 0 ? (totalClicked / totalSent) * 100 : 0,
        replyRate: totalSent > 0 ? (totalReplied / totalSent) * 100 : 0,
        bounceRate: totalSent > 0 ? (totalBounced / totalSent) * 100 : 0,
      };
    } catch (error) {
      console.error("Error getting campaign stats:", error);
      throw error;
    }
  }

  /**
   * Extract and track links from campaign content
   */
  async extractAndTrackLinks(campaignId: number, content: string): Promise<void> {
    try {
      // Extract URLs from content (simple regex)
      const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi;
      const urls = content.match(urlRegex) || [];

      for (const url of urls) {
        // Check if link already exists
        const [existing] = await sql`
          SELECT id FROM campaign_links
          WHERE campaign_id = ${campaignId} AND url = ${url}
          LIMIT 1
        `;

        if (!existing) {
          await sql`
            INSERT INTO campaign_links (campaign_id, url, click_count, unique_clicks)
            VALUES (${campaignId}, ${url}, 0, 0)
          `;
        }
      }
    } catch (error) {
      console.error("Error extracting links:", error);
      // Don't throw - this is not critical
    }
  }
}

export const campaignTracker = new CampaignTracker();

