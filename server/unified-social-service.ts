import { simpleStorage } from './simple-storage.js';
import { FacebookService } from './facebook-service.js';
import { InstagramService } from './instagram-service.js';
import { LinkedInService } from './linkedin-service.js';
import { TwitterService } from './twitter-service.js';
import { TikTokService } from './tiktok-service.js';

interface SocialPost {
  id: string;
  platform: string;
  content: string;
  mediaUrls?: string[];
  mediaType?: 'image' | 'video' | 'carousel';
  scheduledAt?: string;
  publishedAt?: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    views?: number;
  };
  analytics?: any;
}

interface SocialMessage {
  id: string;
  platform: string;
  from: string;
  to: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  conversationId: string;
  attachments?: string[];
}

interface SocialAnalytics {
  platform: string;
  followers: number;
  engagement: number;
  reach: number;
  impressions: number;
  clicks: number;
  periodChange: {
    followers: number;
    engagement: number;
    reach: number;
  };
}

interface SocialLead {
  id: string;
  platform: string;
  name: string;
  email?: string;
  phone?: string;
  source: string;
  formName?: string;
  createdAt: string;
  fields: Record<string, any>;
}

interface PostData {
  content: string;
  platforms: string[];
  mediaUrls?: string[];
  scheduledAt?: string;
  mediaType?: 'image' | 'video' | 'carousel';
}

export class UnifiedSocialService {
  private facebookService?: FacebookService;
  private instagramService?: InstagramService;
  private linkedinService?: LinkedInService;
  private twitterService?: TwitterService;
  private tiktokService?: TikTokService;

  constructor() {
    // Initialize services based on available credentials
    this.initializeServices();
  }

  private async initializeServices() {
    // Don't initialize social services during startup - use SocialServiceFactory when needed
    // This prevents requiring credentials before tenants configure them
    
    console.log("📱 UnifiedSocialService: Skipping service initialization - services will be created per tenant as needed");
    
    // Services will be created dynamically using SocialServiceFactory when accessed
    
    // Don't initialize services during startup - they will be created per tenant when needed
    this.facebookService = null;
    this.instagramService = null;
    this.linkedinService = null;
    this.twitterService = null;
    this.tiktokService = null;
    
    console.log("📱 UnifiedSocialService: All services set to null - will use SocialServiceFactory per tenant");
  }

  /**
   * Get all connected platforms for a tenant
   */
  async getConnectedPlatforms(tenantId: number): Promise<Array<{platform: string, isConnected: boolean, lastSync?: string}>> {
    const platforms = ['facebook', 'instagram', 'linkedin', 'twitter', 'tiktok'];
    const results = [];

    for (const platform of platforms) {
      const integration = await simpleStorage.getSocialIntegration(tenantId, platform);
      results.push({
        platform,
        isConnected: !!integration?.accessToken,
        lastSync: integration?.lastSync
      });
    }

    return results;
  }

  /**
   * Create and publish/schedule posts across multiple platforms
   */
  async createPost(tenantId: number, postData: PostData): Promise<{success: boolean, results: Array<{platform: string, success: boolean, postId?: string, error?: string}>}> {
    const results = [];
    
    for (const platform of postData.platforms) {
      try {
        const integration = await simpleStorage.getSocialIntegration(tenantId, platform);
        if (!integration?.accessToken) {
          results.push({
            platform,
            success: false,
            error: `${platform} not connected`
          });
          continue;
        }

        let postId: string | undefined;

        // Platform-specific posting logic
        switch (platform) {
          case 'facebook':
            if (this.facebookService) {
              postId = await this.facebookService.createPost(
                integration.accessToken,
                postData.content,
                postData.mediaUrls,
                postData.scheduledAt
              );
            }
            break;

          case 'instagram':
            if (this.instagramService) {
              postId = await this.instagramService.createPost(
                integration.accessToken,
                postData.content,
                postData.mediaUrls,
                postData.mediaType
              );
            }
            break;

          case 'linkedin':
            if (this.linkedinService) {
              postId = await this.linkedinService.createPost(
                integration.accessToken,
                postData.content,
                postData.mediaUrls
              );
            }
            break;

          case 'twitter':
            if (this.twitterService) {
              postId = await this.twitterService.createTweet(
                integration.accessToken,
                postData.content,
                postData.mediaUrls
              );
            }
            break;

          case 'tiktok':
            if (this.tiktokService) {
              postId = await this.tiktokService.uploadVideo(
                integration.accessToken,
                postData.content,
                postData.mediaUrls?.[0] // TikTok typically handles one video
              );
            }
            break;
        }

        // Store post in database
        if (postId) {
          await simpleStorage.createSocialPost({
            tenantId,
            platform,
            externalId: postId,
            content: postData.content,
            mediaUrls: postData.mediaUrls,
            mediaType: postData.mediaType,
            scheduledAt: postData.scheduledAt,
            status: postData.scheduledAt ? 'scheduled' : 'published',
            publishedAt: postData.scheduledAt ? undefined : new Date().toISOString()
          });
        }

        results.push({
          platform,
          success: !!postId,
          postId,
          error: postId ? undefined : 'Failed to create post'
        });

      } catch (error: any) {
        console.error(`Error creating post on ${platform}:`, error);
        results.push({
          platform,
          success: false,
          error: error.message
        });
      }
    }

    return {
      success: results.some(r => r.success),
      results
    };
  }

  /**
   * Get unified posts from all platforms
   */
  async getPosts(tenantId: number, filter: string = 'all'): Promise<SocialPost[]> {
    const posts = await simpleStorage.getSocialPosts(tenantId, filter);
    
    // Transform to unified format
    return posts.map(post => ({
      id: post.id.toString(),
      platform: post.platform,
      content: post.content,
      mediaUrls: post.mediaUrls ? JSON.parse(post.mediaUrls) : undefined,
      mediaType: post.mediaType as any,
      scheduledAt: post.scheduledAt,
      publishedAt: post.publishedAt,
      status: post.status as any,
      engagement: {
        likes: post.likes || 0,
        comments: post.comments || 0,
        shares: post.shares || 0,
        views: post.views || 0
      },
      analytics: post.analytics ? JSON.parse(post.analytics) : undefined
    }));
  }

  /**
   * Get unified messages from all platforms
   */
  async getMessages(tenantId: number, filter: string = 'all'): Promise<SocialMessage[]> {
    const messages = await simpleStorage.getSocialMessages(tenantId, filter);
    
    return messages.map(msg => ({
      id: msg.id.toString(),
      platform: msg.platform,
      from: msg.fromUser,
      to: msg.toUser,
      content: msg.content,
      timestamp: msg.createdAt,
      isRead: msg.isRead,
      conversationId: msg.conversationId,
      attachments: msg.attachments ? JSON.parse(msg.attachments) : undefined
    }));
  }

  /**
   * Reply to a message
   */
  async replyToMessage(tenantId: number, messageId: string, reply: string): Promise<{success: boolean, error?: string}> {
    try {
      const message = await simpleStorage.getSocialMessage(tenantId, messageId);
      if (!message) {
        return { success: false, error: 'Message not found' };
      }

      const integration = await simpleStorage.getSocialIntegration(tenantId, message.platform);
      if (!integration?.accessToken) {
        return { success: false, error: `${message.platform} not connected` };
      }

      // Platform-specific reply logic
      let success = false;
      switch (message.platform) {
        case 'facebook':
          if (this.facebookService) {
            success = await this.facebookService.replyToMessage(
              integration.accessToken,
              message.conversationId,
              reply
            );
          }
          break;

        case 'instagram':
          if (this.instagramService) {
            success = await this.instagramService.replyToMessage(
              integration.accessToken,
              message.conversationId,
              reply
            );
          }
          break;

        case 'linkedin':
          if (this.linkedinService) {
            success = await this.linkedinService.replyToMessage(
              integration.accessToken,
              message.conversationId,
              reply
            );
          }
          break;

        case 'twitter':
          if (this.twitterService) {
            success = await this.twitterService.replyToTweet(
              integration.accessToken,
              message.conversationId,
              reply
            );
          }
          break;
      }

      if (success) {
        // Mark original message as read and store reply
        await simpleStorage.updateSocialMessage(tenantId, messageId, { isRead: true });
        await simpleStorage.createSocialMessage({
          tenantId,
          platform: message.platform,
          fromUser: 'self',
          toUser: message.fromUser,
          content: reply,
          conversationId: message.conversationId,
          isRead: true
        });
      }

      return { success, error: success ? undefined : 'Failed to send reply' };
    } catch (error: any) {
      console.error('Error replying to message:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get unified analytics from all platforms
   */
  async getAnalytics(tenantId: number): Promise<SocialAnalytics[]> {
    const connectedPlatforms = await this.getConnectedPlatforms(tenantId);
    const analytics = [];

    for (const platform of connectedPlatforms) {
      if (!platform.isConnected) continue;

      try {
        const integration = await simpleStorage.getSocialIntegration(tenantId, platform.platform);
        if (!integration?.accessToken) continue;

        let platformAnalytics: any = {};

        // Platform-specific analytics fetching
        switch (platform.platform) {
          case 'facebook':
            if (this.facebookService) {
              platformAnalytics = await this.facebookService.getInsights(integration.accessToken);
            }
            break;

          case 'instagram':
            if (this.instagramService) {
              platformAnalytics = await this.instagramService.getInsights(integration.accessToken);
            }
            break;

          case 'linkedin':
            if (this.linkedinService) {
              platformAnalytics = await this.linkedinService.getPageStatistics(integration.accessToken);
            }
            break;

          case 'twitter':
            if (this.twitterService) {
              platformAnalytics = await this.twitterService.getUserMetrics(integration.accessToken);
            }
            break;

          case 'tiktok':
            if (this.tiktokService) {
              platformAnalytics = await this.tiktokService.getUserInfo(integration.accessToken);
            }
            break;
        }

        analytics.push({
          platform: platform.platform,
          followers: platformAnalytics.followers || 0,
          engagement: platformAnalytics.engagement || 0,
          reach: platformAnalytics.reach || 0,
          impressions: platformAnalytics.impressions || 0,
          clicks: platformAnalytics.clicks || 0,
          periodChange: {
            followers: platformAnalytics.followerChange || 0,
            engagement: platformAnalytics.engagementChange || 0,
            reach: platformAnalytics.reachChange || 0
          }
        });

      } catch (error: any) {
        console.error(`Error fetching analytics for ${platform.platform}:`, error);
        // Add placeholder data for platforms with errors
        analytics.push({
          platform: platform.platform,
          followers: 0,
          engagement: 0,
          reach: 0,
          impressions: 0,
          clicks: 0,
          periodChange: { followers: 0, engagement: 0, reach: 0 }
        });
      }
    }

    return analytics;
  }

  /**
   * Get unified leads from all platforms
   */
  async getLeads(tenantId: number): Promise<SocialLead[]> {
    const leads = await simpleStorage.getSocialLeads(tenantId);
    
    return leads.map(lead => ({
      id: lead.id.toString(),
      platform: lead.platform,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      source: lead.source,
      formName: lead.formName,
      createdAt: lead.createdAt,
      fields: lead.fields ? JSON.parse(lead.fields) : {}
    }));
  }

  /**
   * Sync data from all connected platforms
   */
  async syncAllPlatforms(tenantId: number, platforms: string[]): Promise<{success: boolean, platformCount: number, errors: string[]}> {
    const errors = [];
    let successCount = 0;

    for (const platform of platforms) {
      try {
        const integration = await simpleStorage.getSocialIntegration(tenantId, platform);
        if (!integration?.accessToken) {
          continue;
        }

        // Platform-specific sync logic
        switch (platform) {
          case 'facebook':
            if (this.facebookService) {
              await this.syncFacebookData(tenantId, integration.accessToken);
            }
            break;

          case 'instagram':
            if (this.instagramService) {
              await this.syncInstagramData(tenantId, integration.accessToken);
            }
            break;

          case 'linkedin':
            if (this.linkedinService) {
              await this.syncLinkedInData(tenantId, integration.accessToken);
            }
            break;

          case 'twitter':
            if (this.twitterService) {
              await this.syncTwitterData(tenantId, integration.accessToken);
            }
            break;

          case 'tiktok':
            if (this.tiktokService) {
              await this.syncTikTokData(tenantId, integration.accessToken);
            }
            break;
        }

        // Update last sync time
        await simpleStorage.updateSocialIntegrationByPlatform(tenantId, platform, {
          lastSync: new Date().toISOString()
        });

        successCount++;
      } catch (error: any) {
        console.error(`Error syncing ${platform}:`, error);
        errors.push(`${platform}: ${error.message}`);
      }
    }

    return {
      success: successCount > 0,
      platformCount: successCount,
      errors
    };
  }

  private async syncFacebookData(tenantId: number, accessToken: string) {
    if (!this.facebookService) return;

    // Sync posts
    const posts = await this.facebookService.getUserPosts(accessToken);
    for (const post of posts) {
      await simpleStorage.upsertSocialPost({
        tenantId,
        platform: 'facebook',
        externalId: post.id,
        content: post.message || '',
        publishedAt: post.created_time,
        status: 'published'
      });
    }

    // Sync messages
    const conversations = await this.facebookService.getConversations(accessToken);
    for (const conversation of conversations) {
      const messages = await this.facebookService.getMessages(accessToken, conversation.id);
      for (const message of messages) {
        await simpleStorage.upsertSocialMessage({
          tenantId,
          platform: 'facebook',
          externalId: message.id,
          fromUser: message.from.name,
          toUser: message.to?.data?.[0]?.name || 'Page',
          content: message.message,
          conversationId: conversation.id,
          createdAt: message.created_time,
          isRead: false
        });
      }
    }

    // Sync leads
    const leadForms = await this.facebookService.getLeadForms(accessToken);
    for (const form of leadForms) {
      const leads = await this.facebookService.getLeads(accessToken, form.id);
      for (const lead of leads) {
        const leadData = this.facebookService.transformLeadData(lead);
        await simpleStorage.upsertSocialLead({
          tenantId,
          platform: 'facebook',
          externalId: lead.id,
          name: leadData.name,
          email: leadData.email,
          phone: leadData.phone,
          source: 'Facebook Lead Form',
          formName: form.name,
          fields: JSON.stringify(leadData.fields),
          createdAt: lead.created_time
        });
      }
    }
  }

  private async syncInstagramData(tenantId: number, accessToken: string) {
    if (!this.instagramService) return;

    // Sync posts
    const posts = await this.instagramService.getUserMedia(accessToken);
    for (const post of posts) {
      await simpleStorage.upsertSocialPost({
        tenantId,
        platform: 'instagram',
        externalId: post.id,
        content: post.caption || '',
        mediaUrls: JSON.stringify([post.media_url]),
        mediaType: post.media_type.toLowerCase(),
        publishedAt: post.timestamp,
        status: 'published'
      });
    }

    // Sync leads from Instagram lead forms
    const leadForms = await this.instagramService.getLeadForms(accessToken);
    for (const form of leadForms) {
      const leads = await this.instagramService.getLeads(accessToken, form.id);
      for (const lead of leads) {
        const leadData = this.instagramService.transformLeadData(lead);
        await simpleStorage.upsertSocialLead({
          tenantId,
          platform: 'instagram',
          externalId: lead.id,
          name: leadData.name,
          email: leadData.email,
          phone: leadData.phone,
          source: 'Instagram Lead Form',
          formName: form.name,
          fields: JSON.stringify(leadData.fields),
          createdAt: lead.created_time
        });
      }
    }
  }

  private async syncLinkedInData(tenantId: number, accessToken: string) {
    if (!this.linkedinService) return;

    // Sync leads from LinkedIn lead forms
    const leadForms = await this.linkedinService.getLeadForms(accessToken);
    for (const form of leadForms) {
      const leads = await this.linkedinService.getLeads(accessToken, form.id);
      for (const lead of leads) {
        const leadData = this.linkedinService.transformLeadData(lead);
        await simpleStorage.upsertSocialLead({
          tenantId,
          platform: 'linkedin',
          externalId: lead.id,
          name: leadData.name,
          email: leadData.email,
          phone: leadData.phone,
          source: 'LinkedIn Lead Form',
          formName: form.name,
          fields: JSON.stringify(leadData.fields),
          createdAt: new Date(lead.createdAt).toISOString()
        });
      }
    }
  }

  private async syncTwitterData(tenantId: number, accessToken: string) {
    if (!this.twitterService) return;

    // Sync tweets
    const tweets = await this.twitterService.getUserTweets(accessToken);
    for (const tweet of tweets) {
      await simpleStorage.upsertSocialPost({
        tenantId,
        platform: 'twitter',
        externalId: tweet.id,
        content: tweet.text,
        publishedAt: tweet.created_at,
        status: 'published'
      });
    }

    // Sync mentions and DMs
    const mentions = await this.twitterService.getMentions(accessToken);
    for (const mention of mentions) {
      await simpleStorage.upsertSocialMessage({
        tenantId,
        platform: 'twitter',
        externalId: mention.id,
        fromUser: mention.author_id,
        toUser: 'self',
        content: mention.text,
        conversationId: mention.conversation_id,
        createdAt: mention.created_at,
        isRead: false
      });
    }
  }

  private async syncTikTokData(tenantId: number, accessToken: string) {
    if (!this.tiktokService) return;

    // Sync videos
    const videos = await this.tiktokService.getUserVideos(accessToken);
    for (const video of videos) {
      await simpleStorage.upsertSocialPost({
        tenantId,
        platform: 'tiktok',
        externalId: video.id,
        content: video.title,
        mediaUrls: JSON.stringify([video.video_url]),
        mediaType: 'video',
        publishedAt: new Date(video.create_time * 1000).toISOString(),
        status: 'published'
      });
    }
  }
}

// Export singleton instance
// Removed global export - use per-tenant service creation instead