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
    // Si tenemos precios específicos por seguro en los datos, usarlos
    if (serviceData.prices_by_insurance && serviceData.prices_by_insurance[insuranceTypeId.toString()]) {
      return serviceData.prices_by_insurance[insuranceTypeId.toString()]
    }
    
    // Si no hay precios por seguro pero hay base_price, devolver eso
    // Esto funciona porque el servidor siempre devuelve base_price como fallback
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

      const url = `/medical/reception/service-price?${params}`
      
      const response = await fetch(url, {
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
      
      // Ensure we always return a number, even if 0
      return typeof data.price === 'number' ? data.price : 0
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener precio del servicio'
      setError(errorMessage)
      console.error('Error getting service price:', errorMessage)
      // Return 0 instead of throwing, so callers can handle it
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