import { NextResponse } from 'next/server'

// Ingreso al panel SOLO valida el PIN. No toca la base de datos, asi el
// administrador siempre puede entrar aunque Supabase tenga un problema.
export async function POST(req) {
  let pin = ''
  try {
    const b = await req.json()
    pin = (b && b.pin) || ''
  } catch {
    pin = ''
  }
  if (!pin) pin = req.headers.get('x-admin-pin') || ''

  if (!process.env.ADMIN_PIN) {
    return NextResponse.json(
      {
        ok: false,
        error:
          'No hay ADMIN_PIN configurado en Vercel. Agregalo en Settings -> Environment Variables y vuelve a desplegar.',
      },
      { status: 500 }
    )
  }
  if (pin === process.env.ADMIN_PIN) {
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ ok: false, error: 'PIN incorrecto' }, { status: 401 })
}
