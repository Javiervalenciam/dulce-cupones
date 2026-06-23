import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

function pinOk(req) {
  return req.headers.get('x-admin-pin') === process.env.ADMIN_PIN
}

const ESTADOS = ['DISPONIBLE', 'RECLAMADO', 'REDIMIDO', 'ANULADO', 'ELIMINADO']

export async function POST(req) {
  if (!pinOk(req)) {
    return NextResponse.json({ ok: false, error: 'PIN invalido' }, { status: 401 })
  }
  try {
    const stats = {}
    let fallo = null
    await Promise.all(
      ESTADOS.map(async (e) => {
        const { count, error } = await supabaseAdmin
          .from('cupones')
          .select('*', { count: 'exact', head: true })
          .eq('estado', e)
        if (error) fallo = error.message
        stats[e] = count || 0
      })
    )
    const { count: total, error: errTotal } = await supabaseAdmin
      .from('cupones')
      .select('*', { count: 'exact', head: true })
    if (errTotal) fallo = errTotal.message
    if (fallo) return NextResponse.json({ ok: false, error: fallo }, { status: 500 })
    return NextResponse.json({ ok: true, stats, total: total || 0 })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e && e.message) || 'Error de servidor' },
      { status: 500 }
    )
  }
}
