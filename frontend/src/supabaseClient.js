import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.REACT_APP_SUPABASE_URL ||
  "https://veqfyjrxkcwauuscncpd.supabase.co";
const supabaseAnonKey =
  process.env.REACT_APP_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_8sKLGgLa5ZsHcYVzdzIKuw_z9D8Rfov";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});