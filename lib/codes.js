// Prefijos permitidos para los seriales de cupon.
export const PREFIJOS = ['DULCE', 'MEZCLA']

// Alfabeto sin caracteres ambiguos (sin O, 0, I, 1).
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generarSerial(longitud = 6) {
  let s = ''
  for (let i = 0; i < longitud; i++) {
    s += CHARS[Math.floor(Math.random() * CHARS.length)]
  }
  return s
}

export function nuevoCodigo(prefijo) {
  const p = PREFIJOS.includes(prefijo) ? prefijo : 'DULCE'
  return `${p}-${generarSerial()}`
}
