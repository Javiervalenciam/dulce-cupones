import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { estaVencido } from '@/lib/fechas'
import { normalizarCodigoCupon } from '@/lib/cuponCodigo'

export async function POST(req) {
  const { codigo, detalle, pin } = await req.json()
  if (pin !== process.env.ADMIN_PIN) {
    return NextResponse.json({ ok: false, error: 'PIN invalido' }, { status: 401 })
  }
  const cod = normalizarCodigoCupon(codigo)
  if (!cod) return NextResponse.json({ ok: false, error: 'Codigo invalido.' }, { status: 400 })

  const { data: cupon } = await supabaseAdmin
    .from('cupones')
    .select('estado, vence_en')
    .eq('codigo', cod)
    .maybeSingle()

  if (!cupon) return NextResponse.json({ ok: false, error: 'Cupon inexistente.' }, { status: 404 })
  if (cupon.estado === 'DISPONIBLE') {
    return NextResponse.json(
      { ok: false, error: 'Este cupon aun no fue reclamado por el cliente.' },
      { status: 409 }
    )
  }
  if (cupon.estado === 'REDIMIDO') {
    return NextResponse.json({ ok: false, error: 'Este cupon YA fue entregado.' }, { status: 409 })
  }
  if (cupon.estado === 'ELIMINADO' || cupon.estado === 'ANULADO') {
    return NextResponse.json({ ok: false, error: 'Cupon no valido.' }, { status: 409 })
  }
  if (estaVencido(cupon.vence_en)) {
    return NextResponse.json({ ok: false, error: 'Cupon vencido.' }, { status: 409 })
  }

  const { data, error } = await supabaseAdmin
    .from('cupones')
    .update({
      estado: 'REDIMIDO',
      detalle_entregado: detalle ? String(detalle).slice(0, 120) : null,
      redimido_en: new Date().toISOString(),
    })
    .eq('codigo', cod)
    .eq('estado', 'RECLAMADO')
    .select()

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  if (!data || data.length === 0) {
    return NextResponse.json({ ok: false, error: 'No se pudo marcar como entregado.' }, { status: 409 })
  }
  return NextResponse.json({ ok: true, cupon: data[0] })
}
