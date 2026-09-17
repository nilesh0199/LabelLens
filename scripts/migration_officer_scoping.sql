-- ============================================================================
-- LabelLens Supabase Migration: officer_inspectors & inspectors tables
-- Run this script in the Supabase Dashboard SQL Editor to establish jurisdiction scoping.
-- ============================================================================

-- 1. Create inspectors profile table
CREATE TABLE IF NOT EXISTS public.inspectors (
    inspector_id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    jurisdiction TEXT NOT NULL,
    contact_phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create officer_inspectors join table
CREATE TABLE IF NOT EXISTS public.officer_inspectors (
    id SERIAL PRIMARY KEY,
    officer_id TEXT NOT NULL,
    inspector_id TEXT NOT NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(officer_id, inspector_id)
);

-- 3. Indexes for fast bidirectional lookups
CREATE INDEX IF NOT EXISTS idx_officer_inspectors_officer ON public.officer_inspectors(officer_id);
CREATE INDEX IF NOT EXISTS idx_officer_inspectors_inspector ON public.officer_inspectors(inspector_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.inspectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.officer_inspectors ENABLE ROW LEVEL SECURITY;

-- 5. Full Access Policies for Service Role & Application Backend
DROP POLICY IF EXISTS "Allow all access on inspectors" ON public.inspectors;
CREATE POLICY "Allow all access on inspectors" ON public.inspectors 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access on officer_inspectors" ON public.officer_inspectors;
CREATE POLICY "Allow all access on officer_inspectors" ON public.officer_inspectors 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

-- 6. Seed Inspectors Directory
INSERT INTO public.inspectors (inspector_id, full_name, jurisdiction, contact_phone)
VALUES 
    ('LMO-DL-04', 'Rajesh Kumar', 'Central District, Circle 2, Delhi', '+91 98101 23456'),
    ('LMO-DL-05', 'Priya Sharma', 'West & South West Delhi', '+91 98102 34567'),
    ('INSP-DEL-042', 'Vikas Verma', 'North & North West Delhi', '+91 98103 45678'),
    ('LMO-01', 'Rajesh Kumar (Auth Fallback)', 'Central District, Delhi', '+91 98101 23456'),
    ('LMO-MH-02', 'Sunil Joshi', 'Mumbai Suburban, Zone 4', '+91 98201 12345'),
    ('LMO-MH-03', 'Neha Kulkarni', 'Mumbai Suburban, Zone 5 & 6', '+91 98202 23456')
ON CONFLICT (inspector_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    jurisdiction = EXCLUDED.jurisdiction;

-- 7. Seed Officer-to-Inspector Scoping Mapping
-- Delhi Zone: Dr. S. K. Sharma (AD-CTRL-DL-02 / username: officer)
INSERT INTO public.officer_inspectors (officer_id, inspector_id)
VALUES 
    ('AD-CTRL-DL-02', 'LMO-DL-04'),
    ('AD-CTRL-DL-02', 'LMO-DL-05'),
    ('AD-CTRL-DL-02', 'INSP-DEL-042'),
    ('AD-CTRL-DL-02', 'LMO-01'),
    ('AD-CTRL-DL-02', 'inspector'),
    ('officer', 'LMO-DL-04'),
    ('officer', 'LMO-DL-05'),
    ('officer', 'INSP-DEL-042'),
    ('officer', 'LMO-01'),
    ('officer', 'inspector')
ON CONFLICT (officer_id, inspector_id) DO NOTHING;

-- Mumbai Zone: Smt. Anita Desai (AD-CTRL-MH-01 / username: officer2)
INSERT INTO public.officer_inspectors (officer_id, inspector_id)
VALUES 
    ('AD-CTRL-MH-01', 'LMO-MH-02'),
    ('AD-CTRL-MH-01', 'LMO-MH-03'),
    ('officer2', 'LMO-MH-02'),
    ('officer2', 'LMO-MH-03')
ON CONFLICT (officer_id, inspector_id) DO NOTHING;
