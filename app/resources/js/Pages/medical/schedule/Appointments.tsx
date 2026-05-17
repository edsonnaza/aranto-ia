
import { Head } from '@inertiajs/react'
import { useState, useRef, useEffect, useMemo } from 'react'
import type { CalendarApi } from '@fullcalendar/core'
import type { DatesSetArg, EventClickArg, DateSelectArg } from '@fullcalendar/core'
// Chevron icons removed — FullCalendar header provides prev/next controls
import AppLayout from '@/layouts/app-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import AppointmentSlotModal from '@/components/medical/schedule/AppointmentSlotModal'
import PatientSummaryModal from '@/components/medical/schedule/PatientSummaryModal'
import { useSchedule, useSearch } from '@/hooks/medical'
import { useAppointments } from '@/hooks/medical/useAppointments'
import CitasFullCalendar from '@/medical/appointments/CitasFullCalendar'
import { toast } from 'sonner'

type ProfessionalOption = {
  id: number;
  full_name: string;
  specialties: string[];
};

type MedicalServiceOption = {
  id: number;
  name: string;
  duration_minutes: number;
};

type Appointment = {
  id: number;
  professional_id: number;
  professional_name: string;
  patient_id: number;
  patient_name: string;
  medical_service_id?: number | null;
  medical_service_ids?: number[] | null;
  medical_service_name?: string | null;
  medical_service_names?: string[] | null;
  service_request_id?: number | null;
  service_request_number?: string | null;
  service_request_status?: string | null;
  appointment_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  status: 'scheduled' | 'checked_in' | 'completed' | 'cancelled' | 'no_show';
  source: 'agenda' | 'reception' | 'manual';
  notes?: string | null;
  cancellation_reason?: string | null;
};

type SlotBoardEntry = {
  professional_id: number;
  professional_name: string;
  date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  slot_status: string;
  block_title?: string;
  available_capacity: number;
  appointments: Appointment[];
  capacity?: number;
  occupied_count?: number;
};

type AppointmentsPageProps = {
  appointments?: Appointment[];
  slotBoard?: SlotBoardEntry[];
  professionals?: ProfessionalOption[];
  medicalServices?: MedicalServiceOption[];
  filters?: { selected_date?: string; [key: string]: unknown };
  professionalsWithAgendaIds?: number[];
  fallbackProfessionalId?: string;
  error?: string;
};

export default function AppointmentsPage(props: AppointmentsPageProps) {
  // Props y valores por defecto
  const appointments = props.appointments ?? []
  const slotBoard = useMemo(() => props.slotBoard ?? [], [props.slotBoard])
  const professionals = props.professionals ?? []
  const medicalServices = props.medicalServices ?? []
  // Fuente de verdad estática para la fecha inicial
  const initialDate = props.filters?.selected_date || new Date().toISOString().slice(0, 10)
  const filters = props.filters ?? { selected_date: initialDate }
  const professionalsWithAgendaIds = props.professionalsWithAgendaIds ?? professionals.map(p => p.id)
 // const fallbackProfessionalId = props.fallbackProfessionalId ?? (professionals[0]?.id ? String(professionals[0].id) : '')
  const error = props.error ?? ''
  // Estado para timeout de carga de agenda
  const [agendaTimeout, setAgendaTimeout] = useState(false)



  // Hooks reales
  const { saveAppointment, goToReceptionFromAppointment, loadingAction } = useSchedule()
  const { searchPatients } = useSearch()

    // Hook para refrescar solo la tabla de citas
    const { refreshAppointments } = useAppointments()

  // Estado local de la fecha, inicializado solo una vez
  const [selectedDate, setSelectedDate] = useState(initialDate)
  // Sincroniza selectedDate solo si el backend responde con una fecha distinta
  useEffect(() => {
    if (props.filters?.selected_date && props.filters.selected_date !== selectedDate) {
      const now = Date.now()
      // Solo actualiza si no hay update local reciente (<1200ms)
      if (!lastLocalUpdateRef.current || (now - lastLocalUpdateRef.current) > 1200) {
        setSelectedDate(props.filters.selected_date)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.filters?.selected_date])
  // Inicializa con el primer profesional si existe
  const [filterProfessionalId, setFilterProfessionalId] = useState(() => {
    if (filters.professional_id) return String(filters.professional_id)
    if (professionals.length > 0) return String(professionals[0].id)
    return ''
  })
  const [showAllProfessionals, setShowAllProfessionals] = useState(false)
  const lastRequestedDateRef = useRef<string | null>(null)
  const calendarApiRef = useRef<CalendarApi | null>(null)
  const calendarInitializedRef = useRef(false)
  // Marca temporal para evitar que respuestas del servidor sobrescriban cambios recientes del usuario
  const lastLocalUpdateRef = useRef<number | null>(null)
  const dateInputTimerRef = useRef<number | null>(null)
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
    agendaName?: string | null
    slotLengthMinutes?: number | null
  } | null>(null)

  const breadcrumbs = [
    { href: '/dashboard', title: 'Dashboard' },
    { href: '/medical', title: 'Sistema Médico' },
    { href: '/medical/appointments', title: 'Citas' },
  ]
  // Use only the explicit filter; when empty, treat as 'no selection' so all professionals are shown
  // Siempre debe ser un string con el id válido o el primero disponible
  const activeProfessionalId: string = filterProfessionalId || (professionals.length > 0 ? String(professionals[0].id) : '')

  function navigateBoard(nextDate: string) {
    // Actualiza siempre el estado local y la marca
    setSelectedDate(nextDate)
    lastLocalUpdateRef.current = Date.now()
    lastRequestedDateRef.current = nextDate

    try {
      if (calendarApiRef.current) {
        calendarApiRef.current.gotoDate(nextDate)
      }
    } catch (e) {
      console.info('Error navigating calendar to date:', e)
    }

    // Refresca datos en backend: traer TODAS las agendas para la fecha
    refreshAppointments({
      selected_date: nextDate,
      // No enviar professional_id aquí para que el backend devuelva todas las agendas
    })
  }

  // navigateBoard handles date changes from both the input and FullCalendar

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

  // Adaptar acciones para DataTable (se implementará cuando la tabla esté integrada)

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

    // No specific professional selected -> show all professionals
    return professionals
  })()
  // Timeout para mostrar error si slotBoard no carga
  useEffect(() => {
    setAgendaTimeout(false)
    if (!slotBoard.some(s => s.date === selectedDate)) {
      const timer = setTimeout(() => setAgendaTimeout(true), 8000)
      return () => clearTimeout(timer)
    }
  }, [selectedDate, slotBoard])
  
  const slotColumnsByProfessionalForSelectedDate = professionalsForDailyView.map((professional) => ({
    professional,
    slots: selectedDateSlots.filter((slot) => slot.professional_id === professional.id),
    appointmentCount: selectedDateAppointments.filter((appointment) => appointment.professional_id === professional.id).length,
  }))
  const visibleDailyAppointments = slotColumnsByProfessionalForSelectedDate.reduce((total, column) => total + column.appointmentCount, 0)
  const professionalsWithSlotsToday = new Set(professionalsWithAgendaIds ?? professionals.map(p => p.id))
  const dailyProfessionalHeaderHeight = 88
 
  const timelinePixelsPerMinute = 3
  const dailyTimelineTopOffset = 8
  const dailyTimelineBottomOffset = 52
  const dailySlotGap = 1
  const dailyHourDividerGap = 0
 

  const parseTimeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number)
    return (hours * 60) + minutes
  }

  const formatMinutesToLabel = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60

    return `${String(hours).padStart(2, '0')}:${String(remainingMinutes).padStart(2, '0')}`
  }

  // Prepare values for FullCalendar rendering outside JSX to avoid nested IIFEs
  const visibleProfessionalIds = professionalsForDailyView.map(p => p.id)
  //const hasSlotForVisible = visibleProfessionalIds.some(pid => selectedDateSlots.some(s => s.professional_id === pid))

  // Determine slot duration for calendar: prefer selected professional's slot when present, otherwise use minimal among visible
  const computeSlotDurationString = () => {
    let slotDurationMinutes = 30
    if (activeProfessionalId) {
      const profSlots = selectedDateSlots.filter((s) => String(s.professional_id) === String(activeProfessionalId))
      if (profSlots.length) {
        slotDurationMinutes = profSlots[0].duration_minutes
      } else {
        const visibleSlots = selectedDateSlots.filter((s) => visibleProfessionalIds.includes(s.professional_id))
        const slotMinutesCandidates = visibleSlots.map(s => s.duration_minutes).filter(Boolean)
        slotDurationMinutes = slotMinutesCandidates.length ? Math.min(...slotMinutesCandidates) : 30
      }
    } else {
      const visibleSlots = selectedDateSlots.filter((s) => visibleProfessionalIds.includes(s.professional_id))
      const slotMinutesCandidates = visibleSlots.map(s => s.duration_minutes).filter(Boolean)
      slotDurationMinutes = slotMinutesCandidates.length ? Math.min(...slotMinutesCandidates) : 30
    }

    const minutesToHHMMSS = (m: number) => {
      const hours = Math.floor(m / 60)
      const minutes = m % 60
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`
    }

    return minutesToHHMMSS(slotDurationMinutes)
  }

 // const slotDurationForCalendar = computeSlotDurationString()
  void formatMinutesToLabel

  // Slots to consider for calendar rendering depend on selected professional filter
  const computeVisibleSlotsForCalendar = () => {
    if (activeProfessionalId) {
      return selectedDateSlots.filter((s) => String(s.professional_id) === activeProfessionalId)
    }
    return selectedDateSlots.filter((s) => visibleProfessionalIds.includes(s.professional_id))
  }

  const visibleSlotsForCalendar = computeVisibleSlotsForCalendar()

  const computeSlotMinTimeForCalendar = () => {
    if (visibleSlotsForCalendar.length === 0) return '07:00:00'
    const times = visibleSlotsForCalendar.map(s => s.start_time)
    const min = times.reduce((a, b) => a < b ? a : b)
    return min.length === 5 ? min + ':00' : min
  }

  const computeSlotMaxTimeForCalendar = () => {
    if (visibleSlotsForCalendar.length === 0) return '21:00:00'
    const times = visibleSlotsForCalendar.map(s => s.end_time)
    const max = times.reduce((a, b) => a > b ? a : b)
    return max.length === 5 ? max + ':00' : max
  }

  // Usar solo los valores reales para el timeline
  const computedSlotMinTime = computeSlotMinTimeForCalendar()
  const computedSlotMaxTime = computeSlotMaxTimeForCalendar()

  // Ajuste: asegurar que la duración de slot utilizada por el calendario divide exactamente
  // el rango visible (desde el primer slot hasta el último). Si no divide, reducir la
  // duración a un divisor común para evitar filas vacías al final del timeline.
  const computeAdjustedSlotDurationString = () => {
    const base = computeSlotDurationString()
    const parts = base.split(':').map(Number)
    const slotMinutes = (parts[0] || 0) * 60 + (parts[1] || 0)

    const visibleStarts = visibleSlotsForCalendar.map(s => s.start_time)
    const visibleEnds = visibleSlotsForCalendar.map(s => s.end_time)
    if (visibleStarts.length === 0 || visibleEnds.length === 0) return base

    const minStart = Math.min(...visibleStarts.map(parseTimeToMinutes))
    const maxEnd = Math.max(...visibleEnds.map(parseTimeToMinutes))
    const span = maxEnd - minStart
    if (span <= 0) return base

    const gcd = (a: number, b: number): number => {
      return b === 0 ? a : gcd(b, a % b)
    }

    if (span % slotMinutes === 0) return base

    const g = gcd(span, slotMinutes)
    const adjustedMinutes = g > 0 ? g : slotMinutes

    const hours = Math.floor(adjustedMinutes / 60)
    const minutes = adjustedMinutes % 60
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`
  }

  const slotDurationForCalendarAdjusted = computeAdjustedSlotDurationString()

  // No extender slotMaxTime ni sumar minutos extra: el timeline termina en el último slot real
  const computedDayLastSlotEndMinutes = undefined
  const computedSlotMaxTimeExtended = computedSlotMaxTime

  // Compute contentHeight in pixels for FullCalendar based on number of slot rows
  const slotHeightForCalendar = 50 // px per slot row (matches CitasFullCalendar default)
  const computedCalendarContentHeight = (() => {
    const visible = visibleSlotsForCalendar
    if (!visible || visible.length === 0) return undefined
    const minStart = Math.min(...visible.map(s => parseTimeToMinutes(s.start_time)))
    const maxEnd = Math.max(...visible.map(s => parseTimeToMinutes(s.end_time)))
    const parts = slotDurationForCalendarAdjusted.split(':').map(Number)
    const slotMinutes = (parts[0] || 0) * 60 + (parts[1] || 0)
    if (!slotMinutes || slotMinutes <= 0) return undefined
    const rows = Math.ceil((maxEnd - minStart) / slotMinutes)
    return rows * slotHeightForCalendar
  })()

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

    // Altura mínima dinámica: 36px para 15 min, 44px para 20 min, 60px para 30 min, 88px para slots largos
    const slotDuration = endMinutes - startMinutes
    let minHeight = 88
    if (slotDuration <= 15) minHeight = 36
    else if (slotDuration <= 20) minHeight = 44
    else if (slotDuration <= 30) minHeight = 60

    return Math.max(
      ((endMinutes - startMinutes) * timelinePixelsPerMinute)
      - (dailySlotGap * 2)
      - startDividerGap
      - endDividerGap,
      minHeight,
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
        return status as string
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
      agendaName: slot.block_title ?? undefined,
      slotLengthMinutes: slot.duration_minutes,
    })
    setIsAppointmentModalOpen(true)
  }

  function openAppointmentForEdit(appointmentId: number, slot: SlotBoardEntry) {
    const fullAppointment = appointments.find((item) => item.id === appointmentId)

    if (!fullAppointment) {
      return
    }

    setSelectedAppointment(fullAppointment)
    setSelectedSlot({
      professionalId: slot.professional_id,
      professionalName: slot.professional_name,
      date: fullAppointment.appointment_date,
      startTime: fullAppointment.start_time,
      endTime: fullAppointment.end_time,
      durationMinutes: fullAppointment.duration_minutes,
      agendaName: slot.block_title ?? undefined,
      slotLengthMinutes: slot.duration_minutes,
    })
    setIsAppointmentModalOpen(true)
  }

  function releaseAppointmentSlot(appointmentId: number) {
    const fullAppointment = appointments.find((item) => item.id === appointmentId)

    if (!fullAppointment) {
      return
    }

    const confirmed = window.confirm('¿Deseas liberar este turno? La cita quedará cancelada y el slot volverá a estar disponible.')

    if (!confirmed) {
      return
    }

    saveAppointment({
      professional_id: fullAppointment.professional_id,
      patient_id: fullAppointment.patient_id,
      medical_service_id: fullAppointment.medical_service_id ?? undefined,
      medical_service_ids: fullAppointment.medical_service_ids?.length
        ? fullAppointment.medical_service_ids
        : (fullAppointment.medical_service_id ? [fullAppointment.medical_service_id] : undefined),
      appointment_date: fullAppointment.appointment_date,
      start_time: fullAppointment.start_time,
      duration_minutes: fullAppointment.duration_minutes,
      status: 'cancelled',
      source: fullAppointment.source,
      notes: fullAppointment.notes || undefined,
      cancellation_reason: 'Turno liberado desde la agenda diaria',
    }, fullAppointment.id)
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
              <Badge variant="secondary" className="border-white/20 bg-white/15 text-white">{entry.slots.length} turnos</Badge>
              <Badge variant="secondary" className="border-white/20 bg-white/15 text-white">{entry.appointmentCount} cita(s)</Badge>
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

        <div className="relative bg-white" style={{ minHeight: '120px' }}>
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
            className={`absolute left-0 right-0 flex flex-col overflow-hidden px-2 mb-0.5 ${getDailySlotBlockClasses(slot)} ${isSlotAssignable(slot) ? 'cursor-pointer transition hover:bg-slate-50/70 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-inset' : ''}`}
            style={{
              top: `${getSlotTopPosition(slot.start_time)}px`,
              height: `${getSlotHeight(slot.start_time, slot.end_time)}px`,
              justifyContent: (parseTimeToMinutes(slot.end_time) - parseTimeToMinutes(slot.start_time)) >= 30 ? 'center' : 'flex-start',
              paddingTop: (parseTimeToMinutes(slot.end_time) - parseTimeToMinutes(slot.start_time)) >= 30 ? '0.75rem' : '0.125rem',
              paddingBottom: (parseTimeToMinutes(slot.end_time) - parseTimeToMinutes(slot.start_time)) >= 30 ? '0.75rem' : '0.125rem',
            }}
          >
            {slot.block_title && (
              <p className="text-[11px] font-medium text-amber-900">{slot.block_title}</p>
            )}

            <div className="space-y-1.5">
              {slot.appointments.length === 0 && (
                <div className={`grid ${dailyAppointmentsGridColumns} items-center gap-3 rounded-sm border-b border-slate-100 bg-white px-2 py-1 text-[10px] text-slate-700 last:border-b-0`}>
                  <div className="min-w-0 whitespace-nowrap font-semibold text-slate-700">
                    {slot.start_time} - {slot.end_time}
                  </div>
                  <div className="min-w-0 truncate text-slate-500">
                    {slot.slot_status === 'blocked' ? slot.block_title || 'Bloqueo operativo' : 'Sin paciente asignado'}
                  </div>
                  <div className="min-w-0 truncate text-slate-500">
                    {slot.slot_status === 'blocked' ? slot.block_title || 'Bloqueo operativo' : 'Disponible para agendar'}
                  </div>
                  <div className="min-w-0">
                    <Badge variant={slot.slot_status === 'blocked' ? 'secondary' : 'outline'} className="h-6 px-1.5 text-[10px]">
                      {slot.slot_status === 'blocked' ? (slot.block_title || 'Slot') : 'Disponible'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isSlotAssignable(slot) ? (
                      <Button
                        type="button"
                        size="sm"
                        className="h-9 px-2.5 text-[11px]"
                        onClick={(event) => {
                          event.stopPropagation()
                          openSlotForNewAppointment(slot)
                        }}
                      >
                        Agendar
                      </Button>
                    ) : (
                      <span className="text-[10px] text-slate-500">Sin acción</span>
                    )}
                  </div>
                </div>
              )}

              {slot.appointments.map((appointment) => {
                const appointmentLocked = isAppointmentLocked(appointment)
                // Solo se puede enviar a recepción si está agendada, no está bloqueada y no tiene service_request_id ni status de llegada
                const appointmentCanGoToReception = appointment.status === 'scheduled' && !appointmentLocked && !appointment.service_request_id && appointment.service_request_status !== 'checked_in' && appointment.service_request_status !== 'completed' && appointment.service_request_status !== 'cancelled' && appointment.service_request_status !== 'no_show'

                return (
                  <div key={appointment.id} className={`grid ${dailyAppointmentsGridColumns} items-center gap-3 rounded-sm border-b border-slate-100 bg-white px-2 py-1 last:border-b-0`}>
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
                      {/* Botón principal contextual */}
                      {appointmentCanGoToReception ? (
                        <Button
                          type="button"
                          size="sm"
                          className="h-9 px-2.5 text-[11px]"
                          onClick={(event) => {
                            event.stopPropagation()
                            goToReceptionFromAppointment(appointment.id)
                          }}
                          disabled={!appointmentCanGoToReception || loadingAction === 'reception'}
                        >
                          Recepción
                        </Button>
                      ) : (appointmentLocked || ['checked_in', 'completed', 'cancelled', 'no_show'].includes(appointment.status)) ? (
                        <div className="flex items-center gap-1.5 opacity-60 cursor-not-allowed select-none">
                          <Button type="button" size="sm" variant="outline" className="h-9 px-2.5 text-[11px]" disabled>Editar</Button>
                          <Button type="button" size="sm" variant="outline" className="h-9 w-9" disabled>⋮</Button>
                          <span className="ml-1 text-xs text-gray-500 flex items-center"><svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path stroke="#888" strokeWidth="2" d="M7 11V7a5 5 0 0 1 10 0v4m-9 8h8a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2Z"/></svg>No editable</span>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-9 px-2.5 text-[11px]"
                          onClick={(event) => {
                            event.stopPropagation()
                            openAppointmentForEdit(appointment.id, slot)
                          }}
                          disabled={appointmentLocked || loadingAction === 'appointment'}
                        >
                          Editar
                        </Button>
                      )}
                      {/* Menú Más para acciones secundarias */}
                      {!(appointmentLocked || ['checked_in', 'completed', 'cancelled', 'no_show'].includes(appointment.status)) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button type="button" variant="outline" size="icon" className="h-9 w-9"><span className="sr-only">Más</span>⋮</Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36">
                            {!appointmentCanGoToReception && (
                              <DropdownMenuItem
                                onClick={(event) => {
                                  event.stopPropagation()
                                  goToReceptionFromAppointment(appointment.id)
                                }}
                                disabled={loadingAction === 'reception'}
                              >
                                Enviar a recepción
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={(event) => {
                                event.stopPropagation()
                                openAppointmentForEdit(appointment.id, slot)
                              }}
                              disabled={appointmentLocked || loadingAction === 'appointment'}
                            >
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(event) => {
                                event.stopPropagation()
                                releaseAppointmentSlot(appointment.id)
                              }}
                              disabled={appointmentLocked || appointment.status === 'cancelled' || loadingAction === 'appointment'}
                            >
                              Liberar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(event) => {
                                event.stopPropagation()
                                openPatientRecord(appointment.patient_id)
                              }}
                            >
                              Ver paciente
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
  void renderDailyProfessionalColumn

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
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between mt-2">
              <div className="flex flex-wrap items-center gap-2">
                {/* <Button type="button" size="sm" variant="outline" onClick={() => changeSelectedDate(-1)}>
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Día anterior
                </Button> */}
                <div className="min-w-45 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-center">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(event) => {
                      const val = event.target.value
                      if (dateInputTimerRef.current) window.clearTimeout(dateInputTimerRef.current)
                      dateInputTimerRef.current = window.setTimeout(() => {
                        navigateBoard(val)
                      }, 200)
                    }}
                    className="w-full border-0 bg-transparent p-0 text-center text-sm font-medium text-gray-700 focus:outline-none"
                  />
                  
                </div>
                {/* <Button type="button" size="sm" variant="outline" onClick={() => changeSelectedDate(1)}>
                  Día siguiente
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button> */}
              </div>
              <div className="text-sm text-slate-500">{visibleDailyAppointments} citas visibles en la jornada.</div>
            </div>
            {professionals.some((professional) => professionalsWithSlotsToday.has(professional.id)) && (() => {
              const profsWithAgenda = professionals.filter((professional) => professionalsWithSlotsToday.has(professional.id))
              const selectedProf = profsWithAgenda.find((p) => String(p.id) === activeProfessionalId)
              const rest = profsWithAgenda.filter((p) => String(p.id) !== activeProfessionalId)
              const ordered = selectedProf ? [selectedProf, ...rest] : profsWithAgenda
              const first3 = ordered.slice(0, 3)
              const hiddenProfs = ordered.slice(3)
              const hiddenCount = hiddenProfs.length
              // --- NUEVO: buscar slot siempre por profesional y fecha seleccionados ---
              // Detectar si slotBoard ya tiene datos para la fecha seleccionada
              const isSlotBoardLoaded = slotBoard.some(s => s.date === selectedDate)
              const getAgendaNameAndSlotLength = (professionalId: number) => {
                if (!isSlotBoardLoaded) return { agendaName: undefined, slotLength: undefined }
                const profSlots = slotBoard.filter((s) => s.professional_id === professionalId && s.date === selectedDate)
                const firstSlot = profSlots[0]
                return {
                  agendaName: firstSlot?.block_title,
                  slotLength: firstSlot?.duration_minutes
                }
              }
              // Detectar si hay algún slot para la fecha seleccionada
              const professionalsWithSlots = professionals.filter((p) => slotBoard.some(s => s.date === selectedDate && s.professional_id === p.id))
              const noAgendaForAnyProfessional = isSlotBoardLoaded && professionalsWithSlots.length === 0
              // Si slotBoard está cargado pero no hay ningún slot para la fecha, mostrar mensaje claro
              const noSlotsForDate = isSlotBoardLoaded && slotBoard.filter(s => s.date === selectedDate).length === 0
              return (
                <div className="flex flex-wrap items-center gap-2 mt-2 min-h-32px">
                  {!isSlotBoardLoaded && !agendaTimeout && (
                    <span className="text-xs text-slate-400 italic">Cargando agendas...</span>
                  )}
                  {!isSlotBoardLoaded && agendaTimeout && (
                    <span className="text-xs text-red-500 italic">No se pudo cargar la agenda, intente nuevamente.</span>
                  )}
                  {noSlotsForDate && (
                    <span className="text-xs text-slate-500 italic">Sin agenda para la fecha seleccionada.</span>
                  )}
                  {!noSlotsForDate && noAgendaForAnyProfessional && (
                    <span className="text-xs text-slate-500 italic">No existe agenda disponible para ningún profesional en esta fecha.</span>
                  )}
                  {isSlotBoardLoaded && !noAgendaForAnyProfessional && first3.map((professional) => {
                    const isSelected = String(professional.id) === activeProfessionalId
                    const { agendaName, slotLength } = getAgendaNameAndSlotLength(professional.id)
                    const hasAgenda = typeof slotLength === 'number' && slotLength > 0
                    return (
                      <button
                        key={professional.id}
                        type="button"
                        onClick={() => {
                          setFilterProfessionalId(String(professional.id))
                        }}
                        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all ${
                          isSelected
                            ? 'border-sky-500 bg-sky-500 text-white shadow-sm'
                            : 'border-gray-200 bg-white text-gray-400 hover:border-gray-300 hover:text-gray-600'
                        }`}
                      >
                        <span className={`h-2 w-2 shrink-0 rounded-full transition-all ${isSelected ? 'bg-white' : 'bg-gray-300'}`} />
                        <div className="flex flex-col items-start">
                          <span className="leading-none">{professional.full_name}</span>
                          {/* Solo mostrar subtítulo si realmente hay agenda */}
                          {hasAgenda && (
                            <span className="text-xs text-slate-500 leading-none">
                              {agendaName ? `${agendaName}` : ''}{agendaName && slotLength ? ' · ' : ''}{slotLength ? `${slotLength} min` : ''}
                            </span>
                          )}
                        </div>
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
                                      setShowAllProfessionals(false)
                                      setProfessionalsDropdownSearch('')
                                    }}
                                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-gray-50 ${
                                      isSelected ? 'font-medium text-sky-600' : 'text-gray-700'
                                    }`}
                                  >
                                    <span className={`h-2 w-2 shrink-0 rounded-full ${isSelected ? 'bg-sky-500' : 'bg-gray-300'}`} />
                                    <div className="flex flex-col">
                                      <span>{professional.full_name}</span>
                                      {(() => {
                                        const profSlots2 = selectedDateSlots.filter((s) => s.professional_id === professional.id)
                                        const firstSlot2 = profSlots2[0]
                                        if (!firstSlot2) return null
                                        return (
                                          <span className="text-xs text-shadow-gray-200">{firstSlot2.block_title ? `${firstSlot2.block_title} - ` : ''}{firstSlot2.duration_minutes} min</span>
                                        )
                                      })()}
                                    </div>
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
       
              
              {/* FullCalendar central */}
              <div className="flex-1 min-w-0 flex flex-col gap-4">
                {/* Filtros y botones siempre arriba del calendario, nunca dentro del mismo contenedor */}
                <div className="w-full flex flex-wrap gap-2 mb-2 z-20 relative">
                  {/* Aquí puedes poner tus filtros, botones, dropdowns, etc. Ejemplo: */}
                  {/* <Button variant="outline">Filtrar presupuesto</Button> */}
                  {/* ...otros filtros... */}
                </div>
                <div className="w-full flex-1 min-h-0">
                  {/*
                    Siempre renderizamos el calendario. El hijo (CitasFullCalendar) es responsable de mostrar el mensaje de "Sin agenda para la fecha"
                    si no hay slots visibles para la fecha/profesional seleccionados. Así, los botones prev/next nunca se bloquean y la UX es consistente.
                  */}
                  <CitasFullCalendar
                    // Unimos citas y slots bloqueados para visualización
                    events={(() => {
                      const visibleProfessionalIds = new Set(professionalsForDailyView.map(p => p.id))
                      // Eventos de citas
                      const appointmentEvents = appointments
                        .filter((appt) => visibleProfessionalIds.size === 0 || visibleProfessionalIds.has(appt.professional_id))
                        .map(appt => {
                          const matchingSlot = slotBoard.find((s) => s.professional_id === appt.professional_id && s.date === appt.appointment_date && s.start_time === appt.start_time)
                          const agendaName = matchingSlot?.block_title || matchingSlot?.block_title === null ? matchingSlot?.block_title : undefined
                          const slotLength = matchingSlot?.duration_minutes ?? appt.duration_minutes
                          return {
                            id: String(appt.id),
                            title: `${appt.professional_name} — ${appt.patient_name}` + (appt.medical_service_name ? ` (${appt.medical_service_name})` : ''),
                            start: appt.appointment_date + 'T' + appt.start_time,
                            end: appt.appointment_date + 'T' + appt.end_time,
                            extendedProps: {
                              ...appt,
                              agenda_name: agendaName,
                              slot_length_minutes: slotLength,
                              service_name: appt.medical_service_name || '',
                              slot_status: matchingSlot?.slot_status,
                            },
                            backgroundColor: appt.status === 'cancelled' ? '#fca5a5' : appt.status === 'completed' ? '#a7f3d0' : '#93c5fd',
                            borderColor: appt.status === 'cancelled' ? '#f87171' : appt.status === 'completed' ? '#10b981' : '#2563eb',
                          }
                        })
                      // Eventos de slots bloqueados
                      const blockedSlotEvents = slotBoard
                        .filter(slot => slot.slot_status === 'blocked' && (visibleProfessionalIds.size === 0 || visibleProfessionalIds.has(slot.professional_id)))
                        .map(slot => {
                          return {
                            id: `blocked-${slot.professional_id}-${slot.date}-${slot.start_time}`,
                            title: 'Franja bloqueada',
                            start: slot.date + 'T' + slot.start_time,
                            end: slot.date + 'T' + slot.end_time,
                            extendedProps: {
                              ...slot,
                              block_title: slot.block_title,
                              block_type: slot.block_type,
                              agenda_name: slot.block_title || slot.agenda_name,
                              slot_status: 'blocked',
                            },
                           // backgroundColor: '#374151',
                           // borderColor: '#374151',
                          }
                        })
                      return [...appointmentEvents, ...blockedSlotEvents]
                    })()}
                    initialView="timeGridDay"
                    filters={{
                      professional_id: filterProfessionalId,
                      selected_date: selectedDate,
                    }}
                    lastRequestedDateRef={lastRequestedDateRef}
                    onConsumeLastRequested={() => { lastRequestedDateRef.current = null }}
                    onApiReady={(api) => { calendarApiRef.current = api }}
                    slotMinTime={computedSlotMinTime}
                    slotMaxTime={computedSlotMaxTimeExtended}
                    contentHeight={computedCalendarContentHeight}
                    slotDuration={slotDurationForCalendarAdjusted}
                    slotLabelInterval={slotDurationForCalendarAdjusted}
                    slotHeight={slotHeightForCalendar}
                    dayLastSlotEndMinutes={computedDayLastSlotEndMinutes}
                    onDateChange={(info: DatesSetArg) => {
                      const newDate = info.startStr?.slice(0, 10)
                      if (!newDate) return

                      // Ignorar el primer render del calendario
                      if (!calendarInitializedRef.current) {
                        calendarInitializedRef.current = true
                        if (lastRequestedDateRef.current === newDate) {
                          lastRequestedDateRef.current = null
                        }
                        return
                      }

                      // Si es navegación programática, ignorar
                      if (lastRequestedDateRef.current === newDate) {
                        lastRequestedDateRef.current = null
                        return
                      }

                      // Siempre usa navigateBoard para mantener sincronía
                      if (newDate !== selectedDate) {
                        navigateBoard(newDate)
                      }
                    }}
                    onEventClick={(arg: EventClickArg) => {
                      const appt = arg.event.extendedProps as Appointment
                      if (appt && appt.id) {
                        openAppointmentForEdit(appt.id, {
                          professional_id: appt.professional_id,
                          professional_name: appt.professional_name,
                          date: appt.appointment_date,
                          start_time: appt.start_time,
                          end_time: appt.end_time,
                          duration_minutes: appt.duration_minutes,
                          capacity: 1,
                          occupied_count: 1,
                          available_capacity: 0,
                          slot_status: 'occupied',
                          appointments: [] as Appointment[],
                        })
                      }
                    }}
                    onEventAction={(action, mountArg) => {
                      const appt = mountArg.event.extendedProps as Appointment
                      if (!appt || !appt.id) return

                      if (action === 'edit') {
                        openAppointmentForEdit(appt.id, {
                          professional_id: appt.professional_id,
                          professional_name: appt.professional_name,
                          date: appt.appointment_date,
                          start_time: appt.start_time,
                          end_time: appt.end_time,
                          duration_minutes: appt.duration_minutes,
                          capacity: 1,
                          occupied_count: 1,
                          available_capacity: 0,
                          slot_status: 'occupied',
                          appointments: [] as Appointment[],
                        })
                        return
                      }

                      if (action === 'release') {
                        releaseAppointmentSlot(appt.id)
                        return
                      }

                      if (action === 'reception') {
                        goToReceptionFromAppointment(appt.id)
                        return
                      }
                    }}
                    onSlotSelect={(selection: DateSelectArg) => {
                      const { start, end } = selection
                      try {
                        // debug log removed
                      } catch (e) {
                        console.error('Error processing slot selection:', e)
                      }

                      const formatLocalDate = (d?: Date) => {
                        if (!d) return ''
                        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                      }
                      const formatLocalTime = (d?: Date) => {
                        if (!d) return ''
                        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
                      }

                      const derivedSlot = {
                        professionalId: Number(filterProfessionalId || ''),
                        professionalName: professionals.find(p => String(p.id) === filterProfessionalId)?.full_name || '',
                        date: formatLocalDate(start),
                        startTime: formatLocalTime(start),
                        endTime: formatLocalTime(end),
                        durationMinutes: start && end ? Math.round((end.getTime() - start.getTime()) / 60000) : 0,
                      }

                      const derivedStartMinutes = parseTimeToMinutes(derivedSlot.startTime)
                      const matchingSlot = selectedDateSlots.find((s) => {
                        const sStart = parseTimeToMinutes(s.start_time)
                        const sEnd = parseTimeToMinutes(s.end_time)
                        const matchesProfessional = filterProfessionalId ? String(s.professional_id) === filterProfessionalId : true

                        if (s.start_time === derivedSlot.startTime && s.end_time === derivedSlot.endTime) return matchesProfessional
                        if (derivedStartMinutes >= sStart && derivedStartMinutes < sEnd) return matchesProfessional
                        return false
                      })

                      if (!matchingSlot) {
                        // Mostrar mensaje tipo toast/sooner visual
                        if (toast) {
                          toast.warning('La hora seleccionada no corresponde a una agenda activa para el profesional.')
                        } 
                        return
                      }

                      if (!isSlotAssignable(matchingSlot)) {
                      toast.warning('El slot seleccionado no es asignable.')
                        return
                      }

                      setSelectedAppointment(null)
                      setSelectedSlot({
                        professionalId: matchingSlot.professional_id,
                        professionalName: matchingSlot.professional_name,
                        date: matchingSlot.date,
                        startTime: matchingSlot.start_time,
                        endTime: matchingSlot.end_time,
                        durationMinutes: matchingSlot.duration_minutes,
                        agendaName: matchingSlot.block_title ?? undefined,
                        slotLengthMinutes: matchingSlot.duration_minutes,
                      })
                      setIsAppointmentModalOpen(true)
                    }}
                  />
                </div>
              </div>
         
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

        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      </div>
    </AppLayout>
  )
}
