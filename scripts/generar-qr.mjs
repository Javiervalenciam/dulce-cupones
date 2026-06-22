// Generacion masiva opcional desde tu computadora (crea cupones + PNGs en ./qr).
// Uso:  npm run generar-qr
// Variables opcionales: CANTIDAD, PREFIJO, PROMO, DESCRIPCION, VENCE
import { createClient } from '@supabase/supabase-js'
import QRCode from 'qrcode'
import fs from 'node:fs'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL

const CANTIDAD = Number(process.env.CANTIDAD || 100)
const PREFIJO = process.env.PREFIJO || 'DULCE'
const PROMO = process.env.PROMO || '15% de descuento'
const DESCRIPCION = process.env.DESCRIPCION || 'Valido en tu proxima compra.'
const VENCE = process.env.VENCE || null

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const serial = () =>
  Array.from({ length: 6 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('')

const vistos = new Set()
const filas = []
while (filas.length < CANTIDAD) {
  const codigo = PREFIJO + '-' + serial()
  if (vistos.has(codigo)) continue
  vistos.add(codigo)
  filas.push({
    codigo,
    prefijo: PREFIJO,
    promocion: PROMO,
    descripcion: DESCRIPCION,
    vence_en: VENCE,
    estado: 'DISPONIBLE',
  })
}

const { data, error } = await supabase
  .from('cupones')
  .upsert(filas, { onConflict: 'codigo', ignoreDuplicates: true })
  .select('codigo')

if (error) {
  console.error('Error:', error.message)
  process.exit(1)
}

fs.mkdirSync('./qr', { recursive: true })
for (const { codigo } of data) {
  await QRCode.toFile('./qr/' + codigo + '.png', BASE_URL + '/c/' + codigo, {
    width: 700,
    margin: 2,
  })
}
console.log('Listos ' + data.length + ' cupones y sus QR en ./qr')
