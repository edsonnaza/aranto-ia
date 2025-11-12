import { useState, useCallback } from 'react'

interface ServicePriceResponse {
  price: number
  found: boolean
  source: 'insurance_specific' | 'base_price'
}

export interface UseServicePricingReturn {
  // State
  loading: boolean
  error: string | null
  
  // Actions
  getServicePrice: (serviceId: number, insuranceTypeId: number) => Promise<number>
  getServicePriceFromData: (serviceData: ServiceData, insuranceTypeId: number) => number
  
  // Utils
  clearError: () => void
}

interface ServiceData {
  id?: number
  value?: number // For compatibility with select options
  prices_by_insurance?: Record<string, number>
  base_price: number
}

export const useServicePricing = (): UseServicePricingReturn => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Clear error state
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Get price from service data (if already loaded)
  const getServicePriceFromData = useCallback((serviceData: ServiceData, insuranceTypeId: number): number => {
    // Si tenemos precios por seguro en los datos
    if (serviceData.prices_by_insurance && serviceData.prices_by_insurance[insuranceTypeId.toString()]) {
      return serviceData.prices_by_insurance[insuranceTypeId.toString()]
    }
    
    // Fallback al precio base
    return serviceData.base_price || 0
  }, [])

  // Get price via API call (for dynamic updates)
  const getServicePrice = useCallback(async (serviceId: number, insuranceTypeId: number): Promise<number> => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        service_id: serviceId.toString(),
        insurance_type_id: insuranceTypeId.toString()
      })

      const response = await fetch(`/medical/reception/service-price?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: ServicePriceResponse = await response.json()
      return data.price
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener precio del servicio'
      setError(errorMessage)
      console.error('Error getting service price:', err)
      return 0
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    getServicePrice,
    getServicePriceFromData,
    clearError
  }
}