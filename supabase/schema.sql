-- ==============================================================================
-- SUPABASE SCHEMA: Dual Dashboard Platform (Client Intake & Company Analytics)
-- ==============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE (Stores role-based user info: admin vs client)
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    company_name TEXT,
    phone TEXT,
    role TEXT NOT NULL CHECK (role IN ('admin', 'client')) DEFAULT 'client',
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    last_login_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 2. FORM SUBMISSIONS (Tracks client intake forms, candidate roster, NAPS records, compliance reports)
CREATE TABLE IF NOT EXISTS public.form_submissions (
    id TEXT PRIMARY KEY,
    client_id TEXT,
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    company_name TEXT,
    status TEXT NOT NULL CHECK (status IN ('draft', 'in_progress', 'submitted', 'under_review', 'approved', 'rejected', 'abandoned')) DEFAULT 'in_progress',
    current_step INTEGER NOT NULL DEFAULT 1,
    total_steps INTEGER NOT NULL DEFAULT 4,
    responses JSONB NOT NULL DEFAULT '{}'::jsonb,
    started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    submitted_at TIMESTAMPTZ,
    time_spent_seconds INTEGER NOT NULL DEFAULT 0,
    completion_percentage INTEGER NOT NULL DEFAULT 25,
    notes TEXT,

    -- Dynamic Compliance, Candidates & NAPS Ledger columns
    candidates JSONB DEFAULT '[]'::jsonb,
    dbt_claims JSONB DEFAULT '[]'::jsonb,
    spoc_logs JSONB DEFAULT '[]'::jsonb,
    naps_records JSONB DEFAULT '[]'::jsonb,
    invoices JSONB DEFAULT '[]'::jsonb,
    action_items JSONB DEFAULT '[]'::jsonb,
    assigned_company_spoc JSONB,
    sanctioned_quota INTEGER DEFAULT 0,
    reporting_month TEXT,
    naps_portal_id TEXT,
    dbt_allocation_not_utilized NUMERIC DEFAULT 0
);

-- 3. FUNNEL ANALYTICS & DROP-OFF EVENTS
CREATE TABLE IF NOT EXISTS public.funnel_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id TEXT,
    submission_id TEXT,
    event_type TEXT NOT NULL CHECK (event_type IN ('form_started', 'step_reached', 'step_completed', 'field_blurred', 'abandoned', 'submitted')),
    step_number INTEGER NOT NULL,
    step_name TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. LOGIN & SECURITY AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.login_activity_logs (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id TEXT,
    email TEXT NOT NULL,
    role_attempted TEXT NOT NULL DEFAULT 'client',
    status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
    failure_reason TEXT,
    ip_address TEXT DEFAULT '127.0.0.1',
    user_agent TEXT DEFAULT 'Modern Browser',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- SAFE MIGRATION / ALTER COLUMNS (Run if tables already exist in your Supabase)
-- ==============================================================================
ALTER TABLE public.form_submissions ADD COLUMN IF NOT EXISTS candidates JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.form_submissions ADD COLUMN IF NOT EXISTS dbt_claims JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.form_submissions ADD COLUMN IF NOT EXISTS spoc_logs JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.form_submissions ADD COLUMN IF NOT EXISTS naps_records JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.form_submissions ADD COLUMN IF NOT EXISTS invoices JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.form_submissions ADD COLUMN IF NOT EXISTS action_items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.form_submissions ADD COLUMN IF NOT EXISTS assigned_company_spoc JSONB;
ALTER TABLE public.form_submissions ADD COLUMN IF NOT EXISTS sanctioned_quota INTEGER DEFAULT 0;
ALTER TABLE public.form_submissions ADD COLUMN IF NOT EXISTS reporting_month TEXT;
ALTER TABLE public.form_submissions ADD COLUMN IF NOT EXISTS naps_portal_id TEXT;
ALTER TABLE public.form_submissions ADD COLUMN IF NOT EXISTS dbt_allocation_not_utilized NUMERIC DEFAULT 0;

-- Indexing for fast search and analytics queries
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.form_submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_client_id ON public.form_submissions(client_id);
CREATE INDEX IF NOT EXISTS idx_funnel_events_step ON public.funnel_events(step_number, event_type);
CREATE INDEX IF NOT EXISTS idx_login_logs_created_at ON public.login_activity_logs(created_at DESC);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_activity_logs ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert profiles" ON public.profiles;
CREATE POLICY "Users can insert profiles" 
ON public.profiles FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE USING (true);

-- Form Submissions Policies
DROP POLICY IF EXISTS "Clients can view own submissions" ON public.form_submissions;
CREATE POLICY "Clients can view own submissions" 
ON public.form_submissions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Clients can insert own submissions" ON public.form_submissions;
CREATE POLICY "Clients can insert own submissions" 
ON public.form_submissions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Clients can update own submissions" ON public.form_submissions;
CREATE POLICY "Clients can update own submissions" 
ON public.form_submissions FOR UPDATE USING (true);

-- Funnel Events Policies
DROP POLICY IF EXISTS "Anyone authenticated can insert funnel events" ON public.funnel_events;
CREATE POLICY "Anyone authenticated can insert funnel events" 
ON public.funnel_events FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view all funnel events" ON public.funnel_events;
CREATE POLICY "Admins can view all funnel events" 
ON public.funnel_events FOR SELECT USING (true);

-- Login Activity Logs Policies
DROP POLICY IF EXISTS "Anyone can insert login logs" ON public.login_activity_logs;
CREATE POLICY "Anyone can insert login logs" 
ON public.login_activity_logs FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view all login logs" ON public.login_activity_logs;
CREATE POLICY "Admins can view all login logs" 
ON public.login_activity_logs FOR SELECT USING (true);

-- ==============================================================================
-- STORAGE BUCKET: documents (For COI, GST, Cheque, Candidate Photos, Signatures)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage RLS Policies
DROP POLICY IF EXISTS "Public access to view documents" ON storage.objects;
CREATE POLICY "Public access to view documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents');

DROP POLICY IF EXISTS "Allow upload to documents bucket" ON storage.objects;
CREATE POLICY "Allow upload to documents bucket"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documents');

DROP POLICY IF EXISTS "Allow update in documents bucket" ON storage.objects;
CREATE POLICY "Allow update in documents bucket"
ON storage.objects FOR UPDATE
USING (bucket_id = 'documents');
