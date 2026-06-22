import { supabaseAdmin } from '@/lib/supabase'
import { estaVencido } from '@/lib/fechas'
import ClaimForm from '@/components/ClaimForm'
import ShareButtons from '@/components/ShareButtons'

export const dynamic = 'force-dynamic'

export default async function CuponPage({ params }) {
  const codigo = decodeURIComponent(params.codigo).toUpperCase()
  const { data: cupon } = await supabaseAdmin
    .from('cupones')
    .select('*')
    .eq('codigo', codigo)
    .maybeSingle()

  const base = process.env.NEXT_PUBLIC_BASE_URL || ''
  const url = `${base}/c/${codigo}`

  if (!cupon || cupon.estado === 'ELIMINADO') {
    return (
      <main className="card">
        <div className="logo">DM</div>
        <h1>Cupón no encontrado</h1>
        <p>Verifica el enlace o acércate a nuestro stand.</p>
      </main>
    )
  }
  if (cupon.estado === 'ANULADO') {
    return (
      <main className="card">
        <div className="logo">DM</div>
        <h1>Cupón no disponible</h1>
      </main>
    )
  }
  if (estaVencido(cupon.vence_en)) {
    return (
      <main className="card">
        <div className="logo">DM</div>
        <h1>⏰ Cupón vencido</h1>
        <p>Este cupón expiró el {cupon.vence_en}.</p>
      </main>
    )
  }
  if (cupon.estado === 'REDIMIDO') {
    return (
      <main className="card">
        <div className="logo">DM</div>
        <h1>🎉 Este cupón ya fue entregado</h1>
        <div className="codigo">{cupon.codigo}</div>
      </main>
    )
  }
  if (cupon.estado === 'RECLAMADO') {
    return (
      <main className="card">
        <div className="logo">DM</div>
        <h1>✅ ¡Listo, {cupon.nombre_cliente}!</h1>
        <p>Muestra esta pantalla en el stand de Dulce Mezcla para recibir tu sorpresa.</p>
        <div className="codigo">{cupon.codigo}</div>
        <p className="promo">{cupon.promocion}</p>
        {cupon.vence_en && <p className="vence">Válido hasta {cupon.vence_en}</p>}
        <ShareButtons url={url} texto={`Mira mi cupón de Dulce Mezcla: ${cupon.promocion || ''}`} />
      </main>
    )
  }

  return (
    <ClaimForm
      codigo={cupon.codigo}
      promocion={cupon.promocion}
      descripcion={cupon.descripcion}
      vence={cupon.vence_en}
      url={url}
    />
  )
}
