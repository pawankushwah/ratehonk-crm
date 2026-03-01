-- Customer Itinerary Builder tables (new module - no changes to travel_packages)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customer_itineraries') THEN
        CREATE TABLE customer_itineraries (
            id SERIAL PRIMARY KEY,
            tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
            lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL,
            title TEXT NOT NULL DEFAULT 'Untitled Itinerary',
            intro TEXT,
            cover_photo TEXT,
            signature TEXT,
            signature_style TEXT DEFAULT 'cursive',
            client_price DECIMAL(12,2) DEFAULT 0,
            agent_profit DECIMAL(12,2) DEFAULT 0,
            currency TEXT DEFAULT 'INR',
            status TEXT DEFAULT 'draft',
            created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
            updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
            created_at TIMESTAMP DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        );
        CREATE INDEX idx_customer_itineraries_tenant ON customer_itineraries(tenant_id);
        CREATE INDEX idx_customer_itineraries_customer ON customer_itineraries(customer_id);
        RAISE NOTICE 'Table customer_itineraries created';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customer_itinerary_sections') THEN
        CREATE TABLE customer_itinerary_sections (
            id SERIAL PRIMARY KEY,
            itinerary_id INTEGER NOT NULL REFERENCES customer_itineraries(id) ON DELETE CASCADE,
            section_name TEXT NOT NULL,
            section_date DATE,
            display_order INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        );
        CREATE INDEX idx_itinerary_sections_itinerary ON customer_itinerary_sections(itinerary_id);
        RAISE NOTICE 'Table customer_itinerary_sections created';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customer_itinerary_items') THEN
        CREATE TABLE customer_itinerary_items (
            id SERIAL PRIMARY KEY,
            section_id INTEGER NOT NULL REFERENCES customer_itinerary_sections(id) ON DELETE CASCADE,
            item_type TEXT NOT NULL DEFAULT 'activity',
            title TEXT NOT NULL,
            description TEXT,
            details JSONB DEFAULT '{}',
            display_order INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        );
        CREATE INDEX idx_itinerary_items_section ON customer_itinerary_items(section_id);
        RAISE NOTICE 'Table customer_itinerary_items created';
    END IF;
END $$;
