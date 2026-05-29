-- =========================================================================
-- YOROTA SMART OFFICE — REPORTING DASHBOARD SQL SETUP
-- Run this ONCE in your Supabase SQL Editor
-- Project: yzwhenzafegxshhuxhcn
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 1. PROFILES TABLE (Extends Supabase Auth users) ──────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'officer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to profiles" ON public.profiles;
CREATE POLICY "Allow public read access to profiles" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (true);

DROP POLICY IF EXISTS "Allow users to insert their own profile" ON public.profiles;
CREATE POLICY "Allow users to insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.profiles;
CREATE POLICY "Allow users to update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Helper function to check if user is admin (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql;

DROP POLICY IF EXISTS "Allow Admin to manage all profiles" ON public.profiles;
CREATE POLICY "Allow Admin to manage all profiles" 
ON public.profiles FOR ALL 
TO authenticated 
USING (public.is_admin(auth.uid()));



-- ── AUTOMATIC PROFILE CREATION TRIGGER ─────────────────────────────────────
-- Automatically inserts a row into public.profiles when a new user signs up.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'role', 'officer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ── 2. SERVICES / CATEGORIES TABLE (Dynamic Categories) ───────────────────
CREATE TABLE IF NOT EXISTS public.services (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_services_status ON public.services(status);

-- Enable RLS for Services
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read to active categories" ON public.services;
CREATE POLICY "Allow authenticated read to active categories" 
ON public.services FOR SELECT 
TO authenticated 
USING (true);

DROP POLICY IF EXISTS "Allow Admin full write access to categories" ON public.services;
CREATE POLICY "Allow Admin full write access to categories" 
ON public.services FOR ALL 
TO authenticated 
USING (public.is_admin(auth.uid()));


-- ── 3. DAILY RECORDS TABLE (Officer Daily Work) ──────────────────────────
CREATE TABLE IF NOT EXISTS public.daily_records (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    service_id UUID REFERENCES public.services(id) ON DELETE RESTRICT NOT NULL,
    customer_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    officer_name TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_daily_records_created_at ON public.daily_records(created_at);
CREATE INDEX IF NOT EXISTS idx_daily_records_customer_name ON public.daily_records(customer_name);
CREATE INDEX IF NOT EXISTS idx_daily_records_phone_number ON public.daily_records(phone_number);
CREATE INDEX IF NOT EXISTS idx_daily_records_service_id ON public.daily_records(service_id);

-- Enable RLS for Daily Records
ALTER TABLE public.daily_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated full access to daily records" ON public.daily_records;
CREATE POLICY "Allow authenticated full access to daily records" 
ON public.daily_records FOR ALL 
TO authenticated 
USING (true);


-- ── 4. TRANSACTIONS TABLE (Office Cash Ledger) ───────────────────────────
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    date DATE DEFAULT CURRENT_DATE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    purpose TEXT NOT NULL,
    collected_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);

-- Enable RLS for Transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated full access to transactions" ON public.transactions;
CREATE POLICY "Allow authenticated full access to transactions" 
ON public.transactions FOR ALL 
TO authenticated 
USING (true);


-- ── 5. DEBTORS TABLE (Outstanding Credit Tracker) ─────────────────────────
CREATE TABLE IF NOT EXISTS public.debtors (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    amount_owed NUMERIC(12, 2) NOT NULL CHECK (amount_owed >= 0),
    due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'paid')),
    payment_history JSONB DEFAULT '[]'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_debtors_status ON public.debtors(status);
CREATE INDEX IF NOT EXISTS idx_debtors_customer_name ON public.debtors(customer_name);
CREATE INDEX IF NOT EXISTS idx_debtors_phone_number ON public.debtors(phone_number);

-- Enable RLS for Debtors
ALTER TABLE public.debtors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated full access to debtors roster" ON public.debtors;
CREATE POLICY "Allow authenticated full access to debtors roster" 
ON public.debtors FOR ALL 
TO authenticated 
USING (true);


-- ── 6. SYNC EXISTING USERS WITH PROFILES ─────────────────────────────
-- In case users signed up before the trigger was created, running this will 
-- safely create their profile records automatically mapping roles.
INSERT INTO public.profiles (id, name, role)
SELECT 
  id, 
  COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1)),
  CASE WHEN email LIKE '%admin%' THEN 'admin' ELSE 'officer' END
FROM auth.users
ON CONFLICT (id) DO NOTHING;

