'use client'

import { useState } from 'react'
import SocialFooter from './SocialFooter'

const DEFAULT_PROMO = 'En tu próxima compra'
const DEFAULT_DESCRIPTION = 'Válido en todos nuestros productos de pastelería y repostería.'

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

export default function ClaimForm({ codigo, promocion, descripcion, vence, qrDataUrl }) {
  const [nombre, setNombre] = useState('')
  const [estado, setEstado] = useState('form') // form | ok | error
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  const reclamado = estado === 'ok'
  const tone = reclamado ? 'claimed' : 'available'
  const safePromo = promocion || DEFAULT_PROMO
  const safeDescription = descripcion || DEFAULT_DESCRIPTION
  const nombreLimpio = nombre.trim()

  async function reclamar(e) {
    e.preventDefault()
    if (!nombreLimpio || cargando) return

    setCargando(true)
    setMensaje('')

    try {
      const res = await fetch('/api/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo, nombre: nombreLimpio }),
      })
      const json = await res.json()

      if (json.ok) {
        setEstado('ok')
      } else {
        setEstado('error')
        setMensaje(json.error || 'No pudimos reclamar este cupón.')
      }
    } catch (error) {
      setEstado('error')
      setMensaje('No pudimos conectar con el sistema. Inténtalo nuevamente.')
    } finally {
      setCargando(false)
    }
  }

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
                  <strong>{reclamado ? 'Cupón reclamado' : 'Cupón disponible para reclamar'}</strong>
                  <span>
                    {reclamado
                      ? `Listo${nombreLimpio ? `, ${nombreLimpio}` : ''}. Preséntalo en caja.`
                      : 'Escribe tu nombre para activar este beneficio.'}
                  </span>
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
                <span>{reclamado ? 'Listo para mostrar en caja' : 'Disponible ahora'}</span>
              </div>

              {reclamado ? (
                <div className="claim-note claim-note--ok" role="status">
                  Presenta este cupón en caja para aplicar el descuento.
                </div>
              ) : (
                <form className="claim-form" onSubmit={reclamar}>
                  <label htmlFor="claim-name">Nombre</label>
                  <input
                    id="claim-name"
                    name="nombre"
                    required
                    autoComplete="name"
                    placeholder="Tu nombre"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                  />
                  <button type="submit" disabled={cargando || !nombreLimpio}>
                    {cargando ? 'Reclamando...' : 'Reclamar mi cupón'}
                  </button>
                  {estado === 'error' && (
                    <p className="claim-error" role="alert">
                      {mensaje}
                    </p>
                  )}
                </form>
              )}
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
