import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

function pinOk(req) {
  return req.headers.get('x-admin-pin') === process.env.ADMIN_PIN
}

export async function POST(req) {
  if (!pinOk(req)) {
    return NextResponse.json({ ok: false, error: 'PIN invalido' }, { status: 401 })
  }
  try {
    const { estado, prefijo, q, limit } = await req.json()

    let query = supabaseAdmin
      .from('cupones')
      .select('*')
      .order('creado_en', { ascending: false })
      .limit(Math.min(Number(limit) || 1000, 2000))

    if (estado && estado !== 'TODOS') query = query.eq('estado', estado)
    if (prefijo && prefijo !== 'TODOS') query = query.eq('prefijo', prefijo)

    if (q && q.trim()) {
      const term = `%${q.trim().replace(/,/g, '')}%`
      query = query.or(
        `codigo.ilike.${term},nombre_cliente.ilike.${term},telefono_cliente.ilike.${term}`
      )
    }

    const { data, error } = await query
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, cupones: data })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e && e.message) || 'Error de servidor' },
      { status: 500 }
    )
  }
}
