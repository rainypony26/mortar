import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://dnmphnreetetnsreqars.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRubXBobnJlZXRldG5zcmVxYXJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3ODY0MzUsImV4cCI6MjEwNzM2MjQzNX0.Tao6vvFjbatY_2vDJh9WALCnDS0AdnXVd3iIBQ1G_LQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
