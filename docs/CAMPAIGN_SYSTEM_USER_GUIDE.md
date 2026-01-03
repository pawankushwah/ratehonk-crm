# Campaign System - How It Works

## Overview

The Campaign System is a comprehensive multi-channel marketing tool that allows you to create, manage, and track email, SMS, and WhatsApp campaigns for your travel business.

## Complete Workflow

### 1. Creating a Campaign

#### Step 1: Click "Create Campaign"
- Navigate to `http://localhost:5000/email-campaigns`
- Click the **"Create Campaign"** button (purple gradient button)

#### Step 2: Campaign Builder Tabs

The Campaign Builder has 5 tabs:

##### **Tab 1: Setup**
- **Campaign Name**: Give your campaign a descriptive name (e.g., "Summer Travel Promotion 2024")
- **Channel**: Choose how to send
  - Email
  - SMS
  - WhatsApp
  - Multi-Channel (all three)
- **Campaign Objective**: Select the goal
  - Lead Generation
  - Package Promotion
  - Seasonal Offers
  - Abandoned Inquiry Follow-up
  - Post-Booking Upsell
  - Feedback/Reviews
- **From Name/Email**: Set sender information (Email campaigns)
- **Reply-To**: Where replies should go
- **Internal Notes**: Private notes for your team

##### **Tab 2: Content**
- **Email Subject**: Subject line (for email campaigns)
- **Message Content**: Write your campaign message
  - Supports HTML
  - Preview mode available
- **Personalization Tokens**: Click to insert dynamic content
  - `{{FirstName}}` - Recipient's first name
  - `{{LastName}}` - Recipient's last name
  - `{{Destination}}` - Preferred destination
  - `{{TravelDate}}` - Travel date
  - `{{AgentName}}` - Assigned agent
  - `{{BookingLink}}` - Direct booking link
  - And more...

##### **Tab 3: Audience**
- **Audience Selection**: Choose who receives the campaign
  - Manual Selection
  - All Customers
  - New Leads
  - Recent Bookings
  - Newsletter Subscribers
  - Custom Segments (from Audience Segments page)
- **Estimated Recipients**: Shows how many people will receive it

##### **Tab 4: Schedule**
- **Send Time**: Choose when to send
  - Send Immediately
  - Schedule for Later
- **Schedule Date & Time**: Pick specific date/time (if scheduled)
- **Timezone**: Select timezone for scheduling

##### **Tab 5: Settings**
- **Template**: Choose from saved templates (optional)
- Additional advanced settings

#### Step 3: Save or Send
- **Save Draft**: Saves campaign without sending (status: "draft")
- **Send Now**: Immediately sends the campaign (status: "sent")
- **Schedule**: If scheduled, sets status to "scheduled"

### 2. Managing Campaigns

#### Campaign List View
The campaigns table shows:
- Campaign name
- Subject line
- Type (welcome, newsletter, follow_up, etc.)
- Status (draft, scheduled, sent, paused)
- Recipients count
- Open rate
- Click rate
- Created date
- Actions menu (three dots)

#### Actions Menu Options

Click the **three dots (⋯)** on any campaign to see options:

##### **1. Preview**
- Opens a preview dialog
- Shows how the email will look to recipients
- Displays From/To/Subject headers
- Renders HTML content

##### **2. Edit**
- Opens the Campaign Builder with existing data
- Modify any aspect of the campaign
- Works for draft and scheduled campaigns
- **Note**: Sent campaigns can't be edited (only viewed)

##### **3. Send Now**
- Only visible for **draft** campaigns
- Immediately sends the campaign
- Updates status to "sent"
- Generates recipient list and sends emails

##### **4. Duplicate**
- Creates an exact copy of the campaign
- New campaign name: "[Original Name] (Copy)"
- Status set to "draft"
- Useful for creating variations

##### **5. Analytics**
- Opens analytics dashboard
- Shows:
  - Recipients count
  - Open rate percentage
  - Click rate percentage
  - Campaign status
  - Created/Sent/Scheduled dates
  - Performance chart (coming soon)

##### **6. Delete**
- Removes the campaign permanently
- Shows confirmation toast
- **Warning**: Cannot be undone

### 3. Campaign Statuses

#### Draft
- Campaign is created but not sent
- Can be edited, scheduled, or sent
- No recipients yet

#### Scheduled
- Campaign is set to send at a future date/time
- Can be edited or cancelled
- Will automatically send at scheduled time

#### Sent
- Campaign has been sent to recipients
- Shows delivery metrics
- Cannot be edited (only viewed/duplicated)

#### Paused
- Campaign is temporarily stopped
- Can be resumed later
- Useful for seasonal campaigns

### 4. Campaign Types

#### Welcome Email
- Sent to new leads/customers
- Objective: Lead Generation
- Introduces your services

#### Newsletter
- Regular updates and promotions
- Objective: Package Promotion, Seasonal Offers
- Keeps customers engaged

#### Booking Confirmation
- Sent after booking is made
- Confirms travel details
- Objective: Customer Service

#### Follow Up
- Reminder emails
- Objective: Abandoned Inquiry, Feedback/Reviews
- Re-engages inactive leads

### 5. Personalization

#### How Personalization Works

When you use tokens like `{{FirstName}}`, the system automatically replaces them with actual data:

**Example:**
```
Template: "Hi {{FirstName}}, welcome to {{CompanyName}}!"
```

**Becomes:**
```
"Hi John, welcome to Vani Technologies Travel!"
```

#### Available Tokens
- `{{FirstName}}` - Customer's first name
- `{{LastName}}` - Customer's last name
- `{{Email}}` - Customer's email
- `{{Destination}}` - Preferred travel destination
- `{{TravelDate}}` - Upcoming travel date
- `{{AgentName}}` - Assigned travel agent
- `{{BookingLink}}` - Direct link to booking page
- `{{CompanyName}}` - Your company name
- `{{PackageName}}` - Package name
- `{{Price}}` - Package price

### 6. Audience Selection

#### Pre-defined Audiences
- **All Customers**: Everyone in your database
- **New Leads**: Recently created leads
- **Recent Bookings**: Customers who booked recently
- **Newsletter Subscribers**: Opted-in subscribers

#### Custom Segments
- Create advanced segments at `/email-segments`
- Filter by:
  - Travel interest
  - Destination preference
  - Budget range
  - Last activity date
  - Booking status
  - Geography
  - Engagement history

### 7. Scheduling

#### Immediate Send
- Campaign sends right away
- Status: "sent"
- Best for time-sensitive promotions

#### Scheduled Send
- Set specific date and time
- Status: "scheduled"
- System automatically sends at scheduled time
- Timezone-aware (respects selected timezone)

### 8. Analytics & Tracking

#### Key Metrics

**Recipients**
- Total number of people who received the campaign

**Open Rate**
- Percentage of recipients who opened the email
- Formula: (Opens / Recipients) × 100
- Industry average: 20-25%

**Click Rate**
- Percentage who clicked links in the email
- Formula: (Clicks / Recipients) × 100
- Industry average: 2-5%

**Reply Rate**
- Percentage who replied to the email
- Shows engagement level

#### Viewing Analytics
1. Click **three dots (⋯)** on any campaign
2. Select **"Analytics"**
3. View detailed metrics and performance

### 9. Campaign Lifecycle

```
Create Campaign
    ↓
[Draft] → Edit → Save Draft
    ↓
Schedule OR Send Now
    ↓
[Scheduled] → Auto-send at scheduled time
    ↓
[Sent] → Track metrics → View Analytics
    ↓
(Optional) Duplicate for new campaign
```

### 10. Best Practices

#### Campaign Naming
- Use descriptive names: "Summer 2024 Promotion"
- Include date/season: "Diwali Special 2024"
- Add objective: "Welcome New Leads - Q1 2024"

#### Subject Lines
- Keep under 50 characters
- Be specific: "40% Off Bali Packages This Summer"
- Create urgency: "Limited Time: Book by Friday"
- Personalize: "{{FirstName}}, Your Dream Trip Awaits"

#### Content
- Use personalization tokens
- Include clear call-to-action (CTA)
- Add booking links
- Keep mobile-friendly

#### Timing
- Schedule for best engagement times
- Consider timezone of recipients
- Avoid weekends for business campaigns
- Send travel promotions on weekdays

#### Audience
- Start with smaller segments to test
- Use custom segments for targeted campaigns
- Exclude opted-out contacts
- Respect DND (Do Not Disturb) lists

## Example Campaign Workflow

### Scenario: Summer Travel Promotion

1. **Create Campaign**
   - Name: "Summer Travel Promotion 2024"
   - Channel: Email
   - Objective: Package Promotion

2. **Content**
   - Subject: "Discover Amazing Summer Destinations - Up to 40% Off!"
   - Message: "Hi {{FirstName}}, Get ready for summer! We're offering exclusive discounts..."
   - Add personalization tokens

3. **Audience**
   - Select: "All Customers"
   - Estimated: 1,234 contacts

4. **Schedule**
   - Choose: "Schedule for Later"
   - Date: Tomorrow, 10:00 AM
   - Timezone: Asia/Kolkata

5. **Save**
   - Click "Schedule" button
   - Campaign status: "scheduled"

6. **Monitor**
   - Campaign automatically sends tomorrow at 10 AM
   - Status changes to "sent"
   - View analytics to see open/click rates

7. **Optimize**
   - If good results, duplicate campaign
   - Modify for next promotion
   - Create variations for different segments

## Troubleshooting

### Campaign Not Sending
- Check email settings (SMTP configuration)
- Verify recipient list is not empty
- Check campaign status (should be "sent" or "scheduled")
- Review error logs

### Low Open Rates
- Improve subject lines
- Send at better times
- Clean email list (remove inactive contacts)
- Segment audience better

### Personalization Not Working
- Ensure tokens are spelled correctly: `{{FirstName}}` not `{FirstName}`
- Check that recipient data exists in database
- Verify token syntax matches exactly

### Can't Edit Campaign
- Only draft and scheduled campaigns can be edited
- Sent campaigns are locked (view-only)
- Duplicate sent campaigns to create new versions

## Next Steps

1. **Create Your First Campaign**
   - Start with a simple welcome email
   - Test with a small audience
   - Review analytics

2. **Build Segments**
   - Go to `/email-segments`
   - Create targeted audience groups
   - Use segments in campaigns

3. **Set Up Templates**
   - Create reusable email templates
   - Save time on future campaigns
   - Maintain brand consistency

4. **Schedule Regular Campaigns**
   - Set up monthly newsletters
   - Schedule seasonal promotions
   - Automate follow-ups

5. **Analyze Performance**
   - Review analytics regularly
   - Identify best-performing campaigns
   - Optimize based on data

## Support

For issues or questions:
- Check campaign status and logs
- Review email settings configuration
- Verify recipient data is correct
- Contact support if needed

