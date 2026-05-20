import { createClient } from '@supabase/supabase-js';

// Server-side client (used in API routes / server components)
// These env vars are only available on the server
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Browser/client-side Supabase client
// Only uses NEXT_PUBLIC_ vars which are exposed to the browser
export const createBrowserClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(url, key);
};
