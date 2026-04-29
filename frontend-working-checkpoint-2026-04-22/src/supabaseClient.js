import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://veqfyjrxkcwauuscncpd.supabase.co";
const supabaseAnonKey = "sb_publishable_8sKLGgLa5ZsHcYVzdzIKuw_z9D8Rfov";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});