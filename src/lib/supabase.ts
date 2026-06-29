import { createClient } from '@supabase/supabase-js';

// Read environment variables (will fall back to empty strings for compilation, 
// but users will enter their own credentials in .env file)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
