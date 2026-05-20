import { useEcho } from '@laravel/echo-react'
import { useEffectEvent } from 'react'
import { usePage } from '@inertiajs/react'

export interface ConsultorioPatientEnteredEvent {
  id: number
  patient: { id: number; name: string }
  doctor_id: number
  status: string
  priority: string | number | null
  created_at?: string | null
}

export function useConsultorioNotifications(
  onEntry: (event: ConsultorioPatientEnteredEvent) => void,
) {
  const page: any = usePage()
  const userId = page.props?.auth?.user?.id
  const handleEntry = useEffectEvent(onEntry)

  useEcho<ConsultorioPatientEnteredEvent>(
    `consultorio.${String(userId ?? '')}`,
    '.consultorio.patient-entered',
    (event) => {
      handleEntry(event)
    },
    [userId],
  )
}

export default useConsultorioNotifications
