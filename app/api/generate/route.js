import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { nuevoCodigo, PREFIJOS } from '@/lib/codes'

function pinOk(req) {
  return req.headers.get('x-admin-pin') === process.env.ADMIN_PIN
}

export async function POST(req) {
  if (!pinOk(req)) {
    return NextResponse.json({ ok: false, error: 'PIN invalido' }, { status: 401 })
  }
  const body = await req.json()
  let { cantidad, prefijo, promocion, descripcion, vence_en } = body

  cantidad = Math.max(0, Math.min(Number(cantidad) || 0, 100))
  if (cantidad === 0) return NextResponse.json({ ok: true, creados: 0, codigos: [] })
  if (!PREFIJOS.includes(prefijo)) prefijo = 'DULCE'

  const vistos = new Set()
  const filas = []
  while (filas.length < cantidad) {
    const codigo = nuevoCodigo(prefijo)
    if (vistos.has(codigo)) continue
    vistos.add(codigo)
    filas.push({
      codigo,
      prefijo,
      promocion: promocion || null,
      descripcion: descripcion || null,
      vence_en: vence_en || null,
      estado: 'DISPONIBLE',
    })
  }

  // ignoreDuplicates evita colisiones con seriales ya existentes.
  const { data, error } = await supabaseAdmin
    .from('cupones')
    .upsert(filas, { onConflict: 'codigo', ignoreDuplicates: true })
    .select('codigo')

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, creados: data.length, codigos: data.map((d) => d.codigo) })
}
