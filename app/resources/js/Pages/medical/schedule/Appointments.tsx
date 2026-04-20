import type { DateClickArg, EventClickArg, EventContentArg, MoreLinkContentArg } from '@fullcalendar/core'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import { Head, router } from '@inertiajs/react'
import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import AppLayout from '@/layouts/app-layout'
import SearchableInput from '@/components/ui/SearchableInput'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import AppointmentSlotModal from '@/components/medical/schedule/AppointmentSlotModal'
import { useSchedule, useSearch } from '@/hooks/medical'

type ProfessionalOption = {
  id: number
  full_name: string
  specialties: string[]
}

type MedicalServiceOption = {
  id: number
  name: string
  duration_minutes: number
}

type Appointment = {
  id: number
  professional_id: number
  professional_name: string
  patient_id: number
  patient_name: string
  medical_service_id?: number | null
  medical_service_ids?: number[] | null
  medical_service_name?: string | null
  medical_service_names?: string[] | null
  service_request_id?: number | null
  service_request_number?: string | null
  service_request_status?: string | null
  appointment_date: string
  start_time: string
  end_time: string
  duration_minutes: number
  status: 'scheduled' | 'checked_in' | 'completed' | 'cancelled' | 'no_show'
  source: 'agenda' | 'reception' | 'manual'
  notes?: string | null
  cancellation_reason?: string | null
}

type SlotBoardEntry = {
  professional_id: number
  professional_name: string
  date: string
  start_time: string
  end_time: string
  duration_minutes: number
  capacity: number
  occupied_count: number
  available_capacity: number
  slot_status: 'available' | 'partial' | 'occupied' | 'blocked'
  block_title?: string | null
  appointments: Array<{
    id: number
    patient_id: number
    patient_name: string
    medical_service_id?: number | null
    medical_service_ids?: number[] | null
    medical_service_name?: string | null
    medical_service_names?: string[] | null
    service_request_id?: number | null
    service_request_number?: string | null
    service_request_status?: string | null
    status: 'scheduled' | 'checked_in' | 'completed' | 'cancelled' | 'no_show'
    notes?: string | null
  }>
}

interface AppointmentsPageProps {
  professionals: ProfessionalOption[]
  medicalServices: MedicalServiceOption[]
  appointments: Appointment[]
  slotBoard: SlotBoardEntry[]
  filters: {
    professional_id?: number | null
    selected_date: string
    view: 'day' | 'week' | 'month'
    range_start: string
    range_end: string
  }
}

type PanelView = 'range' | 'today' | 'calendar'

export default function AppointmentsPage({
  professionals,
  medicalServices,
  appointments,
  slotBoard,
  filters,
}: AppointmentsPageProps) {
  const { searchPatients, searchProfessionals } = useSearch()
  const { saveAppointment, goToReceptionFromAppointment, loadingAction, error } = useSchedule()

  const [selectedDate, setSelectedDate] = useState(filters.selected_date)
  const [currentView, setCurrentView] = useState<'day' | 'week' | 'month'>(filters.view)
  const [currentPanel, setCurrentPanel] = useState<PanelView>(filters.view === 'day' ? 'today' : 'range')
  const [filterProfessionalId, setFilterProfessionalId] = useState(filters.professional_id ? String(filters.professional_id) : '')
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [calendarAppointmentDetails, setCalendarAppointmentDetails] = useState<Appointment | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<{
    professionalId: number
    professionalName: string
    date: string
    startTime: string
    endTime: string
    durationMinutes: number
  } | null>(null)

  const breadcrumbs = [
    { href: '/dashboard', title: 'Dashboard' },
    { href: '/medical', title: 'Sistema Médico' },
    { href: '/medical/appointments', title: 'Citas' },
  ]

  const getProfessionalName = (professionalId: string) => {
    if (!professionalId) {
      return ''
    }

    return professionals.find((professional) => String(professional.id) === professionalId)?.full_name || ''
  }

  const navigateBoard = (nextDate: string, nextView = currentView, nextProfessionalId = filterProfessionalId) => {
    setSelectedDate(nextDate)
    setCurrentView(nextView)

    if (nextView !== 'day') {
      setCurrentPanel('range')
    }

    router.get('/medical/appointments', {
      selected_date: nextDate,
      view: nextView,
      professional_id: nextProfessionalId || undefined,
    }, {
      preserveState: true,
      preserveScroll: true,
    })
  }

  const changeSelectedDate = (direction: number) => {
    const nextDate = new Date(`${selectedDate}T00:00:00`)

    if (currentView === 'month') {
      nextDate.setMonth(nextDate.getMonth() + direction)
    } else if (currentView === 'week') {
      nextDate.setDate(nextDate.getDate() + (7 * direction))
    } else {
      nextDate.setDate(nextDate.getDate() + direction)
    }

    navigateBoard(nextDate.toISOString().split('T')[0])
  }

  const formattedSelectedDate = new Intl.DateTimeFormat('es-PY', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${selectedDate}T00:00:00`))

  const groupedSlots = slotBoard.reduce<Record<string, SlotBoardEntry[]>>((accumulator, slot) => {
    if (!accumulator[slot.date]) {
      accumulator[slot.date] = []
    }

    accumulator[slot.date].push(slot)
    return accumulator
  }, {})

  const orderedDates = Object.keys(groupedSlots).sort()

  const selectedDateAppointments = appointments
    .filter((appointment) => appointment.appointment_date === selectedDate)
    .sort((left, right) => {
      if (left.start_time === right.start_time) {
        return left.patient_name.localeCompare(right.patient_name, 'es')
      }

      return left.start_time.localeCompare(right.start_time)
    })

  const selectedDateSlots = slotBoard
    .filter((slot) => slot.date === selectedDate)
    .sort((left, right) => {
      if (left.start_time === right.start_time) {
        return left.professional_name.localeCompare(right.professional_name, 'es')
      }

      return left.start_time.localeCompare(right.start_time)
    })

  const professionalsForDailyView = (() => {
    if (filterProfessionalId) {
      return professionals.filter((professional) => String(professional.id) === filterProfessionalId)
    }

    const professionalIdsWithSchedule = new Set<number>()

    selectedDateSlots.forEach((slot) => {
      professionalIdsWithSchedule.add(slot.professional_id)
    })

    selectedDateAppointments.forEach((appointment) => {
      professionalIdsWithSchedule.add(appointment.professional_id)
    })

    return professionals.filter((professional) => professionalIdsWithSchedule.has(professional.id))
  })()

  const slotColumnsByProfessionalForSelectedDate = professionalsForDailyView.map((professional) => ({
    professional,
    slots: selectedDateSlots.filter((slot) => slot.professional_id === professional.id),
    appointmentCount: selectedDateAppointments.filter((appointment) => appointment.professional_id === professional.id).length,
  }))

  const currentViewLabel = currentView === 'day' ? 'día' : currentView === 'week' ? 'semana' : 'mes'
  const currentCalendarView = currentView === 'day' ? 'timeGridDay' : currentView === 'week' ? 'timeGridWeek' : 'dayGridMonth'
  const timelinePixelsPerMinute = 3.5
  const dailyTimelineTopOffset = 20
  const dailyTimelineBottomOffset = 24
  const dailySlotGap = 4
  const dailyHourDividerGap = 4

  const parseTimeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number)
    return (hours * 60) + minutes
  }

  const formatMinutesToLabel = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60

    return `${String(hours).padStart(2, '0')}:${String(remainingMinutes).padStart(2, '0')}`
  }

  const getTimelinePosition = (minutes: number) => {
    return dailyTimelineTopOffset + ((minutes - dailyTimeline.startMinutes) * timelinePixelsPerMinute)
  }

  const getSlotTopPosition = (startTime: string) => {
    const startMinutes = parseTimeToMinutes(startTime)
    const startsAtHourBoundary = startMinutes % 60 === 0

    return getTimelinePosition(startMinutes) + dailySlotGap + (startsAtHourBoundary ? dailyHourDividerGap : 0)
  }

  const getSlotHeight = (startTime: string, endTime: string) => {
    const startMinutes = parseTimeToMinutes(startTime)
    const endMinutes = parseTimeToMinutes(endTime)
    const startsAtHourBoundary = startMinutes % 60 === 0
    const endsAtHourBoundary = endMinutes % 60 === 0
    const startDividerGap = startsAtHourBoundary ? dailyHourDividerGap : 0
    const endDividerGap = endsAtHourBoundary ? dailyHourDividerGap : 0

    return Math.max(
      ((endMinutes - startMinutes) * timelinePixelsPerMinute)
      - (dailySlotGap * 2)
      - startDividerGap
      - endDividerGap,
      42
    )
  }

  const dailyTimeline = (() => {
    const slotStartMinutes = selectedDateSlots.map((slot) => parseTimeToMinutes(slot.start_time))
    const slotEndMinutes = selectedDateSlots.map((slot) => parseTimeToMinutes(slot.end_time))
    const defaultStartMinutes = 7 * 60
    const defaultEndMinutes = 19 * 60
    const earliestSlotMinutes = slotStartMinutes.length > 0 ? Math.min(...slotStartMinutes) : defaultStartMinutes
    const latestSlotMinutes = slotEndMinutes.length > 0 ? Math.max(...slotEndMinutes) : defaultEndMinutes
    const startMinutes = slotStartMinutes.length > 0
      ? Math.floor(earliestSlotMinutes / 60) * 60
      : defaultStartMinutes
    const endMinutes = slotEndMinutes.length > 0
      ? Math.ceil(latestSlotMinutes / 60) * 60
      : defaultEndMinutes
    const hourlyMarks: number[] = []

    for (let value = startMinutes; value <= endMinutes; value += 60) {
      hourlyMarks.push(value)
    }

    return {
      startMinutes,
      endMinutes,
      totalMinutes: endMinutes - startMinutes,
      totalHeight: dailyTimelineTopOffset + ((endMinutes - startMinutes) * timelinePixelsPerMinute) + dailyTimelineBottomOffset,
      hourlyMarks,
    }
  })()

  const formatCalendarBoundaryTime = (minutes: number) => {
    const safeMinutes = Math.max(0, Math.min(minutes, 24 * 60))
    const hours = Math.floor(safeMinutes / 60)
    const remainingMinutes = safeMinutes % 60

    return `${String(hours).padStart(2, '0')}:${String(remainingMinutes).padStart(2, '0')}:00`
  }

  const getCalendarAppointmentColors = (status: Appointment['status']) => {
    switch (status) {
      case 'cancelled':
        return {
          backgroundColor: '#e2e8f0',
          borderColor: '#94a3b8',
          textColor: '#334155',
        }
      case 'completed':
        return {
          backgroundColor: '#dcfce7',
          borderColor: '#22c55e',
          textColor: '#14532d',
        }
      case 'checked_in':
        return {
          backgroundColor: '#dbeafe',
          borderColor: '#3b82f6',
          textColor: '#1e3a8a',
        }
      case 'no_show':
        return {
          backgroundColor: '#fef3c7',
          borderColor: '#f59e0b',
          textColor: '#78350f',
        }
      default:
        return {
          backgroundColor: '#e0f2fe',
          borderColor: '#0ea5e9',
          textColor: '#0f172a',
        }
    }
  }

  const getCalendarSlotColor = (slotStatus: SlotBoardEntry['slot_status']) => {
    switch (slotStatus) {
      case 'blocked':
        return '#fcd34d'
      case 'occupied':
        return '#fda4af'
      case 'partial':
        return '#93c5fd'
      default:
        return '#bef264'
    }
  }

  const calendarEvents = [
    ...((currentCalendarView === 'dayGridMonth' ? [] : slotBoard).map((slot) => ({
      id: `slot-${slot.professional_id}-${slot.date}-${slot.start_time}`,
      start: `${slot.date}T${slot.start_time}`,
      end: `${slot.date}T${slot.end_time}`,
      display: 'background' as const,
      backgroundColor: getCalendarSlotColor(slot.slot_status),
      extendedProps: {
        type: 'slot' as const,
      },
    }))),
    ...appointments.map((appointment) => {
      const colors = getCalendarAppointmentColors(appointment.status)

      return {
        id: String(appointment.id),
        title: appointment.patient_name,
        start: `${appointment.appointment_date}T${appointment.start_time}`,
        end: `${appointment.appointment_date}T${appointment.end_time}`,
        backgroundColor: colors.backgroundColor,
        borderColor: colors.borderColor,
        textColor: colors.textColor,
        extendedProps: {
          type: 'appointment' as const,
          patientName: appointment.patient_name,
          professionalName: appointment.professional_name,
          medicalServiceName: appointment.medical_service_name,
          startTime: appointment.start_time,
          statusLabel: getAppointmentStatusLabel(getDisplayAppointmentStatus(appointment)),
          canEdit: !isAppointmentLocked(appointment),
        },
      }
    }),
  ]

  const handleCalendarEventClick = (eventClickInfo: EventClickArg) => {
    if (eventClickInfo.event.extendedProps.type !== 'appointment') {
      return
    }

    const appointment = appointments.find((item) => item.id === Number(eventClickInfo.event.id))

    if (!appointment) {
      return
    }

    setCalendarAppointmentDetails(appointment)
  }

  const handleCalendarDateClick = (dateClickInfo: DateClickArg) => {
    setCurrentPanel('today')
    navigateBoard(dateClickInfo.dateStr.slice(0, 10), 'day', filterProfessionalId)
  }

  const closeCalendarAppointmentDetails = (open: boolean) => {
    if (!open) {
      setCalendarAppointmentDetails(null)
    }
  }

  const openCalendarAppointmentEditor = () => {
    if (!calendarAppointmentDetails) {
      return
    }

    setCalendarAppointmentDetails(null)
    openExistingAppointment(calendarAppointmentDetails.id)
  }

  function isAppointmentLocked(
    appointment:
      | Pick<Appointment, 'service_request_id' | 'service_request_status'>
      | Pick<SlotBoardEntry['appointments'][number], 'service_request_id' | 'service_request_status'>
  ) {
    return Boolean(
      appointment.service_request_id
      && appointment.service_request_status
      && appointment.service_request_status !== 'pending_confirmation'
    )
  }

  function getAppointmentStatusLabel(status: Appointment['status'] | SlotBoardEntry['appointments'][number]['status']) {
    switch (status) {
      case 'scheduled':
        return 'Agendada'
      case 'checked_in':
        return 'Confirmado / llegó'
      case 'completed':
        return 'Completada'
      case 'cancelled':
        return 'Cancelada'
      case 'no_show':
        return 'No asistió'
      default:
        return status
    }
  }

  function getDisplayAppointmentStatus(
    appointment:
      | Pick<Appointment, 'status' | 'service_request_status'>
      | Pick<SlotBoardEntry['appointments'][number], 'status' | 'service_request_status'>
  ) {
    if (appointment.service_request_status === 'confirmed' && appointment.status === 'scheduled') {
      return 'checked_in'
    }

    return appointment.status
  }

  const getSlotClasses = (slot: SlotBoardEntry) => {
    switch (slot.slot_status) {
      case 'blocked':
        return 'border-amber-300 bg-amber-50'
      case 'occupied':
        return 'border-rose-300 bg-rose-50'
      case 'partial':
        return 'border-blue-300 bg-blue-50'
      default:
        return 'border-emerald-300 bg-emerald-50'
    }
  }

  const getDailySlotBlockClasses = (slot: SlotBoardEntry) => {
    switch (slot.slot_status) {
      case 'blocked':
        return 'border-amber-300 bg-amber-100 text-amber-950'
      case 'occupied':
        return 'border-rose-300 bg-rose-100 text-rose-950'
      case 'partial':
        return 'border-sky-300 bg-sky-100 text-sky-950'
      default:
        return 'border-lime-300 bg-lime-100 text-lime-950'
    }
  }

  const isSlotAssignable = (slot: SlotBoardEntry) => {
    return slot.slot_status !== 'blocked' && slot.available_capacity > 0
  }

  const openSlotForNewAppointment = (slot: SlotBoardEntry) => {
    setSelectedAppointment(null)
    setSelectedSlot({
      professionalId: slot.professional_id,
      professionalName: slot.professional_name,
      date: slot.date,
      startTime: slot.start_time,
      endTime: slot.end_time,
      durationMinutes: slot.duration_minutes,
    })
    setIsAppointmentModalOpen(true)
  }

  const openExistingAppointment = (appointmentId: number) => {
    const appointment = appointments.find((item) => item.id === appointmentId)

    if (!appointment || isAppointmentLocked(appointment)) {
      return
    }

    setSelectedAppointment(appointment)
    setSelectedSlot({
      professionalId: appointment.professional_id,
      professionalName: appointment.professional_name,
      date: appointment.appointment_date,
      startTime: appointment.start_time,
      endTime: appointment.end_time,
      durationMinutes: appointment.duration_minutes,
    })
    setIsAppointmentModalOpen(true)
  }

  const closeAppointmentModal = (open: boolean) => {
    setIsAppointmentModalOpen(open)
    if (!open) {
      setSelectedAppointment(null)
      setSelectedSlot(null)
    }
  }

  const submitAppointment = (payload: {
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
  }, appointmentId?: number) => {
    saveAppointment(payload, appointmentId, {
      onSuccess: () => {
        closeAppointmentModal(false)
        setCalendarAppointmentDetails(null)
      },
    })
  }

  const renderCalendarEventContent = (eventInfo: EventContentArg) => {
    if (eventInfo.event.extendedProps.type !== 'appointment') {
      return undefined
    }

    if (currentCalendarView === 'dayGridMonth') {
      return (
        <div className="flex items-center gap-1 truncate text-[11px] leading-tight">
          <span
            className="h-2 w-2 shrink-0 rounded-full bg-sky-500"
            aria-hidden="true"
          />
          <span className="shrink-0 font-medium">{eventInfo.timeText}</span>
          <span className="truncate font-semibold">{eventInfo.event.title}</span>
        </div>
      )
    }

    return (
      <div className="px-1 py-0.5 text-[11px] leading-tight">
        <div className="font-semibold">{eventInfo.event.extendedProps.patientName}</div>
        <div className="opacity-80">{eventInfo.timeText}</div>
        {!filterProfessionalId && (
          <div className="truncate opacity-75">{eventInfo.event.extendedProps.professionalName}</div>
        )}
        {eventInfo.event.extendedProps.medicalServiceName && (
          <div className="truncate opacity-75">{eventInfo.event.extendedProps.medicalServiceName}</div>
        )}
      </div>
    )
  }

  const renderCalendarMoreLinkContent = (moreLinkInfo: MoreLinkContentArg) => {
    return `+ ${moreLinkInfo.num} pacientes`
  }

  const renderSlotCard = (slot: SlotBoardEntry) => (
    <div key={`${slot.date}-${slot.start_time}-${slot.professional_id}`} className={`rounded-lg border p-4 shadow-sm ${getSlotClasses(slot)}`}>
      <div className="mb-2 flex items-start justify-between gap-2 ">
        <div>
          <div className="font-semibold text-gray-900">{slot.start_time} - {slot.end_time}</div>
          <div className="text-xs text-gray-600">{slot.professional_name}</div>
        </div>
        <Badge variant={slot.slot_status === 'blocked' ? 'secondary' : 'outline'}>
          {slot.slot_status === 'available' && 'Disponible'}
          {slot.slot_status === 'partial' && `Parcial ${slot.available_capacity}/${slot.capacity}`}
          {slot.slot_status === 'occupied' && 'Ocupado'}
          {slot.slot_status === 'blocked' && 'Bloqueado'}
        </Badge>
      </div>

      {slot.slot_status === 'blocked' && (
        <p className="mb-2 text-xs text-amber-800">{slot.block_title || 'Franja bloqueada'}</p>
      )}

      {slot.appointments.length > 0 && (
        <div className="space-y-2">
          {slot.appointments.map((slotAppointment) => {
            const appointmentLocked = isAppointmentLocked(slotAppointment)

            return (
              <button
                key={slotAppointment.id}
                type="button"
                onClick={() => openExistingAppointment(slotAppointment.id)}
                disabled={appointmentLocked}
                className={`w-full rounded-md border border-white/70 bg-white/80 px-3 py-2 text-left ${appointmentLocked ? 'cursor-not-allowed opacity-75' : 'hover:bg-white'}`}
              >
                <div className="font-medium text-gray-900">{slotAppointment.patient_name}</div>
                {slotAppointment.medical_service_name && <div className="text-xs text-gray-500">{slotAppointment.medical_service_name}</div>}
                {slotAppointment.service_request_number && <div className="text-xs text-emerald-600">Recepción: {slotAppointment.service_request_number}</div>}
                <div className="mt-1 flex items-center justify-between gap-2">
                  <Badge variant="outline">{getAppointmentStatusLabel(getDisplayAppointmentStatus(slotAppointment))}</Badge>
                  {appointmentLocked && <span className="text-[11px] text-gray-500">No editable</span>}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {slot.slot_status !== 'blocked' && slot.available_capacity > 0 && (
        <Button type="button" className="mt-3 w-full" variant={slot.appointments.length > 0 ? 'outline' : 'default'} onClick={() => openSlotForNewAppointment(slot)}>
          Asignar cita
        </Button>
      )}
    </div>
  )

  const renderDaySlotRow = (slot: SlotBoardEntry) => (
    <div key={`${slot.date}-${slot.start_time}-${slot.professional_id}`} className="grid grid-cols-[84px,1fr] border-b border-gray-200 last:border-b-0">
      <div className="bg-gray-50 px-3 py-3 text-sm font-medium text-gray-700">
        <div>{slot.start_time}</div>
        <div className="text-xs font-normal text-gray-500">{slot.end_time}</div>
      </div>

      <div className="px-3 py-3">
        <div className={`rounded-lg border p-2.5 ${getSlotClasses(slot)}`}>
          <div className="mb-1.5 flex items-start justify-between gap-2">
            <div>
              <div className="font-semibold text-gray-900">{slot.professional_name}</div>
              <div className="text-xs text-gray-600">Slot de {slot.duration_minutes} min · Cupo {slot.capacity}</div>
            </div>
            <Badge variant={slot.slot_status === 'blocked' ? 'secondary' : 'outline'}>
              {slot.slot_status === 'available' && 'Disponible'}
              {slot.slot_status === 'partial' && `Parcial ${slot.available_capacity}/${slot.capacity}`}
              {slot.slot_status === 'occupied' && 'Ocupado'}
              {slot.slot_status === 'blocked' && 'Bloqueado'}
            </Badge>
          </div>

          {slot.slot_status === 'blocked' && (
            <p className="mb-1.5 text-xs text-amber-800">{slot.block_title || 'Franja bloqueada'}</p>
          )}

          {slot.appointments.length > 0 && (
            <div className="space-y-1.5">
              {slot.appointments.map((slotAppointment) => {
                const appointmentLocked = isAppointmentLocked(slotAppointment)
                const appointmentCanGoToReception = !slotAppointment.service_request_id && slotAppointment.status !== 'cancelled'

                return (
                  <div key={slotAppointment.id} className={`rounded-md border border-white/70 bg-white/80 px-3 py-2 ${appointmentLocked ? 'opacity-80' : ''}`}>
                    <button
                      type="button"
                      onClick={() => openExistingAppointment(slotAppointment.id)}
                      disabled={appointmentLocked}
                      className={`w-full text-left ${appointmentLocked ? 'cursor-not-allowed' : 'hover:bg-white'}`}
                    >
                      <div className="font-medium leading-tight text-gray-900">{slotAppointment.patient_name}</div>
                      {slotAppointment.medical_service_name && <div className="text-xs leading-tight text-gray-500">{slotAppointment.medical_service_name}</div>}
                      {slotAppointment.service_request_number && <div className="text-xs text-emerald-600">Recepción: {slotAppointment.service_request_number}</div>}
                    </button>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{getAppointmentStatusLabel(getDisplayAppointmentStatus(slotAppointment))}</Badge>
                      {appointmentLocked && <span className="text-[11px] text-gray-500">No editable</span>}
                      {appointmentCanGoToReception && (
                        <Button
                          type="button"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => goToReceptionFromAppointment(slotAppointment.id)}
                          disabled={loadingAction === 'reception'}
                        >
                          Enviar a Recepción
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {slot.slot_status !== 'blocked' && slot.available_capacity > 0 && (
            <Button type="button" className="mt-2 h-8 px-3 text-xs" variant={slot.appointments.length > 0 ? 'outline' : 'default'} onClick={() => openSlotForNewAppointment(slot)}>
              Asignar cita
            </Button>
          )}
        </div>
      </div>
    </div>
  )

  const renderDailyProfessionalColumn = (entry: {
    professional: ProfessionalOption
    slots: SlotBoardEntry[]
    appointmentCount: number
  }) => {
    return (
      <div key={entry.professional.id} className="flex min-w-[270px] max-w-[270px] flex-col rounded-xl border border-slate-200 bg-white pb-2 shadow-sm">
        <div className="sticky top-0 z-10 rounded-t-xl border-b border-slate-200 bg-sky-600 px-4 py-3 text-white">
          <div className="font-semibold text-white">{entry.professional.full_name}</div>
          <div className="mt-1 flex items-center justify-between gap-2 text-xs text-sky-50/90">
            <span className="truncate">{entry.professional.specialties.join(', ') || 'Sin especialidad'}</span>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="border-white/20 bg-white/15 text-white">{entry.slots.length} slots</Badge>
              <Badge variant="secondary" className="border-white/20 bg-white/15 text-white">{entry.appointmentCount} citas</Badge>
            </div>
          </div>
        </div>

        <div
          className="relative flex-1 overflow-hidden bg-slate-50"
          style={{ height: `${Math.max(dailyTimeline.totalHeight, 720)}px` }}
        >
          {dailyTimeline.hourlyMarks.map((hourMark) => {
            const topPosition = getTimelinePosition(hourMark)

            return (
              <div
                key={`${entry.professional.id}-${hourMark}`}
                className="pointer-events-none absolute inset-x-0 border-t border-slate-200"
                style={{ top: `${topPosition}px` }}
              />
            )
          })}

        {entry.slots.length === 0 && (
          <div className="flex h-full items-center justify-center px-4 text-center text-sm text-gray-500">
            Sin slots para este día.
          </div>
        )}

        {entry.slots.map((slot) => (
          <div
            key={`${slot.date}-${slot.start_time}-${slot.professional_id}`}
            role={isSlotAssignable(slot) ? 'button' : undefined}
            tabIndex={isSlotAssignable(slot) ? 0 : undefined}
            onClick={() => {
              if (!isSlotAssignable(slot)) {
                return
              }

              openSlotForNewAppointment(slot)
            }}
            onKeyDown={(event) => {
              if (!isSlotAssignable(slot)) {
                return
              }

              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                openSlotForNewAppointment(slot)
              }
            }}
            className={`absolute left-2 right-2 flex flex-col overflow-hidden rounded-lg border px-1.5 py-2 shadow-sm ${getDailySlotBlockClasses(slot)} ${isSlotAssignable(slot) ? 'cursor-pointer transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2' : ''}`}
            style={{
              top: `${getSlotTopPosition(slot.start_time)}px`,
              height: `${getSlotHeight(slot.start_time, slot.end_time)}px`,
            }}
          >
            <div className="flex items-start justify-between gap-2 ">
              <div>
                <div className="text-[11px] font-semibold leading-none">{slot.start_time} - {slot.end_time}</div>
                <div className="mt-0.5 text-[9px] opacity-75">{slot.duration_minutes} min · Cupo {slot.capacity}</div>
              </div>
              <Badge variant="secondary" className="h-4 border-black/10 bg-white/70 px-1.5 text-[9px] text-slate-700">
                {slot.slot_status === 'available' && 'Libre'}
                {slot.slot_status === 'partial' && `Parcial ${slot.available_capacity}/${slot.capacity}`}
                {slot.slot_status === 'occupied' && 'Ocupado'}
                {slot.slot_status === 'blocked' && 'Bloqueado'}
              </Badge>
            </div>

            {slot.block_title && (
              <p className="mt-1 text-[11px] text-amber-900">{slot.block_title}</p>
            )}

            <div className="mt-1 space-y-1">
              {slot.appointments.length === 0 && slot.slot_status !== 'blocked' && (
                <div className="w-full rounded-md border border-dashed border-black/10 bg-white/70 px-2 py-0.5 text-left text-[9px] text-slate-700">
                  {isSlotAssignable(slot) ? 'Click en el slot para asignar.' : 'Disponible para agendar.'}
                </div>
              )}

              {slot.appointments.map((appointment) => {
                const appointmentLocked = isAppointmentLocked(appointment)
                const appointmentCanGoToReception = !appointment.service_request_id && appointment.status !== 'cancelled'

                return (
                  <div key={appointment.id} className="rounded-md border border-black/10 bg-white/85 px-1 shadow-sm">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        openExistingAppointment(appointment.id)
                      }}
                      disabled={appointmentLocked}
                      className={`w-full text-left ${appointmentLocked ? 'cursor-not-allowed opacity-80' : 'hover:bg-slate-50'}`}
                    >
                      <div className="text-[10px] font-medium leading-tight text-gray-900">{appointment.patient_name}</div>
                      {appointment.medical_service_name && <div className="mt-0.5 text-[9px] leading-tight text-gray-500">{appointment.medical_service_name}</div>}
                      {appointment.service_request_number && <div className="mt-0.5 text-[9px] text-emerald-600">Recepción: {appointment.service_request_number}</div>}
                    </button>

                    <div className="mt-0.5 flex flex-wrap items-center gap-2 pb-[2px]">
                      <Badge variant={appointment.status === 'cancelled' ? 'secondary' : 'outline'} className="h-4 px-1.5 text-[9px]">
                        {getAppointmentStatusLabel(getDisplayAppointmentStatus(appointment))}
                      </Badge>
                      {appointmentCanGoToReception && (
                        <Button type="button" size="sm" variant="outline" className="h-4 px-1.5 text-[9px]" onClick={(event) => {
                          event.stopPropagation()
                          goToReceptionFromAppointment(appointment.id)
                        }} disabled={loadingAction === 'reception'}>
                          Recepción
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
        </div>
      </div>
    )
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Citas médicas" />

      <div className="space-y-6 p-4 md:p-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Citas médicas</h1>
          <p className="text-sm text-gray-500">Administrá la agenda clínica con foco en reservas, slots y seguimiento operativo.</p>
        </div>

        <Tabs value={currentPanel} onValueChange={(value) => setCurrentPanel(value as PanelView)}>
          <TabsList className="grid w-full max-w-xl grid-cols-3">
            <TabsTrigger value="range">Agenda del rango</TabsTrigger>
            <TabsTrigger value="today" disabled={currentView !== 'day'}>Citas del día</TabsTrigger>
            <TabsTrigger value="calendar">Calendario</TabsTrigger>
          </TabsList>

        <Card>
          <CardHeader className="gap-2">
            <CardTitle>Agenda y citas</CardTitle>
            <p className="text-sm text-gray-500">Filtros, navegación y cambio de vista para trabajar la agenda clínica desde un solo panel.</p>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="w-full xl:max-w-xl">
              <label className="mb-1 block text-sm font-medium text-gray-700">Profesional</label>
              <div className="flex gap-2">
                <SearchableInput
                  placeholder="Prof."
                  value={getProfessionalName(filterProfessionalId)}
                  onSelect={(professional) => {
                    const nextProfessionalId = String(professional.id)
                    setFilterProfessionalId(nextProfessionalId)
                    navigateBoard(selectedDate, currentView, nextProfessionalId)
                  }}
                  onSearch={searchProfessionals}
                  minSearchLength={1}
                  maxResults={10}
                  className="w-full"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setFilterProfessionalId('')
                    navigateBoard(selectedDate, currentView, '')
                  }}
                >
                  Todos
                </Button>
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 xl:w-auto xl:items-end">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                <div className="min-w-56 rounded-md border border-gray-200 px-3 py-2 text-center">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(event) => navigateBoard(event.target.value)}
                    className="w-full border-0 bg-transparent p-0 text-center text-sm font-medium text-gray-700 focus:outline-none"
                  />
                  <div className="mt-1 text-xs text-gray-500">Rango visible: {filters.range_start} al {filters.range_end}</div>
                </div>

                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" onClick={() => changeSelectedDate(-1)}>
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    {currentViewLabel}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => changeSelectedDate(1)}>
                    {currentViewLabel}
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <span className="text-sm font-medium text-gray-700">Vista</span>
                <div className="flex rounded-lg border border-gray-200 bg-white p-1">
                  {(['day', 'week', 'month'] as const).map((viewOption) => (
                    <Button
                      key={viewOption}
                      type="button"
                      size="sm"
                      variant={currentView === viewOption ? 'default' : 'ghost'}
                      className="capitalize"
                      onClick={() => navigateBoard(selectedDate, viewOption)}
                    >
                      {viewOption === 'day' ? 'Día' : viewOption === 'week' ? 'Semana' : 'Mes'}
                    </Button>
                  ))}
                </div>
              </div>

              {currentPanel === 'calendar' && (
                <div className="flex flex-wrap items-center justify-end gap-2 text-xs text-slate-600">
                  <Badge variant="outline" className="border-lime-300 bg-lime-50 text-lime-800">Slots disponibles</Badge>
                  <Badge variant="outline" className="border-sky-300 bg-sky-50 text-sky-800">Slots parciales</Badge>
                  <Badge variant="outline" className="border-rose-300 bg-rose-50 text-rose-800">Slots ocupados</Badge>
                  <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800">Slots bloqueados</Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

          <TabsContent value="range" className="mt-4">
            <div className="grid gap-6 xl:grid-cols-[1.6fr,1fr]">
              <Card>
                <CardHeader>
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <CardTitle>Slots navegables</CardTitle>
                      <p className="text-sm text-gray-500">Fecha foco: {formattedSelectedDate}</p>
                    </div>
                    <Badge variant="outline">Vista {currentViewLabel}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {orderedDates.length === 0 && (
                    <div className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-sm text-gray-500">
                      No hay slots generados para el rango seleccionado.
                    </div>
                  )}

                  {orderedDates.length > 0 && currentView === 'day' && (
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                      <div className="grid grid-cols-[84px,1fr] border-b border-gray-200 bg-gray-50">
                        <div className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Hora</div>
                        <div className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Detalle del slot</div>
                      </div>
                      {orderedDates.flatMap((date) => groupedSlots[date]).map(renderDaySlotRow)}
                    </div>
                  )}

                  {orderedDates.length > 0 && currentView === 'week' && (
                    <div className="grid gap-4 lg:grid-cols-7">
                      {orderedDates.map((date) => (
                        <div key={date} className="space-y-3 rounded-lg border border-gray-200 p-3">
                          <div className="text-sm font-semibold text-gray-900">{new Intl.DateTimeFormat('es-PY', { weekday: 'short', day: '2-digit', month: '2-digit' }).format(new Date(`${date}T00:00:00`))}</div>
                          <div className="space-y-2">
                            {groupedSlots[date].length === 0 && <div className="text-xs text-gray-500">Sin slots</div>}
                            {groupedSlots[date].map(renderSlotCard)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {orderedDates.length > 0 && currentView === 'month' && (
                    <div className="grid gap-4 lg:grid-cols-7">
                      {orderedDates.map((date) => (
                        <div key={date} className="rounded-lg border border-gray-200 p-3">
                          <div className="mb-3 text-sm font-semibold text-gray-900">{new Intl.DateTimeFormat('es-PY', { day: '2-digit', month: 'short' }).format(new Date(`${date}T00:00:00`))}</div>
                          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                            {groupedSlots[date].length === 0 && <div className="text-xs text-gray-500">Sin slots</div>}
                            {groupedSlots[date].map(renderSlotCard)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Citas del rango</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {appointments.length === 0 && <p className="text-sm text-gray-500">No hay citas registradas en este rango.</p>}
                  {appointments.map((appointment) => (
                    <div key={appointment.id} className="rounded-lg border border-gray-200 p-4">
                      <div className="flex flex-col gap-3">
                        <div>
                          <div className="font-medium text-gray-900">{appointment.patient_name}</div>
                          <div className="text-sm text-gray-500">{appointment.professional_name}</div>
                          <div className="mt-1 text-xs text-gray-500">{appointment.appointment_date} · {appointment.start_time} a {appointment.end_time}</div>
                          {appointment.medical_service_name && <div className="mt-1 text-xs text-gray-500">{appointment.medical_service_name}</div>}
                          {appointment.service_request_number && <div className="mt-1 text-xs text-emerald-600">Recepción: {appointment.service_request_number}</div>}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={appointment.status === 'cancelled' ? 'secondary' : 'default'}>{getAppointmentStatusLabel(getDisplayAppointmentStatus(appointment))}</Badge>
                          <Button type="button" variant="outline" size="sm" onClick={() => openExistingAppointment(appointment.id)} disabled={isAppointmentLocked(appointment)}>
                            {isAppointmentLocked(appointment) ? 'No editable' : 'Editar'}
                          </Button>
                          {!appointment.service_request_id && appointment.status !== 'cancelled' && (
                            <Button type="button" size="sm" onClick={() => goToReceptionFromAppointment(appointment.id)} disabled={loadingAction === 'reception'}>
                              Enviar a Recepción
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="today" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle>Agenda diaria por profesional</CardTitle>
                    <p className="text-sm text-gray-500">Solo se muestran médicos con slots o citas en {formattedSelectedDate}.</p>
                  </div>
                  <Badge variant="outline">{slotColumnsByProfessionalForSelectedDate.length} médicos</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {slotColumnsByProfessionalForSelectedDate.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
                    No hay agendas ni citas para la fecha seleccionada.
                  </div>
                ) : (
                  <div className="overflow-x-auto pb-2">
                    <div className="flex min-w-max gap-4">
                      <div className="sticky left-0 z-10 min-w-[68px] rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex h-[76px] items-center justify-center rounded-t-xl border-b border-slate-200 bg-slate-100 px-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-600">
                          Hora
                        </div>
                        <div className="relative bg-white" style={{ height: `${Math.max(dailyTimeline.totalHeight, 720)}px` }}>
                          {dailyTimeline.hourlyMarks.map((hourMark) => {
                            const topPosition = getTimelinePosition(hourMark)

                            return (
                              <div key={`timeline-${hourMark}`}>
                                <div
                                  className="pointer-events-none absolute inset-x-0 border-t border-slate-200"
                                  style={{ top: `${topPosition}px` }}
                                />
                                <div
                                  className="absolute left-0 right-0 -translate-y-1/2 px-2 text-center text-[11px] font-medium text-slate-500"
                                  style={{ top: `${topPosition}px` }}
                                >
                                  {formatMinutesToLabel(hourMark)}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {slotColumnsByProfessionalForSelectedDate.map(renderDailyProfessionalColumn)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 flex flex-col gap-1">
                  <div className="text-base font-semibold text-slate-900">Calendario de citas</div>
                  <p className="text-sm text-gray-500">Vista tipo calendario con navegación por día, semana y mes. Click en una cita para ver detalle; click en una fecha para abrir la agenda diaria.</p>
                </div>
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <FullCalendar
                    key={`${currentCalendarView}-${selectedDate}-${filterProfessionalId || 'all'}`}
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView={currentCalendarView}
                    initialDate={selectedDate}
                    locale="es"
                    height="auto"
                    allDaySlot={false}
                    nowIndicator
                    selectable={false}
                    weekends
                    headerToolbar={false}
                    moreLinkClick="popover"
                    slotMinTime={formatCalendarBoundaryTime(Math.max(dailyTimeline.startMinutes - 60, 0))}
                    slotMaxTime={formatCalendarBoundaryTime(Math.min(dailyTimeline.endMinutes + 60, 24 * 60))}
                    eventDisplay={currentCalendarView === 'dayGridMonth' ? 'list-item' : 'auto'}
                    eventTimeFormat={{ hour: 'numeric', minute: '2-digit', meridiem: 'short' }}
                    dayMaxEvents={currentCalendarView === 'dayGridMonth' ? 3 : undefined}
                    dayMaxEventRows={currentCalendarView === 'dayGridMonth' ? true : 4}
                    moreLinkContent={renderCalendarMoreLinkContent}
                    events={calendarEvents}
                    eventClick={handleCalendarEventClick}
                    dateClick={handleCalendarDateClick}
                    eventContent={renderCalendarEventContent}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <AppointmentSlotModal
          open={isAppointmentModalOpen}
          onOpenChange={closeAppointmentModal}
          loading={loadingAction === 'appointment'}
          medicalServices={medicalServices}
          slot={selectedSlot}
          appointment={selectedAppointment}
          onSearchPatients={searchPatients}
          onSubmit={submitAppointment}
        />

        <Dialog open={Boolean(calendarAppointmentDetails)} onOpenChange={closeCalendarAppointmentDetails}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Detalle de la cita</DialogTitle>
              <DialogDescription>
                Resumen rápido para no recargar la vista mensual del calendario.
              </DialogDescription>
            </DialogHeader>

            {calendarAppointmentDetails && (
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-lg font-semibold text-slate-900">{calendarAppointmentDetails.patient_name}</div>
                  <div className="mt-1 text-sm text-slate-600">
                    {calendarAppointmentDetails.appointment_date} · {calendarAppointmentDetails.start_time} a {calendarAppointmentDetails.end_time}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 p-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Médico</div>
                    <div className="mt-1 text-sm font-medium text-slate-900">{calendarAppointmentDetails.professional_name}</div>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Estado</div>
                    <div className="mt-1">
                      <Badge variant={calendarAppointmentDetails.status === 'cancelled' ? 'secondary' : 'outline'}>
                        {getAppointmentStatusLabel(getDisplayAppointmentStatus(calendarAppointmentDetails))}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 p-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Servicio solicitado</div>
                  <div className="mt-1 text-sm text-slate-900">{calendarAppointmentDetails.medical_service_name || 'Sin servicio vinculado'}</div>
                  {calendarAppointmentDetails.service_request_number && (
                    <div className="mt-2 text-xs text-emerald-600">Recepción: {calendarAppointmentDetails.service_request_number}</div>
                  )}
                </div>

                {calendarAppointmentDetails.notes && (
                  <div className="rounded-lg border border-slate-200 p-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notas</div>
                    <div className="mt-1 text-sm text-slate-700">{calendarAppointmentDetails.notes}</div>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCalendarAppointmentDetails(null)}>
                Cerrar
              </Button>
              <Button type="button" onClick={openCalendarAppointmentEditor} disabled={!calendarAppointmentDetails || isAppointmentLocked(calendarAppointmentDetails)}>
                {calendarAppointmentDetails && isAppointmentLocked(calendarAppointmentDetails) ? 'No editable' : 'Editar cita'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      </div>
    </AppLayout>
  )
}
