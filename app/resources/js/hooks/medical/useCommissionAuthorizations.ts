import { useState, useCallback } from 'react'
import { router } from '@inertiajs/react'
import type { VisitOptions } from '@inertiajs/core'
import { toast } from 'sonner'

interface AuthorizationFilters {
  authorization_date_from: string
  authorization_date_to: string
  authorization_professional_id?: string
}

interface UseCommissionAuthorizationsReturn {
  loading: boolean
  filterAuthorizations: (filters: AuthorizationFilters) => void
  setConsultationAuthorization: (serviceRequestId: number, authorized: boolean, options?: VisitOptions) => void
  bulkAuthorizeAll: (filters: AuthorizationFilters) => void
}

const routes = {
  index: '/medical/commissions',
  authorize: (serviceRequestId: number) => `/medical/commissions/service-requests/${serviceRequestId}/authorize`,
  bulkAuthorize: '/medical/commissions/service-requests/bulk-authorize',
}

export const useCommissionAuthorizations = (): UseCommissionAuthorizationsReturn => {
  const [loading, setLoading] = useState(false)

  const filterAuthorizations = useCallback((filters: AuthorizationFilters) => {
    setLoading(true)

    router.get(
      routes.index,
      {
        tab: 'authorizations',
        authorization_date_from: filters.authorization_date_from,
        authorization_date_to: filters.authorization_date_to,
        authorization_professional_id: filters.authorization_professional_id,
      },
      {
        preserveState: true,
        preserveScroll: true,
        replace: true,
        onFinish: () => setLoading(false),
      }
    )
  }, [])

  const setConsultationAuthorization = useCallback((serviceRequestId: number, authorized: boolean, options: VisitOptions = {}) => {
    setLoading(true)

    router.patch(
      routes.authorize(serviceRequestId),
      { authorized },
      {
        preserveScroll: true,
        preserveState: false,
        onSuccess: () => {
          toast.success(authorized
            ? 'Consulta autorizada correctamente.'
            : 'Consulta desautorizada correctamente.')
        },
        onError: (errors) => {
          const general = errors?.general
          const message =
            (Array.isArray(general) ? general[0] : general) ||
            errors?.message ||
            (authorized
              ? 'No se pudo autorizar la consulta.'
              : 'No se pudo desautorizar la consulta.')

          toast.error(String(message))
        },
        onFinish: () => setLoading(false),
        ...options,
      }
    )
  }, [])

  const bulkAuthorizeAll = useCallback((filters: AuthorizationFilters) => {
    setLoading(true)

    router.post(
      routes.bulkAuthorize,
      {
        authorization_date_from: filters.authorization_date_from,
        authorization_date_to: filters.authorization_date_to,
        authorization_professional_id: filters.authorization_professional_id,
      },
      {
        preserveScroll: true,
        preserveState: false,
        onSuccess: () => {
          toast.success('Consultas autorizadas en masa correctamente.')
        },
        onError: (errors) => {
          const general = errors?.general
          const message =
            (Array.isArray(general) ? general[0] : general) ||
            errors?.message ||
            'No se pudieron autorizar las consultas.'

          toast.error(String(message))
        },
        onFinish: () => setLoading(false),
      }
    )
  }, [])

  return {
    loading,
    filterAuthorizations,
    setConsultationAuthorization,
    bulkAuthorizeAll,
  }
}
