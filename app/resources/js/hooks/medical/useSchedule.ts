import { useCallback, useState } from 'react'
import { router } from '@inertiajs/react'
import type { VisitOptions } from '@inertiajs/core'
import { toast } from 'sonner'

interface ScheduleRulePayload {
  weekday: number
  start_time: string
  end_time: string
  capacity: number
  is_active?: boolean
}

interface SchedulePayload {
  professional_id: number
  name: string
  start_date: string
  end_date?: string
  slot_duration_minutes: number
  status: 'active' | 'inactive'
  notes?: string
  rules: ScheduleRulePayload[]
}

interface BlockPayload {
  professional_id: number
  block_type: 'travel' | 'conference' | 'holiday' | 'vacation' | 'other'
  title: string
  start_datetime: string
  end_datetime: string
  affects_full_day: boolean
  status: 'active' | 'cancelled'
  notes?: string
}

interface AppointmentPayload {
  professional_id: number
  patient_id: number
  medical_service_id?: number
  medical_service_ids?: number[]
  appointment_date: string
  start_time: string
  duration_minutes?: number
  status: 'scheduled' | 'checked_in' | 'completed' | 'cancelled' | 'no_show'
  source: 'agenda' | 'reception' | 'manual'
  notes?: string
  cancellation_reason?: string
}

interface ScheduleFilters {
  professional_id?: string
  date_from?: string
  date_to?: string
  selected_date?: string
  search?: string
  status?: string
  per_page?: number
}

const scheduleRoutes = {
  index: '/medical/schedule',
  scheduleStore: '/medical/schedule/schedules',
  scheduleUpdate: (id: number | string) => `/medical/schedule/schedules/${id}`,
  blockStore: '/medical/schedule/blocks',
  blockUpdate: (id: number | string) => `/medical/schedule/blocks/${id}`,
  appointmentStore: '/medical/schedule/appointments',
  appointmentUpdate: (id: number | string) => `/medical/schedule/appointments/${id}`,
  receptionCreate: '/medical/reception/create',
}

export const useSchedule = () => {
  const [loading, setLoading] = useState(false)
  const [loadingAction, setLoadingAction] = useState<'filters' | 'schedule' | 'block' | 'appointment' | 'reception' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const clearLoading = useCallback(() => {
    setLoading(false)
    setLoadingAction(null)
  }, [])

  const resolveErrorMessage = useCallback((errors: Record<string, string | string[]>) => {
    const firstError = Object.values(errors)[0]

    if (Array.isArray(firstError)) {
      return firstError[0] || 'Ocurrió un error inesperado en Agenda'
    }

    return firstError || 'Ocurrió un error inesperado en Agenda'
  }, [])

  const withLoading = useCallback((action: 'filters' | 'schedule' | 'block' | 'appointment' | 'reception', operation: () => void) => {
    try {
      setLoading(true)
      setLoadingAction(action)
      setError(null)
      operation()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado en Agenda')
      clearLoading()
    }
  }, [clearLoading])

  const navigateWithFilters = useCallback((filters: ScheduleFilters) => {
    withLoading('filters', () => {
      router.get(scheduleRoutes.index, filters, {
        preserveState: true,
        preserveScroll: true,
        onSuccess: (page) => {
          toast.success('Panel actualizado correctamente.')
        },
        onError: (errors) => {
          const message = resolveErrorMessage(errors)
          setError(message)
          toast.error(message)
        },
        onFinish: clearLoading,
        onCancel: clearLoading,
      })
    })
  }, [clearLoading, resolveErrorMessage, withLoading])

  const saveSchedule = useCallback((data: SchedulePayload, scheduleId?: number, options: VisitOptions = {}) => {
    withLoading('schedule', () => {
      const url = scheduleId ? scheduleRoutes.scheduleUpdate(scheduleId) : scheduleRoutes.scheduleStore
      const successMessage = scheduleId ? 'Agenda actualizada correctamente.' : 'Agenda guardada correctamente.'
      const requestOptions: VisitOptions = {
        preserveScroll: true,
        onSuccess: (page) => {
          toast.success(successMessage)
          options.onSuccess?.(page)
        },
        onError: (errors) => {
          const message = resolveErrorMessage(errors)
          setError(message)
          toast.error(message)
          options.onError?.(errors)
        },
        onFinish: (visit) => {
          clearLoading()
          options.onFinish?.(visit)
        },
        onCancel: () => {
          clearLoading()
          options.onCancel?.()
        },
        ...options,
      }

      if (scheduleId) {
        router.patch(url, data, requestOptions)
        return
      }

      router.post(url, data, requestOptions)
    })
  }, [clearLoading, resolveErrorMessage, withLoading])

  const saveBlock = useCallback((data: BlockPayload, blockId?: number, options: VisitOptions = {}) => {
    withLoading('block', () => {
      const url = blockId ? scheduleRoutes.blockUpdate(blockId) : scheduleRoutes.blockStore
      const successMessage = blockId ? 'Bloqueo actualizado correctamente.' : 'Bloqueo registrado correctamente.'
      const requestOptions: VisitOptions = {
        preserveScroll: true,
        onSuccess: (page) => {
          toast.success(successMessage)
          options.onSuccess?.(page)
        },
        onError: (errors) => {
          const message = resolveErrorMessage(errors)
          setError(message)
          toast.error(message)
          options.onError?.(errors)
        },
        onFinish: (visit) => {
          clearLoading()
          options.onFinish?.(visit)
        },
        onCancel: () => {
          clearLoading()
          options.onCancel?.()
        },
        ...options,
      }

      if (blockId) {
        router.patch(url, data, requestOptions)
        return
      }

      router.post(url, data, requestOptions)
    })
  }, [clearLoading, resolveErrorMessage, withLoading])

  const saveAppointment = useCallback((data: AppointmentPayload, appointmentId?: number, options: VisitOptions = {}) => {
    withLoading('appointment', () => {
      const url = appointmentId ? scheduleRoutes.appointmentUpdate(appointmentId) : scheduleRoutes.appointmentStore
      const successMessage = appointmentId ? 'Cita actualizada correctamente.' : 'Cita registrada correctamente.'
      const requestOptions: VisitOptions = {
        preserveScroll: true,
        onSuccess: (page) => {
          toast.success(successMessage)
          options.onSuccess?.(page)
        },
        onError: (errors) => {
          const message = resolveErrorMessage(errors)
          setError(message)
          toast.error(message)
          options.onError?.(errors)
        },
        onFinish: (visit) => {
          clearLoading()
          options.onFinish?.(visit)
        },
        onCancel: () => {
          clearLoading()
          options.onCancel?.()
        },
        ...options,
      }

      if (appointmentId) {
        router.patch(url, data, requestOptions)
        return
      }

      router.post(url, data, requestOptions)
    })
  }, [clearLoading, resolveErrorMessage, withLoading])

  const goToReceptionFromAppointment = useCallback((appointmentId: number) => {
    withLoading('reception', () => {
      router.get(scheduleRoutes.receptionCreate, { appointment_id: appointmentId }, {
        onSuccess: () => {
          toast.success('Redirigiendo a Recepción...')
        },
        onError: (errors) => {
          const message = resolveErrorMessage(errors)
          setError(message)
          toast.error(message)
        },
        onFinish: clearLoading,
        onCancel: clearLoading,
      })
    })
  }, [clearLoading, resolveErrorMessage, withLoading])

  return {
    loading,
    loadingAction,
    error,
    navigateWithFilters,
    saveSchedule,
    saveBlock,
    saveAppointment,
    goToReceptionFromAppointment,
  }
}

export type {
  SchedulePayload,
  ScheduleRulePayload,
  BlockPayload,
  AppointmentPayload,
  ScheduleFilters,
}