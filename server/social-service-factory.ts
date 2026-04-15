import { db } from "./db.js";
import { socialIntegrations } from "./../shared/schema.js";
import { eq, and } from "drizzle-orm";
import { FacebookService } from "./facebook-service.js";
import { InstagramService } from "./instagram-service.js";
import { LinkedInService } from "./linkedin-service.js";
import { TwitterService } from "./twitter-service.js";
import { TikTokService } from "./tiktok-service.js";

/**
 * Factory class to create social media service instances with tenant-specific credentials
 * This replaces the old system that read from .env files
 */
export class SocialServiceFactory {
  
  /**
   * Get Facebook service instance with tenant-specific credentials
   */
  static async getFacebookService(tenantId: number): Promise<FacebookService> {
    const [integration] = await db
      .select()
      .from(socialIntegrations)
      .where(and(
        eq(socialIntegrations.tenantId, tenantId),
        eq(socialIntegrations.platform, 'facebook'),
        eq(socialIntegrations.isActive, true)
      ));

    if (!integration?.appId || !integration?.appSecret) {
      throw new Error('Facebook credentials not configured for this tenant. Please configure them in Social Integrations settings.');
    }

    return new FacebookService(integration.appId, integration.appSecret);
  }

  /**
   * Get Instagram service instance with tenant-specific credentials
   */
  static async getInstagramService(tenantId: number): Promise<InstagramService> {
    const [integration] = await db
      .select()
      .from(socialIntegrations)
      .where(and(
        eq(socialIntegrations.tenantId, tenantId),
        eq(socialIntegrations.platform, 'instagram'),
        eq(socialIntegrations.isActive, true)
      ));

    if (!integration?.appId || !integration?.appSecret) {
      throw new Error('Instagram credentials not configured for this tenant. Please configure them in Social Integrations settings.');
    }

    return new InstagramService(integration.appId, integration.appSecret);
  }

  /**
   * Get LinkedIn service instance with tenant-specific credentials
   */
  static async getLinkedInService(tenantId: number): Promise<LinkedInService> {
    const [integration] = await db
      .select()
      .from(socialIntegrations)
      .where(and(
        eq(socialIntegrations.tenantId, tenantId),
        eq(socialIntegrations.platform, 'linkedin'),
        eq(socialIntegrations.isActive, true)
      ));

    if (!integration?.clientId || !integration?.clientSecret) {
      throw new Error('LinkedIn credentials not configured for this tenant. Please configure them in Social Integrations settings.');
    }

    return new LinkedInService(integration.clientId, integration.clientSecret);
  }

  /**
   * Get Twitter service instance with tenant-specific credentials
   */
  static async getTwitterService(tenantId: number): Promise<TwitterService> {
    const [integration] = await db
      .select()
      .from(socialIntegrations)
      .where(and(
        eq(socialIntegrations.tenantId, tenantId),
        eq(socialIntegrations.platform, 'twitter'),
        eq(socialIntegrations.isActive, true)
      ));

    if (!integration?.clientId || !integration?.clientSecret) {
      throw new Error('Twitter credentials not configured for this tenant. Please configure them in Social Integrations settings.');
    }

    return new TwitterService(integration.clientId, integration.clientSecret);
  }

  /**
   * Get TikTok service instance with tenant-specific credentials
   */
  static async getTikTokService(tenantId: number): Promise<TikTokService> {
    const [integration] = await db
      .select()
      .from(socialIntegrations)
      .where(and(
        eq(socialIntegrations.tenantId, tenantId),
        eq(socialIntegrations.platform, 'tiktok'),
        eq(socialIntegrations.isActive, true)
      ));

    if (!integration?.apiKey || !integration?.apiSecret) {
      throw new Error('TikTok credentials not configured for this tenant. Please configure them in Social Integrations settings.');
    }

    return new TikTokService(integration.apiKey, integration.apiSecret);
  }

  /**
   * Get social integration configuration for a tenant and platform
   */
  static async getSocialIntegration(tenantId: number, platform: string) {
    const [integration] = await db
      .select()
      .from(socialIntegrations)
      .where(and(
        eq(socialIntegrations.tenantId, tenantId),
        eq(socialIntegrations.platform, platform)
      ));

    return integration;
  }

  /**
   * Save or update social integration credentials
   */
  static async saveSocialIntegration(tenantId: number, platform: string, credentials: {
    appId?: string;
    appSecret?: string;
    clientId?: string;
    clientSecret?: string;
    apiKey?: string;
    apiSecret?: string;
    accessToken?: string;
    refreshToken?: string;
    [key: string]: any;
  }) {
    const existingIntegration = await this.getSocialIntegration(tenantId, platform);

    if (existingIntegration) {
      // Update existing integration
      const [updated] = await db
        .update(socialIntegrations)
        .set({
          ...credentials,
          updatedAt: new Date(),
        })
        .where(eq(socialIntegrations.id, existingIntegration.id))
        .returning();
      
      return updated;
    } else {
      // Create new integration
      const [created] = await db
        .insert(socialIntegrations)
        .values({
          tenantId,
          platform,
          ...credentials,
          isActive: true,
        })
        .returning();
      
      return created;
    }
  }
}