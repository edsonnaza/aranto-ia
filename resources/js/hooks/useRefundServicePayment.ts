import { useState } from 'react'
import { router } from '@inertiajs/react'

interface RefundResult {
  success: boolean
  error?: string
}

export function useRefundServicePayment() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<RefundResult | null>(null)

  const refund = async (serviceRequestId: number) => {
    setLoading(true)
    setError(null)
    setResult(null)
    router.post(
      '/cash-register/refund-service-payment',
      { service_request_id: serviceRequestId },
      {
        preserveScroll: true,
        onSuccess: (page) => {
          setLoading(false)
          setResult({ success: true })
        },
        onError: (errors) => {
          setLoading(false)
          setError(errors.message || 'Error al procesar el reembolso')
          setResult({ success: false, error: errors.message })
        },
      }
    )
  }

  return { refund, loading, error, result }
}
