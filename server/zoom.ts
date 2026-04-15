import { db } from "./db.js";
import { zoomTokens, callLogs, type ZoomToken, type InsertZoomToken, type CallLog, type InsertCallLog } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

export interface ZoomOAuthResponse {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
}

export interface ZoomCallEvent {
  event: string;
  payload: {
    object: {
      id: string;
      caller: {
        phone_number: string;
        name?: string;
        user_id?: string;
      };
      callee: {
        phone_number: string;
        name?: string;
        user_id?: string;
      };
      direction: string;
      duration: number;
      start_time: string;
      end_time?: string;
      answer_time?: string;
      call_status: string;
      recording_url?: string;
      recording_duration?: number;
    };
  };
}

export class ZoomService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.ZOOM_CLIENT_ID || '';
    this.clientSecret = process.env.ZOOM_CLIENT_SECRET || '';
    this.redirectUri = process.env.ZOOM_REDIRECT_URI || '';
  }

  // Legacy OAuth token management - DEPRECATED: Use multi-account methods instead
  // These methods work with the primary account for backward compatibility
  async saveTokens(tenantId: number, tokenData: ZoomOAuthResponse): Promise<ZoomToken> {
    // For backward compatibility, save as "Main Account"
    return this.saveTokenWithLabel(tenantId, tokenData, "Main Account");
  }

  async getToken(tenantId: number): Promise<ZoomToken | undefined> {
    // Get primary account for backward compatibility
    return await this.getPrimaryToken(tenantId);
  }

  async refreshAccessToken(tenantId: number): Promise<ZoomToken | undefined> {
    const token = await this.getPrimaryToken(tenantId);
    if (!token) return undefined;

    return await this.refreshAccessTokenById(token.id);
  }

  async getValidAccessToken(tenantId: number): Promise<string | null> {
    const token = await this.getPrimaryToken(tenantId);
    if (!token) return null;

    return await this.getValidAccessTokenById(token.id);
  }

  // Exchange authorization code for tokens
  async exchangeCodeForTokens(code: string, customRedirectUri?: string): Promise<ZoomOAuthResponse> {
    // Use custom redirect URI if provided, otherwise fallback to env variable
    const redirectUri = customRedirectUri || this.redirectUri;
    
    const response = await fetch('https://zoom.us/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to exchange code: ${response.statusText}`);
    }

    return await response.json();
  }

  // Fetch call history from Zoom API
  async fetchCallHistory(tenantId: number, params: {
    from?: string;
    to?: string;
    page_size?: number;
    next_page_token?: string;
  } = {}): Promise<any> {
    const accessToken = await this.getValidAccessToken(tenantId);
    if (!accessToken) {
      throw new Error('No valid Zoom access token');
    }

    const queryParams = new URLSearchParams({
      from: params.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Default: last 30 days
      to: params.to || new Date().toISOString(),
      page_size: params.page_size?.toString() || '30',
      ...(params.next_page_token && { next_page_token: params.next_page_token }),
    });

    const response = await fetch(`https://api.zoom.us/v2/phone/call_history?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch call history: ${response.statusText}`);
    }

    return await response.json();
  }

  // Process Zoom webhook event and save call log
  async processCallEvent(tenantId: number, event: ZoomCallEvent, customerId?: number, userId?: number): Promise<CallLog> {
    const { object } = event.payload;

    const callLogData: InsertCallLog = {
      tenantId,
      customerId: customerId || null,
      userId: userId || null,
      zoomCallId: object.id,
      callType: object.direction === 'inbound' ? 'incoming' : 'outgoing',
      direction: object.direction,
      callerNumber: object.caller.phone_number,
      calleeNumber: object.callee.phone_number,
      callerName: object.caller.name || null,
      calleeName: object.callee.name || null,
      status: this.mapZoomStatusToCrmStatus(object.call_status),
      duration: object.duration || 0,
      recordingUrl: object.recording_url || null,
      recordingDuration: object.recording_duration || null,
      startedAt: new Date(object.start_time),
      endedAt: object.end_time ? new Date(object.end_time) : null,
      answerTime: object.answer_time ? new Date(object.answer_time) : null,
      notes: null,
    };

    // Check if call log already exists (prevent duplicates)
    const [existing] = await db
      .select()
      .from(callLogs)
      .where(eq(callLogs.zoomCallId, object.id));

    if (existing) {
      // Update existing call log
      const [updated] = await db
        .update(callLogs)
        .set(callLogData)
        .where(eq(callLogs.id, existing.id))
        .returning();
      return updated;
    }

    // Create new call log
    const [newCallLog] = await db
      .insert(callLogs)
      .values(callLogData)
      .returning();

    return newCallLog;
  }

  // Get call logs by customer
  async getCallLogsByCustomer(customerId: number, tenantId: number): Promise<any[]> {
    return await db
      .select({
        id: callLogs.id,
        zoomCallId: callLogs.zoomCallId,
        callType: callLogs.callType,
        direction: callLogs.direction,
        callerNumber: callLogs.callerNumber,
        calleeNumber: callLogs.calleeNumber,
        callerName: callLogs.callerName,
        calleeName: callLogs.calleeName,
        status: callLogs.status,
        duration: callLogs.duration,
        recordingUrl: callLogs.recordingUrl,
        recordingDuration: callLogs.recordingDuration,
        startedAt: callLogs.startedAt,
        endedAt: callLogs.endedAt,
        answerTime: callLogs.answerTime,
        notes: callLogs.notes,
        zoomAccountId: callLogs.zoomAccountId,
        zoomAccountLabel: zoomTokens.accountLabel,
      })
      .from(callLogs)
      .leftJoin(zoomTokens, eq(callLogs.zoomAccountId, zoomTokens.id))
      .where(and(eq(callLogs.customerId, customerId), eq(callLogs.tenantId, tenantId)))
      .orderBy(desc(callLogs.startedAt));
  }

  // Get all call logs for tenant
  async getCallLogsByTenant(tenantId: number, limit?: number): Promise<CallLog[]> {
    const query = db
      .select()
      .from(callLogs)
      .where(eq(callLogs.tenantId, tenantId))
      .orderBy(desc(callLogs.startedAt));

    if (limit) {
      return await query.limit(limit);
    }

    return await query;
  }

  private mapZoomStatusToCrmStatus(zoomStatus: string): string {
    const statusMap: Record<string, string> = {
      'completed': 'completed',
      'missed': 'missed',
      'voicemail': 'voicemail',
      'no_answer': 'no-answer',
      'busy': 'busy',
      'failed': 'failed',
      'canceled': 'missed',
    };
    return statusMap[zoomStatus] || 'completed';
  }

  // Multi-account support methods
  
  // Save token with account label and email
  async saveTokenWithLabel(
    tenantId: number, 
    tokenData: ZoomOAuthResponse, 
    accountLabel: string,
    accountEmail?: string
  ): Promise<ZoomToken> {
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
    
    // Check if this is the first account for this tenant
    const existingAccounts = await this.getAllTokens(tenantId);
    const isPrimary = existingAccounts.length === 0;

    const [created] = await db
      .insert(zoomTokens)
      .values({
        tenantId,
        accountLabel,
        accountEmail,
        isPrimary,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt,
        scope: tokenData.scope,
      })
      .returning();
    
    return created;
  }

  // Get all Zoom accounts for a tenant
  async getAllTokens(tenantId: number): Promise<ZoomToken[]> {
    return await db
      .select()
      .from(zoomTokens)
      .where(eq(zoomTokens.tenantId, tenantId))
      .orderBy(desc(zoomTokens.isPrimary), desc(zoomTokens.createdAt));
  }

  // Get Zoom account by ID
  async getTokenById(accountId: number): Promise<ZoomToken | undefined> {
    const [token] = await db
      .select()
      .from(zoomTokens)
      .where(eq(zoomTokens.id, accountId));
    return token || undefined;
  }

  // Get primary Zoom account for tenant
  async getPrimaryToken(tenantId: number): Promise<ZoomToken | undefined> {
    const [token] = await db
      .select()
      .from(zoomTokens)
      .where(and(eq(zoomTokens.tenantId, tenantId), eq(zoomTokens.isPrimary, true)));
    return token || undefined;
  }

  // Set an account as primary (with tenant validation)
  async setPrimaryAccount(accountId: number, tenantId: number): Promise<ZoomToken> {
    // First verify the account belongs to this tenant
    const account = await this.getTokenById(accountId);
    if (!account || account.tenantId !== tenantId) {
      throw new Error('Account not found or access denied');
    }

    // Unset all accounts as non-primary for this tenant
    await db
      .update(zoomTokens)
      .set({ isPrimary: false })
      .where(eq(zoomTokens.tenantId, tenantId));

    // Then set the specified account as primary
    const [updated] = await db
      .update(zoomTokens)
      .set({ isPrimary: true })
      .where(and(eq(zoomTokens.id, accountId), eq(zoomTokens.tenantId, tenantId)))
      .returning();
    
    return updated;
  }

  // Delete Zoom account by ID (with tenant validation)
  async deleteTokenById(accountId: number, tenantId: number): Promise<void> {
    // Verify the account belongs to this tenant before deleting
    const account = await this.getTokenById(accountId);
    if (!account || account.tenantId !== tenantId) {
      throw new Error('Account not found or access denied');
    }

    await db
      .delete(zoomTokens)
      .where(and(eq(zoomTokens.id, accountId), eq(zoomTokens.tenantId, tenantId)));
  }

  // Refresh access token by account ID
  async refreshAccessTokenById(accountId: number): Promise<ZoomToken | undefined> {
    const token = await this.getTokenById(accountId);
    if (!token) return undefined;

    const response = await fetch('https://zoom.us/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh token: ${response.statusText}`);
    }

    const data: ZoomOAuthResponse = await response.json();
    const expiresAt = new Date(Date.now() + data.expires_in * 1000);

    const [updated] = await db
      .update(zoomTokens)
      .set({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt,
        scope: data.scope,
        updatedAt: new Date(),
      })
      .where(eq(zoomTokens.id, accountId))
      .returning();
    
    return updated;
  }

  // Get valid access token by account ID
  async getValidAccessTokenById(accountId: number): Promise<string | null> {
    const token = await this.getTokenById(accountId);
    if (!token) return null;

    // Check if token is expired or will expire in next 5 minutes
    const now = new Date();
    const expiresAt = new Date(token.expiresAt);
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    if (expiresAt <= fiveMinutesFromNow) {
      // Token expired or will expire soon, refresh it
      const refreshed = await this.refreshAccessTokenById(accountId);
      return refreshed?.accessToken || null;
    }

    return token.accessToken;
  }
}

export const zoomService = new ZoomService();
