import { useEffect } from 'react'

export interface ConsultorioEventPayload {
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

export function useConsultorioRealtime(
  doctorId: number | null,
  handlers: {
    onAdded?: (p: ConsultorioEventPayload) => void
    onCalled?: (p: ConsultorioEventPayload) => void
    onInConsultation?: (p: ConsultorioEventPayload) => void
    onFinished?: (p: ConsultorioEventPayload) => void
    /** Play sound when a patient is added? Defaults to true */
    playSound?: boolean
  }
) {
  useEffect(() => {
    if (typeof window === 'undefined' || !window.Echo) return
    if (!doctorId) return

    const channel = window.Echo.private(`consultorio.${doctorId}`)

    const playNotification = () => {
      if (handlers.playSound === false) return
      try {
        const audio = new Audio('/sounds/notify.mp3')
        audio.play().catch(() => {})
      } catch (e) {
        // ignore playback errors (autoplay policies)
      }
    }

    if (handlers.onAdded) channel.listen('.patient.added', (payload: ConsultorioEventPayload) => {
      playNotification()
      handlers.onAdded?.(payload)
    })
    if (handlers.onCalled) channel.listen('.patient.called', handlers.onCalled)
    if (handlers.onInConsultation) channel.listen('.patient.in_consultation', handlers.onInConsultation)
    if (handlers.onFinished) channel.listen('.patient.finished', handlers.onFinished)

    return () => {
      try {
        if (handlers.onAdded) channel.stopListening('.patient.added')
        if (handlers.onCalled) channel.stopListening('.patient.called')
        if (handlers.onInConsultation) channel.stopListening('.patient.in_consultation')
        if (handlers.onFinished) channel.stopListening('.patient.finished')
        window.Echo.leave(`consultorio.${doctorId}`)
      } catch (e) {
        // ignore
      }
    }
  }, [doctorId, handlers.onAdded, handlers.onCalled, handlers.onInConsultation, handlers.onFinished, handlers.playSound])
}

export default useConsultorioRealtime
