import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { estaVencido } from '@/lib/fechas'

export async function POST(req) {
  const { codigo, nombre, telefono } = await req.json()
  if (!codigo || !nombre || !telefono) {
    return NextResponse.json({ ok: false, error: 'Faltan datos' }, { status: 400 })
  }
  const cod = String(codigo).trim().toUpperCase()

  const { data: cupon } = await supabaseAdmin
    .from('cupones')
    .select('estado, vence_en')
    .eq('codigo', cod)
    .maybeSingle()

  if (!cupon || cupon.estado === 'ELIMINADO') {
    return NextResponse.json({ ok: false, error: 'Este cupon no existe.' }, { status: 404 })
  }
  if (cupon.estado === 'ANULADO') {
    return NextResponse.json({ ok: false, error: 'Cupon no valido.' }, { status: 409 })
  }
  if (estaVencido(cupon.vence_en)) {
    return NextResponse.json({ ok: false, error: 'Este cupon esta vencido.' }, { status: 409 })
  }

  // Update atomico: solo cambia si AUN esta DISPONIBLE.
  const { data, error } = await supabaseAdmin
    .from('cupones')
    .update({
      estado: 'RECLAMADO',
      nombre_cliente: String(nombre).slice(0, 80),
      telefono_cliente: String(telefono).slice(0, 30),
      escaneado_en: new Date().toISOString(),
    })
    .eq('codigo', cod)
    .eq('estado', 'DISPONIBLE')
    .select()

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  if (!data || data.length === 0) {
    return NextResponse.json({ ok: false, error: 'Este cupon ya fue usado.' }, { status: 409 })
  }
  return NextResponse.json({ ok: true, cupon: data[0] })
}
