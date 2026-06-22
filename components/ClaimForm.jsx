'use client'
import { useState } from 'react'
import ShareButtons from './ShareButtons'

export default function ClaimForm({ codigo, promocion, descripcion, vence, url }) {
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [estado, setEstado] = useState('form') // form | ok | error
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  async function reclamar(e) {
    e.preventDefault()
    setCargando(true)
    const res = await fetch('/api/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo, nombre, telefono }),
    })
    const json = await res.json()
    setCargando(false)
    if (json.ok) setEstado('ok')
    else {
      setEstado('error')
      setMensaje(json.error)
    }
  }

  if (estado === 'ok') {
    return (
      <main className="card">
        <div className="logo">DM</div>
        <h1>✅ ¡Listo, {nombre}!</h1>
        <p>Muestra esta pantalla en el stand de Dulce Mezcla para recibir tu sorpresa.</p>
        <div className="codigo">{codigo}</div>
        <ShareButtons url={url} texto={`Mira mi cupón de Dulce Mezcla: ${promocion || ''}`} />
      </main>
    )
  }

  return (
    <main className="card">
      <div className="logo">DM</div>
      <h1>🧁 Dulce Mezcla</h1>
      <h2 className="promo">{promocion || 'Tu cupón especial'}</h2>
      <p>{descripcion}</p>
      {vence && <p className="vence">Válido hasta {vence}</p>}
      <form onSubmit={reclamar}>
        <input
          required
          placeholder="Tu nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
        <input
          required
          placeholder="Tu teléfono / WhatsApp"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
        />
        <button disabled={cargando}>{cargando ? 'Activando...' : 'Activar mi cupón'}</button>
      </form>
      {estado === 'error' && <p className="error">{mensaje}</p>}
    </main>
  )
}
