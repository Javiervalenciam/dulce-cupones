import './globals.css'

export const metadata = {
  title: 'Dulce Mezcla — Cupones',
  description: 'Cupones QR de Dulce Mezcla Pastelería & Repostería',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
