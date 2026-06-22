import { createClient } from '@supabase/supabase-js'

// Cliente con permisos de administrador. SOLO se usa en el servidor (rutas API).
// Nunca importes este archivo en componentes del navegador.
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)
