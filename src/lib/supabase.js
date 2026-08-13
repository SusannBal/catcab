import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey, {
  // Esta app no usa Realtime → desactivar WebSocket evita conexiones y egress innecesarios
  realtime: { enabled: false },
  auth: { persistSession: true, autoRefreshToken: false },
})
