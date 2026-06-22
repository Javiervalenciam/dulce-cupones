// Devuelve true si el cupon esta vencido (vence_en es 'YYYY-MM-DD').
// Es valido durante todo el dia de vencimiento.
export function estaVencido(vence_en) {
  if (!vence_en) return false
  const hoy = new Date().toISOString().slice(0, 10)
  return vence_en < hoy
}
