import { useEcho } from '@laravel/echo-react'
import { useEffectEvent } from 'react'

export interface PendingServicePaymentRequestedEvent {
  message: string
  service_request: {
    id: number
    request_number: string
    patient_name: string | null
    total_amount: number
    request_date: string | null
    request_time: string | null
    reception_type: string
    services_count: number
    status?: string
    payment_status?: string
  }
}

export function useCashRegisterPendingServiceNotifications(
  onPendingServiceCreated: (event: PendingServicePaymentRequestedEvent) => void,
  onPendingServiceCancelled?: (event: PendingServicePaymentRequestedEvent) => void,
) {
  const handlePendingServiceCreated = useEffectEvent(onPendingServiceCreated)
  const handlePendingServiceCancelled = useEffectEvent(onPendingServiceCancelled ?? onPendingServiceCreated)

  useEcho<PendingServicePaymentRequestedEvent>(
    'cash-register.pending-services',
    '.cash-register.pending-service-created',
    (event) => {
      handlePendingServiceCreated(event)
    },
    [],
  )

  useEcho<PendingServicePaymentRequestedEvent>(
    'cash-register.pending-services',
    '.cash-register.pending-service-cancelled',
    (event) => {
      handlePendingServiceCancelled(event)
    },
    [],
  )
}