import { useState, useCallback } from 'react'
import { router } from '@inertiajs/react'
import type { VisitOptions } from '@inertiajs/core'

interface ServiceRequest {
  id: number
  request_number: string
  patient_name: string
  patient_document: string
  request_date: string
  request_time: string
  status: string
  reception_type: string
  priority: string
  total_amount: number
  paid_amount: number
  payment_status: string
  remaining_amount: number
  services_count: number
  created_by: string
  created_at: string
  patient?: {
    id: number
    name: string
    last_name: string
    phone?: string
    email?: string
  }
  service_details?: Array<{
    id: number
    service_name: string
    quantity: number
    unit_price: number
    total: number
  }>
}

interface ServiceRequestsIndexData {
  data: ServiceRequest[]
  links: {
    first?: string
    last?: string
    prev?: string
    next?: string
  }
  meta: {
    current_page: number
    from?: number
    last_page: number
    path: string
    per_page: number
    to?: number
    total: number
  }
}

interface ServiceRequestFilters {
  [key: string]: string | undefined
  status?: string
  payment_status?: string
  reception_type?: string
  date_from?: string
  date_to?: string
  search?: string
}

interface ServiceData {
  medical_service_id: number
  professional_id: number
  insurance_type_id: number
  scheduled_date?: string
  scheduled_time?: string
  estimated_duration?: number
  unit_price: number
  quantity: number
  discount_percentage?: number
  discount_amount?: number
  preparation_instructions?: string
  notes?: string
}

interface CreateServiceRequestData {
  [key: string]: string | number | boolean | ServiceData[] | undefined
  patient_id: number
  reception_type: string
  priority: string
  request_date: string
  request_time?: string
  notes?: string
  services: ServiceData[]
}

// Service Request Routes - usando las URLs directamente
const serviceRequestRoutes = {
  index: '/medical/service-requests',
  create: '/medical/service-requests/create',
  show: (id: number | string) => `/medical/service-requests/${id}`,
  edit: (id: number | string) => `/medical/service-requests/${id}/edit`,
  store: '/medical/service-requests',
  update: (id: number | string) => `/medical/service-requests/${id}`,
  destroy: (id: number | string) => `/medical/service-requests/${id}`,
  confirm: (id: number | string) => `/medical/service-requests/${id}/confirm`,
  cancel: (id: number | string) => `/medical/service-requests/${id}/cancel`
}

interface UseServiceRequestsReturn {
  // State
  loading: boolean
  error: string | null
  
  // Actions
  navigateToIndex: (filters?: ServiceRequestFilters) => void
  navigateToCreate: () => void
  navigateToShow: (id: number | string) => void
  navigateToEdit: (id: number | string) => void
  createServiceRequest: (data: CreateServiceRequestData, options?: VisitOptions) => void
  updateServiceRequest: (id: number | string, data: Partial<CreateServiceRequestData>, options?: VisitOptions) => void
  deleteServiceRequest: (id: number | string, options?: VisitOptions) => void
  confirmServiceRequest: (id: number | string, options?: VisitOptions) => void
  cancelServiceRequest: (id: number | string, reason: string, options?: VisitOptions) => void
  
  // Utils
  refreshCurrentPage: () => void
}

export const useServiceRequests = (): UseServiceRequestsReturn => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Utility to handle loading states
  const withLoading = useCallback(async (operation: () => void) => {
    try {
      setLoading(true)
      setError(null)
      operation()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado')
    } finally {
      setLoading(false)
    }
  }, [])

  // Navigation methods
  const navigateToIndex = useCallback((filters?: ServiceRequestFilters) => {
    withLoading(() => {
      const url = serviceRequestRoutes.index
      router.get(url, filters as Record<string, string | undefined>, {
        preserveState: true,
        preserveScroll: true,
      })
    })
  }, [withLoading])

  const navigateToCreate = useCallback(() => {
    withLoading(() => {
      router.get(serviceRequestRoutes.create)
    })
  }, [withLoading])

  const navigateToShow = useCallback((id: number | string) => {
    withLoading(() => {
      router.get(serviceRequestRoutes.show(id))
    })
  }, [withLoading])

  const navigateToEdit = useCallback((id: number | string) => {
    withLoading(() => {
      router.get(serviceRequestRoutes.edit(id))
    })
  }, [withLoading])

  // CRUD operations
  const createServiceRequest = useCallback((data: CreateServiceRequestData, options: VisitOptions = {}) => {
    withLoading(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.post(serviceRequestRoutes.store, data as any, {
        preserveState: true,
        onSuccess: () => {
          setError(null)
        },
        onError: () => {
          setError('Error al crear la solicitud de servicio')
        },
        ...options
      })
    })
  }, [withLoading])

  const updateServiceRequest = useCallback((id: number | string, data: Partial<CreateServiceRequestData>, options: VisitOptions = {}) => {
    withLoading(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.patch(serviceRequestRoutes.update(id), data as any, {
        preserveState: true,
        onSuccess: () => {
          setError(null)
        },
        onError: () => {
          setError('Error al actualizar la solicitud de servicio')
        },
        ...options
      })
    })
  }, [withLoading])

  const deleteServiceRequest = useCallback((id: number | string, options: VisitOptions = {}) => {
    withLoading(() => {
      router.delete(serviceRequestRoutes.destroy(id), {
        preserveState: true,
        onSuccess: () => {
          setError(null)
        },
        onError: () => {
          setError('Error al eliminar la solicitud de servicio')
        },
        ...options
      })
    })
  }, [withLoading])

  // Special actions
  const confirmServiceRequest = useCallback((id: number | string, options: VisitOptions = {}) => {
    withLoading(() => {
      router.patch(serviceRequestRoutes.confirm(id), {}, {
        preserveState: true,
        onSuccess: () => {
          setError(null)
        },
        onError: () => {
          setError('Error al confirmar la solicitud de servicio')
        },
        ...options
      })
    })
  }, [withLoading])

  const cancelServiceRequest = useCallback((id: number | string, reason: string, options: VisitOptions = {}) => {
    withLoading(() => {
      router.patch(serviceRequestRoutes.cancel(id), { cancellation_reason: reason }, {
        preserveState: true,
        onSuccess: () => {
          setError(null)
        },
        onError: () => {
          setError('Error al cancelar la solicitud de servicio')
        },
        ...options
      })
    })
  }, [withLoading])

  // Utility methods
  const refreshCurrentPage = useCallback(() => {
    router.reload()
  }, [])

  return {
    // State
    loading,
    error,
    
    // Actions
    navigateToIndex,
    navigateToCreate,
    navigateToShow,
    navigateToEdit,
    createServiceRequest,
    updateServiceRequest,
    deleteServiceRequest,
    confirmServiceRequest,
    cancelServiceRequest,
    
    // Utils
    refreshCurrentPage,
  }
}

export type { ServiceRequest, ServiceRequestFilters, ServiceRequestsIndexData, CreateServiceRequestData, UseServiceRequestsReturn }