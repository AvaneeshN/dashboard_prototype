import { createBrowserClient } from '@supabase/ssr';

const LIVE_SUPABASE_URL = 'https://budhnvdyzrmoubuwjonc.supabase.co';
const LIVE_SUPABASE_KEY = 'sb_publishable_bP73jhmdP0sMFLczy7HLbQ_Zk1G2TOR';

export const isSupabaseConfigured = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || LIVE_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || (process.env as any).NEXT_PUBLIC_SUPABASE_ANC || LIVE_SUPABASE_KEY;
  return Boolean(url && key && !url.includes('your-project') && !key.includes('your-anon-key'));
};

export const createClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || LIVE_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || (process.env as any).NEXT_PUBLIC_SUPABASE_ANC || LIVE_SUPABASE_KEY;
  
  return createBrowserClient(url, key);
};
