-- Add images column to itinerary sections
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_itinerary_sections' AND column_name = 'images') THEN
    ALTER TABLE customer_itinerary_sections ADD COLUMN images JSONB DEFAULT '[]'::jsonb;
    RAISE NOTICE 'Added images column to customer_itinerary_sections';
  END IF;
END $$;
