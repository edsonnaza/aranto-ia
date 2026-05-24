import { useEffect } from 'react'

export interface QueuePatient {
  id: number
  name: string
}

export interface RealtimePayload {
  id: number
  patient: QueuePatient
  doctor_id: number
  status: 'waiting' | 'called' | 'in_consultation' | 'done' | string
  priority?: string | null
  created_at?: string | null
  called_at?: string | null
  started_at?: string | null
  finished_at?: string | null
}

export interface QueueItem {
  id: number
  patient: {
    id: number
    first_name: string
    last_name: string
    display: string
  }
  status: 'waiting' | 'called' | 'in_consultation' | string
  priority: string | null
  created_at: string
  called_at?: string | null
  started_at?: string | null
  finished_at?: string | null
}

export interface PaginationLink {
  url: string | null
  label: string
  active: boolean
}

export interface QueuePagination {
  data: QueueItem[]
  current_page: number
  last_page: number
  per_page: number
  total: number
  links: PaginationLink[]
}

export interface ConsultorioRealtimeHandlers {
  onPatientAdded?: (payload: RealtimePayload) => void
  onPatientCalled?: (payload: RealtimePayload) => void
  onPatientStarted?: (payload: RealtimePayload) => void
  onPatientFinished?: (payload: RealtimePayload) => void
  playSound?: boolean
}

const getDoctorChannel = (doctorId: number) => `doctor.${doctorId}.queue`

export function useConsultorioRealtime(
  doctorId: number | null,
  handlers: ConsultorioRealtimeHandlers
) {
  const {
    onPatientAdded,
    onPatientCalled,
    onPatientStarted,
    onPatientFinished,
    playSound = true,
  } = handlers

  useEffect(() => {
    if (typeof window === 'undefined' || !window.Echo || !doctorId) return

    const channel = window.Echo.private(getDoctorChannel(doctorId))

    const playDing = (eventType: 'added' | 'called') => {
      if (!playSound) return
      try {
        const audio = new Audio('/sounds/notify.mp3')
        audio.play().catch(() => {})
      } catch (error) {
        // ignore playback errors
      }
    }

    if (onPatientAdded) {
      channel.listen('.patient.added', (payload: RealtimePayload) => {
        playDing('added')
        onPatientAdded(payload)
      })
    }

    if (onPatientCalled) {
      channel.listen('.patient.called', (payload: RealtimePayload) => {
        playDing('called')
        onPatientCalled(payload)
      })
    }

    if (onPatientStarted) {
      channel.listen('.patient.in_consultation', onPatientStarted)
    }

    if (onPatientFinished) {
      channel.listen('.patient.finished', onPatientFinished)
    }

    return () => {
      try {
        if (onPatientAdded) channel.stopListening('.patient.added')
        if (onPatientCalled) channel.stopListening('.patient.called')
        if (onPatientStarted) channel.stopListening('.patient.in_consultation')
        if (onPatientFinished) channel.stopListening('.patient.finished')
        window.Echo.leave(getDoctorChannel(doctorId))
      } catch (error) {
        // ignore cleanup errors
      }
    }
  }, [doctorId, onPatientAdded, onPatientCalled, onPatientStarted, onPatientFinished, playSound])
}

export default useConsultorioRealtime
