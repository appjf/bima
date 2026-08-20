-- ==============================================================================
-- DATABASE SCHEMA: ASISTEN OPERATOR SIMBG DPUPR KABUPATEN GARUT
-- Target Database: Supabase (PostgreSQL 15+)
-- Standard: PP No. 16/2021 & UU Cipta Kerja No. 6/2023
-- ==============================================================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USER ACCOUNTS & ROLES TABLE
-- Stores operators, TPA experts, leaders, and auditors
CREATE TABLE IF NOT EXISTS public.user_accounts (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    nip TEXT,
    role TEXT NOT NULL CHECK (role IN ('SUPER_ADMIN', 'OPERATOR_SIMBG', 'TPA_TPT', 'PIMPINAN', 'AUDITOR')),
    position_title TEXT NOT NULL,
    sub_specialty TEXT,
    phone TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
    signature_data_url TEXT,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. APPLICATIONS TABLE (PERMOHONAN PBG & SLF)
-- Core operational table storing building permits, verification iterations, and technical BA
CREATE TABLE IF NOT EXISTS public.applications (
    id TEXT PRIMARY KEY,
    register_number TEXT UNIQUE NOT NULL,
    application_number TEXT,
    submission_date DATE NOT NULL,
    permit_type TEXT DEFAULT 'PBG_BARU' CHECK (permit_type IN ('PBG_BARU', 'SLF_EKSISTING', 'PBG_PERUBAHAN', 'SLF_PERPANJANGAN')),
    status TEXT NOT NULL,
    current_stage TEXT,
    priority TEXT DEFAULT 'NORMAL' CHECK (priority IN ('NORMAL', 'HIGH', 'URGENT')),
    
    -- JSONB Structured Objects for Rich Domain Entities
    applicant JSONB NOT NULL, -- { name, nik, phone, email, address, village, district, city }
    building JSONB NOT NULL,  -- { name, functionType, subFunction, complexity, address, district, village, landArea, buildingArea, floors, height, permanence, existingImbStatus, consultantName }
    documents JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of DocumentItem
    verification_iterations JSONB DEFAULT '[]'::jsonb,
    multi_verifications JSONB DEFAULT '[]'::jsonb,
    undangan_visite JSONB,
    ba_lapangan JSONB,
    consultation_notice JSONB,
    ba_konsultasi JSONB,
    multi_verifikasi_perbaikan JSONB DEFAULT '[]'::jsonb,
    ba_pleno JSONB,
    retribution JSONB,
    schedule JSONB,
    
    -- SLA and Quality Metrics
    sla_days INTEGER DEFAULT 1,
    sla_deadline TIMESTAMPTZ,
    sla_status TEXT DEFAULT 'IN_SLA' CHECK (sla_status IN ('IN_SLA', 'WARNING', 'EXCEEDED')),
    data_quality_score NUMERIC(5,2) DEFAULT 100.00,
    data_errors JSONB DEFAULT '[]'::jsonb,
    assigned_operator TEXT,
    internal_notes TEXT,
    
    -- Archiving System Fields (Pengarsipan Permohonan Selesai / Konsultasi Done)
    is_archived BOOLEAN DEFAULT FALSE,
    archived_at TIMESTAMPTZ,
    archive_notes TEXT,
    archived_by TEXT,
    
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. NOTIFICATION LOGS TABLE (WHATSAPP DISPATCH LOGS)
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id TEXT PRIMARY KEY,
    application_id TEXT REFERENCES public.applications(id) ON DELETE SET NULL,
    register_number TEXT NOT NULL,
    recipient_name TEXT NOT NULL,
    recipient_phone TEXT NOT NULL,
    template_type TEXT NOT NULL,
    message TEXT NOT NULL,
    channel TEXT DEFAULT 'WHATSAPP',
    status TEXT DEFAULT 'SENT' CHECK (status IN ('SENT', 'DELIVERED', 'PENDING', 'FAILED')),
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. STATUS AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.status_audit_logs (
    id TEXT PRIMARY KEY,
    application_id TEXT REFERENCES public.applications(id) ON DELETE CASCADE,
    register_number TEXT NOT NULL,
    from_status TEXT NOT NULL,
    to_status TEXT NOT NULL,
    actor_name TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    stage_name TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PRASARANA PRICES CONFIG TABLE (RETRIBUSI PRASARANA)
CREATE TABLE IF NOT EXISTS public.prasarana_prices (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    unit TEXT NOT NULL,
    price NUMERIC(15, 2) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by TEXT DEFAULT 'Sistem'
);

-- 6. APP SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES FOR PERFORMANCE & FAST RETRIEVAL
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_apps_register_number ON public.applications(register_number);
CREATE INDEX IF NOT EXISTS idx_apps_status ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_apps_is_archived ON public.applications(is_archived);
CREATE INDEX IF NOT EXISTS idx_apps_permit_type ON public.applications(permit_type);
CREATE INDEX IF NOT EXISTS idx_apps_submission_date ON public.applications(submission_date);
CREATE INDEX IF NOT EXISTS idx_notif_app_id ON public.notification_logs(application_id);
CREATE INDEX IF NOT EXISTS idx_notif_created_at ON public.notification_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_app_id ON public.status_audit_logs(application_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.user_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prasarana_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Allow read/write access for authenticated and anonymous API keys for operational app
CREATE POLICY "Allow public read-write for applications" ON public.applications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for user_accounts" ON public.user_accounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for notification_logs" ON public.notification_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for status_audit_logs" ON public.status_audit_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for prasarana_prices" ON public.prasarana_prices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for app_settings" ON public.app_settings FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- INITIAL SEED: PRASARANA PRICES (GARUT REGULATION)
-- ==============================================================================
INSERT INTO public.prasarana_prices (id, label, unit, price, updated_at, updated_by)
VALUES 
  ('PAGAR', 'Pagar / Pembatas Lahan', 'm²', 25000, NOW(), 'Perda Garut 2024'),
  ('PERKERASAN', 'Perkerasan Lapangan / Parkir', 'm²', 35000, NOW(), 'Perda Garut 2024'),
  ('KOLAM', 'Kolam Retensi / IPAL', 'm³', 50000, NOW(), 'Perda Garut 2024'),
  ('MENARA', 'Menara Penampung Air / Rangka', 'm', 75000, NOW(), 'Perda Garut 2024'),
  ('SEPTIC_TANK', 'Biofilter Septic Tank Bersama', 'Unit', 150000, NOW(), 'Perda Garut 2024')
ON CONFLICT (id) DO NOTHING;
