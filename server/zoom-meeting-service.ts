interface ZoomCredentials {
  accountId: string;
  clientId: string;
  clientSecret: string;
}

interface ZoomMeetingOptions {
  topic: string;
  agenda?: string;
  startTime: string;
  duration: number; // in minutes
  timezone?: string;
}

interface ZoomMeetingResult {
  joinUrl: string;
  meetingId: string;
  password: string;
  startUrl: string;
}

async function getZoomAccessToken(credentials: ZoomCredentials): Promise<string> {
  try {
    const { accountId, clientId, clientSecret } = credentials;

    // Base64 encode credentials
    const base64Credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const tokenUrl = `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`;

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${base64Credentials}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get Zoom access token: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error: any) {
    console.error('Error getting Zoom access token:', error);
    throw new Error(`Zoom authentication failed: ${error.message}`);
  }
}

export async function createZoomMeeting(
  credentials: ZoomCredentials,
  options: ZoomMeetingOptions
): Promise<ZoomMeetingResult> {
  try {
    // Get access token
    const accessToken = await getZoomAccessToken(credentials);

    // Create meeting data
    const meetingData = {
      topic: options.topic,
      type: 2, // Scheduled meeting
      start_time: options.startTime,
      duration: options.duration,
      timezone: options.timezone || 'UTC',
      agenda: options.agenda || '',
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: false,
        mute_upon_entry: true,
        waiting_room: true,
        auto_recording: 'none'
      }
    };

    // Create meeting via Zoom API
    const response = await fetch('https://api.zoom.us/v2/users/me/meetings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(meetingData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create Zoom meeting: ${response.status} ${errorText}`);
    }

    const meeting = await response.json();

    return {
      joinUrl: meeting.join_url,
      meetingId: meeting.id.toString(),
      password: meeting.password || '',
      startUrl: meeting.start_url
    };
  } catch (error: any) {
    console.error('Error creating Zoom meeting:', error);
    throw new Error(`Failed to create Zoom meeting: ${error.message}`);
  }
}
