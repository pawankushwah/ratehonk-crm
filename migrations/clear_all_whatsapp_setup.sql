-- Clear all tenant WhatsApp setup (config, devices, messages)
-- Use this when reconnecting with a different API panel
-- Run: psql $DATABASE_URL -f migrations/clear_all_whatsapp_setup.sql

-- Delete in order due to foreign key constraints
DELETE FROM whatsapp_messages;
DELETE FROM whatsapp_devices;
DELETE FROM whatsapp_config;
