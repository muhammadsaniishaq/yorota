-- =========================================================================
-- YOROTA TRAFFIC MANAGEMENT SYSTEM — DATABASE SETUP
-- Run this ONCE in your Supabase SQL Editor
-- Project: yzwhenzafegxshhuxhcn
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Sequences for human-readable display IDs ──────────────────────────────
CREATE SEQUENCE IF NOT EXISTS incident_display_seq START 1001;
CREATE SEQUENCE IF NOT EXISTS officer_display_seq START 1;

-- =========================================================================
-- TABLE: incidents
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.incidents (
  id            UUID         DEFAULT uuid_generate_v4() PRIMARY KEY,
  incident_id   TEXT         DEFAULT ('INC-' || LPAD(nextval('incident_display_seq')::TEXT, 4, '0')),
  location      TEXT         NOT NULL,
  type          TEXT         NOT NULL CHECK (type IN ('Collision','Over-speeding','DUI','Illegal Parking','Other')),
  severity      TEXT         NOT NULL CHECK (severity IN ('High','Medium','Low')),
  officer_name  TEXT         NOT NULL DEFAULT '',
  status        TEXT         NOT NULL DEFAULT 'Active' CHECK (status IN ('Active','Pending','Resolved')),
  fine          NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes         TEXT         DEFAULT '',
  created_at    TIMESTAMPTZ  DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON public.incidents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_status     ON public.incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_severity   ON public.incidents(severity);
CREATE INDEX IF NOT EXISTS idx_incidents_type       ON public.incidents(type);

ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "incidents_auth_all" ON public.incidents;
CREATE POLICY "incidents_auth_all"
  ON public.incidents FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);

-- =========================================================================
-- TABLE: vehicles
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.vehicles (
  id         UUID    DEFAULT uuid_generate_v4() PRIMARY KEY,
  plate      TEXT    UNIQUE NOT NULL,
  owner      TEXT    NOT NULL,
  make       TEXT    NOT NULL,
  type       TEXT    NOT NULL CHECK (type IN ('Saloon','SUV','Truck','Bus','Motorcycle')),
  color      TEXT    NOT NULL DEFAULT 'Black',
  lga        TEXT    NOT NULL,
  reg_date   DATE    NOT NULL DEFAULT CURRENT_DATE,
  expiry     DATE    NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '1 year'),
  status     TEXT    NOT NULL DEFAULT 'Valid' CHECK (status IN ('Valid','Expired','Suspended')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_vehicles_status ON public.vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_lga    ON public.vehicles(lga);
CREATE INDEX IF NOT EXISTS idx_vehicles_type   ON public.vehicles(type);

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "vehicles_auth_all" ON public.vehicles;
CREATE POLICY "vehicles_auth_all"
  ON public.vehicles FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);

-- =========================================================================
-- TABLE: officers
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.officers (
  id              UUID    DEFAULT uuid_generate_v4() PRIMARY KEY,
  officer_id      TEXT    DEFAULT ('OFF-' || LPAD(nextval('officer_display_seq')::TEXT, 3, '0')),
  name            TEXT    NOT NULL,
  badge           TEXT    UNIQUE NOT NULL,
  rank            TEXT    NOT NULL DEFAULT 'Officer'
                           CHECK (rank IN ('Officer','Senior Officer','Inspector','Superintendent')),
  zone            TEXT    NOT NULL,
  status          TEXT    NOT NULL DEFAULT 'On Duty'
                           CHECK (status IN ('On Duty','Off Duty','On Leave')),
  incidents_count INTEGER NOT NULL DEFAULT 0,
  fines_total     NUMERIC(12,2) NOT NULL DEFAULT 0,
  phone           TEXT    DEFAULT '',
  joined          DATE    NOT NULL DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_officers_status ON public.officers(status);
CREATE INDEX IF NOT EXISTS idx_officers_zone   ON public.officers(zone);

ALTER TABLE public.officers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "officers_auth_all" ON public.officers;
CREATE POLICY "officers_auth_all"
  ON public.officers FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);

-- =========================================================================
-- STEP 2: Create Admin User
-- Go to Supabase Dashboard → Authentication → Users → Add User
-- Email:    admin@yorota.gov.ng
-- Password: Yorota@2024
-- =========================================================================
