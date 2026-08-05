import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fcfuvouajaqrekzokxvn.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_Z_SFQXzCMUXWFUWgb0K65A_1QXlv6Ce';

export const supabase = createClient(supabaseUrl, supabaseKey);
