'use client'
import { useEffect, useRef, useState } from 'react'
import { etiquetaEstadoCupon, normalizarCodigoCupon } from '@/lib/cuponCodigo'

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
      setMsg({ t: 'ok', x: '✅ Entregado a ' + (j.cupon.nombre_cliente || 'cliente') })
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
      <main className="card">
        <div className="logo">DM</div>
        <h1>🎪 Caja</h1>
        <input
          type="password"
          placeholder="PIN"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && entrar()}
        />
        <button onClick={entrar}>Entrar</button>
      </main>
    )
  }

  return (
    <main className="card caja">
      <div className="logo">DM</div>
      <h1>🎪 Caja — Dulce Mezcla</h1>

      {!scanning && <button onClick={startScan}>📷 Escanear con cámara</button>}
      {scanning && (
        <>
          <div id="reader" className="reader"></div>
          <button className="btn-sec" onClick={stopScan}>
            Detener cámara
          </button>
        </>
      )}

      <div className="o">— o —</div>
      <div className="manual">
        <input
          placeholder="Escribe el código"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && buscar()}
        />
        <button className="btn-sec" onClick={() => buscar()}>
          Buscar
        </button>
      </div>

      {cupon && (
        <div className="cupon-info">
          <div className="codigo">{cupon.codigo}</div>
          <p>
            <span className={'badge ' + cupon.estado}>{etiquetaEstadoCupon(cupon.estado)}</span>
          </p>
          <p>
            <b>Cliente:</b> {cupon.nombre_cliente || '—'}
          </p>
          <p>
            <b>Promo:</b> {cupon.promocion || '—'}
          </p>
          {cupon.vence_en && (
            <p>
              <b>Vence:</b> {cupon.vence_en}
            </p>
          )}
          {cupon.estado === 'DISPONIBLE' && (
            <p className="aviso">
              Este cupón todavía no fue reclamado por el cliente. Primero debe abrir el QR y escribir su
              nombre.
            </p>
          )}
          {cupon.estado === 'REDIMIDO' && (
            <p className="ok">Este cupón ya fue entregado.</p>
          )}
          {cupon.estado === 'RECLAMADO' && (
            <>
              <input
                placeholder="Detalle entregado (ej: cupcake)"
                value={detalle}
                onChange={(e) => setDetalle(e.target.value)}
              />
              <button onClick={confirmar} disabled={cargando}>
                {cargando ? '...' : '✅ Confirmar entrega'}
              </button>
            </>
          )}
          <button className="btn-sec" onClick={reset}>
            Nuevo
          </button>
        </div>
      )}

      {msg && <div className={msg.t === 'ok' ? 'ok' : 'error'}>{msg.x}</div>}
    </main>
  )
}
