import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Database types for better TypeScript support - Updated for new table structure
interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          full_name: string;
          email_address: string;
          is_active: boolean;
          profile_created_at: string;
          profile_updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          email_address: string;
          is_active?: boolean;
          profile_created_at?: string;
          profile_updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email_address?: string;
          is_active?: boolean;
          profile_created_at?: string;
          profile_updated_at?: string;
        };
      };
    };
  };
}