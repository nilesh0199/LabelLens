-- ============================================================================
-- LabelLens Supabase Schema Migration: batches & batch_items
-- ============================================================================

-- 1. Batches Table
CREATE TABLE IF NOT EXISTS public.batches (
    batch_id TEXT PRIMARY KEY,
    inspector_id TEXT NOT NULL,
    inspector_name TEXT NOT NULL,
    jurisdiction TEXT NOT NULL,
    store_name TEXT NOT NULL,
    store_location TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'under_review', 'completed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    submitted_at TIMESTAMPTZ
);

-- 2. Batch Items Table (stores photo metadata directly in JSONB photos column)
CREATE TABLE IF NOT EXISTS public.batch_items (
    item_id TEXT PRIMARY KEY,
    batch_id TEXT NOT NULL REFERENCES public.batches(batch_id) ON DELETE CASCADE,
    product_name TEXT NOT NULL DEFAULT 'Unidentified Commodity',
    product_category TEXT NOT NULL DEFAULT 'General',
    photos JSONB NOT NULL DEFAULT '[]'::jsonb,
    compliant BOOLEAN NOT NULL DEFAULT FALSE,
    confidence NUMERIC NOT NULL DEFAULT 0.85,
    declarations_found JSONB NOT NULL DEFAULT '[]'::jsonb,
    declarations_missing JSONB NOT NULL DEFAULT '[]'::jsonb,
    declaration_values JSONB NOT NULL DEFAULT '{}'::jsonb,
    raw_ocr_text TEXT DEFAULT '',
    cleaned_summary TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'draft',
    needs_review BOOLEAN NOT NULL DEFAULT FALSE,
    review_reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    officer_action TEXT,
    officer_remarks TEXT
);

-- 3. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_batches_inspector ON public.batches(inspector_id, status);
CREATE INDEX IF NOT EXISTS idx_batches_status ON public.batches(status);
CREATE INDEX IF NOT EXISTS idx_batch_items_batch_id ON public.batch_items(batch_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_items ENABLE ROW LEVEL SECURITY;

-- 5. Full Access Policies for Service Role & Application Access
DROP POLICY IF EXISTS "Allow all access on batches" ON public.batches;
CREATE POLICY "Allow all access on batches" ON public.batches FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access on batch_items" ON public.batch_items;
CREATE POLICY "Allow all access on batch_items" ON public.batch_items FOR ALL USING (true) WITH CHECK (true);
