import { Head, router } from '@inertiajs/react'
import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import AppLayout from '@/layouts/app-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import AppointmentSlotModal from '@/components/medical/schedule/AppointmentSlotModal'
import PatientSummaryModal from '@/components/medical/schedule/PatientSummaryModal'
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
  professionalsWithAgendaIds: number[]
  filters: {
    professional_id?: number | null
    selected_date: string
    view: 'day' | 'week' | 'month'
    range_start: string
    range_end: string
  }
}

export default function AppointmentsPage({
  professionals,
  medicalServices,
  appointments,
  slotBoard,
  professionalsWithAgendaIds,
  filters,
}: AppointmentsPageProps) {
  const { searchPatients } = useSearch()
  const { saveAppointment, goToReceptionFromAppointment, loadingAction, error } = useSchedule()
  const fallbackProfessionalId = (() => {
    const professionalIdFromFilters = filters.professional_id ? String(filters.professional_id) : ''

    if (professionalIdFromFilters && professionals.some((professional) => String(professional.id) === professionalIdFromFilters)) {
      return professionalIdFromFilters
    }

    const suggestedProfessionalId = appointments.find((appointment) => appointment.appointment_date === filters.selected_date)?.professional_id
      ?? slotBoard.find((slot) => slot.date === filters.selected_date)?.professional_id
      ?? professionals[0]?.id

    return suggestedProfessionalId ? String(suggestedProfessionalId) : ''
  })()

  const [selectedDate, setSelectedDate] = useState(filters.selected_date)
  const [filterProfessionalId, setFilterProfessionalId] = useState(fallbackProfessionalId)
  const [showAllProfessionals, setShowAllProfessionals] = useState(false)
  const [professionalsDropdownSearch, setProfessionalsDropdownSearch] = useState('')
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false)
  const [patientSummaryId, setPatientSummaryId] = useState<number | null>(null)
  const professionalsDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showAllProfessionals) return
    const handleClickOutside = (event: MouseEvent) => {
      if (professionalsDropdownRef.current && !professionalsDropdownRef.current.contains(event.target as Node)) {
        setShowAllProfessionals(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showAllProfessionals])
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
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
  const activeProfessionalId = filterProfessionalId || fallbackProfessionalId

  const navigateBoard = (nextDate: string, nextProfessionalId = activeProfessionalId) => {
    setSelectedDate(nextDate)

    router.get('/medical/appointments', {
      selected_date: nextDate,
      view: 'day',
      professional_id: nextProfessionalId,
    }, {
      preserveState: true,
      preserveScroll: true,
    })
  }

  const changeSelectedDate = (direction: number) => {
    const nextDate = new Date(`${selectedDate}T00:00:00`)

    nextDate.setDate(nextDate.getDate() + direction)

    navigateBoard(nextDate.toISOString().split('T')[0])
  }

  const formattedSelectedDate = new Intl.DateTimeFormat('es-PY', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${selectedDate}T00:00:00`))

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
    if (activeProfessionalId) {
      return professionals.filter((professional) => String(professional.id) === activeProfessionalId)
    }

    return []
  })()

  const slotColumnsByProfessionalForSelectedDate = professionalsForDailyView.map((professional) => ({
    professional,
    slots: selectedDateSlots.filter((slot) => slot.professional_id === professional.id),
    appointmentCount: selectedDateAppointments.filter((appointment) => appointment.professional_id === professional.id).length,
  }))
  const visibleDailyAppointments = slotColumnsByProfessionalForSelectedDate.reduce((total, column) => total + column.appointmentCount, 0)
  const professionalsWithSlotsToday = new Set(professionalsWithAgendaIds)
  const dailyProfessionalHeaderHeight = 88
  const dailyTimelineSidebarHeaderHeight = 88
  const timelinePixelsPerMinute = 1.55
  const dailyTimelineTopOffset = 8
  const dailyTimelineBottomOffset = 12
  const dailySlotGap = 1
  const dailyHourDividerGap = 0
  const dailyHourLabelOffset = 28

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
      124,
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

  const getDailySlotBlockClasses = (slot: SlotBoardEntry) => {
    switch (slot.slot_status) {
      case 'blocked':
        return 'border border-slate-200 border-l-4 border-l-amber-300 bg-white text-slate-900'
      case 'occupied':
        return 'border border-slate-200 border-l-4 border-l-rose-300 bg-white text-slate-900'
      case 'partial':
        return 'border border-slate-200 border-l-4 border-l-sky-300 bg-white text-slate-900'
      default:
        return 'border border-slate-200 border-l-4 border-l-lime-300 bg-white text-slate-900'
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


  const openPatientRecord = (patientId: number) => {
    setPatientSummaryId(patientId)
  }

  const getSlotAppointmentTimeRange = (appointmentId: number, slot: Pick<SlotBoardEntry, 'start_time' | 'end_time'>) => {
    const fullAppointment = appointments.find((item) => item.id === appointmentId)

    return `${fullAppointment?.start_time || slot.start_time} - ${fullAppointment?.end_time || slot.end_time}`
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
      },
    })
  }

  const renderDailyProfessionalColumn = (entry: {
    professional: ProfessionalOption
    slots: SlotBoardEntry[]
    appointmentCount: number
  }) => {
    const hasSingleProfessionalColumn = slotColumnsByProfessionalForSelectedDate.length === 1
    const dailyAppointmentsGridColumns = 'grid-cols-[124px_minmax(0,1.3fr)_minmax(0,1fr)_98px_172px]'
    const dailyAppointmentsHeaderClasses = `sticky z-10 grid ${dailyAppointmentsGridColumns} gap-2 border-b border-slate-300 bg-slate-100/95 px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-800 shadow-sm backdrop-blur`

    return (
      <div key={entry.professional.id} className={hasSingleProfessionalColumn ? 'grid min-w-0 flex-1 border border-slate-200 bg-white' : 'grid min-w-145 max-w-145 border border-slate-200 bg-white'} style={{ gridTemplateRows: `${dailyProfessionalHeaderHeight}px auto 1fr` }}>
        <div className="sticky top-0 z-20 border-b border-slate-200 bg-sky-600 px-4 py-3.5 text-white shadow-sm" style={{ height: `${dailyProfessionalHeaderHeight}px` }}>
          <div className="font-semibold text-white">{entry.professional.full_name}</div>
          <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px] text-sky-50/90">
            <span className="truncate">{entry.professional.specialties.join(', ') || 'Sin especialidad'}</span>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="border-white/20 bg-white/15 text-white">{entry.slots.length} slots</Badge>
              <Badge variant="secondary" className="border-white/20 bg-white/15 text-white">{entry.appointmentCount} citas</Badge>
            </div>
          </div>
        </div>

        <div className={dailyAppointmentsHeaderClasses} style={{ top: `${dailyProfessionalHeaderHeight}px` }}>
          <div>Turno</div>
          <div>Paciente</div>
          <div>Servicio</div>
          <div>Estado</div>
          <div>Acciones</div>
        </div>

        <div
          className="relative flex-1 overflow-hidden bg-white"
          style={{ height: `${Math.max(dailyTimeline.totalHeight, 720)}px` }}
        >
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
            className={`absolute left-0 right-0 flex flex-col overflow-hidden px-2 py-1.5 ${getDailySlotBlockClasses(slot)} ${isSlotAssignable(slot) ? 'cursor-pointer transition hover:bg-slate-50/70 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-inset' : ''}`}
            style={{
              top: `${getSlotTopPosition(slot.start_time)}px`,
              height: `${getSlotHeight(slot.start_time, slot.end_time)}px`,
            }}
          >
            {slot.block_title && (
              <p className="text-[11px] font-medium text-amber-900">{slot.block_title}</p>
            )}

            <div className="space-y-1.5">
              {slot.appointments.length === 0 && slot.slot_status !== 'blocked' && (
                <div className="w-full rounded-sm bg-white px-2 py-2 text-left text-[10px] text-slate-700">
                  {isSlotAssignable(slot) ? 'Click en el slot para asignar.' : 'Disponible para agendar.'}
                </div>
              )}

              {slot.appointments.map((appointment) => {
                const appointmentLocked = isAppointmentLocked(appointment)
                const appointmentCanGoToReception = !appointment.service_request_id && appointment.status !== 'cancelled'

                return (
                  <div key={appointment.id} className={`grid ${dailyAppointmentsGridColumns} items-center gap-3 rounded-sm bg-white px-0 py-0`}>
                    <div className="min-w-0 whitespace-nowrap text-[10px] font-semibold text-slate-700">
                      {getSlotAppointmentTimeRange(appointment.id, slot)}
                    </div>

                    <div className="min-w-0">
                      <div className="truncate text-[11px] font-medium leading-tight text-gray-900">{appointment.patient_name}</div>
                      <div className="mt-0.5 truncate text-[10px] text-slate-600">Paciente #{appointment.patient_id}</div>
                      {appointment.service_request_number && <div className="mt-0.5 truncate text-[10px] text-emerald-600">Recepción: {appointment.service_request_number}</div>}
                    </div>

                    <div className="min-w-0">
                      <div className="truncate text-[10px] leading-tight text-gray-700">
                        {appointment.medical_service_name || 'Sin servicio cargado'}
                      </div>
                    </div>

                    <div className="min-w-0">
                      <Badge variant={appointment.status === 'cancelled' ? 'secondary' : 'outline'} className="h-6 px-1.5 text-[10px]">
                        {getAppointmentStatusLabel(getDisplayAppointmentStatus(appointment))}
                      </Badge>
                      {appointmentLocked && <div className="mt-0.5 text-[10px] text-gray-500">No editable</div>}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-9 px-2.5 text-[11px]"
                        onClick={(event) => {
                          event.stopPropagation()
                          openPatientRecord(appointment.patient_id)
                        }}
                      >
                        Paciente
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="h-9 px-2.5 text-[11px]"
                        onClick={(event) => {
                          event.stopPropagation()
                          goToReceptionFromAppointment(appointment.id)
                        }}
                        disabled={!appointmentCanGoToReception || loadingAction === 'reception'}>
                        Recepción
                      </Button>
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

      <div className="space-y-4 p-4 md:p-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-gray-900">Citas médicas</h1>
          <p className="text-sm text-gray-500">Vista diaria de trabajo para secretaría.</p>
        </div>

        <Card>
          <CardHeader className="gap-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <CardTitle>Agenda diaria por profesional</CardTitle>
                <p className="text-sm text-gray-500">Vista operativa para secretaría en {formattedSelectedDate}.</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => changeSelectedDate(-1)}>
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Día anterior
                </Button>
                <div className="min-w-45 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-center">
                  <input
                    type="date"
                    value={selectedDate}
                      onChange={(event) => navigateBoard(event.target.value, activeProfessionalId)}
                    className="w-full border-0 bg-transparent p-0 text-center text-sm font-medium text-gray-700 focus:outline-none"
                  />
                </div>
                  <Button type="button" size="sm" variant="outline" onClick={() => changeSelectedDate(1)}>
                  Día siguiente
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>

              <div className="text-sm text-slate-500">{visibleDailyAppointments} citas visibles en la jornada.</div>
            </div>

            {professionals.some((professional) => professionalsWithSlotsToday.has(professional.id)) && (() => {
              const profsWithAgenda = professionals.filter((professional) => professionalsWithSlotsToday.has(professional.id))
              // El seleccionado siempre visible: lo ponemos primero, luego los demás hasta completar 3
              const selectedProf = profsWithAgenda.find((p) => String(p.id) === activeProfessionalId)
              const rest = profsWithAgenda.filter((p) => String(p.id) !== activeProfessionalId)
              const ordered = selectedProf ? [selectedProf, ...rest] : profsWithAgenda
              const first3 = ordered.slice(0, 3)
              const hiddenProfs = ordered.slice(3)
              const hiddenCount = hiddenProfs.length
              return (
                <div className="flex flex-wrap items-center gap-2">
                  {first3.map((professional) => {
                    const isSelected = String(professional.id) === activeProfessionalId
                    return (
                      <button
                        key={professional.id}
                        type="button"
                        onClick={() => {
                          setFilterProfessionalId(String(professional.id))
                          navigateBoard(selectedDate, String(professional.id))
                        }}
                        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all ${
                          isSelected
                            ? 'border-sky-500 bg-sky-500 text-white shadow-sm'
                            : 'border-gray-200 bg-white text-gray-400 hover:border-gray-300 hover:text-gray-600'
                        }`}
                      >
                        <span className={`h-2 w-2 shrink-0 rounded-full transition-all ${isSelected ? 'bg-white' : 'bg-gray-300'}`} />
                        {professional.full_name}
                      </button>
                    )
                  })}
                  {hiddenCount > 0 && (
                    <div className="relative" ref={professionalsDropdownRef}>
                      <button
                        type="button"
                        onClick={() => {
                        setShowAllProfessionals((prev) => !prev)
                        setProfessionalsDropdownSearch('')
                      }}
                        className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-all ${
                          showAllProfessionals
                            ? 'border-gray-400 bg-gray-100 text-gray-700'
                            : 'border-dashed border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700'
                        }`}
                      >
                        +{hiddenCount} más
                      </button>
                      {showAllProfessionals && (
                        <div className="absolute left-0 top-full z-30 mt-1.5 w-60 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
                          <div className="border-b border-gray-100 p-2">
                            <input
                              type="text"
                              autoFocus
                              placeholder="Buscar profesional..."
                              value={professionalsDropdownSearch}
                              onChange={(e) => setProfessionalsDropdownSearch(e.target.value)}
                              className="w-full rounded-md border border-gray-200 px-2.5 py-1.5 text-sm text-gray-700 placeholder-gray-400 focus:border-sky-400 focus:outline-none"
                            />
                          </div>
                          <div className="max-h-52 overflow-y-auto py-1">
                            {hiddenProfs
                              .filter((p) => p.full_name.toLowerCase().includes(professionalsDropdownSearch.toLowerCase()))
                              .map((professional) => {
                              const isSelected = String(professional.id) === activeProfessionalId
                              return (
                                <button
                                  key={professional.id}
                                  type="button"
                                  onClick={() => {
                                    setFilterProfessionalId(String(professional.id))
                                    navigateBoard(selectedDate, String(professional.id))
                                    setShowAllProfessionals(false)
                                    setProfessionalsDropdownSearch('')
                                  }}
                                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-gray-50 ${
                                    isSelected ? 'font-medium text-sky-600' : 'text-gray-700'
                                  }`}
                                >
                                  <span className={`h-2 w-2 shrink-0 rounded-full ${isSelected ? 'bg-sky-500' : 'bg-gray-300'}`} />
                                  {professional.full_name}
                                </button>
                              )
                            })}
                            {hiddenProfs.filter((p) => p.full_name.toLowerCase().includes(professionalsDropdownSearch.toLowerCase())).length === 0 && (
                              <p className="px-3 py-2 text-sm text-gray-400">Sin resultados</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })()}

          </CardHeader>

          <CardContent className="pt-0">
            {slotColumnsByProfessionalForSelectedDate.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
                No hay agendas ni citas para la fecha seleccionada.
              </div>
            ) : (
              <div className="overflow-x-auto pb-2">
                <div className={slotColumnsByProfessionalForSelectedDate.length === 1 ? 'flex w-full gap-0' : 'flex min-w-max gap-4'}>
                  <div className="sticky left-0 z-10 grid min-w-21 border border-slate-200 bg-white" style={{ gridTemplateRows: `${dailyTimelineSidebarHeaderHeight}px auto 1fr` }}>
                    <div className="sticky top-0 z-20 flex items-center justify-center border-b border-slate-200 bg-slate-100 px-3 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-800 shadow-sm" style={{ height: `${dailyTimelineSidebarHeaderHeight}px` }}>
                      Escala
                    </div>
                    <div className="sticky z-10 border-b border-slate-300 bg-slate-100/95 px-2 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-800 shadow-sm backdrop-blur" style={{ top: `${dailyTimelineSidebarHeaderHeight}px` }}>
                      Día
                    </div>
                    <div className="relative bg-white" style={{ height: `${Math.max(dailyTimeline.totalHeight, 720)}px` }}>
                      {dailyTimeline.hourlyMarks.map((hourMark) => {
                        const topPosition = getTimelinePosition(hourMark)

                        return (
                          <div key={`timeline-${hourMark}`}>
                            <div
                              className="absolute left-0 right-0 px-2 text-center text-[12px] font-medium text-slate-600"
                              style={{ top: `${topPosition + dailyHourLabelOffset}px` }}
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

        <PatientSummaryModal
          patientId={patientSummaryId}
          open={patientSummaryId !== null}
          onOpenChange={(open) => { if (!open) setPatientSummaryId(null) }}
        />

        <PatientSummaryModal
          patientId={patientSummaryId}
          open={patientSummaryId !== null}
          onOpenChange={(open) => { if (!open) setPatientSummaryId(null) }}
        />

        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      </div>
    </AppLayout>
  )
}
