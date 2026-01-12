import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

/**
 * Get Google Calendar access token from environment variables
 * Uses GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN from .env
 */
async function getAccessToken(): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  const accessToken = process.env.GOOGLE_ACCESS_TOKEN;

  if (!clientId || !clientSecret) {
    throw new Error('Google Calendar credentials not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file.');
  }

  try {
    const oauth2Client = new OAuth2Client(
      clientId,
      clientSecret,
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback'
    );

    // If we have a refresh token, use it to get a new access token
    if (refreshToken) {
      oauth2Client.setCredentials({
        refresh_token: refreshToken
      });

      const { credentials: newCredentials } = await oauth2Client.refreshAccessToken();
      return newCredentials.access_token || '';
    }

    // If we have an access token, use it directly (for testing)
    if (accessToken) {
      return accessToken;
    }

    throw new Error('Google Calendar access token not available. Please set GOOGLE_REFRESH_TOKEN or GOOGLE_ACCESS_TOKEN in your .env file.');
  } catch (error: any) {
    console.error('Error getting Google Calendar access token:', error);
    throw new Error(`Google Calendar authentication failed: ${error.message}`);
  }
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
// Always call this function again to get a fresh client.
async function getUncachableGoogleCalendarClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

interface GoogleMeetOptions {
  title: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  timezone?: string;
  attendees?: string[];
}

/**
 * Generate a manual Google Meet link (fallback when API is not configured)
 */
export function generateManualGoogleMeetLink(): string {
  // Generate a random meeting code
  const meetingCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 10);
  return `https://meet.google.com/${meetingCode}`;
}

export async function createGoogleMeetLink(options: GoogleMeetOptions): Promise<{
  meetLink: string;
  eventId: string;
  needsConfiguration?: boolean;
}> {
  try {
    // Try to create via Google Calendar API
    const calendar = await getUncachableGoogleCalendarClient();
    
    const event = {
      summary: options.title,
      description: options.description || '',
      start: {
        dateTime: options.startDateTime,
        timeZone: options.timezone || 'UTC',
      },
      end: {
        dateTime: options.endDateTime,
        timeZone: options.timezone || 'UTC',
      },
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
      attendees: options.attendees?.map(email => ({ email })) || [],
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      conferenceDataVersion: 1,
      requestBody: event,
    });

    const meetLink = response.data.hangoutLink || response.data.conferenceData?.entryPoints?.find(
      (entry: any) => entry.entryPointType === 'video'
    )?.uri;

    if (!meetLink) {
      throw new Error('Google Meet link was not generated');
    }

    return {
      meetLink,
      eventId: response.data.id || '',
    };
  } catch (error: any) {
    console.error('Error creating Google Meet link via API:', error);
    
    // If credentials are not configured, generate a manual link
    if (error.message?.includes('credentials not configured') || error.message?.includes('not available')) {
      console.log('⚠️ Google Calendar credentials not configured, generating manual link');
      const manualLink = generateManualGoogleMeetLink();
      
      return {
        meetLink: manualLink,
        eventId: '',
        needsConfiguration: true,
      };
    }
    
    throw new Error(`Failed to create Google Meet link: ${error.message}`);
  }
}
