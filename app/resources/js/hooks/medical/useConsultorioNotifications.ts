import { useEffect } from 'react'
import { usePage } from '@inertiajs/react'

export interface ConsultorioEventPayload {
  id: number
  patient: { id: number; name: string }
  doctor_id: number
  status: string
  priority?: string | null
  created_at?: string | null
}

export function useConsultorioNotifications(onEvent: (payload: ConsultorioEventPayload) => void) {
  const page: any = usePage()
  const userId = page.props?.auth?.user?.id

  useEffect(() => {
    if (!userId || typeof window === 'undefined' || !window.Echo) return

    const channel = window.Echo.private(`consultorio.${userId}`)
    const events = ['.patient.added', '.patient.called', '.patient.in_consultation', '.patient.finished']

    const handler = (payload: ConsultorioEventPayload) => {
      try { onEvent(payload) } catch (e) { console.error('consultorio event handler error', e) }
    }

    events.forEach((ev) => channel.listen(ev, handler))

    return () => {
      try {
        events.forEach((ev) => channel.stopListening(ev))
        window.Echo.leave(`consultorio.${userId}`)
      } catch (e) {
        // ignore
      }
    }
  }, [userId, onEvent])
}

export default useConsultorioNotifications
