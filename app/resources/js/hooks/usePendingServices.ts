import { useState, useCallback } from "react"
import { router, usePage } from "@inertiajs/react"

export interface PendingServicesFilters {
  status?: string
  date_from?: string
  date_to?: string
  search?: string
  professional_id?: string
  [key: string]: string | undefined
}

export interface ServiceRequest {
  id: number
  status: string
  date: string
  professional_id: number
  // Add other relevant fields as needed
}

export interface Professional {
  id: number
  name: string
  // Add other relevant fields as needed
}

export interface PendingServicesHookResult {
  serviceRequests: ServiceRequest[]
  professionals: Professional[]
  filters: PendingServicesFilters
  loading: boolean
  error: string | null
  setFilters: (newFilters: PendingServicesFilters) => void
}

export function usePendingServices(initialFilters: PendingServicesFilters): PendingServicesHookResult {
  const { props } = usePage()
  const [filters, setFilters] = useState<PendingServicesFilters>(initialFilters)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Actualiza los filtros y refresca los datos usando Inertia
  const updateFilters = useCallback((newFilters: PendingServicesFilters) => {
    setLoading(true)
    setFilters(prev => ({ ...prev, ...newFilters }))
    const mergedFilters = { ...filters, ...newFilters }
    const filteredFilters: Record<string, string> = Object.fromEntries(
      Object.entries(mergedFilters).filter(([, v]) => typeof v === "string" && v !== undefined)
        .map(([k, v]) => [k, v as string])
    )
    const params = new URLSearchParams(filteredFilters)
    router.get(
      window.location.pathname + "?" + params.toString(),
      {},
      {
        preserveState: true,
        replace: true,
        onFinish: () => setLoading(false),
        onError: () => setError("Error al cargar los datos")
      }
    )
  }, [filters])

  // Los datos se actualizan automáticamente por Inertia
  return {
    serviceRequests: props.serviceRequests as ServiceRequest[],
    professionals: props.professionals as Professional[],
    filters,
    loading,
    error,
    setFilters: updateFilters
  }
}
