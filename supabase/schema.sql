-- Collaborative Investigative Intelligence Platform (PS #16)
-- Schema Definition for Supabase Postgres

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUM TYPES
DO $$ BEGIN
    CREATE TYPE doc_file_type AS ENUM ('text', 'image', 'audio', 'video');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE doc_status AS ENUM ('uploaded', 'processing', 'processed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE timestamp_confidence AS ENUM ('exact', 'approximate', 'inferred');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE entity_type AS ENUM ('person', 'vehicle', 'location', 'weapon', 'object', 'organization');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE relationship_status AS ENUM ('ai_suggested', 'confirmed', 'dismissed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE contradiction_type AS ENUM ('temporal', 'spatial', 'factual');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE contradiction_status AS ENUM ('flagged', 'reviewed', 'dismissed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE connection_request_status AS ENUM ('pending', 'accepted', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. TABLES

-- cases
CREATE TABLE IF NOT EXISTS cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    filing_agency_id UUID REFERENCES agencies(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- agencies
CREATE TABLE IF NOT EXISTS agencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE
);

-- documents
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    uploaded_by TEXT NOT NULL,
    title TEXT NOT NULL,
    file_type doc_file_type NOT NULL,
    storage_path TEXT,
    content_text TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    status doc_status DEFAULT 'uploaded',
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- events
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    event_timestamp TIMESTAMPTZ,
    event_timestamp_confidence timestamp_confidence DEFAULT 'approximate',
    location_text TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    source_offset TEXT NOT NULL, -- line/page (text), mm:ss (audio/video), bbox (image)
    confidence NUMERIC(4, 3) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- entities
CREATE TABLE IF NOT EXISTS entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    agency_id UUID REFERENCES agencies(id) ON DELETE SET NULL,
    type entity_type NOT NULL,
    name TEXT NOT NULL,
    attributes JSONB DEFAULT '{}'::jsonb,
    first_seen_at TIMESTAMPTZ DEFAULT NOW()
);

-- entity_mentions
CREATE TABLE IF NOT EXISTS entity_mentions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    source_snippet TEXT NOT NULL,
    source_offset TEXT NOT NULL,
    confidence NUMERIC(4, 3) NOT NULL CHECK (confidence >= 0 AND confidence <= 1)
);

-- relationships
CREATE TABLE IF NOT EXISTS relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    source_entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    target_entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    relationship_type TEXT NOT NULL,
    description TEXT NOT NULL,
    confidence NUMERIC(4, 3) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    status relationship_status DEFAULT 'ai_suggested',
    source_document_ids UUID[] DEFAULT ARRAY[]::UUID[],
    explanation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- contradictions
CREATE TABLE IF NOT EXISTS contradictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    event_a_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    event_b_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    type contradiction_type NOT NULL,
    description TEXT NOT NULL,
    status contradiction_status DEFAULT 'flagged',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- connection_requests  (cross-agency case access control)
CREATE TABLE IF NOT EXISTS connection_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    requesting_agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    target_agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    case_brief_snapshot TEXT,
    status connection_request_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    responded_at TIMESTAMPTZ
);

-- 4. INDEXES
CREATE INDEX IF NOT EXISTS idx_documents_case ON documents(case_id);
CREATE INDEX IF NOT EXISTS idx_events_case ON events(case_id);
CREATE INDEX IF NOT EXISTS idx_entities_case ON entities(case_id);
CREATE INDEX IF NOT EXISTS idx_relationships_case ON relationships(case_id);
CREATE INDEX IF NOT EXISTS idx_contradictions_case ON contradictions(case_id);
CREATE INDEX IF NOT EXISTS idx_connection_requests_case ON connection_requests(case_id);
CREATE INDEX IF NOT EXISTS idx_connection_requests_target ON connection_requests(target_agency_id, status);

-- 5. REALTIME PUBLICATION ENABLEMENT
-- Wrapped in DO blocks so re-running the schema doesn't fail with duplicate errors
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE events; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE relationships; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE contradictions; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE documents; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE entities; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE connection_requests; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 6. ROW LEVEL SECURITY (stubs — enforce in production)
-- An agency may view a case if:
--   (a) it is the filing agency, OR
--   (b) there is an accepted connection_request with their agency_id
-- ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Agency case access" ON cases USING ( ... );
