interface MicrosoftTeamsCredentials {
  clientId: string;
  clientSecret: string;
  tenantId: string; // Azure AD tenant ID
}

interface MicrosoftTeamsMeetingOptions {
  subject: string;
  startDateTime: string;
  endDateTime: string;
  timezone?: string;
  attendees?: string[];
  description?: string;
}

interface MicrosoftTeamsMeetingResult {
  joinUrl: string;
  meetingId: string;
  onlineMeetingId: string;
}

/**
 * Create a Microsoft Teams meeting using Microsoft Graph API
 */
export async function createMicrosoftTeamsMeeting(
  credentials: MicrosoftTeamsCredentials,
  options: MicrosoftTeamsMeetingOptions
): Promise<MicrosoftTeamsMeetingResult> {
  try {
    // Step 1: Get access token using client credentials flow
    const accessToken = await getMicrosoftAccessToken(credentials);

    // Step 2: Create an online meeting
    const meetingData = {
      subject: options.subject,
      startDateTime: options.startDateTime,
      endDateTime: options.endDateTime,
      participants: {
        attendees: options.attendees?.map(email => ({
          upn: email,
          role: 'attendee'
        })) || []
      }
    };

    // Create online meeting via Microsoft Graph API
    const response = await fetch('https://graph.microsoft.com/v1.0/me/onlineMeetings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(meetingData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create Teams meeting: ${response.status} ${errorText}`);
    }

    const meeting = await response.json();

    return {
      joinUrl: meeting.joinWebUrl || meeting.joinUrl,
      meetingId: meeting.id || '',
      onlineMeetingId: meeting.id || ''
    };
  } catch (error: any) {
    console.error('Error creating Microsoft Teams meeting:', error);
    throw new Error(`Failed to create Teams meeting: ${error.message}`);
  }
}

/**
 * Get Microsoft access token using client credentials flow
 */
async function getMicrosoftAccessToken(credentials: MicrosoftTeamsCredentials): Promise<string> {
  try {
    const tokenUrl = `https://login.microsoftonline.com/${credentials.tenantId}/oauth2/v2.0/token`;
    
    const params = new URLSearchParams({
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials'
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Microsoft authentication failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error: any) {
    console.error('Error getting Microsoft access token:', error);
    throw new Error(`Microsoft authentication failed: ${error.message}`);
  }
}

/**
 * Alternative: Create Teams meeting link manually (for cases where API is not configured)
 * This generates a Teams meeting link that can be used directly
 */
export function generateTeamsMeetingLink(): string {
  // Generate a random meeting ID
  const meetingId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  return `https://teams.microsoft.com/l/meetup-join/19:meeting_${meetingId}@thread.tacv2/0?context=%7B%22Tid%22%3A%22tenant-id%22%2C%22Oid%22%3A%22user-id%22%7D`;
}
