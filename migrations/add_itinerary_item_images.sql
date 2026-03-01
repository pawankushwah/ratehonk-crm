-- Add images column to itinerary items
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_itinerary_items' AND column_name = 'images') THEN
    ALTER TABLE customer_itinerary_items ADD COLUMN images JSONB DEFAULT '[]'::jsonb;
    RAISE NOTICE 'Added images column to customer_itinerary_items';
  END IF;
END $$;
