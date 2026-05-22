import React from 'react'
import { usePage } from '@inertiajs/react'
import useConsultorioRealtime from '@/hooks/medical/useConsultorioRealtime'

interface Props {
  refresh: () => void
}

export default function QueueNotifier({ refresh }: Props) {
  const page = usePage<any>()
  const doctorId = page.props?.auth?.user?.id ?? null

  useConsultorioRealtime(doctorId, {
    onAdded: () => {
      // Refresh the doctor's queue UI when a new patient is enqueued
      try {
        refresh()
      } catch (e) {
        // ignore
      }
    },
    playSound: true,
  })

  return null
}
