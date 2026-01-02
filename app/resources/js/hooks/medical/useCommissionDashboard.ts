import { useState, useEffect, useCallback } from 'react'

export interface CommissionDashboardData {
  summary: {
    total_commissions: number
    active_professionals: number
    total_liquidations: number
    pending_liquidations: number
    growth_rate: number
  }
  monthly_trend: Array<{
    month: string
    amount: number
    liquidations: number
  }>
  pending_approvals: Array<{
    id: number
    professional_name: string
    period_start: string
    period_end: string
    commission_amount: number
    days_pending: number
  }>
  top_professionals: Array<{
    id: number
    name: string
    specialty: string
    total_commissions: number
    liquidations_count: number
  }>
  recent_liquidations: Array<{
    id: number
    professional_name: string
    specialty_name: string
    period_start: string
    period_end: string
    commission_amount: number
    status: string
    created_at: string
  }>
}

interface UseCommissionDashboardReturn {
  data: CommissionDashboardData | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useCommissionDashboard(): UseCommissionDashboardReturn {
  const [data, setData] = useState<CommissionDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/medical/commissions/dashboard-data')
      if (!response.ok) {
        throw new Error('Error al cargar datos del dashboard')
      }

      const dashboardData = await response.json()
      setData(dashboardData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      console.error('Error loading commission dashboard:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  }
}
