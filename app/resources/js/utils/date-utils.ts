/**
 * Parse a date string without UTC timezone interpretation
 * 
 * This is crucial for birth dates and other date-only fields that should not be
 * affected by timezone. JavaScript's new Date() interprets dates as UTC, which
 * causes a 1-day offset in some timezones.
 * 
 * Usage:
 * ```tsx
 * import { parseDateWithoutUTC, formatBirthDate } from '@/utils/date-utils'
 * 
 * // Anywhere you need to format a birth_date:
 * const formatted = formatBirthDate(patient.birth_date)
 * 
 * // Or manually:
 * const date = parseDateWithoutUTC('1988-08-28')
 * date.toLocaleDateString('es-PY', { year: 'numeric', month: 'long', day: 'numeric' })
 * ```
 * 
 * @param dateStr - Date string in format 'YYYY-MM-DD' or with timestamp
 * @returns Date object created in local timezone
 */
export function parseDateWithoutUTC(dateStr: string | null | undefined): Date {
  if (!dateStr) return new Date()
  
  // Extract only the date part (YYYY-MM-DD) without timestamp
  const datePart = dateStr.split('T')[0] || dateStr.split(' ')[0]
  if (!datePart) return new Date()
  
  const [year, month, day] = datePart.split('-')
  // Create date with components to avoid UTC interpretation
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
}

/**
 * Format a birth date in the standard format for the app
 * Format: "28 de agosto de 1988" (es-PY locale with full month names)
 * 
 * @param birthDate - Date string from database
 * @returns Formatted date string or 'No especificada' if empty
 */
export function formatBirthDate(
  birthDate: string | null | undefined,
  locale: string = 'es-PY'
): string {
  if (!birthDate) return 'No especificada'
  
  try {
    return parseDateWithoutUTC(birthDate).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return 'Fecha inválida'
  }
}

/**
 * Format a date for input type="date" (YYYY-MM-DD)
 * 
 * @param dateStr - Date string from database
 * @returns Formatted date string for date input or empty string
 */
export function formatDateForInput(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  
  // Extract only the YYYY-MM-DD part
  return dateStr.split('T')[0] || dateStr.split(' ')[0] || ''
}

/**
 * Calculate age from birth date
 * 
 * @param birthDate - Date string from database
 * @returns Age in years or error message
 */
export function calculateAge(birthDate: string | null | undefined): string {
  if (!birthDate) return 'No calculable'
  
  try {
    const today = new Date()
    const birth = parseDateWithoutUTC(birthDate)
    
    if (isNaN(birth.getTime())) {
      return 'Fecha inválida'
    }
    
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    
    return `${age} años`
  } catch {
    return 'Error al calcular'
  }
}
