import { useCallback, useState } from 'react'

interface ProcessPaymentData {
  service_request_id: number | string
  payment_method: string
  amount: number
  notes?: string
}

interface ProcessOptions {
  onSuccess?: (response: unknown) => void
  onError?: (error: string) => void
}

interface UseProcessServicePaymentReturn {
  loading: boolean
  error: string | null
  processServicePayment: (data: ProcessPaymentData, options?: ProcessOptions) => Promise<void>
}

export const useProcessServicePayment = (): UseProcessServicePaymentReturn => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const processServicePayment = useCallback(async (data: ProcessPaymentData, options: ProcessOptions = {}) => {
    setLoading(true)
    setError(null)

    try {
      const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''

      const response = await fetch('/cash-register/process-service-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': csrf,
        },
        body: JSON.stringify(data),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        // Validation errors or server error
        const message = payload?.message || payload?.error || `HTTP ${response.status}`
        setError(typeof message === 'string' ? message : 'Error al procesar el pago')
        options.onError?.(String(message))
        return
      }

      // Success — call optional callback
      options.onSuccess?.(payload)
      setError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al procesar el pago'
      setError(message)
      options.onError?.(message)
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    processServicePayment,
  }
}

export type { ProcessPaymentData }
