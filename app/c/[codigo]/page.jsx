import QRCode from 'qrcode'
import { headers } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'
import { estaVencido } from '@/lib/fechas'
import ClaimForm from '@/components/ClaimForm'
import SocialFooter from '@/components/SocialFooter'

export const dynamic = 'force-dynamic'

const DEFAULT_PROMO = 'En tu próxima compra'
const DEFAULT_DESCRIPTION = 'Válido en todos nuestros productos de pastelería y repostería.'

function buildCouponUrl(codigo) {
  const base = (process.env.NEXT_PUBLIC_BASE_URL || '').trim().replace(/\/+$/, '')
  if (base) return `${base}/c/${codigo}`

  const h = headers()
  const host = h.get('x-forwarded-host') || h.get('host') || ''
  const proto = h.get('x-forwarded-proto') || 'https'
  return host ? `${proto}://${host}/c/${codigo}` : `/c/${codigo}`
}

async function buildQr(url) {
  return QRCode.toDataURL(url, {
    width: 360,
    margin: 1,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#2F211E',
      light: '#FFFFFF',
    },
  })
}

function getDiscount(promocion) {
  const match = String(promocion || '').match(/(\d{1,2})\s*%/)
  return match ? `${match[1]}%` : '15%'
}

function StateIcon({ tone }) {
  const paths = {
    available: (
      <path d="M12 21s-7-4.4-7-10a4 4 0 0 1 7-2.4A4 4 0 0 1 19 11c0 5.6-7 10-7 10Z" />
    ),
    claimed: <path d="m7.5 12.2 3 3 6-6.4M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
    redeemed: <path d="M9 12h6M12 9v6M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
    warning: (
      <path d="M12 8v4m0 4h.01M10.3 4.3 2.8 17.2A2 2 0 0 0 4.5 20h15a2 2 0 0 0 1.7-2.8L13.7 4.3a2 2 0 0 0-3.4 0Z" />
    ),
  }

  return (
    <svg className="coupon-status-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {paths[tone] || paths.available}
      </g>
    </svg>
  )
}

function CouponFrame({
  codigo,
  promocion,
  descripcion,
  vence,
  qrDataUrl,
  tone,
  statusTitle,
  statusText,
  qrPill,
}) {
  const safePromo = promocion || DEFAULT_PROMO
  const safeDescription = descripcion || DEFAULT_DESCRIPTION

  return (
    <main className={`coupon-public coupon-public--${tone}`}>
      <div className="coupon-scallop coupon-scallop--top" aria-hidden="true" />

      <section className="coupon-stage" aria-labelledby="coupon-title">
        <header className="coupon-hero">
          <div className="coupon-logo-shell">
            <img src="/logo.png" alt="Dulce Mezcla" className="coupon-logo-img" width="132" height="132" />
          </div>
          <h1 id="coupon-title" className="coupon-brand">
            Dulce Mezcla
          </h1>
          <p className="coupon-subtitle">
            <span aria-hidden="true">⌁</span>
            PASTELERÍA &amp; REPOSTERÍA
            <span aria-hidden="true">⌁</span>
          </p>
          <div className="coupon-welcome">
            <p>
              <span aria-hidden="true" className="coupon-heart">
                ♡
              </span>
              ¡Gracias por ser parte de nuestra comunidad dulce!
            </p>
            <span>Disfruta de este beneficio especial, hecho para ti.</span>
          </div>
        </header>

        <section className="coupon-card-public" aria-label="Cupón de descuento">
          <div className="coupon-ribbon" aria-hidden="true">
            OFERTA
            <span>ESPECIAL</span>
          </div>

          <div className="coupon-grid">
            <div className="coupon-detail-panel">
              <p className="coupon-section-label">
                <span aria-hidden="true">⌁</span>
                CÓDIGO DE DESCUENTO
                <span aria-hidden="true">⌁</span>
              </p>

              <div className="coupon-code-display">{codigo}</div>

              <div className={`coupon-status coupon-status--${tone}`}>
                <StateIcon tone={tone} />
                <div>
                  <strong>{statusTitle}</strong>
                  <span>{statusText}</span>
                </div>
              </div>

              {vence && <p className="coupon-validity">Válido hasta {vence}</p>}

              <div className="coupon-divider" aria-hidden="true" />

              <div className="coupon-promo">
                <div className="coupon-discount-seal">
                  <span>{getDiscount(safePromo)}</span>
                  <small>DESCUENTO</small>
                </div>
                <div className="coupon-promo-copy">
                  <strong>{safePromo}</strong>
                  <p>{safeDescription}</p>
                </div>
              </div>
            </div>

            <aside className="coupon-qr-panel" aria-label="Código QR del cupón">
              <p className="coupon-section-label">
                <span aria-hidden="true">⌁</span>
                ESCANEA PARA MOSTRAR
                <span aria-hidden="true">⌁</span>
              </p>
              <div className="coupon-qr-frame">
                <img src={qrDataUrl} alt={`QR del cupón ${codigo}`} width="260" height="260" />
              </div>
              <div className={`coupon-pill coupon-pill--${tone}`}>
                <StateIcon tone={tone} />
                <span>{qrPill}</span>
              </div>
            </aside>
          </div>
        </section>

        <section className="coupon-reminder" aria-label="Recordatorio para usar el cupón">
          <div className="coupon-reminder-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M4 10.5 12 4l8 6.5M6 9.5V20h12V9.5M9 20v-6h6v6M8 12h2m4 0h2"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p>
            <strong>Presenta este cupón en caja para aplicar el descuento.</strong>
            <span>No acumulable con otras promociones. Válido por tiempo limitado.</span>
          </p>
          <em>¡Gracias por elegirnos!</em>
        </section>

        <SocialFooter />
      </section>

      <div className="coupon-scallop coupon-scallop--bottom" aria-hidden="true" />
    </main>
  )
}

export default async function CuponPage({ params }) {
  const codigo = decodeURIComponent(params.codigo).toUpperCase()
  const url = buildCouponUrl(codigo)
  const qrDataUrl = await buildQr(url)

  const { data: cupon } = await supabaseAdmin
    .from('cupones')
    .select('*')
    .eq('codigo', codigo)
    .maybeSingle()

  if (!cupon || cupon.estado === 'ELIMINADO') {
    return (
      <CouponFrame
        codigo={codigo}
        promocion="Cupón especial"
        descripcion="Verifica el enlace o acércate a nuestro punto de atención."
        qrDataUrl={qrDataUrl}
        tone="warning"
        statusTitle="Cupón no válido"
        statusText="Este cupón no existe o ya no está disponible."
        qrPill="Cupón no válido"
      />
    )
  }

  if (cupon.estado === 'ANULADO') {
    return (
      <CouponFrame
        codigo={cupon.codigo}
        promocion={cupon.promocion}
        descripcion={cupon.descripcion}
        vence={cupon.vence_en}
        qrDataUrl={qrDataUrl}
        tone="warning"
        statusTitle="Cupón anulado"
        statusText="Este beneficio fue anulado y no puede ser usado."
        qrPill="Cupón anulado"
      />
    )
  }

  if (estaVencido(cupon.vence_en)) {
    return (
      <CouponFrame
        codigo={cupon.codigo}
        promocion={cupon.promocion}
        descripcion={cupon.descripcion}
        vence={cupon.vence_en}
        qrDataUrl={qrDataUrl}
        tone="warning"
        statusTitle="Cupón expirado"
        statusText="Este beneficio ya pasó su fecha de validez."
        qrPill="Cupón expirado"
      />
    )
  }

  if (cupon.estado === 'REDIMIDO') {
    return (
      <CouponFrame
        codigo={cupon.codigo}
        promocion={cupon.promocion}
        descripcion={cupon.descripcion}
        vence={cupon.vence_en}
        qrDataUrl={qrDataUrl}
        tone="redeemed"
        statusTitle="Este cupón ya fue entregado"
        statusText="El beneficio ya fue aplicado en caja."
        qrPill="Cupón entregado correctamente"
      />
    )
  }

  if (cupon.estado === 'RECLAMADO') {
    return (
      <CouponFrame
        codigo={cupon.codigo}
        promocion={cupon.promocion}
        descripcion={cupon.descripcion}
        vence={cupon.vence_en}
        qrDataUrl={qrDataUrl}
        tone="claimed"
        statusTitle="Cupón reclamado"
        statusText={`Listo${cupon.nombre_cliente ? `, ${cupon.nombre_cliente}` : ''}. Preséntalo en caja.`}
        qrPill="Listo para mostrar en caja"
      />
    )
  }

  return (
    <ClaimForm
      codigo={cupon.codigo}
      promocion={cupon.promocion}
      descripcion={cupon.descripcion}
      vence={cupon.vence_en}
      qrDataUrl={qrDataUrl}
    />
  )
}
