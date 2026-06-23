import Link from 'next/link'

export default function Home() {
  return (
    <main className="ops-shell home-shell">
      <div className="ops-scallop ops-scallop--top" aria-hidden="true" />

      <section className="home-panel" aria-labelledby="home-title">
        <div className="home-logo">
          <div className="ops-logo-ring">
            <img src="/logo.png" alt="Dulce Mezcla" width="104" height="104" />
          </div>
        </div>

        <p className="ops-eyebrow">PASTELERÍA &amp; REPOSTERÍA</p>
        <h1 id="home-title">Dulce Mezcla</h1>
        <p className="home-lead">Sistema de cupones QR para administrar beneficios y validar entregas.</p>

        <div className="home-actions" aria-label="Accesos principales">
          <Link className="home-option home-option--admin" href="/admin">
            <span className="home-option-icon" aria-hidden="true">
              ✦
            </span>
            <span>
              <strong>Panel de administración</strong>
              <small>Crear lotes, revisar estados y descargar QRs.</small>
            </span>
          </Link>

          <Link className="home-option home-option--cash" href="/caja">
            <span className="home-option-icon" aria-hidden="true">
              ✓
            </span>
            <span>
              <strong>Vista de caja</strong>
              <small>Escanear cupones reclamados y confirmar entregas.</small>
            </span>
          </Link>
        </div>

        <p className="home-note">Acceso privado para el equipo de Dulce Mezcla.</p>
      </section>

      <div className="ops-scallop ops-scallop--bottom" aria-hidden="true" />
    </main>
  )
}
