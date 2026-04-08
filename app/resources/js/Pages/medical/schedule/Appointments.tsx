import { Head, router } from '@inertiajs/react'
import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import AppLayout from '@/layouts/app-layout'
import SearchableInput from '@/components/ui/SearchableInput'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  const [currentPanel, setCurrentPanel] = useState<'range' | 'today'>('range')
  const [filterProfessionalId, setFilterProfessionalId] = useState(filters.professional_id ? String(filters.professional_id) : '')
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false)
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

  const getProfessionalName = (professionalId: string) => {
    if (!professionalId) {
      return ''
    }

    return professionals.find((professional) => String(professional.id) === professionalId)?.full_name || ''
  }

  const navigateBoard = (nextDate: string, nextView = currentView, nextProfessionalId = filterProfessionalId) => {
    setSelectedDate(nextDate)
    setCurrentView(nextView)

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

  const formattedSelectedDate = useMemo(
    () => new Intl.DateTimeFormat('es-PY', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(`${selectedDate}T00:00:00`)),
    [selectedDate]
  )

  const groupedSlots = useMemo(() => {
    return slotBoard.reduce<Record<string, SlotBoardEntry[]>>((accumulator, slot) => {
      if (!accumulator[slot.date]) {
        accumulator[slot.date] = []
      }

      accumulator[slot.date].push(slot)
      return accumulator
    }, {})
  }, [slotBoard])

  const orderedDates = useMemo(() => Object.keys(groupedSlots).sort(), [groupedSlots])

  const professionalsForDailyView = useMemo(() => {
    if (filterProfessionalId) {
      return professionals.filter((professional) => String(professional.id) === filterProfessionalId)
    }

    return professionals
  }, [filterProfessionalId, professionals])

  const appointmentsByProfessionalForSelectedDate = useMemo(() => {
    const appointmentsForSelectedDate = appointments
      .filter((appointment) => appointment.appointment_date === selectedDate)
      .sort((left, right) => {
        if (left.start_time === right.start_time) {
          return left.patient_name.localeCompare(right.patient_name, 'es')
        }

        return left.start_time.localeCompare(right.start_time)
      })

    return professionalsForDailyView.map((professional) => ({
      professional,
      appointments: appointmentsForSelectedDate.filter((appointment) => appointment.professional_id === professional.id),
    }))
  }, [appointments, professionalsForDailyView, selectedDate])

  const isAppointmentLocked = (
    appointment:
      | Pick<Appointment, 'service_request_id' | 'service_request_status'>
      | Pick<SlotBoardEntry['appointments'][number], 'service_request_id' | 'service_request_status'>
  ) => {
    return Boolean(
      appointment.service_request_id
      && appointment.service_request_status
      && appointment.service_request_status !== 'pending_confirmation'
    )
  }

  const getAppointmentStatusLabel = (status: Appointment['status'] | SlotBoardEntry['appointments'][number]['status']) => {
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

  const getDisplayAppointmentStatus = (
    appointment:
      | Pick<Appointment, 'status' | 'service_request_status'>
      | Pick<SlotBoardEntry['appointments'][number], 'status' | 'service_request_status'>
  ) => {
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
      },
    })
  }

  const renderSlotCard = (slot: SlotBoardEntry) => (
    <div key={`${slot.date}-${slot.start_time}-${slot.professional_id}`} className={`rounded-lg border p-3 ${getSlotClasses(slot)}`}>
      <div className="mb-2 flex items-start justify-between gap-2">
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

  const renderDailyProfessionalColumn = (entry: { professional: ProfessionalOption; appointments: Appointment[] }) => (
    <div key={entry.professional.id} className="flex min-w-[300px] max-w-[300px] flex-col rounded-xl border border-gray-200 bg-white">
      <div className="sticky top-0 rounded-t-xl border-b border-gray-200 bg-slate-50 px-4 py-3">
        <div className="font-semibold text-gray-900">{entry.professional.full_name}</div>
        <div className="mt-1 flex items-center justify-between gap-2 text-xs text-gray-500">
          <span>{entry.professional.specialties.join(', ') || 'Sin especialidad'}</span>
          <Badge variant="outline">{entry.appointments.length} citas</Badge>
        </div>
      </div>

      <div className="flex-1 space-y-3 p-3">
        {entry.appointments.length === 0 && (
          <div className="rounded-lg border border-dashed border-gray-200 px-3 py-6 text-center text-sm text-gray-500">
            Sin citas para este día.
          </div>
        )}

        {entry.appointments.map((appointment) => {
          const appointmentLocked = isAppointmentLocked(appointment)
          const appointmentCanGoToReception = !appointment.service_request_id && appointment.status !== 'cancelled'

          return (
            <div key={appointment.id} className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
              <button
                type="button"
                onClick={() => openExistingAppointment(appointment.id)}
                disabled={appointmentLocked}
                className={`w-full text-left ${appointmentLocked ? 'cursor-not-allowed opacity-80' : 'hover:bg-slate-50'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-gray-900">{appointment.patient_name}</div>
                    <div className="mt-1 text-xs text-gray-500">{appointment.start_time} a {appointment.end_time}</div>
                    {appointment.medical_service_name && <div className="mt-1 text-xs text-gray-500">{appointment.medical_service_name}</div>}
                    {appointment.service_request_number && <div className="mt-1 text-xs text-emerald-600">Recepción: {appointment.service_request_number}</div>}
                  </div>
                  <Badge variant={appointment.status === 'cancelled' ? 'secondary' : 'outline'}>
                    {getAppointmentStatusLabel(getDisplayAppointmentStatus(appointment))}
                  </Badge>
                </div>
              </button>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => openExistingAppointment(appointment.id)} disabled={appointmentLocked}>
                  {appointmentLocked ? 'No editable' : 'Editar'}
                </Button>

                {appointmentCanGoToReception && (
                  <Button type="button" size="sm" onClick={() => goToReceptionFromAppointment(appointment.id)} disabled={loadingAction === 'reception'}>
                    Enviar a Recepción
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Citas médicas" />

      <div className="space-y-6 p-4 md:p-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Citas médicas</h1>
          <p className="text-sm text-gray-500">Administrá la agenda clínica con foco en reservas, slots y seguimiento operativo.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Panel de citas</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-[1fr,auto,auto]">
            <div>
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
                <Button type="button" variant="outline" onClick={() => {
                  setFilterProfessionalId('')
                  navigateBoard(selectedDate, currentView, '')
                }}>
                  Todos
                </Button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Vista</label>
              <Tabs value={currentView} onValueChange={(value) => navigateBoard(selectedDate, value as 'day' | 'week' | 'month')}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="day">Día</TabsTrigger>
                  <TabsTrigger value="week">Semana</TabsTrigger>
                  <TabsTrigger value="month">Mes</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="flex items-end gap-2">
              <Button type="button" variant="outline" size="icon" onClick={() => changeSelectedDate(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button type="button" variant="outline" size="icon" onClick={() => changeSelectedDate(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs value={currentPanel} onValueChange={(value) => setCurrentPanel(value as 'range' | 'today')}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="range">Agenda del rango</TabsTrigger>
            <TabsTrigger value="today">Citas del día</TabsTrigger>
          </TabsList>

          <TabsContent value="range" className="mt-4">
            <div className="grid gap-6 xl:grid-cols-[1.6fr,1fr]">
              <Card>
                <CardHeader>
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <CardTitle>Slots navegables</CardTitle>
                      <p className="text-sm text-gray-500">Fecha foco: {formattedSelectedDate}</p>
                    </div>
                    <div className="min-w-56 rounded-md border border-gray-200 px-3 py-2 text-center">
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(event) => navigateBoard(event.target.value)}
                        className="w-full border-0 bg-transparent p-0 text-center text-sm font-medium text-gray-700 focus:outline-none"
                      />
                      <div className="mt-1 text-xs text-gray-500">Rango visible: {filters.range_start} al {filters.range_end}</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {!filterProfessionalId && (
                    <div className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-sm text-gray-500">
                      Seleccioná un profesional para navegar sus slots y citas por día, semana o mes.
                    </div>
                  )}

                  {filterProfessionalId && orderedDates.length === 0 && (
                    <div className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-sm text-gray-500">
                      No hay slots generados para el rango seleccionado.
                    </div>
                  )}

                  {filterProfessionalId && currentView === 'day' && orderedDates.map((date) => (
                    <div key={date} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                      <div className="grid grid-cols-[84px,1fr] border-b border-gray-200 bg-gray-50">
                        <div className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Hora</div>
                        <div className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Detalle del slot</div>
                      </div>
                      {groupedSlots[date].map(renderDaySlotRow)}
                    </div>
                  ))}

                  {filterProfessionalId && currentView === 'week' && (
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

                  {filterProfessionalId && currentView === 'month' && (
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
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle>Citas del día por profesional</CardTitle>
                    <p className="text-sm text-gray-500">Vista navegable por columnas para {formattedSelectedDate}.</p>
                  </div>
                  <div className="min-w-56 rounded-md border border-gray-200 px-3 py-2 text-center">
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(event) => navigateBoard(event.target.value)}
                      className="w-full border-0 bg-transparent p-0 text-center text-sm font-medium text-gray-700 focus:outline-none"
                    />
                    <div className="mt-1 text-xs text-gray-500">Cada columna representa un médico.</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {appointmentsByProfessionalForSelectedDate.every((entry) => entry.appointments.length === 0) ? (
                  <div className="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
                    No hay citas registradas para la fecha seleccionada.
                  </div>
                ) : (
                  <div className="overflow-x-auto pb-2">
                    <div className="flex gap-4">
                      {appointmentsByProfessionalForSelectedDate.map(renderDailyProfessionalColumn)}
                    </div>
                  </div>
                )}
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

        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      </div>
    </AppLayout>
  )
}
