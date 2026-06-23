export function normalizarCodigoCupon(valor) {
  const texto = String(valor || '').trim()
  if (!texto) return ''

  try {
    const url = new URL(texto, 'https://dulcemezcla.local')
    const partes = url.pathname.split('/').filter(Boolean)
    const cIndex = partes.findIndex((parte) => parte.toLowerCase() === 'c')
    if (cIndex >= 0 && partes[cIndex + 1]) {
      return decodeURIComponent(partes[cIndex + 1]).trim().toUpperCase()
    }
  } catch {
    /* No era una URL valida; se normaliza como texto simple. */
  }

  const matchRuta = texto.match(/(?:^|\/)c\/([^/?#\s]+)/i)
  if (matchRuta) return decodeURIComponent(matchRuta[1]).trim().toUpperCase()

  return texto.replace(/^["']|["']$/g, '').trim().toUpperCase()
}

export function etiquetaEstadoCupon(estado) {
  const etiquetas = {
    DISPONIBLE: 'DISPONIBLE',
    RECLAMADO: 'RECLAMADO',
    REDIMIDO: 'ENTREGADO',
    ANULADO: 'ANULADO',
    ELIMINADO: 'ELIMINADO',
  }
  return etiquetas[estado] || estado || '—'
}
