# YOROTA Smart Office - Database & System Guide

Welcome to the **YOROTA Smart Office** administrative management platform database setup and architecture guide. This document details the Supabase PostgreSQL setup script, environment parameters, and clean system architecture overview.

---

## 1. Database Schema DDL (PostgreSQL Script)

Copy and execute the following SQL script inside the **Supabase SQL Editor** to establish the required tables, keys, default UTC timestamps, search optimization indexes, and role-based validation constraints.

```sql
-- =========================================================================
-- YOROTA SMART OFFICE DATABASE SCHEMA
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES (Extends Supabase Auth users to store name and roles metadata)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'officer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to profiles" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow Admin to update profiles" 
ON public.profiles FOR ALL 
TO authenticated 
USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));


-- 2. SERVICES / CATEGORIES (Dynamic category management)
CREATE TABLE public.services (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_services_status ON public.services(status);

-- Enable RLS for Services
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read to active categories" 
ON public.services FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow Admin full write access to categories" 
ON public.services FOR ALL 
TO authenticated 
USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));


-- 3. DAILY RECORDS (Officer work registry)
CREATE TABLE public.daily_records (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    service_id UUID REFERENCES public.services(id) ON DELETE RESTRICT NOT NULL,
    customer_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0), -- Saved price * qty to preserve audit history
    officer_name TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_daily_records_created_at ON public.daily_records(created_at);
CREATE INDEX idx_daily_records_customer_name ON public.daily_records(customer_name);
CREATE INDEX idx_daily_records_phone_number ON public.daily_records(phone_number);
CREATE INDEX idx_daily_records_service_id ON public.daily_records(service_id);

-- Enable RLS for Daily Records
ALTER TABLE public.daily_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated full access to daily records" 
ON public.daily_records FOR ALL 
TO authenticated 
USING (true);


-- 4. TRANSACTIONS (Office Cash Flow Ledger)
CREATE TABLE public.transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    date DATE DEFAULT CURRENT_DATE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    purpose TEXT NOT NULL,
    collected_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_transactions_date ON public.transactions(date);
CREATE INDEX idx_transactions_type ON public.transactions(type);

-- Enable RLS for Transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated full access to transactions" 
ON public.transactions FOR ALL 
TO authenticated 
USING (true);


-- 5. DEBTORS (Outstanding Credit Tracker)
CREATE TABLE public.debtors (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    amount_owed NUMERIC(12, 2) NOT NULL CHECK (amount_owed >= 0),
    due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'paid')),
    payment_history JSONB DEFAULT '[]'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_debtors_status ON public.debtors(status);
CREATE INDEX idx_debtors_customer_name ON public.debtors(customer_name);
CREATE INDEX idx_debtors_phone_number ON public.debtors(phone_number);

-- Enable RLS for Debtors
ALTER TABLE public.debtors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated full access to debtors roster" 
ON public.debtors FOR ALL 
TO authenticated 
USING (true);
```

---

## 2. Environment Variables Configuration

Create a file named `.env` in the root folder of the project (`c:\yorota\.env`) and configure your Supabase Credentials keys:

```ini
# YOROTA Smart Office - Supabase Connection Keys
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-anon-key-here
```

> [!NOTE]
> If these environment keys are empty, missing, or cannot connect, the application's **High-Fidelity Offline Sandbox** engine automatically engages, caching data in your browser's LocalStorage and seed-populating the app with gorgeous mockup records. This allows you to evaluate and test the entire system immediately.

---

## 3. Clean Architecture Overview

This application leverages a layered, modular frontend architecture separated from state-controller bindings:

```
[UI Components & Pages] -> [Unified DB Router (db.js)] -> [Live Supabase API] (Or [Offline Sandbox])
```

### Key Architectural Core Patterns:
1. **Dynamic Category Pricing & Data Integrity**
   To prevent retro-active changes to old records if an Admin changes the price of "Rider Registration" (e.g. from $50.00 to $75.00), the system:
   - Dynamically pulls the active price for new entries from the `services` table.
   - Calculates the product (`price * quantity`) at the exact timestamp of registry.
   - Explicitly locks the calculated `amount` in `daily_records`. Past entries remain at $50.00, and new entries process at $75.00, keeping audits correct.
2. **Cross-Module Relational Triggers**
   - Logging a registration entry automatically creates a credit receipt transaction in the Cash Ledger.
   - Settle outstanding debtor payments dynamically decreases the debtor's balance, marks them paid if remaining balance is $0, and posts a credit transaction in the Ledger.
3. **Government Grade Exporter**
   Leverages custom mathematical vectors and table hooks inside `jspdf` and `jspdf-autotable` to structure prints, adding preparation signatures, official seal stamps, and neat receipt margins.

---

## 4. How to Build & Run Locally

Follow these commands in your console to install packages, run the dev server, and check production compilation:

```bash
# 1. Start the React development server
npm run dev

# 2. Compile and inspect build validity
npm run build

# 3. Preview production bundles
npm run preview
```
