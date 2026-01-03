-- Create Dummy Campaigns for Tenant support@vanitechnologies.in
-- This script creates sample campaigns to test the campaign system

DO $$
DECLARE
    v_tenant_id INTEGER;
    v_user_id INTEGER;
BEGIN
    -- Find tenant by email domain or company name
    SELECT id INTO v_tenant_id 
    FROM tenants 
    WHERE email LIKE '%vanitechnologies%' 
       OR company_name LIKE '%Vani%'
       OR company_name LIKE '%vani%'
    LIMIT 1;

    -- If tenant not found, try to find by any tenant (for testing)
    IF v_tenant_id IS NULL THEN
        SELECT id INTO v_tenant_id FROM tenants LIMIT 1;
    END IF;

    -- Get first user from tenant
    SELECT id INTO v_user_id 
    FROM users 
    WHERE tenant_id = v_tenant_id 
    LIMIT 1;

    -- If no user found, we'll use NULL for owner_id
    IF v_user_id IS NULL THEN
        v_user_id := NULL;
    END IF;

    RAISE NOTICE 'Creating dummy campaigns for tenant_id: %, user_id: %', v_tenant_id, v_user_id;

    -- Only proceed if we have a tenant
    IF v_tenant_id IS NOT NULL THEN
        -- Campaign 1: Summer Travel Promotion (Draft)
        INSERT INTO email_campaigns (
            tenant_id,
            name,
            subject,
            content,
            type,
            status,
            target_audience,
            channel,
            objective,
            owner_id,
            from_name,
            from_email,
            reply_to,
            recipient_count,
            open_rate,
            click_rate,
            created_at
        ) VALUES (
            v_tenant_id,
            'Summer Travel Promotion 2024',
            'Discover Amazing Summer Destinations - Up to 40% Off!',
            '<html><body>
                <h1>Summer Travel Special</h1>
                <p>Dear {{FirstName}},</p>
                <p>Get ready for an unforgettable summer! We''re offering exclusive discounts on our most popular destinations.</p>
                <ul>
                    <li>Bali Packages - 35% OFF</li>
                    <li>European Tours - 40% OFF</li>
                    <li>Thailand Adventures - 30% OFF</li>
                </ul>
                <p><a href="{{BookingLink}}">Book Now</a></p>
                <p>Best regards,<br>Travel Team</p>
            </body></html>',
            'newsletter',
            'draft',
            'all_customers',
            'email',
            'package_promotion',
            v_user_id,
            'Vani Technologies Travel',
            'noreply@vanitechnologies.in',
            'support@vanitechnologies.in',
            0,
            '0',
            '0',
            NOW() - INTERVAL ''5 days''
        );

        -- Campaign 2: Welcome Email for New Leads (Sent)
        INSERT INTO email_campaigns (
            tenant_id,
            name,
            subject,
            content,
            type,
            status,
            target_audience,
            channel,
            objective,
            owner_id,
            from_name,
            from_email,
            reply_to,
            recipient_count,
            open_rate,
            click_rate,
            sent_at,
            created_at
        ) VALUES (
            v_tenant_id,
            'Welcome New Leads',
            'Welcome to Vani Technologies Travel - Let''s Plan Your Dream Trip!',
            '<html><body>
                <h1>Welcome {{FirstName}}!</h1>
                <p>Thank you for your interest in our travel services. We''re excited to help you plan your perfect getaway.</p>
                <p>Your assigned travel agent, {{AgentName}}, will be in touch shortly to discuss your travel preferences.</p>
                <p>In the meantime, explore our <a href="{{BookingLink}}">popular destinations</a>.</p>
                <p>Happy Travels!<br>Vani Technologies Team</p>
            </body></html>',
            'welcome',
            'sent',
            'new_leads',
            'email',
            'lead_generation',
            v_user_id,
            'Vani Technologies Travel',
            'noreply@vanitechnologies.in',
            'support@vanitechnologies.in',
            150,
            '42.5',
            '12.3',
            NOW() - INTERVAL ''3 days'',
            NOW() - INTERVAL ''4 days''
        );

        -- Campaign 3: Abandoned Inquiry Follow-up (Scheduled)
        INSERT INTO email_campaigns (
            tenant_id,
            name,
            subject,
            content,
            type,
            status,
            target_audience,
            channel,
            objective,
            owner_id,
            from_name,
            from_email,
            reply_to,
            scheduled_at,
            recipient_count,
            open_rate,
            click_rate,
            created_at
        ) VALUES (
            v_tenant_id,
            'Follow-up: Abandoned Inquiries',
            'Still Planning Your Trip? We''re Here to Help!',
            '<html><body>
                <h1>Hi {{FirstName}},</h1>
                <p>We noticed you were interested in {{Destination}} but haven''t completed your inquiry.</p>
                <p>Our travel experts are ready to help you finalize your plans. Here''s what we can offer:</p>
                <ul>
                    <li>Customized itinerary for {{Destination}}</li>
                    <li>Best price guarantee</li>
                    <li>24/7 support during your trip</li>
                </ul>
                <p><a href="{{BookingLink}}">Complete Your Inquiry</a></p>
                <p>Questions? Reply to this email or call us anytime.</p>
                <p>Best regards,<br>{{AgentName}}<br>Vani Technologies Travel</p>
            </body></html>',
            'follow_up',
            'scheduled',
            'new_leads',
            'email',
            'abandoned_inquiry',
            v_user_id,
            'Vani Technologies Travel',
            'noreply@vanitechnologies.in',
            'support@vanitechnologies.in',
            NOW() + INTERVAL ''2 days'',
            75,
            '0',
            '0',
            NOW() - INTERVAL ''1 day''
        );

        -- Campaign 4: Post-Booking Upsell (Active/Sent)
        INSERT INTO email_campaigns (
            tenant_id,
            name,
            subject,
            content,
            type,
            status,
            target_audience,
            channel,
            objective,
            owner_id,
            from_name,
            from_email,
            reply_to,
            recipient_count,
            open_rate,
            click_rate,
            delivered_count,
            sent_at,
            created_at
        ) VALUES (
            v_tenant_id,
            'Post-Booking: Travel Insurance & Add-ons',
            'Enhance Your {{Destination}} Trip with Travel Insurance',
            '<html><body>
                <h1>Protect Your Investment, {{FirstName}}</h1>
                <p>Congratulations on booking your trip to {{Destination}}!</p>
                <p>Before you travel, consider adding:</p>
                <ul>
                    <li><strong>Travel Insurance</strong> - Comprehensive coverage for just ₹{{Price}}</li>
                    <li><strong>Airport Transfers</strong> - Hassle-free arrival</li>
                    <li><strong>Travel Guide</strong> - Local insights and tips</li>
                </ul>
                <p><a href="{{BookingLink}}">Add Services Now</a></p>
                <p>Questions? Contact {{AgentName}} at support@vanitechnologies.in</p>
                <p>Safe Travels!<br>Vani Technologies Team</p>
            </body></html>',
            'newsletter',
            'sent',
            'recent_bookings',
            'email',
            'post_booking_upsell',
            v_user_id,
            'Vani Technologies Travel',
            'noreply@vanitechnologies.in',
            'support@vanitechnologies.in',
            89,
            '58.2',
            '18.7',
            87,
            NOW() - INTERVAL ''2 days'',
            NOW() - INTERVAL ''3 days''
        );

        -- Campaign 5: Seasonal Offer - Diwali Special (Paused)
        INSERT INTO email_campaigns (
            tenant_id,
            name,
            subject,
            content,
            type,
            status,
            target_audience,
            channel,
            objective,
            owner_id,
            from_name,
            from_email,
            reply_to,
            internal_notes,
            recipient_count,
            open_rate,
            click_rate,
            created_at
        ) VALUES (
            v_tenant_id,
            'Diwali Special: Family Travel Packages',
            'Celebrate Diwali with Your Family - Special Travel Packages!',
            '<html><body>
                <h1>Diwali Special Offer</h1>
                <p>Dear {{FirstName}},</p>
                <p>This Diwali, create unforgettable memories with your family!</p>
                <h2>Special Packages:</h2>
                <ul>
                    <li>Goa Family Package - 3N/4D from ₹25,000</li>
                    <li>Kerala Backwaters - 4N/5D from ₹35,000</li>
                    <li>Rajasthan Heritage - 5N/6D from ₹45,000</li>
                </ul>
                <p><strong>Valid until: {{TravelDate}}</strong></p>
                <p><a href="{{BookingLink}}">Book Your Diwali Trip</a></p>
                <p>Wishing you a Happy Diwali!<br>Vani Technologies Travel</p>
            </body></html>',
            'newsletter',
            'paused',
            'all_customers',
            'email',
            'seasonal_offers',
            v_user_id,
            'Vani Technologies Travel',
            'noreply@vanitechnologies.in',
            'support@vanitechnologies.in',
            'Paused for review - waiting for final approval from management',
            0,
            '0',
            '0',
            NOW() - INTERVAL ''7 days''
        );

        -- Campaign 6: Feedback Request (Sent)
        INSERT INTO email_campaigns (
            tenant_id,
            name,
            subject,
            content,
            type,
            status,
            target_audience,
            channel,
            objective,
            owner_id,
            from_name,
            from_email,
            reply_to,
            recipient_count,
            open_rate,
            click_rate,
            reply_count,
            sent_at,
            created_at
        ) VALUES (
            v_tenant_id,
            'Post-Travel Feedback Request',
            'How was your trip to {{Destination}}? We''d love your feedback!',
            '<html><body>
                <h1>Thank You for Traveling with Us!</h1>
                <p>Hi {{FirstName}},</p>
                <p>We hope you had an amazing trip to {{Destination}}!</p>
                <p>Your feedback helps us improve our services. Please take a moment to share your experience:</p>
                <p><a href="{{BookingLink}}">Share Your Feedback</a></p>
                <p>As a thank you, we''re offering 10% off your next booking!</p>
                <p>Thank you for choosing Vani Technologies Travel.</p>
                <p>Best regards,<br>{{AgentName}}<br>Vani Technologies Travel</p>
            </body></html>',
            'follow_up',
            'sent',
            'recent_bookings',
            'email',
            'feedback_reviews',
            v_user_id,
            'Vani Technologies Travel',
            'noreply@vanitechnologies.in',
            'support@vanitechnologies.in',
            120,
            '65.8',
            '22.5',
            15,
            NOW() - INTERVAL ''1 day'',
            NOW() - INTERVAL ''2 days''
        );

        -- Campaign 7: Multi-Channel Campaign (Draft)
        INSERT INTO email_campaigns (
            tenant_id,
            name,
            subject,
            content,
            type,
            status,
            target_audience,
            channel,
            objective,
            owner_id,
            from_name,
            from_email,
            reply_to,
            internal_notes,
            personalization_tokens,
            created_at
        ) VALUES (
            v_tenant_id,
            'New Year Multi-Channel Campaign',
            'Start 2024 with Amazing Travel Adventures!',
            '<html><body>
                <h1>Happy New Year {{FirstName}}!</h1>
                <p>Start the new year with unforgettable travel experiences.</p>
                <p>Special New Year offers on all destinations!</p>
                <p><a href="{{BookingLink}}">Explore Offers</a></p>
            </body></html>',
            'newsletter',
            'draft',
            'all_customers',
            'multi_channel',
            'package_promotion',
            v_user_id,
            'Vani Technologies Travel',
            'noreply@vanitechnologies.in',
            'support@vanitechnologies.in',
            'Multi-channel campaign: Email + SMS + WhatsApp',
            '{"FirstName": true, "Destination": true, "BookingLink": true, "AgentName": true}'::jsonb,
            NOW() - INTERVAL ''10 days''
        );

        RAISE NOTICE 'Successfully created 7 dummy campaigns for tenant_id: %', v_tenant_id;
    ELSE
        RAISE NOTICE 'No tenant found. Please check tenant email or create tenant first.';
    END IF;
END $$;

