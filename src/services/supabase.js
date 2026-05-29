import { createClient } from '@supabase/supabase-js';

// Retrieve credentials from environment variables with safe static fallbacks
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://yzwhenzafegxshhuxhcn.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6d2hlbnphZmVneHNoaHV4aGNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5Nzc0NjgsImV4cCI6MjA5NTU1MzQ2OH0.S1tw3pVInnDzSUrmFRHohaEBJ9hGMC60Giy9iYs9UOg';

// Safely initialize Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
