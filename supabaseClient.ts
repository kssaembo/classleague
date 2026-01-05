
import { createClient } from '@supabase/supabase-js';

// These would normally be environment variables
const supabaseUrl = 'https://demxxfkrqzycsnocbzvh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbXh4ZmtycXp5Y3Nub2NienZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1NDEwMjMsImV4cCI6MjA4MzExNzAyM30.LU6HUOszqBcXGfEVs7fDzIaio43-DPcc1ybGE7bmUMk';

// Note: In this environment, we assume the user might need to set these up 
// or the environment provides them. For functionality, we provide dummy initialization
// but real apps need the actual keys.
export const supabase = createClient(
  process.env.SUPABASE_URL || supabaseUrl,
  process.env.SUPABASE_ANON_KEY || supabaseKey
);
