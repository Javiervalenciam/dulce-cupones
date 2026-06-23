import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { normalizarCodigoCupon } from '@/lib/cuponCodigo'

function pinOk(req) {
  return req.headers.get('x-admin-pin') === process.env.ADMIN_PIN
}

export async function POST(req) {
  if (!pinOk(req)) {
    return NextResponse.json({ ok: false, error: 'PIN invalido' }, { status: 401 })
  }
  try {
    const { codigo } = await req.json()
    const cod = normalizarCodigoCupon(codigo)
    if (!cod) return NextResponse.json({ ok: true, cupon: null })

    const { data, error } = await supabaseAdmin
      .from('cupones')
      .select('*')
      .eq('codigo', cod)
      .maybeSingle()
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, cupon: data })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e && e.message) || 'Error de servidor' },
      { status: 500 }
    )
  }
}
