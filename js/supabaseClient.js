// Maakt één gedeelde Supabase-client op basis van js/config.js
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
