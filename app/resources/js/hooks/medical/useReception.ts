import { useState, useCallback } from 'react'
import { router } from '@inertiajs/react'

interface ReceptionStats {
  pending_requests: number
  confirmed_requests: number
  in_progress_requests: number
  completed_requests: number
}

interface RecentRequest {
  id: number
  request_number: string
  patient_name: string
  patient_document: string
  status: string
  priority: string
  services_count: number
  total_amount: number
  created_at: string
}

interface PatientOption {
  value: number
  label: string
  full_name: string
  document: string
}

interface ServiceCategory {
  category: string
  services: Array<{
    value: number
    label: string
    name: string
    code: string
    base_price: number
    estimated_duration: number
  }>
}

interface ProfessionalOption {
  value: number
  label: string
  full_name: string
  specialty: string
}

interface InsuranceOption {
  value: number
  label: string
  name: string
  coverage_percentage: number
}

interface ReceptionCreateData {
  patients: PatientOption[]
  medicalServices: ServiceCategory[]
  professionals: ProfessionalOption[]
  insuranceTypes: InsuranceOption[]
}

interface UseReceptionReturn {
  // State
  loading: boolean
  error: string | null
  
  // Navigation
  navigateToReceptionDashboard: () => void
  navigateToCreateServiceRequest: () => void
  
  // Utils
  refreshCurrentPage: () => void
}

// Reception Routes
const receptionRoutes = {
  index: '/medical/reception',
  create: '/medical/reception/create'
}

export const useReception = (): UseReceptionReturn => {
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
  const navigateToReceptionDashboard = useCallback(() => {
    withLoading(() => {
      router.get(receptionRoutes.index)
    })
  }, [withLoading])

  const navigateToCreateServiceRequest = useCallback(() => {
    withLoading(() => {
      router.get(receptionRoutes.create)
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
    
    // Navigation
    navigateToReceptionDashboard,
    navigateToCreateServiceRequest,
    
    // Utils
    refreshCurrentPage,
  }
}

export type { 
  ReceptionStats, 
  RecentRequest, 
  PatientOption, 
  ServiceCategory, 
  ProfessionalOption, 
  InsuranceOption, 
  ReceptionCreateData,
  UseReceptionReturn 
}