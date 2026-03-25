import { Head, router } from '@inertiajs/react'
import { useMemo, useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { ChevronLeft, ChevronRight, Pencil, PlusCircle } from 'lucide-react'
import AppLayout from '@/layouts/app-layout'
import SearchableInput from '@/components/ui/SearchableInput'
import SelectItem from '@/components/ui/SelectItem'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable, type PaginatedData } from '@/components/ui/data-table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ScheduleFormModal from '@/components/medical/schedule/ScheduleFormModal'
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

type ScheduleRule = {
	id?: number
	weekday: number
	start_time: string
	end_time: string
	capacity: number
	is_active: boolean
}

type ScheduleConfig = {
	id: number
	professional_id: number
	professional_name: string
	name: string
	start_date: string
	end_date?: string | null
	slot_duration_minutes: number
	status: 'active' | 'inactive'
	notes?: string | null
	rules: ScheduleRule[]
}

type ScheduleBlock = {
	id: number
	professional_id: number
	professional_name: string
	block_type: 'travel' | 'conference' | 'holiday' | 'vacation' | 'other'
	title: string
	start_datetime: string
	end_datetime: string
	affects_full_day: boolean
	status: 'active' | 'cancelled'
	notes?: string | null
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

type Occupancy = {
	total_capacity: number
	total_booked: number
	occupancy_percentage: number
	daily: Array<{
		date: string
		capacity: number
		booked: number
		occupancy_percentage: number
	}>
	professionals: Array<{
		professional_id: number
		professional_name: string
		capacity: number
		booked: number
		occupancy_percentage: number
	}>
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

interface SchedulePageProps {
	professionals: ProfessionalOption[]
	medicalServices: MedicalServiceOption[]
	schedules: PaginatedData<ScheduleConfig>
	blocks: ScheduleBlock[]
	appointments: Appointment[]
	occupancy: Occupancy
	slotBoard: SlotBoardEntry[]
	filters: {
		professional_id?: number | null
		date_from: string
		date_to: string
		selected_date: string
		search?: string | null
		status?: string | null
		per_page?: number
	}
}

const weekDays = [
	{ value: 1, label: 'Lunes' },
	{ value: 2, label: 'Martes' },
	{ value: 3, label: 'Miércoles' },
	{ value: 4, label: 'Jueves' },
	{ value: 5, label: 'Viernes' },
	{ value: 6, label: 'Sábado' },
	{ value: 0, label: 'Domingo' },
]

export default function ScheduleIndex({
	professionals,
	medicalServices,
	schedules,
	blocks,
	appointments,
	occupancy,
	slotBoard,
	filters,
}: SchedulePageProps) {
	const { searchPatients, searchProfessionals } = useSearch()
	const {
		loadingAction,
		error,
		navigateWithFilters,
		saveSchedule,
		saveBlock,
		saveAppointment,
		goToReceptionFromAppointment,
	} = useSchedule()

	const [filterProfessionalId, setFilterProfessionalId] = useState(filters.professional_id ? String(filters.professional_id) : '')
	const [dateFrom, setDateFrom] = useState(filters.date_from)
	const [dateTo, setDateTo] = useState(filters.date_to)
	const [selectedDate, setSelectedDate] = useState(filters.selected_date)
	const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
	const [selectedSchedule, setSelectedSchedule] = useState<ScheduleConfig | null>(null)

	const [blockId, setBlockId] = useState<number | null>(null)
	const [blockProfessionalId, setBlockProfessionalId] = useState('')
	const [blockType, setBlockType] = useState<'travel' | 'conference' | 'holiday' | 'vacation' | 'other'>('vacation')
	const [blockTitle, setBlockTitle] = useState('')
	const [blockStart, setBlockStart] = useState('')
	const [blockEnd, setBlockEnd] = useState('')
	const [blockFullDay, setBlockFullDay] = useState(false)
	const [blockStatus, setBlockStatus] = useState<'active' | 'cancelled'>('active')
	const [blockNotes, setBlockNotes] = useState('')

	const [appointmentId, setAppointmentId] = useState<number | null>(null)
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
		{ href: '/medical/schedule', title: 'Agenda' },
	]

	const getProfessionalName = (professionalId: string) => {
		if (!professionalId) {
			return ''
		}

		return professionals.find((professional) => String(professional.id) === professionalId)?.full_name || ''
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

	const applyFilters = () => {
		navigateWithFilters({
			professional_id: filterProfessionalId || undefined,
			date_from: dateFrom,
			date_to: dateTo,
			selected_date: selectedDate,
			search: filters.search || undefined,
			status: filters.status || undefined,
			per_page: filters.per_page,
		})
	}

	const openCreateScheduleModal = () => {
		setSelectedSchedule(null)
		setIsScheduleModalOpen(true)
	}

	const openEditScheduleModal = (schedule: ScheduleConfig) => {
		setSelectedSchedule(schedule)
		setIsScheduleModalOpen(true)
	}

	const closeScheduleModal = (open: boolean) => {
		setIsScheduleModalOpen(open)
		if (!open) {
			setSelectedSchedule(null)
		}
	}

	const resetBlockForm = () => {
		setBlockId(null)
		setBlockProfessionalId('')
		setBlockType('vacation')
		setBlockTitle('')
		setBlockStart('')
		setBlockEnd('')
		setBlockFullDay(false)
		setBlockStatus('active')
		setBlockNotes('')
	}

	const resetAppointmentForm = () => {
		setAppointmentId(null)
		setSelectedAppointment(null)
		setSelectedSlot(null)
	}

	const loadBlock = (block: ScheduleBlock) => {
		setBlockId(block.id)
		setBlockProfessionalId(String(block.professional_id))
		setBlockType(block.block_type)
		setBlockTitle(block.title)
		setBlockStart(block.start_datetime)
		setBlockEnd(block.end_datetime)
		setBlockFullDay(block.affects_full_day)
		setBlockStatus(block.status)
		setBlockNotes(block.notes || '')
	}

	const loadAppointment = (appointment: Appointment) => {
		setAppointmentId(appointment.id)
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

	const openSlotForNewAppointment = (slot: SlotBoardEntry) => {
		setAppointmentId(null)
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

	const closeAppointmentModal = (open: boolean) => {
		setIsAppointmentModalOpen(open)
		if (!open) {
			resetAppointmentForm()
		}
	}

	const navigateToDate = (nextDate: string) => {
		setSelectedDate(nextDate)
		navigateWithFilters({
			professional_id: filterProfessionalId || undefined,
			date_from: dateFrom,
			date_to: dateTo,
			selected_date: nextDate,
			search: filters.search || undefined,
			status: filters.status || undefined,
			per_page: filters.per_page,
		})
	}

	const changeSelectedDate = (days: number) => {
		const nextDate = new Date(`${selectedDate}T00:00:00`)
		nextDate.setDate(nextDate.getDate() + days)
		const normalized = nextDate.toISOString().split('T')[0]
		navigateToDate(normalized)
	}

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

	const submitSchedule = (payload: {
		professional_id: number
		name: string
		start_date: string
		end_date?: string
		slot_duration_minutes: number
		status: 'active' | 'inactive'
		notes?: string
		rules: Array<{
			weekday: number
			start_time: string
			end_time: string
			capacity: number
			is_active?: boolean
		}>
	}, scheduleId?: number) => {
		saveSchedule(payload, scheduleId, {
			onSuccess: () => {
				closeScheduleModal(false)
			},
		})
	}

	const scheduleColumns = useMemo<ColumnDef<ScheduleConfig>[]>(() => [
		{
			accessorKey: 'name',
			header: 'Agenda',
			cell: ({ row }) => (
				<div>
					<div className="font-medium text-gray-900">{row.original.name}</div>
					<div className="text-sm text-gray-500">{row.original.professional_name}</div>
				</div>
			),
		},
		{
			accessorKey: 'start_date',
			header: 'Vigencia',
			cell: ({ row }) => (
				<div className="text-sm text-gray-600">
					{row.original.start_date} {row.original.end_date ? `al ${row.original.end_date}` : 'sin fecha fin'}
				</div>
			),
		},
		{
			accessorKey: 'slot_duration_minutes',
			header: 'Slot',
			cell: ({ row }) => <div className="text-sm text-gray-600">{row.original.slot_duration_minutes} min</div>,
		},
		{
			id: 'rules_summary',
			header: 'Reglas',
			cell: ({ row }) => (
				<div className="flex flex-wrap gap-1">
					{row.original.rules.slice(0, 2).map((rule) => (
						<span key={`${row.original.id}-${rule.weekday}-${rule.start_time}`} className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">
							{weekDays.find((day) => day.value === rule.weekday)?.label}: {rule.start_time}-{rule.end_time}
						</span>
					))}
					{row.original.rules.length > 2 && (
						<span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">+{row.original.rules.length - 2} más</span>
					)}
				</div>
			),
		},
		{
			accessorKey: 'status',
			header: 'Estado',
			cell: ({ row }) => (
				<Badge variant={row.original.status === 'active' ? 'default' : 'secondary'}>
					{row.original.status === 'active' ? 'Activa' : 'Inactiva'}
				</Badge>
			),
		},
		{
			id: 'actions',
			header: 'Acciones',
			cell: ({ row }) => (
				<Button type="button" variant="outline" size="sm" onClick={() => openEditScheduleModal(row.original)}>
					<Pencil className="mr-2 h-4 w-4" />
					Editar
				</Button>
			),
		},
	], [])

	const submitBlock = (event: React.FormEvent) => {
		event.preventDefault()

		saveBlock({
			professional_id: Number(blockProfessionalId),
			block_type: blockType,
			title: blockTitle,
			start_datetime: blockStart,
			end_datetime: blockEnd,
			affects_full_day: blockFullDay,
			status: blockStatus,
			notes: blockNotes || undefined,
		}, blockId || undefined)
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
	}, currentAppointmentId?: number) => {
		saveAppointment(payload, currentAppointmentId, {
			onSuccess: () => {
				closeAppointmentModal(false)
			},
		})
	}

	return (
		<AppLayout breadcrumbs={breadcrumbs}>
			<Head title="Agenda médica" />

			<div className="space-y-6 p-4 md:p-6">
				<div>
					<h1 className="text-2xl font-semibold text-gray-900">Agenda médica</h1>
					<p className="text-sm text-gray-500">Configurá agendas, bloqueos, reservas y el paso a Recepción desde un solo flujo.</p>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>Filtros de ocupación y disponibilidad</CardTitle>
					</CardHeader>
					<CardContent className="grid gap-4 md:grid-cols-5">
						<div>
							<label className="mb-1 block text-sm font-medium text-gray-700">Profesional</label>
							<div className="flex gap-2">
								<SearchableInput
									placeholder="Prof."
									value={getProfessionalName(filterProfessionalId)}
									onSelect={(professional) => setFilterProfessionalId(String(professional.id))}
									onSearch={searchProfessionals}
									minSearchLength={1}
									maxResults={10}
									className="w-full"
								/>
								<Button type="button" variant="outline" onClick={() => setFilterProfessionalId('')}>
									Todos
								</Button>
							</div>
						</div>
						<div>
							<label className="mb-1 block text-sm font-medium text-gray-700">Desde</label>
							<input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2" />
						</div>
						<div>
							<label className="mb-1 block text-sm font-medium text-gray-700">Hasta</label>
							<input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2" />
						</div>
						<div>
							<label className="mb-1 block text-sm font-medium text-gray-700">Vista de disponibilidad</label>
							<input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2" />
						</div>
						<div className="flex items-end">
							<Button type="button" className="w-full" onClick={applyFilters} disabled={loadingAction === 'filters'}>
								Actualizar panel
							</Button>
						</div>
					</CardContent>
				</Card>

				<div className="grid gap-4 md:grid-cols-4">
					<Card>
						<CardContent className="pt-6">
							<div className="text-sm text-gray-500">Capacidad total</div>
							<div className="text-3xl font-semibold">{occupancy.total_capacity}</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="pt-6">
							<div className="text-sm text-gray-500">Slots ocupados</div>
							<div className="text-3xl font-semibold">{occupancy.total_booked}</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="pt-6">
							<div className="text-sm text-gray-500">Ocupación global</div>
							<div className="text-3xl font-semibold">{occupancy.occupancy_percentage}%</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="pt-6">
							<div className="text-sm text-gray-500">Citas en rango</div>
							<div className="text-3xl font-semibold">{appointments.length}</div>
						</CardContent>
					</Card>
				</div>

				<div className="grid gap-6 xl:grid-cols-2">
					<Card>
						<CardHeader>
							<CardTitle>Ocupación diaria</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							{occupancy.daily.length === 0 && <p className="text-sm text-gray-500">No hay agenda disponible en el rango seleccionado.</p>}
							{occupancy.daily.map((day) => (
								<div key={day.date} className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
									<div>
										<div className="font-medium text-gray-900">{day.date}</div>
										<div className="text-sm text-gray-500">{day.booked} reservados de {day.capacity}</div>
									</div>
									<Badge variant="secondary">{day.occupancy_percentage}%</Badge>
								</div>
							))}
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Ocupación por profesional</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							{occupancy.professionals.length === 0 && <p className="text-sm text-gray-500">Sin datos de ocupación.</p>}
							{occupancy.professionals.map((row) => (
								<div key={row.professional_id} className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
									<div>
										<div className="font-medium text-gray-900">{row.professional_name}</div>
										<div className="text-sm text-gray-500">{row.booked} reservados de {row.capacity}</div>
									</div>
									<Badge>{row.occupancy_percentage}%</Badge>
								</div>
							))}
						</CardContent>
					</Card>
				</div>

				<Tabs defaultValue="agendas" className="space-y-6">
					<TabsList className="grid w-full grid-cols-3">
						<TabsTrigger value="agendas">Agendas</TabsTrigger>
						<TabsTrigger value="bloqueos">Bloqueos</TabsTrigger>
						<TabsTrigger value="citas">Citas</TabsTrigger>
					</TabsList>

					<TabsContent value="agendas">
						<Card>
							<CardHeader>
								<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
									<div>
										<CardTitle>Agendas configuradas</CardTitle>
										<p className="text-sm text-gray-500">Gestioná todas las agendas desde una grilla paginada y editá en modal.</p>
									</div>
									<Button type="button" onClick={openCreateScheduleModal}>
										<PlusCircle className="mr-2 h-4 w-4" />
										Nueva agenda
									</Button>
								</div>
							</CardHeader>
							<CardContent>
								<DataTable
									columns={scheduleColumns}
									data={schedules}
									searchPlaceholder="Buscar agenda o profesional..."
									emptyMessage="No se encontraron agendas con los filtros aplicados"
									statusFilterable={true}
									statusOptions={[
										{ value: 'active', label: 'Activa' },
										{ value: 'inactive', label: 'Inactiva' },
									]}
									onStatusChange={(status) => {
										const params = new URLSearchParams(window.location.search)
										if (status !== 'all') {
											params.set('status', status)
										} else {
											params.delete('status')
										}
										params.set('page', '1')
										router.get(`${window.location.pathname}?${params.toString()}`, {}, { preserveState: true, replace: true })
									}}
									initialSearch={filters.search || ''}
									initialStatus={filters.status || 'all'}
									loading={loadingAction === 'filters'}
								/>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="bloqueos">
						<div className="grid gap-6 xl:grid-cols-2">
					<Card>
						<CardHeader>
							<CardTitle>{blockId ? 'Editar bloqueo' : 'Nuevo bloqueo'}</CardTitle>
						</CardHeader>
						<CardContent>
							<form className="space-y-4" onSubmit={submitBlock}>
								<div className="grid gap-4 md:grid-cols-2">
									<div>
										<label className="mb-1 block text-sm font-medium text-gray-700">Profesional</label>
										<SearchableInput
											placeholder="Prof."
											value={getProfessionalName(blockProfessionalId)}
											onSelect={(professional) => setBlockProfessionalId(String(professional.id))}
											onSearch={searchProfessionals}
											minSearchLength={1}
											maxResults={10}
											className="w-full"
										/>
									</div>
									<div>
										<label className="mb-1 block text-sm font-medium text-gray-700">Tipo</label>
										<SelectItem value={blockType} onValueChange={(value) => setBlockType(value as 'travel' | 'conference' | 'holiday' | 'vacation' | 'other')} required>
											<option value="travel">Viaje</option>
											<option value="conference">Congreso</option>
											<option value="holiday">Feriado</option>
											<option value="vacation">Vacaciones</option>
											<option value="other">Otro</option>
										</SelectItem>
									</div>
									<div className="md:col-span-2">
										<label className="mb-1 block text-sm font-medium text-gray-700">Título</label>
										<input value={blockTitle} onChange={(event) => setBlockTitle(event.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2" required />
									</div>
									<div>
										<label className="mb-1 block text-sm font-medium text-gray-700">Inicio</label>
										<input type="datetime-local" value={blockStart} onChange={(event) => setBlockStart(event.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2" required />
									</div>
									<div>
										<label className="mb-1 block text-sm font-medium text-gray-700">Fin</label>
										<input type="datetime-local" value={blockEnd} onChange={(event) => setBlockEnd(event.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2" required />
									</div>
									<div>
										<label className="mb-1 block text-sm font-medium text-gray-700">Estado</label>
										<SelectItem value={blockStatus} onValueChange={(value) => setBlockStatus(value as 'active' | 'cancelled')} required>
											<option value="active">Activo</option>
											<option value="cancelled">Cancelado</option>
										</SelectItem>
									</div>
									<label className="flex items-center gap-2 pt-8 text-sm text-gray-700">
										<input type="checkbox" checked={blockFullDay} onChange={(event) => setBlockFullDay(event.target.checked)} />
										Bloqueo de jornada completa
									</label>
								</div>
								<div>
									<label className="mb-1 block text-sm font-medium text-gray-700">Notas</label>
									<textarea value={blockNotes} onChange={(event) => setBlockNotes(event.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2" rows={3} />
								</div>
								<div className="flex gap-3">
									<Button type="submit" disabled={loadingAction === 'block'}>Guardar bloqueo</Button>
									{blockId && <Button type="button" variant="outline" onClick={resetBlockForm}>Cancelar edición</Button>}
								</div>
							</form>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Bloqueos registrados</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							{blocks.length === 0 && <p className="text-sm text-gray-500">No hay bloqueos en el rango actual.</p>}
							{blocks.map((block) => (
								<div key={block.id} className="rounded-lg border border-gray-200 p-4">
									<div className="flex items-start justify-between gap-3">
										<div>
											<div className="font-medium text-gray-900">{block.title}</div>
											<div className="text-sm text-gray-500">{block.professional_name}</div>
											<div className="mt-1 text-xs text-gray-500">{block.start_datetime.replace('T', ' ')} a {block.end_datetime.replace('T', ' ')}</div>
										</div>
										<div className="flex items-center gap-2">
											<Badge variant={block.status === 'active' ? 'default' : 'secondary'}>{block.block_type}</Badge>
											<Button type="button" variant="outline" size="sm" onClick={() => loadBlock(block)}>Editar</Button>
										</div>
									</div>
								</div>
							))}
						</CardContent>
					</Card>
						</div>
					</TabsContent>

					<TabsContent value="citas">
						<div className="grid gap-6 xl:grid-cols-[1.4fr,1fr]">
							<Card>
								<CardHeader>
									<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
										<div>
											<CardTitle>Slots del día</CardTitle>
											<p className="text-sm text-gray-500">Navegá por fecha y hacé click sobre un slot para asignar o editar una cita.</p>
										</div>
										<div className="flex items-center gap-2">
											<Button type="button" variant="outline" size="icon" onClick={() => changeSelectedDate(-1)}>
												<ChevronLeft className="h-4 w-4" />
											</Button>
											<div className="min-w-56 rounded-md border border-gray-200 px-3 py-2 text-center">
												<input
													type="date"
													value={selectedDate}
													onChange={(event) => navigateToDate(event.target.value)}
													className="w-full border-0 bg-transparent p-0 text-center text-sm font-medium text-gray-700 focus:outline-none"
												/>
												<div className="mt-1 text-xs text-gray-500 capitalize">{formattedSelectedDate}</div>
											</div>
											<Button type="button" variant="outline" size="icon" onClick={() => changeSelectedDate(1)}>
												<ChevronRight className="h-4 w-4" />
											</Button>
										</div>
									</div>
								</CardHeader>
								<CardContent>
									{!filterProfessionalId && (
										<div className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-sm text-gray-500">
											Seleccioná un profesional en el filtro superior para ver y asignar slots del día.
										</div>
									)}
									{filterProfessionalId && slotBoard.length === 0 && (
										<div className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-sm text-gray-500">
											No hay slots generados para ese profesional en la fecha seleccionada.
										</div>
									)}
									<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
										{slotBoard.map((slot) => (
											<div key={`${slot.professional_id}-${slot.date}-${slot.start_time}`} className={`rounded-lg border p-4 ${getSlotClasses(slot)}`}>
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
													<p className="mb-3 text-sm text-amber-800">{slot.block_title || 'Franja bloqueada'}</p>
												)}

												{slot.appointments.length > 0 && (
													<div className="space-y-2">
														{slot.appointments.map((slotAppointment) => {
															const appointmentLocked = isAppointmentLocked(slotAppointment)

															return (
															<button
																key={slotAppointment.id}
																type="button"
																onClick={() => {
																	if (appointmentLocked) {
																		return
																	}
																	const fullAppointment = appointments.find((appointment) => appointment.id === slotAppointment.id)
																	if (fullAppointment) {
																		loadAppointment(fullAppointment)
																	}
																}}
																className={`w-full rounded-md border border-white/70 bg-white/80 px-3 py-2 text-left ${appointmentLocked ? 'cursor-not-allowed opacity-75' : 'hover:bg-white'}`}
																disabled={appointmentLocked}
															>
																<div className="flex items-center justify-between gap-2">
																	<div>
																		<div className="font-medium text-gray-900">{slotAppointment.patient_name}</div>
																		{slotAppointment.medical_service_name && <div className="text-xs text-gray-500">{slotAppointment.medical_service_name}</div>}
																		{slotAppointment.service_request_number && <div className="text-xs text-emerald-600">Recepción: {slotAppointment.service_request_number}</div>}
																	</div>
																	<Badge variant="outline">{getAppointmentStatusLabel(getDisplayAppointmentStatus(slotAppointment))}</Badge>
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
										))}
									</div>
								</CardContent>
							</Card>

							<Card>
						<CardHeader>
							<CardTitle>Citas del rango</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							{appointments.length === 0 && <p className="text-sm text-gray-500">No hay citas registradas.</p>}
							{appointments.map((appointment) => (
								<div key={appointment.id} className="rounded-lg border border-gray-200 p-4">
									<div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
										<div>
											<div className="font-medium text-gray-900">{appointment.patient_name}</div>
											<div className="text-sm text-gray-500">{appointment.professional_name}</div>
											<div className="mt-1 text-xs text-gray-500">{appointment.appointment_date} · {appointment.start_time} a {appointment.end_time}</div>
											{appointment.medical_service_name && <div className="mt-1 text-xs text-gray-500">{appointment.medical_service_name}</div>}
											{appointment.service_request_number && <div className="mt-1 text-xs text-emerald-600">Recepción: {appointment.service_request_number}</div>}
										</div>
										<div className="flex flex-wrap items-center gap-2">
											<Badge variant={appointment.status === 'cancelled' ? 'secondary' : 'default'}>{getAppointmentStatusLabel(getDisplayAppointmentStatus(appointment))}</Badge>
											<Button type="button" variant="outline" size="sm" onClick={() => loadAppointment(appointment)} disabled={isAppointmentLocked(appointment)}>
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
					</TabsContent>
				</Tabs>

				<ScheduleFormModal
					open={isScheduleModalOpen}
					onOpenChange={closeScheduleModal}
					professionals={professionals}
					initialRange={{
						startDate: filters.date_from,
						endDate: filters.date_to,
					}}
					loading={loadingAction === 'schedule'}
					schedule={selectedSchedule}
					onSearchProfessionals={searchProfessionals}
					onSubmit={submitSchedule}
				/>

				{error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
			</div>
		</AppLayout>
	)
}