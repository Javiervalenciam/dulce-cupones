import Link from 'next/link'

export default function Home() {
  return (
    <main className="card">
      <div className="logo">DM</div>
      <h1>🧁 Dulce Mezcla</h1>
      <p className="promo">Sistema de cupones QR</p>
      <Link className="btn-link" href="/admin">
        Panel de administración
      </Link>
      <Link className="btn-link" href="/caja">
        Vista de caja (stand)
      </Link>
    </main>
  )
}
