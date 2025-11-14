// utils/useDateFormat.ts
import { useCallback } from "react"

export function useDateFormat() {
  // Convierte dd/mm/yyyy a yyyy-MM-dd
  const toBackend = useCallback((str: string|null) => {
    if (!str) return ''
    const [d, m, y] = str.split('/')
    if (!d || !m || !y) return str
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }, [])

  // Convierte yyyy-MM-dd a dd/mm/yyyy
  const toFrontend = useCallback((str: string|null) => {
    if (!str) return ''
    const [y, m, d] = str.split('-')
    if (!y || !m || !d) return str
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`
  }, [])

  return { toBackend, toFrontend }
}
