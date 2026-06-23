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
    const texto = encodeURIComponent('Tu cupón de Dulce Mezcla 🧁')
    window.open('https://wa.me/?text=' + texto + '%20' + encodeURIComponent(url), '_blank')
  }

  if (!auth) {
    return (
      <main className="card">
        <div className="logo">DM</div>
        <h1>Panel Dulce Mezcla</h1>
        <input
          type="password"
          placeholder="PIN de administrador"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && entrar()}
        />
        <button onClick={entrar}>Entrar</button>
        {aviso && <p className="error">{aviso}</p>}
      </main>
    )
  }

  return (
    <div className="wrap">
      <header className="topbar">
        <div className="brand">
          <span className="logo sm">DM</span> Dulce Mezcla · Admin
        </div>
        <a className="btn-sec" href="/caja">
          Ir a Caja →
        </a>
      </header>

      <section className="stats">
        <div className="stat total">
          <b>{stats?.TOTAL ?? '—'}</b>
          <span>Total</span>
        </div>
        <div className="stat disp">
          <b>{stats?.DISPONIBLE ?? '—'}</b>
          <span>Disponibles</span>
        </div>
        <div className="stat recl">
          <b>{stats?.RECLAMADO ?? '—'}</b>
          <span>Reclamados</span>
        </div>
        <div className="stat red">
          <b>{stats?.REDIMIDO ?? '—'}</b>
          <span>Entregados</span>
        </div>
        <div className="stat elim">
          <b>{stats?.ELIMINADO ?? '—'}</b>
          <span>Eliminados</span>
        </div>
      </section>

      <section className="panel">
        <h2>Generar cupones</h2>
        <div className="grid-gen">
          <label>
            Prefijo
            <select value={genPrefijo} onChange={(e) => setGenPrefijo(e.target.value)}>
              <option>DULCE</option>
              <option>MEZCLA</option>
            </select>
          </label>
          <label>
            Cantidad (0–100)
            <input
              type="number"
              min="0"
              max="100"
              value={genCantidad}
              onChange={(e) => setGenCantidad(e.target.value)}
            />
          </label>
          <label>
            Vence (opcional)
            <input type="date" value={genVence} onChange={(e) => setGenVence(e.target.value)} />
          </label>
          <label className="col2">
            Promoción
            <input value={genPromo} onChange={(e) => setGenPromo(e.target.value)} />
          </label>
          <label className="col2">
            Descripción
            <input value={genDesc} onChange={(e) => setGenDesc(e.target.value)} />
          </label>
        </div>
        <button onClick={generar} disabled={cargando}>
          Generar lote
        </button>
      </section>

      <section className="panel">
        <div className="filtros">
          <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
            {ESTADOS.map((e) => (
              <option key={e}>{e}</option>
            ))}
          </select>
          <select value={filtroPrefijo} onChange={(e) => setFiltroPrefijo(e.target.value)}>
            {PREFIJOS.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
          <input
            placeholder="Buscar código, nombre o teléfono"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && cargarLista()}
          />
          <button className="btn-sec" onClick={cargarLista}>
            Buscar
          </button>
        </div>

        <div className="acciones">
          <button className="btn-sec" onClick={descargarSeleccion}>
            ⬇️ Descargar QR ({sel.length})
          </button>
          <button className="btn-sec" onClick={() => eliminar('soft')}>
            🗑️ Eliminar
          </button>
          <button className="btn-sec" onClick={() => eliminar('restore')}>
            ♻️ Restaurar
          </button>
          <button className="btn-sec danger" onClick={() => eliminar('hard')}>
            ❌ Borrar definitivo
          </button>
        </div>
        {aviso && <p className="aviso">{aviso}</p>}

        <div className="tabla-wrap">
          <table className="tabla">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={sel.length > 0 && sel.length === cupones.length}
                    onChange={toggleTodos}
                  />
                </th>
                <th>Código</th>
                <th>Estado</th>
                <th>Promo</th>
                <th>Cliente</th>
                <th>Teléfono</th>
                <th>Vence</th>
                <th>Detalle</th>
                <th>QR</th>
              </tr>
            </thead>
            <tbody>
              {cupones.map((c) => (
                <tr key={c.codigo} className={sel.includes(c.codigo) ? 'selrow' : ''}>
                  <td>
                    <input
                      type="checkbox"
                      checked={sel.includes(c.codigo)}
                      onChange={() => toggleSel(c.codigo)}
                    />
                  </td>
                  <td className="mono">{c.codigo}</td>
                  <td>
                    <span className={'badge ' + c.estado}>{etiquetaEstadoCupon(c.estado)}</span>
                  </td>
                  <td>{c.promocion}</td>
                  <td>{c.nombre_cliente || '—'}</td>
                  <td>{c.telefono_cliente || '—'}</td>
                  <td>{c.vence_en || '—'}</td>
                  <td>{c.detalle_entregado || '—'}</td>
                  <td className="acc">
                    <button title="Ver QR" onClick={() => verQR(c.codigo)}>
                      👁️
                    </button>
                    <button title="Descargar" onClick={() => descargarUno(c.codigo)}>
                      ⬇️
                    </button>
                    <button title="Compartir" onClick={() => compartir(c.codigo)}>
                      📤
                    </button>
                  </td>
                </tr>
              ))}
              {cupones.length === 0 && (
                <tr>
                  <td colSpan="9" className="vacio">
                    {cargando ? 'Cargando...' : 'Sin resultados'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {qrModal && (
        <div className="modal" onClick={() => setQrModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>{qrModal.cod}</h3>
            <img src={qrModal.dataUrl} alt="QR" />
            <p className="mono">
              {getCouponUrl(qrModal.cod)}
            </p>
            <div className="modal-acc">
              <button onClick={() => descargarUno(qrModal.cod)}>Descargar PNG</button>
              <button className="btn-sec" onClick={() => setQrModal(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
