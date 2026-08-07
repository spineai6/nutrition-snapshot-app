import { createClient } from '@supabase/supabase-js';

// Set these in Vercel's environment variables:
// VITE_SUPABASE_URL=https://osaoedamapjsiqakkbgo.supabase.co
// VITE_SUPABASE_ANON_KEY=<your anon key>
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
