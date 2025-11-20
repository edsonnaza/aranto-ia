import { useCallback, useState } from 'react'

interface RefundData {
  service_request_id: number | string
  transaction_id: number | string
  amount: number
  reason?: string
}

interface Options {
  onSuccess?: (payload: unknown) => void
  onError?: (error: string) => void
}

export const useRefundServicePayment = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refundServicePayment = useCallback(async (data: RefundData, options: Options = {}) => {
    setLoading(true)
    setError(null)

    try {
      const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''

      const response = await fetch('/cash-register/refund-service-payment', {
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
        const message = payload?.message || payload?.error || `HTTP ${response.status}`
        setError(typeof message === 'string' ? message : 'Error al procesar la devolución')
        options.onError?.(String(message))
        return
      }

      options.onSuccess?.(payload)
      setError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al procesar la devolución'
      setError(message)
      options.onError?.(message)
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    refundServicePayment,
  }
}

export type { RefundData }
