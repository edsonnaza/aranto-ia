import { useState, useCallback } from 'react'
//import { router } from '@inertiajs/react'

export interface ProfessionalCommission {
  id: number
  professional_id: number
  commission_percentage: number
  created_at: string
  updated_at: string
}

interface UseProfessionalCommissionsReturn {
  loading: boolean
  error: string | null
  updateCommission: (professionalId: number, percentage: number) => Promise<void>
}

export function useProfessionalCommissions(): UseProfessionalCommissionsReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateCommission = useCallback(async (professionalId: number, percentage: number) => {
    setLoading(true)
    setError(null)
    try {
      // Get CSRF token from meta tag
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''

      const response = await fetch(`/medical/commissions/professional/${professionalId}/commission-percentage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-Token': csrfToken,
        },
        credentials: 'same-origin',
        body: JSON.stringify({ commission_percentage: percentage }),
      })

      if (!response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType?.includes('application/json')) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Error al actualizar')
        } else {
          throw new Error('Error al actualizar la comisión')
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    updateCommission,
  }
}
