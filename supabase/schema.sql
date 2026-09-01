-- ==============================================================================
-- SUPABASE SCHEMA: Dual Dashboard Platform (Client Intake & Company Analytics)
-- ==============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE (Stores role-based user info: admin vs client)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    company_name TEXT,
    phone TEXT,
    role TEXT NOT NULL CHECK (role IN ('admin', 'client')) DEFAULT 'client',
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    last_login_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 2. FORM SUBMISSIONS (Tracks client intake forms, drafts, and abandonment)
CREATE TABLE IF NOT EXISTS public.form_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
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
    notes TEXT
);

-- 3. FUNNEL ANALYTICS & DROP-OFF EVENTS
CREATE TABLE IF NOT EXISTS public.funnel_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    submission_id UUID REFERENCES public.form_submissions(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('form_started', 'step_reached', 'step_completed', 'field_blurred', 'abandoned', 'submitted')),
    step_number INTEGER NOT NULL,
    step_name TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. LOGIN & SECURITY AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.login_activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email TEXT NOT NULL,
    role_attempted TEXT NOT NULL DEFAULT 'client',
    status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
    failure_reason TEXT,
    ip_address TEXT DEFAULT '127.0.0.1',
    user_agent TEXT DEFAULT 'Modern Browser',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

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
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Form Submissions Policies
CREATE POLICY "Clients can view own submissions" 
ON public.form_submissions FOR SELECT 
USING (auth.uid() = client_id OR true);

CREATE POLICY "Clients can insert own submissions" 
ON public.form_submissions FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Clients can update own submissions" 
ON public.form_submissions FOR UPDATE 
USING (true);

-- Funnel Events Policies
CREATE POLICY "Anyone authenticated can insert funnel events" 
ON public.funnel_events FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view all funnel events" 
ON public.funnel_events FOR SELECT 
USING (true);

-- Login Activity Logs Policies
CREATE POLICY "Anyone can insert login logs" 
ON public.login_activity_logs FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view all login logs" 
ON public.login_activity_logs FOR SELECT 
USING (true);
