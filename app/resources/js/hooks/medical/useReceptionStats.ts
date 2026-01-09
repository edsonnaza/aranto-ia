import { useState, useEffect, useCallback } from 'react'

export interface ReceptionStatsData {
  total_requests: number
  total_pending_count: number
  total_paid_count: number
}

export interface UseReceptionStatsReturn {
  stats: ReceptionStatsData | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export const useReceptionStats = (dateFrom?: string, dateTo?: string): UseReceptionStatsReturn => {
  const [stats, setStats] = useState<ReceptionStatsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (dateFrom) params.append('date_from', dateFrom)
      if (dateTo) params.append('date_to', dateTo)

      const url = `/medical/reception/stats${params.toString() ? '?' + params.toString() : ''}`
      
      console.log('Fetching stats from:', url)
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        }
      })

      console.log('Response status:', response.status)
      
      if (!response.ok) {
        const text = await response.text()
        console.error('Error response:', text)
        throw new Error(`Error al cargar las estadísticas: ${response.status}`)
      }

      const data = await response.json()
      console.log('Stats data received:', data)
      
      setStats(data.stats as ReceptionStatsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      console.error('Error fetching reception stats:', err)
    } finally {
      setLoading(false)
    }
  }, [dateFrom, dateTo])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const refresh = async () => {
    await fetchStats()
  }

  return {
    stats,
    loading,
    error,
    refresh
  }
}
