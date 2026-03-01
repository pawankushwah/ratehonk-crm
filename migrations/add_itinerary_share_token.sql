-- Add share_token for public itinerary URLs
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_itineraries' AND column_name = 'share_token') THEN
    ALTER TABLE customer_itineraries ADD COLUMN share_token TEXT UNIQUE;
    CREATE INDEX IF NOT EXISTS idx_customer_itineraries_share_token ON customer_itineraries(share_token);
    RAISE NOTICE 'Added share_token column to customer_itineraries';
  END IF;
END $$;
