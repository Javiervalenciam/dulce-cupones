'use client'
import { useEffect, useRef, useState } from 'react'
import { etiquetaEstadoCupon, normalizarCodigoCupon } from '@/lib/cuponCodigo'

function LogoLockup({ compact = false }) {
  return (
    <div className={compact ? 'cash-brand cash-brand--compact' : 'cash-brand'}>
      <div className="ops-logo-ring">
        <img src="/logo.png" alt="Dulce Mezcla" width="92" height="92" />
      </div>
      <div>
        <p className="ops-eyebrow">PUNTO DE ENTREGA</p>
        <h1>Caja Dulce Mezcla</h1>
        {!compact && <p className="ops-lead">Escanea el cupón reclamado y confirma la entrega en segundos.</p>}
      </div>
    </div>
  )
}

export default function Caja() {
  const [pin, setPin] = useState('')
  const [auth, setAuth] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [codigo, setCodigo] = useState('')
  const [cupon, setCupon] = useState(null)
  const [detalle, setDetalle] = useState('')
  const [msg, setMsg] = useState(null)
  const [cargando, setCargando] = useState(false)
  const scannerRef = useRef(null)

  useEffect(() => {
    const p = localStorage.getItem('dm_pin')
    if (p) setPin(p)
  }, [])

  useEffect(() => {
    return () => {
      if (scannerRef.current) scannerRef.current.stop().catch(() => {})
    }
  }, [])

  function entrar() {
    if (pin.trim()) {
      setAuth(true)
      localStorage.setItem('dm_pin', pin)
    }
  }

  function parseCodigo(text) {
    return normalizarCodigoCupon(text)
  }

  async function buscar(cod) {
    const c = parseCodigo(cod || codigo)
    if (!c) {
      setMsg({ t: 'error', x: 'Escribe o escanea un código' })
      return
    }
    setCargando(true)
    setMsg(null)
    const res = await fetch('/api/find', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-pin': pin },
      body: JSON.stringify({ codigo: c }),
    })
    const j = await res.json()
    setCargando(false)
    if (!j.ok) {
      setMsg({ t: 'error', x: j.error })
      return
    }
    if (!j.cupon) {
      setCupon(null)
      setMsg({ t: 'error', x: 'Cupón no encontrado' })
      return
    }
    setCupon(j.cupon)
    setCodigo(c)
  }

  async function confirmar() {
    const c = parseCodigo(codigo)
    if (!c) {
      setMsg({ t: 'error', x: 'Escanea o busca un cupón primero' })
      return
    }
    setCargando(true)
    const res = await fetch('/api/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo: c, detalle, pin }),
    })
    const j = await res.json()
    setCargando(false)
    if (j.ok) {
      setCodigo(j.cupon.codigo)
      setMsg({ t: 'ok', x: 'Entregado a ' + (j.cupon.nombre_cliente || 'cliente') })
      setCupon(j.cupon)
    } else {
      setMsg({ t: 'error', x: j.error })
    }
  }

  async function startScan() {
    setMsg(null)
    setScanning(true)
    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      const scanner = new Html5Qrcode('reader')
      scannerRef.current = scanner
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 240 },
        async (txt) => {
          const c = parseCodigo(txt)
          await stopScan()
          await buscar(c)
        },
        () => {}
      )
    } catch (e) {
      setScanning(false)
      setMsg({ t: 'error', x: 'No se pudo abrir la cámara: ' + e })
    }
  }

  async function stopScan() {
    setScanning(false)
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
      } catch (e) {
        /* ya detenido */
      }
      scannerRef.current = null
    }
  }

  function reset() {
    setCupon(null)
    setCodigo('')
    setDetalle('')
    setMsg(null)
  }

  if (!auth) {
    return (
      <main className="ops-shell ops-shell--login ops-shell--cash">
        <div className="ops-scallop ops-scallop--top" aria-hidden="true" />
        <section className="ops-login-card" aria-labelledby="cash-login-title">
          <LogoLockup />
          <label className="ops-field">
            <span>PIN de caja</span>
            <input
              type="password"
              placeholder="Ingresa el PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && entrar()}
            />
          </label>
          <button className="ops-btn ops-btn--primary" onClick={entrar}>
            Entrar a caja
          </button>
        </section>
        <div className="ops-scallop ops-scallop--bottom" aria-hidden="true" />
      </main>
    )
  }

  return (
    <main className="ops-shell ops-shell--cash caja">
      <div className="ops-scallop ops-scallop--top" aria-hidden="true" />

      <section className="cash-desk">
        <header className="cash-hero">
          <LogoLockup />
          <a className="ops-btn ops-btn--soft" href="/admin">
            Volver a Admin
          </a>
        </header>

        <div className="cash-grid">
          <section className="cash-scan-card">
            <div className="ops-panel-head">
              <div>
                <p className="ops-section-label">Validación en stand</p>
                <h2>Escanea o busca el cupón</h2>
              </div>
              <span className="ops-chip">Entrega segura</span>
            </div>

            {!scanning && (
              <button className="ops-btn ops-btn--primary cash-scan-button" onClick={startScan}>
                Escanear con cámara
              </button>
            )}

            {scanning && (
              <div className="cash-reader-wrap">
                <div id="reader" className="reader cash-reader"></div>
                <button className="ops-btn ops-btn--soft" onClick={stopScan}>
                  Detener cámara
                </button>
              </div>
            )}

            <div className="cash-divider">
              <span>o ingresa el código</span>
            </div>

            <div className="cash-manual">
              <input
                placeholder="DULCE-XXXXXX o URL del QR"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && buscar()}
              />
              <button className="ops-btn ops-btn--soft" onClick={() => buscar()} disabled={cargando}>
                {cargando ? 'Buscando...' : 'Buscar'}
              </button>
            </div>

            {msg && (
              <div className={msg.t === 'ok' ? 'ops-alert ops-alert--ok' : 'ops-alert ops-alert--error'}>
                {msg.x}
              </div>
            )}
          </section>

          <aside className="cash-result-card" aria-label="Resultado del cupón">
            {!cupon && (
              <div className="cash-empty">
                <span aria-hidden="true">◇</span>
                <h2>Esperando cupón</h2>
                <p>Cuando escanees un QR reclamado aparecerán los datos del cliente y el botón de entrega.</p>
              </div>
            )}

            {cupon && (
              <div className="cash-ticket">
                <p className="ops-section-label">Cupón encontrado</p>
                <div className="cash-code">{cupon.codigo}</div>
                <span className={'badge ' + cupon.estado}>{etiquetaEstadoCupon(cupon.estado)}</span>

                <dl className="cash-details">
                  <div>
                    <dt>Cliente</dt>
                    <dd>{cupon.nombre_cliente || '—'}</dd>
                  </div>
                  <div>
                    <dt>Promoción</dt>
                    <dd>{cupon.promocion || '—'}</dd>
                  </div>
                  {cupon.vence_en && (
                    <div>
                      <dt>Vence</dt>
                      <dd>{cupon.vence_en}</dd>
                    </div>
                  )}
                </dl>

                {cupon.estado === 'DISPONIBLE' && (
                  <p className="ops-alert ops-alert--notice">
                    Este cupón todavía no fue reclamado por el cliente. Primero debe abrir el QR y escribir su nombre.
                  </p>
                )}

                {cupon.estado === 'REDIMIDO' && <p className="ops-alert ops-alert--ok">Este cupón ya fue entregado.</p>}

                {cupon.estado === 'RECLAMADO' && (
                  <div className="cash-delivery">
                    <label className="ops-field">
                      <span>Detalle entregado</span>
                      <input
                        placeholder="Ej: cupcake, descuento 15%, torta mini"
                        value={detalle}
                        onChange={(e) => setDetalle(e.target.value)}
                      />
                    </label>
                    <button className="ops-btn ops-btn--primary" onClick={confirmar} disabled={cargando}>
                      {cargando ? 'Confirmando...' : 'Confirmar entrega'}
                    </button>
                  </div>
                )}

                <button className="ops-btn ops-btn--soft" onClick={reset}>
                  Nuevo cupón
                </button>
              </div>
            )}
          </aside>
        </div>
      </section>

      <div className="ops-scallop ops-scallop--bottom" aria-hidden="true" />
    </main>
  )
}
