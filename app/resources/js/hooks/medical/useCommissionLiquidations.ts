import { useState, useCallback } from 'react'
import { router } from '@inertiajs/react'
import type { VisitOptions } from '@inertiajs/core'
import { toast } from 'sonner'
import type {
  CommissionLiquidationFormData,
  CommissionPaymentFormData,
  CommissionData,
  CommissionLiquidation,
  CommissionLiquidationDetail,
} from '@/types/commission'

interface CommissionFilters {
  [key: string]: string | undefined
  professional_id?: string
  status?: string
  period_start?: string
  period_end?: string
  search?: string
}

// Commission Routes - usando las URLs directamente
const commissionRoutes = {
  index: '/medical/commissions',
  create: '/medical/commissions/create',
  show: (id: number | string) => `/medical/commissions/${id}`,
  edit: (id: number | string) => `/medical/commissions/${id}/edit`,
  store: '/medical/commissions',
  update: (id: number | string) => `/medical/commissions/${id}`,
  destroy: (id: number | string) => `/medical/commissions/${id}`,
  approve: (id: number | string) => `/medical/commissions/${id}/approve`,
  pay: (id: number | string) => `/medical/commissions/${id}/pay`,
  cancel: (id: number | string) => `/medical/commissions/${id}/cancel`,
  data: '/medical/commission-data'
}

interface UseCommissionLiquidationsReturn {
  // State
  loading: boolean
  error: string | null

  // Actions
  navigateToIndex: (filters?: CommissionFilters) => void
  navigateToCreate: () => void
  navigateToShow: (id: number | string) => void
  navigateToEdit: (id: number | string) => void
  createLiquidation: (data: CommissionLiquidationFormData, options?: VisitOptions) => void
  updateLiquidation: (id: number | string, data: Partial<CommissionLiquidationFormData>, options?: VisitOptions) => void
  deleteLiquidation: (id: number | string, options?: VisitOptions) => void
  approveLiquidation: (id: number | string, options?: VisitOptions) => void
  payLiquidation: (id: number | string, data?: CommissionPaymentFormData, options?: VisitOptions) => void
  cancelLiquidation: (id: number | string, options?: VisitOptions) => void
  getCommissionData: (professionalId: number, startDate: string, endDate: string) => Promise<CommissionData | null>
  getLiquidationDetail: (id: number | string) => Promise<{ liquidation: CommissionLiquidation; services: CommissionLiquidationDetail[] } | null>
  fetchLiquidations: () => Promise<CommissionLiquidation[]>

  // Utils
  refreshCurrentPage: () => void
}

export const useCommissionLiquidations = (): UseCommissionLiquidationsReturn => {
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
  const navigateToIndex = useCallback((filters?: CommissionFilters) => {
    withLoading(() => {
      const url = commissionRoutes.index
      router.get(url, filters as Record<string, string | undefined>, {
        preserveState: true,
        preserveScroll: true,
      })
    })
  }, [withLoading])

  const navigateToCreate = useCallback(() => {
    withLoading(() => {
      router.get(commissionRoutes.create)
    })
  }, [withLoading])

  const navigateToShow = useCallback((id: number | string) => {
    withLoading(() => {
      router.get(commissionRoutes.show(id))
    })
  }, [withLoading])

  const navigateToEdit = useCallback((id: number | string) => {
    withLoading(() => {
      router.get(commissionRoutes.edit(id))
    })
  }, [withLoading])

  // CRUD operations
  const createLiquidation = useCallback((data: CommissionLiquidationFormData, options: VisitOptions = {}) => {
    withLoading(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.post(commissionRoutes.store, data as any, {
        preserveState: true,
        onSuccess: () => {
          setError(null)
        },
        onError: (errors) => {
          console.error('Error creando liquidación:', errors)
          // Extraer mensaje de error del backend
          const errorMessage = errors?.general?.[0] || errors?.message || 'Error al crear la liquidación de comisiones'
          setError(errorMessage)
        },
        ...options
      })
    })
  }, [withLoading])

  const updateLiquidation = useCallback((id: number | string, data: Partial<CommissionLiquidationFormData>, options: VisitOptions = {}) => {
    withLoading(() => {
      router.patch(commissionRoutes.update(id), data, {
        preserveState: true,
        onSuccess: () => {
          setError(null)
        },
        onError: () => {
          setError('Error al actualizar la liquidación de comisiones')
        },
        ...options
      })
    })
  }, [withLoading])

  const deleteLiquidation = useCallback((id: number | string, options: VisitOptions = {}) => {
    withLoading(() => {
      router.delete(commissionRoutes.destroy(id), {
        preserveState: true,
        onSuccess: () => {
          setError(null)
          toast.success('Liquidación eliminada exitosamente')
        },
        onError: (errors) => {
          console.error('Error eliminando liquidación:', errors)
          let errorMessage = 'Error al eliminar la liquidación'
          if (errors?.general) {
            errorMessage = Array.isArray(errors.general) ? errors.general[0] : String(errors.general)
          } else if (errors?.message) {
            errorMessage = String(errors.message)
          }
          setError(errorMessage)
          toast.error(errorMessage)
        },
        ...options
      })
    })
  }, [withLoading])

  // Special actions
  const approveLiquidation = useCallback((id: number | string, options: VisitOptions = {}) => {
    withLoading(() => {
      router.patch(commissionRoutes.approve(id), {}, {
        preserveState: true,
        onSuccess: () => {
          setError(null)
          toast.success('Liquidación aprobada exitosamente')
        },
        onError: (errors) => {
          console.error('Error aprobando liquidación:', errors)
          // Extraer mensaje de error correctamente
          let errorMessage = 'Error al aprobar la liquidación de comisiones'
          if (errors?.general) {
            errorMessage = Array.isArray(errors.general) ? errors.general[0] : String(errors.general)
          } else if (errors?.message) {
            errorMessage = String(errors.message)
          }
          setError(errorMessage)
          toast.error(errorMessage)
        },
        ...options
      })
    })
  }, [withLoading])

  // data argument is optional (some flows mark as paid without extra data)
  const payLiquidation = useCallback((id: number | string, data?: CommissionPaymentFormData, options: VisitOptions = {}) => {
    withLoading(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.patch(commissionRoutes.pay(id), (data || {}) as any, {
        preserveState: true,
        onSuccess: () => {
          setError(null)
          toast.success('Pago procesado exitosamente')
        },
        onError: (errors) => {
          console.error('Error procesando pago:', errors)
          let errorMessage = 'Error al procesar el pago'
          if (errors?.general) {
            errorMessage = Array.isArray(errors.general) ? errors.general[0] : String(errors.general)
          } else if (errors?.message) {
            errorMessage = String(errors.message)
          }
          setError(errorMessage)
          toast.error(errorMessage)
        },
        ...options
      })
    })
  }, [withLoading])

  const cancelLiquidation = useCallback((id: number | string, options: VisitOptions = {}) => {
    withLoading(() => {
      router.patch(commissionRoutes.cancel(id), {}, {
        preserveState: true,
        onSuccess: () => {
          setError(null)
          toast.success('Liquidación cancelada exitosamente')
        },
        onError: (errors) => {
          console.error('Error cancelando liquidación:', errors)
          let errorMessage = 'Error al cancelar la liquidación de comisiones'
          if (errors?.general) {
            errorMessage = Array.isArray(errors.general) ? errors.general[0] : String(errors.general)
          } else if (errors?.message) {
            errorMessage = String(errors.message)
          }
          setError(errorMessage)
          toast.error(errorMessage)
        },
        ...options
      })
    })
  }, [withLoading])

  // API methods
  
    // Fetch a single liquidation detail (liquidation + services)
    const getLiquidationDetail = useCallback(async (id: number | string): Promise<{ liquidation: CommissionLiquidation; services: CommissionLiquidationDetail[] } | null> => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(commissionRoutes.show(id), {
          headers: {
            'Accept': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error('Error al obtener detalles de la liquidación')
        }

        const data = await response.json()
        return data
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al obtener los detalles de la liquidación')
        return null
      } finally {
        setLoading(false)
      }
    }, [])
  const getCommissionData = useCallback(async (
    professionalId: number,
    startDate: string,
    endDate: string
  ): Promise<CommissionData | null> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(commissionRoutes.data, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          professional_id: professionalId,
          start_date: startDate,
          end_date: endDate,
        }),
      })

      if (!response.ok) {
        if (response.status === 419) {
          setError('Sesión expirada. Por favor, recargue la página.')
          return null
        }
        const errorData = await response.json().catch(() => ({ error: 'Error al obtener los datos de comisión' }))
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (err) {
      if (!error) { // Solo setear si no se seteó antes (como en el caso del 419)
        setError(err instanceof Error ? err.message : 'Error al obtener los datos de comisión')
      }
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Utility methods
  const refreshCurrentPage = useCallback(() => {
    router.reload()
  }, [])

  // Obtener liquidaciones desde el backend
  const fetchLiquidations = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(commissionRoutes.index, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        },
      })
      if (!response.ok) {
        throw new Error('Error al obtener las liquidaciones')
      }
      const data = await response.json()
      // Si la respuesta tiene una clave 'liquidations', úsala
      if (Array.isArray(data)) return data
      if (Array.isArray(data.liquidations)) return data.liquidations
      return []
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al obtener las liquidaciones')
      return []
    } finally {
      setLoading(false)
    }
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
    createLiquidation,
    updateLiquidation,
    deleteLiquidation,
    approveLiquidation,
    payLiquidation,
    cancelLiquidation,
    getCommissionData,
    getLiquidationDetail,
    fetchLiquidations,

    // Utils
    refreshCurrentPage,
  }
}

export type { CommissionFilters, UseCommissionLiquidationsReturn }