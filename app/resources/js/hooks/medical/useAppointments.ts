import { useState } from 'react'
import { router } from '@inertiajs/react'

interface RefreshAppointmentsFilters {
  selected_date: string
  professional_id?: string
}

export function useAppointments() {
  const [loading, setLoading] = useState(false)

  const refreshAppointments = (filters: RefreshAppointmentsFilters) => {
    setLoading(true)
    router.get(
      '/medical/appointments',
      filters,
      {
        only: ['appointments', 'slotBoard'], // Solo actualiza estos props
        preserveState: true,
        preserveScroll: true,
        replace: true, // <- Esto evita recarga completa y mantiene la SPA
        onFinish: () => setLoading(false),
      }
    )
  }

  return { refreshAppointments, loading }
}
