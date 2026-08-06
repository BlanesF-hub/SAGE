import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string) => {
  try {
    return (import.meta as any)?.env?.[key];
  } catch {
    return undefined;
  }
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL') || 'https://fcfuvouajaqrekzokxvn.supabase.co';
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY') || 'sb_publishable_Z_SFQXzCMUXWFUWgb0K65A_1QXlv6Ce';

export const supabase = createClient(supabaseUrl, supabaseKey);
