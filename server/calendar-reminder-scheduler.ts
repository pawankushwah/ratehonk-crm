import { sql } from "./db.js";
import { emailService } from "./email-service.js";

interface CalendarEventReminder {
  id: number;
  tenantId: number;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  reminderEmailRecipients?: string[];
  sendReminderEmail: boolean;
  zoomMeetingLink?: string;
  googleMeetLink?: string;
  teamsMeetingLink?: string;
}

/**
 * Send reminder emails for calendar events
 * This function should be called by a scheduler every minute
 */
export async function processCalendarReminders() {
  try {
    const now = new Date();
    const reminderTime = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes from now
    
    console.log(`📧 Processing calendar reminders at ${now.toISOString()}`);
    console.log(`📧 Looking for events starting at ${reminderTime.toISOString()}`);

    // Check if reminder_email_recipients column exists
    const [columnExists] = await sql`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'calendar_events' 
        AND column_name = 'reminder_email_recipients'
      ) as exists
    `;

    if (!columnExists?.exists) {
      console.log("📧 Reminder email column does not exist, skipping reminder processing");
      return;
    }

    // Find events that start in 15 minutes and have reminder emails enabled
    // We check for events starting between now+14 minutes and now+16 minutes to account for scheduler timing
    const startWindow = new Date(reminderTime.getTime() - 60 * 1000); // 1 minute before
    const endWindow = new Date(reminderTime.getTime() + 60 * 1000); // 1 minute after

    // Check if reminder_sent column exists
    const [reminderSentExists] = await sql`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'calendar_events' 
        AND column_name = 'reminder_sent'
      ) as exists
    `;

    let reminderSentFilter = sql``;
    if (reminderSentExists?.exists) {
      reminderSentFilter = sql`AND reminder_sent = false`;
    }

    // Check column names for meeting links (they might be stored differently)
    const [zoomLinkColumn] = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'calendar_events'
      AND column_name IN ('zoom_meeting_link', 'zoomMeetingLink')
      LIMIT 1
    `;

    const events = await sql`
      SELECT 
        id, tenant_id, title, description, start_time, end_time, location,
        reminder_email_recipients, send_reminder_email, attendees,
        attendees as meeting_links_json
      FROM calendar_events
      WHERE 
        send_reminder_email = true
        AND reminder_email_recipients IS NOT NULL
        AND reminder_email_recipients::text != '[]'
        AND start_time >= ${startWindow}
        AND start_time <= ${endWindow}
        ${reminderSentFilter}
    `;

    console.log(`📧 Found ${events.length} events needing reminder emails`);

    for (const event of events) {
      try {
        const recipients = Array.isArray(event.reminder_email_recipients)
          ? event.reminder_email_recipients
          : (typeof event.reminder_email_recipients === 'string'
              ? JSON.parse(event.reminder_email_recipients)
              : []);

        if (!recipients || recipients.length === 0) {
          console.log(`📧 No recipients for event ${event.id}, skipping`);
          continue;
        }

        // Build meeting link section
        let meetingLinksHtml = '';
        if (event.zoom_meeting_link) {
          meetingLinksHtml += `<p><strong>Zoom Meeting:</strong> <a href="${event.zoom_meeting_link}">${event.zoom_meeting_link}</a></p>`;
        }
        if (event.google_meet_link) {
          meetingLinksHtml += `<p><strong>Google Meet:</strong> <a href="${event.google_meet_link}">${event.google_meet_link}</a></p>`;
        }
        if (event.teams_meeting_link) {
          meetingLinksHtml += `<p><strong>Microsoft Teams:</strong> <a href="${event.teams_meeting_link}">${event.teams_meeting_link}</a></p>`;
        }

        // Send email to each recipient
        for (const email of recipients) {
          if (!email || !email.includes('@')) {
            console.log(`📧 Invalid email address: ${email}, skipping`);
            continue;
          }

          const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h2 style="color: #333; margin-top: 0;">📅 Event Reminder</h2>
                <p>Hello,</p>
                <p>This is a reminder that you have an event starting in 15 minutes:</p>
              </div>

              <div style="background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 10px 0;">
                      <strong>Event:</strong> ${event.title}
                    </td>
                  </tr>
                  ${event.description ? `
                  <tr>
                    <td style="padding: 10px 0;">
                      <strong>Description:</strong><br>
                      <div style="margin-top: 5px; color: #666;">${event.description}</div>
                    </td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 10px 0;">
                      <strong>Start Time:</strong> ${new Date(event.start_time).toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0;">
                      <strong>End Time:</strong> ${new Date(event.end_time).toLocaleString()}
                    </td>
                  </tr>
                  ${event.location ? `
                  <tr>
                    <td style="padding: 10px 0;">
                      <strong>Location:</strong> ${event.location}
                    </td>
                  </tr>
                  ` : ''}
                  ${meetingLinksHtml ? `
                  <tr>
                    <td style="padding: 10px 0;">
                      <strong>Meeting Links:</strong><br>
                      ${meetingLinksHtml}
                    </td>
                  </tr>
                  ` : ''}
                </table>
              </div>

              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 12px;">
                <p>This is an automated reminder from RateHonk CRM.</p>
              </div>
            </body>
            </html>
          `;

          const emailSent = await emailService.sendEmail({
            to: email,
            subject: `Event Reminder: ${event.title}`,
            html: emailHtml,
            tenantId: event.tenant_id,
          });

          if (emailSent) {
            console.log(`✅ Reminder email sent to ${email} for event ${event.id}`);
          } else {
            console.error(`❌ Failed to send reminder email to ${email} for event ${event.id}`);
          }
        }

        // Mark reminder as sent (if column exists)
        if (reminderSentExists?.exists) {
          await sql`
            UPDATE calendar_events
            SET reminder_sent = true
            WHERE id = ${event.id}
          `;
        }

        console.log(`✅ Reminder emails processed for event ${event.id}`);
      } catch (error: any) {
        console.error(`❌ Error processing reminder for event ${event.id}:`, error.message);
      }
    }

    console.log(`✅ Calendar reminder processing completed`);
  } catch (error: any) {
    console.error("❌ Error in processCalendarReminders:", error);
  }
}
