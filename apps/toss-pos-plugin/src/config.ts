import { createClient } from '@supabase/supabase-js';

export const API_URL = import.meta.env.PLUGIN_API_URL || 'http://localhost:4000/api/v1';
export const SUPABASE_URL = import.meta.env.PLUGIN_SUPABASE_URL || '';
export const SUPABASE_KEY = import.meta.env.PLUGIN_SUPABASE_ANON_KEY || '';
export const POLLING_INTERVAL = 30000;
export const STORE_ID = import.meta.env.PLUGIN_STORE_ID || 'YOUR_STORE_ID';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
