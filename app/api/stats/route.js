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

  const stats = {}
  await Promise.all(
    ESTADOS.map(async (e) => {
      const { count } = await supabaseAdmin
        .from('cupones')
        .select('*', { count: 'exact', head: true })
        .eq('estado', e)
      stats[e] = count || 0
    })
  )
  const { count: total } = await supabaseAdmin
    .from('cupones')
    .select('*', { count: 'exact', head: true })

  return NextResponse.json({ ok: true, stats, total: total || 0 })
}
