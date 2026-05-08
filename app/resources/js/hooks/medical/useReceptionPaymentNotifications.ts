import { useEcho } from '@laravel/echo-react'
import { useEffectEvent } from 'react'

export interface ReceptionPaymentUpdatedEvent {
  message: string
  service_request: {
    id: number
    request_number: string
    patient_name: string | null
    total_amount: number
    paid_amount: number
    payment_status: 'pending' | 'partial' | 'paid' | 'cancelled'
    status: string
    request_date: string | null
    request_time: string | null
    reception_type: string
    services_count: number
  }
}

export function useReceptionPaymentNotifications(
  onPaymentUpdated: (event: ReceptionPaymentUpdatedEvent) => void,
) {
  const handlePaymentUpdated = useEffectEvent(onPaymentUpdated)

  useEcho<ReceptionPaymentUpdatedEvent>(
    'medical.reception.service-requests',
    '.medical.reception.payment-updated',
    (event) => {
      handlePaymentUpdated(event)
    },
    [],
  )
}
