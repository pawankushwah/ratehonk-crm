import { google } from 'googleapis';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-calendar',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Google Calendar not connected');
  }
  return accessToken;
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

export async function createGoogleMeetLink(options: GoogleMeetOptions): Promise<{
  meetLink: string;
  eventId: string;
}> {
  try {
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
    console.error('Error creating Google Meet link:', error);
    throw new Error(`Failed to create Google Meet link: ${error.message}`);
  }
}
