-- ============================================================================
-- LabelLens Migration: Add reviewed_by Audit Column to batch_items
-- ============================================================================
-- Run this in Supabase SQL Editor to support the Senior Reviewing Officer audit trail.

ALTER TABLE public.batch_items 
ADD COLUMN IF NOT EXISTS reviewed_by TEXT;
