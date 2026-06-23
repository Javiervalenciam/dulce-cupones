import { createClient } from '@supabase/supabase-js'

// Inicializacion "perezosa": el cliente de Supabase se crea en la PRIMERA
// peticion real (cuando alguien usa la pagina), NO mientras Vercel compila.
// Asi el build nunca falla por las variables de entorno, y en tiempo de
// ejecucion ya estan disponibles. Tambien limpia espacios y barras '/' de mas.
let _client = null

function getClient() {
  if (_client) return _client
  const url = (process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '')
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
  if (!/^https?:\/\//.test(url) || !key) {
    throw new Error(
      'Falta configurar SUPABASE_URL (https://xxxx.supabase.co) y SUPABASE_SERVICE_ROLE_KEY en Vercel.'
    )
  }
  _client = createClient(url, key, { auth: { persistSession: false } })
  return _client
}

// Proxy: permite seguir usando supabaseAdmin.from(...) igual que siempre, pero
// crea el cliente solo cuando se usa de verdad (no durante el build).
export const supabaseAdmin = new Proxy(
  {},
  {
    get(_target, prop) {
      const client = getClient()
      const value = client[prop]
      return typeof value === 'function' ? value.bind(client) : value
    },
  }
)
