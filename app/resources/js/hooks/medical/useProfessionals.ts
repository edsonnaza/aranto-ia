import { useState, useEffect } from 'react'
import { router } from '@inertiajs/react'

export interface Professional {
  id: number
  first_name: string
  last_name: string
  full_name: string
  document_type: string
  document_number: string
  phone?: string
  email?: string
  status: string
  commission_percentage: number
}

export interface UseProfessionalsReturn {
  professionals: Professional[]
  loading: boolean
  error: string | null
  refetch: () => void
}

/**
 * Hook para cargar profesionales activos
 * Usado en selectors y listados del módulo médico
 * Ruta: GET /medical/reception/professionals
 */
export function useProfessionals(): UseProfessionalsReturn {
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfessionals = () => {
    setLoading(true)
    setError(null)

    fetch('/medical/reception/professionals')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to fetch professionals')
        }
        return response.json()
      })
      .then((data) => {
        setProfessionals(data.professionals || [])
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error fetching professionals:', err)
        setError(err.message || 'Error loading professionals')
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchProfessionals()
  }, [])

  return {
    professionals,
    loading,
    error,
    refetch: fetchProfessionals,
  }
}
