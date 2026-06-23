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
    const { codigos, modo } = await req.json()
    if (!Array.isArray(codigos) || codigos.length === 0) {
      return NextResponse.json({ ok: false, error: 'Sin codigos' }, { status: 400 })
    }

    if (modo === 'hard') {
      const { error } = await supabaseAdmin.from('cupones').delete().in('codigo', codigos)
      if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true, afectados: codigos.length })
    }

    if (modo === 'restore') {
      const { data, error } = await supabaseAdmin
        .from('cupones')
        .update({ estado: 'DISPONIBLE', eliminado_en: null })
        .in('codigo', codigos)
        .select('codigo')
      if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true, afectados: data.length })
    }

    // soft delete por defecto
    const { data, error } = await supabaseAdmin
      .from('cupones')
      .update({ estado: 'ELIMINADO', eliminado_en: new Date().toISOString() })
      .in('codigo', codigos)
      .select('codigo')
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, afectados: data.length })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e && e.message) || 'Error de servidor' },
      { status: 500 }
    )
  }
}
