import { useState, useCallback } from 'react'
import { router } from '@inertiajs/react'
import type { VisitOptions } from '@inertiajs/core'

export interface Specialty {
  id: number
  name: string
  code?: string
  description?: string
  status: 'active' | 'inactive'
  active_professionals_count: number
  primary_professionals_count: number
  created_at: string
  updated_at: string
}

export interface SpecialtiesIndexData {
  data: Specialty[]
  current_page: number
  per_page: number
  total: number
  last_page: number
  from: number
  to: number
  links: Array<{ url: string | null; label: string; active: boolean }>
}

export interface SpecialtiesListData {
  specialties: SpecialtiesIndexData
  filters: {
    search?: string
    status?: string
  }
  stats: {
    total: number
    active: number
    total_professionals: number
  }
}

export interface SpecialtyFormData {
  name: string
  code?: string
  description?: string
  status: 'active' | 'inactive'
}

const useSpecialties = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const index = useCallback((options?: VisitOptions) => {
    setLoading(true)
    setError(null)

    router.get('/medical/specialties', {}, {
      onFinish: () => setLoading(false),
      onError: (errors) => {
        const errorMessage = Object.values(errors).flat().join(', ')
        setError(errorMessage)
      },
      ...options
    })
  }, [])

  const show = useCallback((specialtyId: number, options?: VisitOptions) => {
    setLoading(true)
    setError(null)

    router.get(`/medical/specialties/${specialtyId}`, {}, {
      onFinish: () => setLoading(false),
      onError: (errors) => {
        const errorMessage = Object.values(errors).flat().join(', ')
        setError(errorMessage)
      },
      ...options
    })
  }, [])

  const create = useCallback((options?: VisitOptions) => {
    setLoading(true)
    setError(null)

    router.get('/medical/specialties/create', {}, {
      onFinish: () => setLoading(false),
      onError: (errors) => {
        const errorMessage = Object.values(errors).flat().join(', ')
        setError(errorMessage)
      },
      ...options
    })
  }, [])

  const store = useCallback((data: SpecialtyFormData, options?: VisitOptions) => {
    setLoading(true)
    setError(null)

    router.post('/medical/specialties', data as unknown as Record<string, string | boolean | undefined>, {
      onFinish: () => setLoading(false),
      onError: (errors) => {
        const errorMessage = Object.values(errors).flat().join(', ')
        setError(errorMessage)
      },
      ...options
    })
  }, [])

  const edit = useCallback((specialtyId: number, options?: VisitOptions) => {
    setLoading(true)
    setError(null)

    router.get(`/medical/specialties/${specialtyId}/edit`, {}, {
      onFinish: () => setLoading(false),
      onError: (errors) => {
        const errorMessage = Object.values(errors).flat().join(', ')
        setError(errorMessage)
      },
      ...options
    })
  }, [])

  const update = useCallback((specialtyId: number, data: SpecialtyFormData, options?: VisitOptions) => {
    setLoading(true)
    setError(null)

    router.patch(`/medical/specialties/${specialtyId}`, data as unknown as Record<string, string | boolean | undefined>, {
      onFinish: () => setLoading(false),
      onError: (errors) => {
        const errorMessage = Object.values(errors).flat().join(', ')
        setError(errorMessage)
      },
      ...options
    })
  }, [])

  const destroy = useCallback((specialtyId: number, options?: VisitOptions) => {
    setLoading(true)
    setError(null)

    router.delete(`/medical/specialties/${specialtyId}`, {
      onFinish: () => setLoading(false),
      onError: (errors) => {
        const errorMessage = Object.values(errors).flat().join(', ')
        setError(errorMessage)
      },
      ...options
    })
  }, [])

  const toggleStatus = useCallback((specialtyId: number, options?: VisitOptions) => {
    setLoading(true)
    setError(null)

    router.patch(`/medical/specialties/${specialtyId}/toggle-status`, {}, {
      onFinish: () => setLoading(false),
      onError: (errors) => {
        const errorMessage = Object.values(errors).flat().join(', ')
        setError(errorMessage)
      },
      ...options
    })
  }, [])

  return {
    loading,
    error,
    index,
    show,
    create,
    store,
    edit,
    update,
    destroy,
    toggleStatus,
    clearError: () => setError(null)
  }
}

export default useSpecialties
