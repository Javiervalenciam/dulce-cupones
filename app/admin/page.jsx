'use client'
import { useEffect, useState, useCallback } from 'react'
import QRCode from 'qrcode'
import { etiquetaEstadoCupon } from '@/lib/cuponCodigo'

const BASE = process.env.NEXT_PUBLIC_BASE_URL || ''
const ESTADOS = ['TODOS', 'DISPONIBLE', 'RECLAMADO', 'REDIMIDO', 'ANULADO', 'ELIMINADO']
const PREFIJOS = ['TODOS', 'DULCE', 'MEZCLA']

function getBaseUrl() {
  const base = BASE || (typeof window !== 'undefined' ? window.location.origin : '')
  return base.replace(/\/+$/, '')
}

function getCouponUrl(cod) {
  return `${getBaseUrl()}/c/${cod}`
}

function LogoLockup({ eyebrow, title, text }) {
  return (
    <div className="ops-brand">
      <div className="ops-logo-ring">
        <img src="/logo.png" alt="Dulce Mezcla" width="92" height="92" />
      </div>
      <div>
        <p className="ops-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {text && <p className="ops-lead">{text}</p>}
      </div>
    </div>
  )
}

function StatCard({ tone, icon, value, label, note }) {
  return (
    <div className={`ops-stat ops-stat--${tone}`}>
      <span className="ops-stat-icon" aria-hidden="true">
        {icon}
      </span>
      <div>
        <b>{value}</b>
        <span>{label}</span>
        {note && <small>{note}</small>}
      </div>
    </div>
  )
}

export default function Admin() {
  const [pin, setPin] = useState('')
  const [auth, setAuth] = useState(false)
  const [stats, setStats] = useState(null)
  const [cupones, setCupones] = useState([])
  const [cargando, setCargando] = useState(false)
  const [sel, setSel] = useState([])
  const [filtroEstado, setFiltroEstado] = useState('TODOS')
  const [filtroPrefijo, setFiltroPrefijo] = useState('TODOS')
  const [busqueda, setBusqueda] = useState('')
  const [qrModal, setQrModal] = useState(null)
  const [aviso, setAviso] = useState('')

  const [genPrefijo, setGenPrefijo] = useState('DULCE')
  const [genCantidad, setGenCantidad] = useState(50)
  const [genPromo, setGenPromo] = useState('15% de descuento')
  const [genDesc, setGenDesc] = useState('Válido en tu próxima compra.')
  const [genVence, setGenVence] = useState('')

  const headers = useCallback(
    () => ({ 'Content-Type': 'application/json', 'x-admin-pin': pin }),
    [pin]
  )

  const cargarStats = useCallback(async () => {
    try {
      const res = await fetch('/api/stats', { method: 'POST', headers: headers() })
      const j = await res.json()
      if (j.ok) setStats({ ...j.stats, TOTAL: j.total })
      else setAviso(j.error || 'No se pudieron cargar las estadisticas')
    } catch (e) {
      setAviso('Error al cargar estadisticas: ' + ((e && e.message) || ''))
    }
  }, [headers])

  const cargarLista = useCallback(async () => {
    setCargando(true)
    try {
      const res = await fetch('/api/list', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ estado: filtroEstado, prefijo: filtroPrefijo, q: busqueda }),
      })
      const j = await res.json()
      if (j.ok) setCupones(j.cupones || [])
      else setAviso(j.error || 'Error')
    } catch (e) {
      setAviso('Error al cargar la lista: ' + ((e && e.message) || ''))
    } finally {
      setCargando(false)
    }
  }, [headers, filtroEstado, filtroPrefijo, busqueda])

  async function entrar() {
    setAviso('')
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      })
      let j = {}
      try {
        j = await res.json()
      } catch {
        j = {}
      }
      if (res.ok && j.ok) {
        setAuth(true)
        localStorage.setItem('dm_pin', pin)
      } else {
        setAviso(j.error || 'No se pudo entrar (error ' + res.status + ')')
      }
    } catch (e) {
      setAviso('No se pudo conectar con el servidor: ' + ((e && e.message) || ''))
    }
  }

  useEffect(() => {
    const p = localStorage.getItem('dm_pin')
    if (p) setPin(p)
  }, [])

  useEffect(() => {
    if (!auth) return
    cargarStats()
    cargarLista()
    const t = setInterval(cargarStats, 5000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth])

  useEffect(() => {
    if (auth) cargarLista()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroEstado, filtroPrefijo])

  async function generar() {
    setCargando(true)
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        cantidad: genCantidad,
        prefijo: genPrefijo,
        promocion: genPromo,
        descripcion: genDesc,
        vence_en: genVence || null,
      }),
    })
    const j = await res.json()
    setCargando(false)
    if (j.ok) {
      setAviso('Se crearon ' + j.creados + ' cupones')
      cargarStats()
      cargarLista()
    } else {
      setAviso(j.error)
    }
  }

  function toggleSel(cod) {
    setSel((s) => (s.includes(cod) ? s.filter((x) => x !== cod) : [...s, cod]))
  }

  function toggleTodos() {
    setSel((s) => (s.length === cupones.length ? [] : cupones.map((c) => c.codigo)))
  }

  async function eliminar(modo) {
    if (sel.length === 0) {
      setAviso('Selecciona al menos un cupón')
      return
    }
    const txt =
      modo === 'hard'
        ? 'eliminar PERMANENTEMENTE'
        : modo === 'restore'
          ? 'restaurar'
          : 'enviar a eliminados'
    if (!confirm('¿Seguro que deseas ' + txt + ' ' + sel.length + ' cupón(es)?')) return
    const res = await fetch('/api/delete', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ codigos: sel, modo }),
    })
    const j = await res.json()
    if (j.ok) {
      setAviso('Hecho')
      setSel([])
      cargarStats()
      cargarLista()
    } else {
      setAviso(j.error)
    }
  }

  async function verQR(cod) {
    const dataUrl = await QRCode.toDataURL(getCouponUrl(cod), { width: 420, margin: 2 })
    setQrModal({ cod, dataUrl })
  }

  async function descargarUno(cod) {
    const dataUrl = await QRCode.toDataURL(getCouponUrl(cod), { width: 700, margin: 2 })
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = cod + '.png'
    a.click()
  }

  async function descargarSeleccion() {
    if (sel.length === 0) {
      setAviso('Selecciona cupones para descargar')
      return
    }
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()
    for (const cod of sel) {
      const dataUrl = await QRCode.toDataURL(getCouponUrl(cod), { width: 700, margin: 2 })
      zip.file(cod + '.png', dataUrl.split(',')[1], { base64: true })
    }
    const blob = await zip.generateAsync({ type: 'blob' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'cupones-qr.zip'
    a.click()
  }

  function compartir(cod) {
    const url = getCouponUrl(cod)
    const texto = encodeURIComponent('Tu cupón de Dulce Mezcla')
    window.open('https://wa.me/?text=' + texto + '%20' + encodeURIComponent(url), '_blank')
  }

  if (!auth) {
    return (
      <main className="ops-shell ops-shell--login">
        <div className="ops-scallop ops-scallop--top" aria-hidden="true" />
        <section className="ops-login-card" aria-labelledby="admin-login-title">
          <LogoLockup
            eyebrow="ACCESO PRIVADO"
            title="Admin Dulce Mezcla"
            text="Gestiona lotes, estados y códigos QR desde un panel ligero y claro."
          />
          <label className="ops-field">
            <span>PIN de administrador</span>
            <input
              type="password"
              placeholder="Ingresa el PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && entrar()}
            />
          </label>
          <button className="ops-btn ops-btn--primary" onClick={entrar}>
            Entrar al panel
          </button>
          {aviso && <p className="ops-alert ops-alert--error">{aviso}</p>}
        </section>
        <div className="ops-scallop ops-scallop--bottom" aria-hidden="true" />
      </main>
    )
  }

  return (
    <main className="ops-shell ops-shell--admin">
      <div className="ops-scallop ops-scallop--top" aria-hidden="true" />

      <div className="ops-wrap">
        <header className="ops-hero">
          <LogoLockup
            eyebrow="PASTELERÍA & REPOSTERÍA"
            title="Gestión de cupones"
            text="Crea, descarga, filtra y revisa el ciclo completo de cada beneficio."
          />
          <a className="ops-btn ops-btn--soft ops-hero-action" href="/caja">
            Ir a Caja
          </a>
        </header>

        <section className="ops-stats" aria-label="Resumen de cupones">
          <StatCard tone="total" icon="✦" value={stats?.TOTAL ?? '—'} label="Total" note="Cupones creados" />
          <StatCard
            tone="available"
            icon="◇"
            value={stats?.DISPONIBLE ?? '—'}
            label="Disponibles"
            note="Listos para reclamar"
          />
          <StatCard
            tone="claimed"
            icon="♡"
            value={stats?.RECLAMADO ?? '—'}
            label="Reclamados"
            note="Pendientes de caja"
          />
          <StatCard
            tone="delivered"
            icon="✓"
            value={stats?.REDIMIDO ?? '—'}
            label="Entregados"
            note="Aplicados en caja"
          />
          <StatCard
            tone="removed"
            icon="×"
            value={stats?.ELIMINADO ?? '—'}
            label="Eliminados"
            note="Fuera de circulación"
          />
        </section>

        <section className="ops-panel ops-panel--generator">
          <div className="ops-panel-head">
            <div>
              <p className="ops-section-label">Nuevo lote</p>
              <h2>Generar cupones</h2>
            </div>
            <span className="ops-chip">QR automático</span>
          </div>

          <div className="ops-form-grid">
            <label className="ops-field">
              <span>Prefijo</span>
              <select value={genPrefijo} onChange={(e) => setGenPrefijo(e.target.value)}>
                <option>DULCE</option>
                <option>MEZCLA</option>
              </select>
            </label>
            <label className="ops-field">
              <span>Cantidad</span>
              <input
                type="number"
                min="0"
                max="100"
                value={genCantidad}
                onChange={(e) => setGenCantidad(e.target.value)}
              />
            </label>
            <label className="ops-field">
              <span>Vence</span>
              <input type="date" value={genVence} onChange={(e) => setGenVence(e.target.value)} />
            </label>
            <label className="ops-field ops-field--wide">
              <span>Promoción</span>
              <input value={genPromo} onChange={(e) => setGenPromo(e.target.value)} />
            </label>
            <label className="ops-field ops-field--wide">
              <span>Descripción</span>
              <input value={genDesc} onChange={(e) => setGenDesc(e.target.value)} />
            </label>
          </div>

          <button className="ops-btn ops-btn--primary" onClick={generar} disabled={cargando}>
            {cargando ? 'Procesando...' : 'Generar lote'}
          </button>
        </section>

        <section className="ops-panel">
          <div className="ops-panel-head ops-panel-head--stack">
            <div>
              <p className="ops-section-label">Inventario</p>
              <h2>Cupones activos</h2>
            </div>
            <div className="ops-filters">
              <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} aria-label="Estado">
                {ESTADOS.map((e) => (
                  <option key={e}>{e}</option>
                ))}
              </select>
              <select value={filtroPrefijo} onChange={(e) => setFiltroPrefijo(e.target.value)} aria-label="Prefijo">
                {PREFIJOS.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
              <input
                placeholder="Buscar código o nombre"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && cargarLista()}
              />
              <button className="ops-btn ops-btn--soft" onClick={cargarLista}>
                Buscar
              </button>
            </div>
          </div>

          <div className="ops-actions">
            <button className="ops-btn ops-btn--soft" onClick={descargarSeleccion}>
              Descargar QR ({sel.length})
            </button>
            <button className="ops-btn ops-btn--soft" onClick={() => eliminar('soft')}>
              Eliminar
            </button>
            <button className="ops-btn ops-btn--mint" onClick={() => eliminar('restore')}>
              Restaurar
            </button>
            <button className="ops-btn ops-btn--danger" onClick={() => eliminar('hard')}>
              Borrar definitivo
            </button>
          </div>

          {aviso && <p className="ops-alert ops-alert--notice">{aviso}</p>}

          <div className="ops-table-wrap">
            <table className="ops-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      aria-label="Seleccionar todos"
                      checked={sel.length > 0 && sel.length === cupones.length}
                      onChange={toggleTodos}
                    />
                  </th>
                  <th>Código</th>
                  <th>Estado</th>
                  <th>Promo</th>
                  <th>Cliente</th>
                  <th>Vence</th>
                  <th>Detalle</th>
                  <th>QR</th>
                </tr>
              </thead>
              <tbody>
                {cupones.map((c) => (
                  <tr key={c.codigo} className={sel.includes(c.codigo) ? 'is-selected' : ''}>
                    <td>
                      <input
                        type="checkbox"
                        aria-label={`Seleccionar ${c.codigo}`}
                        checked={sel.includes(c.codigo)}
                        onChange={() => toggleSel(c.codigo)}
                      />
                    </td>
                    <td className="ops-mono">{c.codigo}</td>
                    <td>
                      <span className={'badge ' + c.estado}>{etiquetaEstadoCupon(c.estado)}</span>
                    </td>
                    <td>{c.promocion || '—'}</td>
                    <td>{c.nombre_cliente || '—'}</td>
                    <td>{c.vence_en || '—'}</td>
                    <td>{c.detalle_entregado || '—'}</td>
                    <td className="ops-row-actions">
                      <button title="Ver QR" aria-label={`Ver QR de ${c.codigo}`} onClick={() => verQR(c.codigo)}>
                        Ver
                      </button>
                      <button
                        title="Descargar"
                        aria-label={`Descargar QR de ${c.codigo}`}
                        onClick={() => descargarUno(c.codigo)}
                      >
                        PNG
                      </button>
                      <button title="Compartir" aria-label={`Compartir ${c.codigo}`} onClick={() => compartir(c.codigo)}>
                        Enviar
                      </button>
                    </td>
                  </tr>
                ))}
                {cupones.length === 0 && (
                  <tr>
                    <td colSpan="8" className="ops-empty">
                      {cargando ? 'Cargando cupones...' : 'Sin resultados para este filtro'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {qrModal && (
        <div className="modal ops-modal" onClick={() => setQrModal(null)}>
          <div className="modal-card ops-modal-card" onClick={(e) => e.stopPropagation()}>
            <p className="ops-section-label">Código QR</p>
            <h3>{qrModal.cod}</h3>
            <img src={qrModal.dataUrl} alt={`QR del cupón ${qrModal.cod}`} />
            <p className="ops-mono">{getCouponUrl(qrModal.cod)}</p>
            <div className="modal-acc">
              <button className="ops-btn ops-btn--primary" onClick={() => descargarUno(qrModal.cod)}>
                Descargar PNG
              </button>
              <button className="ops-btn ops-btn--soft" onClick={() => setQrModal(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="ops-scallop ops-scallop--bottom" aria-hidden="true" />
    </main>
  )
}
