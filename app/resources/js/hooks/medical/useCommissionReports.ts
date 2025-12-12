import { useState, useCallback } from 'react'
import { router } from '@inertiajs/react'
import type { VisitOptions } from '@inertiajs/core'

interface CommissionReportFilters {
  professional_id?: number
  start_date?: string
  end_date?: string
}

// Commission Report Routes
const commissionReportRoutes = {
  report: '/medical/commissions-report',
  pending: '/medical/commissions-pending'
}

interface UseCommissionReportsReturn {
  // State
  loading: boolean
  error: string | null

  // Actions
  generateReport: (filters: CommissionReportFilters, options?: VisitOptions) => void
  viewPendingApprovals: (options?: VisitOptions) => void

  // Utils
  refreshCurrentPage: () => void
}

export const useCommissionReports = (): UseCommissionReportsReturn => {
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

  // Report generation
  const generateReport = useCallback((filters: CommissionReportFilters, options: VisitOptions = {}) => {
    withLoading(() => {
      router.get(commissionReportRoutes.report, filters as Record<string, string | undefined>, {
        preserveState: true,
        onSuccess: () => {
          setError(null)
        },
        onError: () => {
          setError('Error al generar el reporte de comisiones')
        },
        ...options
      })
    })
  }, [withLoading])

  // View pending approvals
  const viewPendingApprovals = useCallback((options: VisitOptions = {}) => {
    withLoading(() => {
      router.get(commissionReportRoutes.pending, {}, {
        preserveState: true,
        onSuccess: () => {
          setError(null)
        },
        onError: () => {
          setError('Error al cargar las liquidaciones pendientes')
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
    generateReport,
    viewPendingApprovals,

    // Utils
    refreshCurrentPage,
  }
}

export type { CommissionReportFilters, UseCommissionReportsReturn }