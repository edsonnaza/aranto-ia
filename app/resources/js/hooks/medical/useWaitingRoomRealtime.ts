import { useEffect } from 'react'

export interface WaitingRoomEventPayload {
  id: number
  patient: { id: number; name: string }
  doctor_id?: number
  status?: string
  priority?: string
  called_at?: string
  started_at?: string
  finished_at?: string
  created_at?: string
}

export function useWaitingRoomRealtime(handlers: {
  onAdded?: (p: WaitingRoomEventPayload) => void
  onCalled?: (p: WaitingRoomEventPayload) => void
  onInConsultation?: (p: WaitingRoomEventPayload) => void
  onFinished?: (p: WaitingRoomEventPayload) => void
}) {
  useEffect(() => {
    if (typeof window === 'undefined' || !window.Echo) return

    const channel = window.Echo.channel('waiting-room')

    if (handlers.onAdded) channel.listen('.patient.added', handlers.onAdded)
    if (handlers.onCalled) channel.listen('.patient.called', handlers.onCalled)
    if (handlers.onInConsultation) channel.listen('.patient.in_consultation', handlers.onInConsultation)
    if (handlers.onFinished) channel.listen('.patient.finished', handlers.onFinished)

    return () => {
      try {
        if (handlers.onAdded) channel.stopListening('.patient.added')
        if (handlers.onCalled) channel.stopListening('.patient.called')
        if (handlers.onInConsultation) channel.stopListening('.patient.in_consultation')
        if (handlers.onFinished) channel.stopListening('.patient.finished')
        window.Echo.leave('waiting-room')
      } catch (e) {
        // ignore
      }
    }
  }, [handlers.onAdded, handlers.onCalled, handlers.onInConsultation, handlers.onFinished])
}

export default useWaitingRoomRealtime
