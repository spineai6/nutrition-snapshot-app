import { createClient } from '@supabase/supabase-js';

// Set these in a .env file at the project root:
// VITE_SUPABASE_URL=https://osaoedamapjsiqakkbgo.supabase.co
// VITE_SUPABASE_ANON_KEY=sb_publishable_PO2695AcgQA4QbtmusCflg_a407gFQL
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
