import { Head, router } from '@inertiajs/react'
import { useMemo, useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { ChevronRight, MoreHorizontal, PlusCircle } from 'lucide-react'
import AppLayout from '@/layouts/app-layout'
import SearchableInput from '@/components/ui/SearchableInput'
import SelectItem from '@/components/ui/SelectItem'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { DataTable, type PaginatedData } from '@/components/ui/data-table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import AppointmentSlotModal from '@/components/medical/schedule/AppointmentSlotModal'
import ScheduleFormModal from '@/components/medical/schedule/ScheduleFormModal'
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
	block_id?: number | null
	block_type?: 'travel' | 'conference' | 'holiday' | 'vacation' | 'other' | null
	block_title?: string | null
	block_notes?: string | null
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

type BlockPreviewSlot = {
	date: string
	start_time: string
	end_time: string
	status: 'available' | 'partial' | 'occupied' | 'blocked'
	block_id?: number | null
	block_type?: 'travel' | 'conference' | 'holiday' | 'vacation' | 'other' | null
	block_title?: string | null
	block_notes?: string | null
	appointments_count?: number
}

type BlockSelectionGroup = {
	date: string
	startTime: string
	endTime: string
	affectsFullDay: boolean
	count: number
}

type ScheduleAvailabilitySummary = {
	totalSlots: number
	usedSlots: number
	blockedSlots: number
	freeSlots: number
	totalCapacity: number
	bookedCapacity: number
	usedPercentage: number
	blockedPercentage: number
	freePercentage: number
}

type AppointmentPlannerSlot = {
	professionalId: number
	professionalName: string
	date: string
	startTime: string
	endTime: string
	durationMinutes: number
	capacity: number
	occupiedCount: number
	availableCapacity: number
	status: 'available' | 'partial' | 'occupied' | 'blocked'
	blockTitle?: string | null
	appointmentsCount: number
	appointmentSummaries: Array<{
		id: number
		patientName: string
		serviceLabel: string
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
	} = useSchedule()

	const [filterProfessionalId, setFilterProfessionalId] = useState(filters.professional_id ? String(filters.professional_id) : '')
	const [dateFrom, setDateFrom] = useState(filters.date_from)
	const [dateTo, setDateTo] = useState(filters.date_to)
	const [selectedDate] = useState(filters.selected_date)
	const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
	const [selectedSchedule, setSelectedSchedule] = useState<ScheduleConfig | null>(null)
	const [isOccupancyBoardOpen, setIsOccupancyBoardOpen] = useState(false)
	const [isAppointmentPlannerOpen, setIsAppointmentPlannerOpen] = useState(false)
	const [appointmentScheduleContext, setAppointmentScheduleContext] = useState<ScheduleConfig | null>(null)
	const [appointmentPlannerStartDate, setAppointmentPlannerStartDate] = useState(filters.date_from)
	const [appointmentPlannerEndDate, setAppointmentPlannerEndDate] = useState(filters.date_to)
	const [appointmentPlannerDayFilter, setAppointmentPlannerDayFilter] = useState<'available' | 'without-schedule' | 'all'>('available')
	const [appointmentPlannerQuickFilter, setAppointmentPlannerQuickFilter] = useState<'all' | 'available' | 'occupied'>('all')
	const [appointmentPlannerSelectedDate, setAppointmentPlannerSelectedDate] = useState<string | null>(null)
	const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false)
	const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
	const [selectedAppointmentSlot, setSelectedAppointmentSlot] = useState<{
		professionalId: number
		professionalName: string
		date: string
		startTime: string
		endTime: string
		durationMinutes: number
	} | null>(null)
	const [scheduleStatusDialog, setScheduleStatusDialog] = useState<{
		open: boolean
		schedule: ScheduleConfig | null
		nextStatus: 'active' | 'inactive' | null
	}>({
		open: false,
		schedule: null,
		nextStatus: null,
	})

	const [blockId, setBlockId] = useState<number | null>(null)
	const [isBlockModalOpen, setIsBlockModalOpen] = useState(false)
	const [blockScheduleContext, setBlockScheduleContext] = useState<ScheduleConfig | null>(null)
	const [blockProfessionalId, setBlockProfessionalId] = useState('')
	const [blockRangeStartDate, setBlockRangeStartDate] = useState(filters.selected_date)
	const [blockRangeEndDate, setBlockRangeEndDate] = useState(filters.selected_date)
	const [blockType, setBlockType] = useState<'travel' | 'conference' | 'holiday' | 'vacation' | 'other'>('vacation')
	const [blockActionMode, setBlockActionMode] = useState<'block' | 'unblock'>('block')
	const [blockTitle, setBlockTitle] = useState('')
	const [blockStart, setBlockStart] = useState('')
	const [blockEnd, setBlockEnd] = useState('')
	const [blockFullDay, setBlockFullDay] = useState(false)
	const [blockStatus, setBlockStatus] = useState<'active' | 'cancelled'>('active')
	const [blockNotes, setBlockNotes] = useState('')
	const [selectedBlockSlotKeys, setSelectedBlockSlotKeys] = useState<string[]>([])
	const [isBlockDetailsOpen, setIsBlockDetailsOpen] = useState(false)

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

	const scheduleContainsSlot = (schedule: ScheduleConfig, slot: SlotBoardEntry) => {
		if (slot.professional_id !== schedule.professional_id) {
			return false
		}

		if (slot.date < schedule.start_date) {
			return false
		}

		if (schedule.end_date && slot.date > schedule.end_date) {
			return false
		}

		const dayOfWeek = new Date(`${slot.date}T00:00:00`).getDay()

		return schedule.rules.some((rule) => (
			rule.is_active
			&& rule.weekday === dayOfWeek
			&& slot.start_time >= rule.start_time
			&& slot.end_time <= rule.end_time
		))
	}

	const scheduleAvailabilityById = useMemo<Record<number, ScheduleAvailabilitySummary>>(() => {
		return schedules.data.reduce<Record<number, ScheduleAvailabilitySummary>>((accumulator, schedule) => {
			const matchingSlots = slotBoard.filter((slot) => scheduleContainsSlot(schedule, slot))

			const totalSlots = matchingSlots.length
			const blockedSlots = matchingSlots.filter((slot) => slot.slot_status === 'blocked').length
			const usedSlots = matchingSlots.filter((slot) => slot.slot_status !== 'blocked' && slot.occupied_count > 0).length
			const freeSlots = Math.max(totalSlots - blockedSlots - usedSlots, 0)
			const totalCapacity = matchingSlots.reduce((sum, slot) => sum + slot.capacity, 0)
			const bookedCapacity = matchingSlots.reduce((sum, slot) => sum + slot.occupied_count, 0)
			const divisor = totalSlots || 1

			accumulator[schedule.id] = {
				totalSlots,
				usedSlots,
				blockedSlots,
				freeSlots,
				totalCapacity,
				bookedCapacity,
				usedPercentage: Math.round((usedSlots / divisor) * 100),
				blockedPercentage: Math.round((blockedSlots / divisor) * 100),
				freePercentage: Math.round((freeSlots / divisor) * 100),
			}

			return accumulator
		}, {})
	}, [schedules.data, slotBoard])

	const occupancyByProfessionalId = useMemo<Record<number, Occupancy['professionals'][number]>>(() => {
		return occupancy.professionals.reduce<Record<number, Occupancy['professionals'][number]>>((accumulator, row) => {
			accumulator[row.professional_id] = row
			return accumulator
		}, {})
	}, [occupancy.professionals])

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

	const applyProfessionalFilter = (professionalId: string) => {
		setFilterProfessionalId(professionalId)
		navigateWithFilters({
			professional_id: professionalId || undefined,
			date_from: dateFrom,
			date_to: dateTo,
			selected_date: selectedDate,
			search: filters.search || undefined,
			status: filters.status || undefined,
			per_page: filters.per_page,
		})
	}

	const clearProfessionalFilter = () => {
		applyProfessionalFilter('')
	}

	const applyScheduleStatusFilter = (status: string) => {
		const params = new URLSearchParams(window.location.search)

		if (status !== 'all') {
			params.set('status', status)
		} else {
			params.delete('status')
		}

		params.set('page', '1')
		router.get(`${window.location.pathname}?${params.toString()}`, {}, { preserveState: true, replace: true })
	}

	const openCreateScheduleModal = () => {
		setSelectedSchedule(null)
		setIsScheduleModalOpen(true)
	}

	const openEditScheduleModal = (schedule: ScheduleConfig) => {
		setSelectedSchedule(schedule)
		setIsScheduleModalOpen(true)
	}

	const clampScheduleDate = (schedule: ScheduleConfig, date: string) => {
		if (date < schedule.start_date) {
			return schedule.start_date
		}

		if (schedule.end_date && date > schedule.end_date) {
			return schedule.end_date
		}

		return date
	}

	const getSchedulePlanningRange = (schedule: ScheduleConfig) => {
		const clampedStart = schedule.start_date
		const clampedEnd = schedule.end_date || schedule.start_date

		if (clampedEnd < clampedStart) {
			return {
				start: clampedStart,
				end: clampedStart,
			}
		}

		return {
			start: clampedStart,
			end: clampedEnd,
		}
	}

	const buildSchedulePayloadFromConfig = (schedule: ScheduleConfig, overrides?: Partial<Pick<ScheduleConfig, 'status'>>) => ({
		professional_id: schedule.professional_id,
		name: schedule.name,
		start_date: schedule.start_date,
		end_date: schedule.end_date || undefined,
		slot_duration_minutes: schedule.slot_duration_minutes,
		status: overrides?.status ?? schedule.status,
		notes: schedule.notes || undefined,
		rules: schedule.rules.map((rule) => ({
			weekday: rule.weekday,
			start_time: rule.start_time,
			end_time: rule.end_time,
			capacity: rule.capacity,
			is_active: rule.is_active,
		})),
	})

	const openScheduleStatusDialog = (schedule: ScheduleConfig) => {
		setScheduleStatusDialog({
			open: true,
			schedule,
			nextStatus: schedule.status === 'active' ? 'inactive' : 'active',
		})
	}

	const closeScheduleStatusDialog = (open: boolean) => {
		setScheduleStatusDialog((current) => ({
			open,
			schedule: open ? current.schedule : null,
			nextStatus: open ? current.nextStatus : null,
		}))
	}

	const confirmScheduleStatusChange = () => {
		if (!scheduleStatusDialog.schedule || !scheduleStatusDialog.nextStatus) {
			return
		}

		saveSchedule(buildSchedulePayloadFromConfig(scheduleStatusDialog.schedule, {
			status: scheduleStatusDialog.nextStatus,
		}), scheduleStatusDialog.schedule.id, {
			onSuccess: () => {
				closeScheduleStatusDialog(false)
			},
		})
	}

	const closeScheduleModal = (open: boolean) => {
		setIsScheduleModalOpen(open)
		if (!open) {
			setSelectedSchedule(null)
		}
	}

	const closeAppointmentPlanner = (open: boolean) => {
		setIsAppointmentPlannerOpen(open)

		if (!open) {
			setAppointmentScheduleContext(null)
			setAppointmentPlannerDayFilter('available')
			setAppointmentPlannerQuickFilter('all')
			setAppointmentPlannerSelectedDate(null)
		}
	}

	const closeAppointmentModal = (open: boolean) => {
		setIsAppointmentModalOpen(open)

		if (!open) {
			setSelectedAppointment(null)
			setSelectedAppointmentSlot(null)
		}
	}

	const resetBlockForm = () => {
		setBlockId(null)
		setBlockScheduleContext(null)
		setBlockProfessionalId('')
		setBlockRangeStartDate(selectedDate)
		setBlockRangeEndDate(selectedDate)
		setBlockType('vacation')
		setBlockActionMode('block')
		setBlockTitle('')
		setBlockStart('')
		setBlockEnd('')
		setBlockFullDay(false)
		setBlockStatus('active')
		setBlockNotes('')
		setSelectedBlockSlotKeys([])
		setIsBlockDetailsOpen(false)
	}

	const closeBlockModal = (open: boolean) => {
		setIsBlockModalOpen(open)

		if (!open) {
			resetBlockForm()
		}
	}

	const buildLocalDateTime = (date: string, time: string) => `${date}T${time.slice(0, 5)}`

	const buildDateRange = (start: string, end: string) => {
		const orderedStart = start <= end ? start : end
		const orderedEnd = start <= end ? end : start
		const dates: string[] = []
		const cursor = new Date(`${orderedStart}T00:00:00`)
		const finish = new Date(`${orderedEnd}T00:00:00`)

		while (cursor <= finish) {
			dates.push(cursor.toISOString().split('T')[0])
			cursor.setDate(cursor.getDate() + 1)
		}

		return dates
	}

	const openAppointmentPlannerForSchedule = (schedule: ScheduleConfig) => {
		const range = getSchedulePlanningRange(schedule)
		setAppointmentScheduleContext(schedule)
		setAppointmentPlannerStartDate(range.start)
		setAppointmentPlannerEndDate(range.end)
		setAppointmentPlannerDayFilter('available')
		setAppointmentPlannerQuickFilter('all')
		setAppointmentPlannerSelectedDate(null)
		setIsAppointmentPlannerOpen(true)
	}

	const openBlockModalForSchedule = (schedule: ScheduleConfig) => {
		resetBlockForm()
		setBlockScheduleContext(schedule)
		setBlockProfessionalId(String(schedule.professional_id))
		setBlockRangeStartDate(selectedDate)
		setBlockRangeEndDate(selectedDate)
		setBlockTitle(`Bloqueo agenda ${schedule.name}`)
		setIsBlockModalOpen(true)
	}

	const orderedBlockRange = useMemo(() => {
		if (blockRangeEndDate < blockRangeStartDate) {
			return {
				start: blockRangeEndDate,
				end: blockRangeStartDate,
			}
		}

		return {
			start: blockRangeStartDate,
			end: blockRangeEndDate,
		}
	}, [blockRangeEndDate, blockRangeStartDate])

	const blockPreviewDates = useMemo(() => {
		const dates: string[] = []
		const cursor = new Date(`${orderedBlockRange.start}T00:00:00`)
		const end = new Date(`${orderedBlockRange.end}T00:00:00`)

		while (cursor <= end) {
			dates.push(cursor.toISOString().split('T')[0])
			cursor.setDate(cursor.getDate() + 1)
		}

		return dates
	}, [orderedBlockRange])

	const blockPreviewSlots = useMemo<BlockPreviewSlot[]>(() => {
		if (!blockScheduleContext) {
			return []
		}

		return blockPreviewDates.flatMap((date) => {
			const actualSlotsForDay = slotBoard
				.filter((slot) => slot.professional_id === blockScheduleContext.professional_id && slot.date === date)
				.map((slot) => ({
					date,
					start_time: slot.start_time,
					end_time: slot.end_time,
					status: slot.slot_status,
					block_id: slot.block_id,
					block_type: slot.block_type,
					block_title: slot.block_title,
					block_notes: slot.block_notes,
					appointments_count: slot.appointments.length,
				}))

			if (actualSlotsForDay.length > 0) {
				return actualSlotsForDay
			}

			const dayOfWeek = new Date(`${date}T00:00:00`).getDay()
			const relevantRules = blockScheduleContext.rules
				.filter((rule) => rule.is_active && rule.weekday === dayOfWeek)
				.sort((left, right) => left.start_time.localeCompare(right.start_time))

			const activeBlocksForDay = blocks.filter((block) => {
				if (block.professional_id !== blockScheduleContext.professional_id || block.status !== 'active') {
					return false
				}

				const startDate = block.start_datetime.slice(0, 10)
				const endDate = block.end_datetime.slice(0, 10)

				return startDate <= date && endDate >= date
			})

			const appointmentsForDay = appointments.filter((appointment) => (
				appointment.professional_id === blockScheduleContext.professional_id
				&& appointment.appointment_date === date
				&& appointment.status !== 'cancelled'
				&& appointment.status !== 'no_show'
			))

			return relevantRules.flatMap((rule) => {
				const previewSlots: BlockPreviewSlot[] = []
				let cursorMinutes = Number(rule.start_time.slice(0, 2)) * 60 + Number(rule.start_time.slice(3, 5))
				const endMinutes = Number(rule.end_time.slice(0, 2)) * 60 + Number(rule.end_time.slice(3, 5))
				const slotDuration = Math.max(blockScheduleContext.slot_duration_minutes, 5)

				while (cursorMinutes + slotDuration <= endMinutes) {
					const slotStart = `${String(Math.floor(cursorMinutes / 60)).padStart(2, '0')}:${String(cursorMinutes % 60).padStart(2, '0')}`
					const slotEndMinutes = cursorMinutes + slotDuration
					const slotEnd = `${String(Math.floor(slotEndMinutes / 60)).padStart(2, '0')}:${String(slotEndMinutes % 60).padStart(2, '0')}`
					const slotStartDate = new Date(buildLocalDateTime(date, slotStart))
					const slotEndDate = new Date(buildLocalDateTime(date, slotEnd))
					const overlappingBlock = activeBlocksForDay.find((block) => {
						const blockStart = new Date(block.start_datetime)
						const blockEnd = new Date(block.end_datetime)

						return slotStartDate < blockEnd && slotEndDate > blockStart
					})
					const appointmentsCount = appointmentsForDay.filter((appointment) => {
						const appointmentStart = new Date(buildLocalDateTime(date, appointment.start_time))
						const appointmentEnd = new Date(buildLocalDateTime(date, appointment.end_time))

						return slotStartDate < appointmentEnd && slotEndDate > appointmentStart
					}).length

					let status: BlockPreviewSlot['status'] = 'available'

					if (overlappingBlock) {
						status = 'blocked'
					} else if (appointmentsCount >= rule.capacity) {
						status = 'occupied'
					} else if (appointmentsCount > 0) {
						status = 'partial'
					}

					previewSlots.push({
						date,
						start_time: slotStart,
						end_time: slotEnd,
						status,
						block_id: overlappingBlock?.id,
						block_type: overlappingBlock?.block_type,
						block_title: overlappingBlock?.title,
						block_notes: overlappingBlock?.notes,
						appointments_count: appointmentsCount,
					})

					cursorMinutes += slotDuration
				}

				return previewSlots
			})
		})
	}, [appointments, blockPreviewDates, blockScheduleContext, blocks, slotBoard])

	const blockPreviewDays = useMemo(() => blockPreviewDates.map((date) => ({
		date,
		label: new Intl.DateTimeFormat('es-PY', {
			weekday: 'short',
			day: '2-digit',
			month: 'short',
		}).format(new Date(`${date}T00:00:00`)),
		slots: blockPreviewSlots.filter((slot) => slot.date === date),
	})), [blockPreviewDates, blockPreviewSlots])

	const getBlockSlotKey = (slot: Pick<BlockPreviewSlot, 'date' | 'start_time' | 'end_time'>) => `${slot.date}|${slot.start_time}|${slot.end_time}`

	const isBlockMode = blockActionMode === 'block'
	const selectableStatus = isBlockMode ? 'available' : 'blocked'

	const selectedPreviewSlots = useMemo(() => {
		const selectedKeys = new Set(selectedBlockSlotKeys)

		return blockPreviewSlots.filter((slot) => selectedKeys.has(getBlockSlotKey(slot)) && slot.status === selectableStatus)
	}, [blockPreviewSlots, selectableStatus, selectedBlockSlotKeys])

	const selectedBlockGroups = useMemo<BlockSelectionGroup[]>(() => {
		const groupedByDate = selectedPreviewSlots.reduce<Record<string, BlockPreviewSlot[]>>((accumulator, slot) => {
			accumulator[slot.date] = accumulator[slot.date] || []
			accumulator[slot.date].push(slot)
			return accumulator
		}, {})

		return Object.entries(groupedByDate).flatMap(([date, slotsForDay]) => {
			const orderedSlots = [...slotsForDay].sort((left, right) => left.start_time.localeCompare(right.start_time))
			const allAvailableDaySlots = blockPreviewSlots
				.filter((slot) => slot.date === date && slot.status === 'available')
				.sort((left, right) => left.start_time.localeCompare(right.start_time))

			const groups: BlockSelectionGroup[] = []
			let currentGroup: BlockSelectionGroup | null = null

			orderedSlots.forEach((slot) => {
				if (!currentGroup) {
					currentGroup = {
						date,
						startTime: slot.start_time,
						endTime: slot.end_time,
						affectsFullDay: false,
						count: 1,
					}
					return
				}

				if (currentGroup.endTime === slot.start_time) {
					currentGroup.endTime = slot.end_time
					currentGroup.count += 1
					return
				}

				groups.push(currentGroup)
				currentGroup = {
					date,
					startTime: slot.start_time,
					endTime: slot.end_time,
					affectsFullDay: false,
					count: 1,
				}
			})

			if (currentGroup) {
				groups.push(currentGroup)
			}

			return groups.map((group) => ({
				...group,
				affectsFullDay: allAvailableDaySlots.length > 0
					&& group.startTime === allAvailableDaySlots[0]?.start_time
					&& group.endTime === allAvailableDaySlots[allAvailableDaySlots.length - 1]?.end_time
					&& group.count === allAvailableDaySlots.length,
			}))
		})
	}, [blockPreviewSlots, selectedPreviewSlots])

	const selectedBlockedIds = useMemo(() => Array.from(new Set(
		selectedPreviewSlots
			.map((slot) => slot.block_id)
			.filter((blockId): blockId is number => Boolean(blockId))
	)), [selectedPreviewSlots])

	const isMultiSlotSelectionMode = !blockId && isBlockMode && selectedBlockGroups.length > 0
	const isScheduleInteractionLocked = blockScheduleContext?.status === 'inactive'

	const fillBlockFromSlot = (slot: BlockPreviewSlot) => {
		setBlockFullDay(false)
		setBlockStart(buildLocalDateTime(slot.date, slot.start_time))
		setBlockEnd(buildLocalDateTime(slot.date, slot.end_time))
		setBlockTitle(`Bloqueo ${slot.start_time} - ${slot.end_time}`)
		setBlockStatus('active')
	}

	const prepareSelectionMode = () => {
		setBlockStart('')
		setBlockEnd('')
		setBlockFullDay(false)
	}

	const toggleBlockSlotSelection = (slot: BlockPreviewSlot) => {
		if (isScheduleInteractionLocked) {
			return
		}

		if (isBlockMode && slot.status !== 'available') {
			clearBlockSelection()
			fillBlockFromSlot(slot)
			return
		}

		if (!isBlockMode && (slot.status !== 'blocked' || !slot.block_id)) {
			return
		}

		const slotKey = getBlockSlotKey(slot)
		prepareSelectionMode()

		setSelectedBlockSlotKeys((currentKeys) => currentKeys.includes(slotKey)
			? currentKeys.filter((key) => key !== slotKey)
			: [...currentKeys, slotKey])
	}

	const toggleDaySelection = (day: { date: string, slots: BlockPreviewSlot[] }) => {
		if (isScheduleInteractionLocked) {
			return
		}

		const availableKeys = day.slots
			.filter((slot) => slot.status === selectableStatus && (isBlockMode || Boolean(slot.block_id)))
			.map((slot) => getBlockSlotKey(slot))

		if (availableKeys.length === 0) {
			return
		}

		prepareSelectionMode()

		setSelectedBlockSlotKeys((currentKeys) => {
			const currentSet = new Set(currentKeys)
			const allSelected = availableKeys.every((key) => currentSet.has(key))

			if (allSelected) {
				return currentKeys.filter((key) => !availableKeys.includes(key))
			}

			availableKeys.forEach((key) => currentSet.add(key))
			return Array.from(currentSet)
		})
	}

	const clearBlockSelection = () => {
		setSelectedBlockSlotKeys([])
	}

	const setBlockMode = (mode: 'block' | 'unblock') => {
		setBlockActionMode(mode)
		setSelectedBlockSlotKeys([])
		setBlockStart('')
		setBlockEnd('')
		setBlockFullDay(false)
		if (!blockId && mode === 'unblock') {
			setIsBlockDetailsOpen(false)
		}
	}

	const getBlockedSlotReason = (blockTitle?: string | null) => blockTitle?.trim() || 'Franja bloqueada'

	const getBlockedSlotDescription = (blockNotes?: string | null) => blockNotes?.trim() || null

	const getAppointmentServiceLabel = (appointment: Pick<Appointment, 'medical_service_names' | 'medical_service_name'>) => {
		if (appointment.medical_service_names?.length) {
			return appointment.medical_service_names.join(', ')
		}

		return appointment.medical_service_name?.trim() || 'Consulta general'
	}

	const getBlockTypeLabel = (blockType?: 'travel' | 'conference' | 'holiday' | 'vacation' | 'other' | null) => {
		switch (blockType) {
			case 'travel':
				return 'Viaje'
			case 'conference':
				return 'Congreso'
			case 'holiday':
				return 'Feriado'
			case 'vacation':
				return 'Vacaciones'
			case 'other':
				return 'Otro'
			default:
				return 'Bloqueo'
		}
	}
	const getBlockStatusLabel = (status: 'active' | 'cancelled') => (status === 'active' ? 'Activo' : 'Cancelado')
	const formatPercentage = (value: number) => Math.round(value)

	const refreshBlockBoard = () => {
			router.reload({
				only: ['schedules', 'blocks', 'appointments', 'occupancy', 'slotBoard', 'filters'],
			})
	}

	const handleBlockSuccess = () => {
		clearBlockSelection()
		setBlockStart('')
		setBlockEnd('')
		setBlockFullDay(false)
		refreshBlockBoard()
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

	const openAppointmentsForSchedule = (schedule: ScheduleConfig, date: string) => {
		router.get('/medical/appointments', {
			selected_date: clampScheduleDate(schedule, date),
			view: 'day',
			professional_id: schedule.professional_id,
		})
	}

	const openAppointmentSlotModal = (slot: AppointmentPlannerSlot) => {
		setSelectedAppointment(null)
		setSelectedAppointmentSlot({
			professionalId: slot.professionalId,
			professionalName: slot.professionalName,
			date: slot.date,
			startTime: slot.startTime,
			endTime: slot.endTime,
			durationMinutes: slot.durationMinutes,
		})
		setIsAppointmentModalOpen(true)
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
				router.reload({
					onSuccess: () => {
						setIsAppointmentPlannerOpen(true)
					},
				})
			},
		})
	}

	const orderedAppointmentPlannerRange = useMemo(() => {
		if (appointmentPlannerEndDate < appointmentPlannerStartDate) {
			return {
				start: appointmentPlannerEndDate,
				end: appointmentPlannerStartDate,
			}
		}

		return {
			start: appointmentPlannerStartDate,
			end: appointmentPlannerEndDate,
		}
	}, [appointmentPlannerEndDate, appointmentPlannerStartDate])

	const appointmentPlannerDates = useMemo(() => {
		if (!appointmentScheduleContext) {
			return []
		}

		return buildDateRange(orderedAppointmentPlannerRange.start, orderedAppointmentPlannerRange.end)
	}, [appointmentScheduleContext, orderedAppointmentPlannerRange])

	const appointmentPlannerSlots = useMemo<AppointmentPlannerSlot[]>(() => {
		if (!appointmentScheduleContext) {
			return []
		}

		return appointmentPlannerDates.flatMap((date) => {
			const actualSlotsForDay = slotBoard
				.filter((slot) => slot.date === date && scheduleContainsSlot(appointmentScheduleContext, slot))
				.map((slot) => ({
					professionalId: slot.professional_id,
					professionalName: slot.professional_name,
					date,
					startTime: slot.start_time,
					endTime: slot.end_time,
					durationMinutes: slot.duration_minutes,
					capacity: slot.capacity,
					occupiedCount: slot.occupied_count,
					availableCapacity: slot.available_capacity,
					status: slot.slot_status,
					blockTitle: slot.block_title,
					appointmentsCount: slot.appointments.length,
					appointmentSummaries: slot.appointments.map((appointment) => ({
						id: appointment.id,
						patientName: appointment.patient_name,
						serviceLabel: appointment.medical_service_names?.length
							? appointment.medical_service_names.join(', ')
							: appointment.medical_service_name?.trim() || 'Consulta general',
					})),
				}))

			if (actualSlotsForDay.length > 0) {
				return actualSlotsForDay
			}

			const dayOfWeek = new Date(`${date}T00:00:00`).getDay()
			const relevantRules = appointmentScheduleContext.rules
				.filter((rule) => rule.is_active && rule.weekday === dayOfWeek)
				.sort((left, right) => left.start_time.localeCompare(right.start_time))

			const activeBlocksForDay = blocks.filter((block) => {
				if (block.professional_id !== appointmentScheduleContext.professional_id || block.status !== 'active') {
					return false
				}

				const startDate = block.start_datetime.slice(0, 10)
				const endDate = block.end_datetime.slice(0, 10)

				return startDate <= date && endDate >= date
			})

			const appointmentsForDay = appointments.filter((appointment) => (
				appointment.professional_id === appointmentScheduleContext.professional_id
				&& appointment.appointment_date === date
				&& appointment.status !== 'cancelled'
				&& appointment.status !== 'no_show'
			))

			return relevantRules.flatMap((rule) => {
				const previewSlots: AppointmentPlannerSlot[] = []
				let cursorMinutes = Number(rule.start_time.slice(0, 2)) * 60 + Number(rule.start_time.slice(3, 5))
				const endMinutes = Number(rule.end_time.slice(0, 2)) * 60 + Number(rule.end_time.slice(3, 5))
				const slotDuration = Math.max(appointmentScheduleContext.slot_duration_minutes, 5)

				while (cursorMinutes + slotDuration <= endMinutes) {
					const startTime = `${String(Math.floor(cursorMinutes / 60)).padStart(2, '0')}:${String(cursorMinutes % 60).padStart(2, '0')}`
					const endTimeMinutes = cursorMinutes + slotDuration
					const endTime = `${String(Math.floor(endTimeMinutes / 60)).padStart(2, '0')}:${String(endTimeMinutes % 60).padStart(2, '0')}`
					const slotStartDate = new Date(buildLocalDateTime(date, startTime))
					const slotEndDate = new Date(buildLocalDateTime(date, endTime))
					const overlappingBlock = activeBlocksForDay.find((block) => {
						const blockStart = new Date(block.start_datetime)
						const blockEnd = new Date(block.end_datetime)

						return slotStartDate < blockEnd && slotEndDate > blockStart
					})
					const overlappingAppointments = appointmentsForDay.filter((appointment) => {
						const appointmentStart = new Date(buildLocalDateTime(date, appointment.start_time))
						const appointmentEnd = new Date(buildLocalDateTime(date, appointment.end_time))

						return slotStartDate < appointmentEnd && slotEndDate > appointmentStart
					})
					const appointmentsCount = overlappingAppointments.length

					let status: AppointmentPlannerSlot['status'] = 'available'

					if (overlappingBlock) {
						status = 'blocked'
					} else if (appointmentsCount >= rule.capacity) {
						status = 'occupied'
					} else if (appointmentsCount > 0) {
						status = 'partial'
					}

					previewSlots.push({
						professionalId: appointmentScheduleContext.professional_id,
						professionalName: appointmentScheduleContext.professional_name,
						date,
						startTime,
						endTime,
						durationMinutes: slotDuration,
						capacity: rule.capacity,
						occupiedCount: appointmentsCount,
						availableCapacity: Math.max(rule.capacity - appointmentsCount, 0),
						status,
						blockTitle: overlappingBlock?.title,
						appointmentsCount,
						appointmentSummaries: overlappingAppointments.map((appointment) => ({
							id: appointment.id,
							patientName: appointment.patient_name,
							serviceLabel: getAppointmentServiceLabel(appointment),
						})),
					})

					cursorMinutes += slotDuration
				}

				return previewSlots
			})
		})
	}, [appointmentPlannerDates, appointmentScheduleContext, appointments, blocks, slotBoard])

	const appointmentPreviewDays = useMemo(() => {
		if (!appointmentScheduleContext) {
			return []
		}

		return appointmentPlannerDates.map((date) => {
			const dayOfWeek = new Date(`${date}T00:00:00`).getDay()
			const hasRules = appointmentScheduleContext.rules.some((rule) => rule.is_active && rule.weekday === dayOfWeek)
			const slots = appointmentPlannerSlots
				.filter((slot) => slot.date === date)
				.sort((left, right) => left.startTime.localeCompare(right.startTime))
			const availableSlots = slots.filter((slot) => slot.status === 'available' || slot.status === 'partial')
			const blockedSlots = slots.filter((slot) => slot.status === 'blocked')
			const occupiedSlots = slots.filter((slot) => slot.status === 'occupied')
			const totalCapacity = slots.reduce((sum, slot) => sum + slot.capacity, 0)
			const bookedCapacity = slots.reduce((sum, slot) => sum + slot.occupiedCount, 0)
			const firstAvailableSlot = availableSlots[0] || null

			let statusLabel = 'Sin agenda'
			let statusTone = 'muted'

			if (slots.length === 0 && hasRules) {
				statusLabel = 'Sin slots'
			} else if (availableSlots.length > 0) {
				statusLabel = 'Disponible'
				statusTone = 'available'
			} else if (slots.length > 0 && blockedSlots.length === slots.length) {
				statusLabel = 'Bloqueado'
				statusTone = 'blocked'
			} else if (slots.length > 0 && (occupiedSlots.length > 0 || bookedCapacity > 0)) {
				statusLabel = 'Completo'
				statusTone = 'occupied'
			}

			return {
				date,
				label: new Intl.DateTimeFormat('es-PY', {
					weekday: 'long',
					day: '2-digit',
					month: 'short',
				}).format(new Date(`${date}T00:00:00`)),
				totalSlots: slots.length,
				availableSlots: availableSlots.length,
				blockedSlots: blockedSlots.length,
				occupiedSlots: occupiedSlots.length,
				bookedCapacity,
				totalCapacity,
				firstAvailableSlot,
				slots,
				hasRules,
				statusLabel,
				statusTone,
			}
		})
	}, [appointmentPlannerDates, appointmentPlannerSlots, appointmentScheduleContext])

	const firstAvailableAppointmentDay = useMemo(() => (
		appointmentPreviewDays.find((day) => day.availableSlots > 0)
	), [appointmentPreviewDays])

	const filteredAppointmentPreviewDays = useMemo(() => {
		if (appointmentPlannerDayFilter === 'available') {
			return appointmentPreviewDays.filter((day) => day.availableSlots > 0)
		}

		if (appointmentPlannerDayFilter === 'without-schedule') {
			return appointmentPreviewDays.filter((day) => day.statusLabel === 'Sin agenda')
		}

		return appointmentPreviewDays
	}, [appointmentPlannerDayFilter, appointmentPreviewDays])

	const selectedAppointmentPlannerDay = useMemo(() => (
		appointmentPlannerSelectedDate
			? appointmentPreviewDays.find((day) => day.date === appointmentPlannerSelectedDate) || null
			: null
	), [appointmentPlannerSelectedDate, appointmentPreviewDays])

	const filteredSelectedAppointmentPlannerSlots = useMemo(() => {
		if (!selectedAppointmentPlannerDay) {
			return []
		}

		if (appointmentPlannerQuickFilter === 'available') {
			return selectedAppointmentPlannerDay.slots.filter((slot) => slot.status === 'available' || slot.status === 'partial')
		}

		if (appointmentPlannerQuickFilter === 'occupied') {
			return selectedAppointmentPlannerDay.slots.filter((slot) => slot.status === 'occupied')
		}

		return selectedAppointmentPlannerDay.slots
	}, [appointmentPlannerQuickFilter, selectedAppointmentPlannerDay])

	const getScheduleStatusLabel = (status: ScheduleConfig['status']) => (status === 'active' ? 'Activa' : 'Inactiva')

	const scheduleColumns: ColumnDef<ScheduleConfig>[] = [
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
			id: 'availability',
			header: 'Disponibilidad',
			cell: ({ row }) => {
				const summary = scheduleAvailabilityById[row.original.id]
				const professionalOccupancy = occupancyByProfessionalId[row.original.professional_id]

				if (row.original.status === 'inactive') {
					return (
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<div className="min-w-45 cursor-default space-y-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
										<div className="flex items-center justify-between gap-2 text-xs">
											<span className="font-medium text-gray-700">Agenda inactiva</span>
											<span className="text-gray-500">Sin gestión</span>
										</div>
										<div className="h-2 overflow-hidden rounded-full bg-gray-200">
											<div className="h-full w-full bg-gray-400" />
										</div>
									</div>
								</TooltipTrigger>
								<TooltipContent className="max-w-xs text-sm">
									<p>La agenda está inactiva. No permite bloquear, desbloquear ni asignar nuevos cambios operativos hasta volver a activarla.</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					)
				}

				if (!summary || summary.totalSlots === 0) {
					if (professionalOccupancy) {
						return (
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<div className="min-w-45 cursor-help space-y-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2">
											<div className="flex items-center justify-between gap-2 text-xs">
												<span className="font-medium text-sky-900">{professionalOccupancy.booked} reservados de {professionalOccupancy.capacity}</span>
												<span className="text-sky-700">{formatPercentage(professionalOccupancy.occupancy_percentage)}%</span>
											</div>
											<div className="h-2 overflow-hidden rounded-full bg-sky-100">
												<div className="h-full bg-green-500" style={{ width: `${formatPercentage(professionalOccupancy.occupancy_percentage)}%` }} />
											</div>
											
										</div>
									</TooltipTrigger>
									<TooltipContent className="max-w-xs text-sm">
										<div className="space-y-1">
											<p>{professionalOccupancy.professional_name} tiene {professionalOccupancy.booked} reservados de {professionalOccupancy.capacity} turnos disponibles en el rango actual.</p>
											<p>Ocupación general: {formatPercentage(professionalOccupancy.occupancy_percentage)}%.</p>
											<p>Se muestra este resumen porque no hubo coincidencias suficientes para derivar el detalle fino desde la grilla local.</p>
										</div>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						)
					}

					return (
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<div className="min-w-45 rounded-lg border border-dashed border-gray-200 px-3 py-2 text-xs text-gray-500">
										Sin slots en el rango
									</div>
								</TooltipTrigger>
								<TooltipContent className="text-sm">
									<p>No hay slots generados para esta agenda dentro del rango filtrado actualmente.</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					)
				}

				return (
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<div className="min-w-45 cursor-help space-y-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
									<div className="flex items-center justify-between gap-2 text-xs">
										<span className="font-medium text-gray-700">{summary.totalSlots} slots</span>
										<span className="text-gray-500">{summary.freePercentage}% libre</span>
									</div>
									<div className="flex h-2 overflow-hidden rounded-full bg-gray-100">
										<div className="bg-emerald-500" style={{ width: `${summary.freePercentage}%` }} />
										<div className="bg-sky-500" style={{ width: `${summary.usedPercentage}%` }} />
										<div className="bg-amber-400" style={{ width: `${summary.blockedPercentage}%` }} />
									</div>
									<div className="flex items-center gap-3 text-[11px] text-gray-500">
										<span>Libres {summary.freeSlots}</span>
										<span>Uso {summary.usedSlots}</span>
										<span>Bloq. {summary.blockedSlots}</span>
									</div>
								</div>
							</TooltipTrigger>
							<TooltipContent className="max-w-xs text-sm">
								<div className="space-y-1">
									<p>Esta agenda tiene {summary.totalSlots} slots generados dentro del rango actual.</p>
									<p>{summary.usedSlots} de {summary.totalSlots} slots ya tienen uso en el rango.</p>
									<p>{summary.blockedSlots} slots están bloqueados y {summary.freeSlots} siguen libres.</p>
									<p>{summary.bookedCapacity} turnos ocupados de {summary.totalCapacity} cupos totales en la agenda filtrada.</p>
								</div>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				)
			},
		},
		{
			accessorKey: 'status',
			header: 'Estado',
			cell: ({ row }) => (
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={() => openScheduleStatusDialog(row.original)}
					disabled={loadingAction === 'schedule'}
					className="h-auto p-0 hover:bg-transparent"
				>
					<Badge variant={row.original.status === 'active' ? 'default' : 'secondary'} className="cursor-pointer">
						{getScheduleStatusLabel(row.original.status)}
					</Badge>
				</Button>
			),
		},
		{
			id: 'actions',
			header: 'Acciones',
			cell: ({ row }) => (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button type="button" variant="outline" size="icon" className="h-9 w-9">
							<MoreHorizontal className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-44">
						<DropdownMenuItem onClick={() => openAppointmentPlannerForSchedule(row.original)} disabled={row.original.status !== 'active'}>
							Agendar
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => openEditScheduleModal(row.original)}>
							Editar agenda
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => openBlockModalForSchedule(row.original)} disabled={row.original.status !== 'active'}>
							{row.original.status === 'active' ? 'Bloquear agenda' : 'Agenda inactiva'}
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			),
		},
	]

	const submitBlock = (event: React.FormEvent) => {
		event.preventDefault()

		if (isScheduleInteractionLocked) {
			return
		}

		if (!blockId && !isBlockMode && selectedBlockedIds.length > 0) {
			saveBlock({
				cancel_block_ids: selectedBlockedIds,
			}, undefined, {
				onSuccess: () => {
					handleBlockSuccess()
				},
			})

			return
		}

		if (!blockId && isBlockMode && selectedBlockGroups.length > 0) {
			saveBlock({
				blocks: selectedBlockGroups.map((group) => ({
					professional_id: Number(blockProfessionalId),
					block_type: blockType,
					title: blockTitle.trim() || `Bloqueo ${group.startTime} - ${group.endTime}`,
					start_datetime: buildLocalDateTime(group.date, group.startTime),
					end_datetime: buildLocalDateTime(group.date, group.endTime),
					affects_full_day: group.affectsFullDay,
					status: blockStatus,
					notes: blockNotes || undefined,
				})),
			}, undefined, {
				onSuccess: () => {
					handleBlockSuccess()
				},
			})

			return
		}

		saveBlock({
			professional_id: Number(blockProfessionalId),
			block_type: blockType,
			title: blockTitle,
			start_datetime: blockStart,
			end_datetime: blockEnd,
			affects_full_day: blockFullDay,
			status: blockStatus,
			notes: blockNotes || undefined,
		}, blockId || undefined, {
			onSuccess: () => {
				handleBlockSuccess()
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
							<div className="text-3xl font-semibold">{formatPercentage(occupancy.occupancy_percentage)}%</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="pt-6">
							<div className="text-sm text-gray-500">Citas en rango</div>
							<div className="text-3xl font-semibold">{appointments.length}</div>
						</CardContent>
					</Card>
				</div>

				<Collapsible open={isOccupancyBoardOpen} onOpenChange={setIsOccupancyBoardOpen}>
					<div className="rounded-xl border border-gray-200 bg-white">
						<CollapsibleTrigger asChild>
							<button type="button" className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left">
								<div>
									<div className="text-sm font-semibold text-gray-900">Tablero de ocupación</div>
									<div className="text-xs text-gray-500">Ver detalle diario y por profesional del rango actual.</div>
								</div>
								<ChevronRight className={`h-4 w-4 text-gray-500 transition-transform ${isOccupancyBoardOpen ? 'rotate-90' : ''}`} />
							</button>
						</CollapsibleTrigger>
						<CollapsibleContent className="border-t border-gray-200 p-4">
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
												<Badge variant="secondary">{formatPercentage(day.occupancy_percentage)}%</Badge>
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
												<Badge>{formatPercentage(row.occupancy_percentage)}%</Badge>
											</div>
										))}
									</CardContent>
								</Card>
							</div>
						</CollapsibleContent>
					</div>
				</Collapsible>

				<Card>
					<CardHeader>
						<div className="flex flex-col gap-5">
							<div>
								<CardTitle>Agendas configuradas</CardTitle>
								<p className="text-sm text-gray-500">Gestioná todas las agendas desde una grilla paginada y editá en modal.</p>
							</div>
							<div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,180px)_minmax(0,180px)_auto_auto] xl:items-end xl:justify-start">
								<div>
									<label className="mb-1 block text-sm font-medium text-gray-700">Profesional</label>
									<div className="flex gap-2">
										<SearchableInput
											placeholder="Dr. Juan Pérez"
											value={getProfessionalName(filterProfessionalId)}
											onSelect={(professional) => applyProfessionalFilter(String(professional.id))}
											onSearch={searchProfessionals}
											minSearchLength={1}
											maxResults={10}
											className="w-full"
										/>
									</div>
									{filterProfessionalId && (
										<button
											type="button"
											onClick={clearProfessionalFilter}
											className="mt-1 text-xs text-gray-500 hover:text-gray-700"
										>
											Limpiar filtro
										</button>
									)}
								</div>
								<div>
									<label className="mb-1 block text-sm font-medium text-gray-700">Desde</label>
									<input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2" />
								</div>
								<div>
									<label className="mb-1 block text-sm font-medium text-gray-700">Hasta</label>
									<input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2" />
								</div>
								<Button type="button" size="sm" className="xl:w-auto" onClick={applyFilters} disabled={loadingAction === 'filters'}>
									Aplicar
								</Button>
								<Button type="button" size="sm" className="xl:w-auto" onClick={openCreateScheduleModal}>
									<PlusCircle className="mr-2 h-4 w-4" />
									Nueva agenda
								</Button>
							</div>
							<div className="flex flex-wrap items-center gap-2">
								<Button
									type="button"
									size="sm"
									variant={!filters.status ? 'default' : 'outline'}
									onClick={() => applyScheduleStatusFilter('all')}
								>
									Todos
								</Button>
								<Button
									type="button"
									size="sm"
									variant={filters.status === 'active' ? 'default' : 'outline'}
									onClick={() => applyScheduleStatusFilter('active')}
								>
									Activas
								</Button>
								<Button
									type="button"
									size="sm"
									variant={filters.status === 'inactive' ? 'default' : 'outline'}
									onClick={() => applyScheduleStatusFilter('inactive')}
								>
									Inactivas
								</Button>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<DataTable
							columns={scheduleColumns}
							data={schedules}
							searchable={false}
							emptyMessage="No se encontraron agendas con los filtros aplicados"
							initialSearch={filters.search || ''}
							loading={loadingAction === 'filters'}
						/>
					</CardContent>
				</Card>

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

				<AlertDialog open={scheduleStatusDialog.open} onOpenChange={closeScheduleStatusDialog}>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>{scheduleStatusDialog.nextStatus === 'inactive' ? '¿Desactivar agenda?' : '¿Activar agenda?'}</AlertDialogTitle>
							<AlertDialogDescription>
								{scheduleStatusDialog.schedule ? `${scheduleStatusDialog.schedule.name} · ${scheduleStatusDialog.schedule.professional_name}` : ''}
								{scheduleStatusDialog.nextStatus === 'inactive'
									? ' quedará inactiva y no permitirá bloquear ni desbloquear hasta volver a activarla.'
									: ' volverá a estar disponible para gestionar bloqueos y turnos.'}
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel disabled={loadingAction === 'schedule'}>Cancelar</AlertDialogCancel>
							<AlertDialogAction onClick={confirmScheduleStatusChange} disabled={loadingAction === 'schedule'}>
								{scheduleStatusDialog.nextStatus === 'inactive' ? 'Sí, desactivar' : 'Sí, activar'}
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>

				<Dialog open={isAppointmentPlannerOpen} onOpenChange={closeAppointmentPlanner}>
					<DialogContent className="flex h-[90vh] max-h-[90vh] flex-col overflow-hidden p-0 sm:max-w-5xl">
						<DialogHeader className="sticky top-0 z-20 shrink-0 border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
							<DialogTitle>Planificar cita por fecha</DialogTitle>
							<DialogDescription>
								{appointmentScheduleContext
									? `${appointmentScheduleContext.professional_name} · ${appointmentScheduleContext.name}. Revisá qué días tienen lugar y entrá a la agenda diaria con un click.`
									: 'Elegí una agenda para revisar fechas y disponibilidad.'}
							</DialogDescription>
						</DialogHeader>
						<div className="shrink-0 border-b border-gray-200 bg-white px-6 py-5">
							<div className="space-y-5">
								<div className="grid gap-3 md:grid-cols-[180px_180px_auto] md:items-end">
									<div>
									<label className="mb-1 block text-sm font-medium text-gray-700">Desde</label>
									<input
										type="date"
										value={appointmentPlannerStartDate}
										onChange={(event) => setAppointmentPlannerStartDate(appointmentScheduleContext ? clampScheduleDate(appointmentScheduleContext, event.target.value) : event.target.value)}
										className="w-full rounded-md border border-gray-300 px-3 py-2"
										disabled={!appointmentScheduleContext}
									/>
								</div>
								<div>
									<label className="mb-1 block text-sm font-medium text-gray-700">Hasta</label>
									<input
										type="date"
										value={appointmentPlannerEndDate}
										onChange={(event) => setAppointmentPlannerEndDate(appointmentScheduleContext ? clampScheduleDate(appointmentScheduleContext, event.target.value) : event.target.value)}
										className="w-full rounded-md border border-gray-300 px-3 py-2"
										disabled={!appointmentScheduleContext}
									/>
								</div>
								<div className="flex flex-wrap gap-2">
									{firstAvailableAppointmentDay && appointmentScheduleContext && (
										<Button
											type="button"
											variant="outline"
											onClick={() => openAppointmentsForSchedule(appointmentScheduleContext, firstAvailableAppointmentDay.date)}
										>
											Ir al primer día con lugar
										</Button>
									)}
								</div>
							</div>
							<div className="flex flex-wrap items-center gap-2">
								<Button
									type="button"
									size="sm"
									variant={appointmentPlannerDayFilter === 'available' ? 'default' : 'outline'}
									onClick={() => setAppointmentPlannerDayFilter('available')}
								>
									Disponibles
								</Button>
								<Button
									type="button"
									size="sm"
									variant={appointmentPlannerDayFilter === 'without-schedule' ? 'default' : 'outline'}
									onClick={() => setAppointmentPlannerDayFilter('without-schedule')}
								>
									Sin agenda
								</Button>
								<Button
									type="button"
									size="sm"
									variant={appointmentPlannerDayFilter === 'all' ? 'default' : 'outline'}
									onClick={() => setAppointmentPlannerDayFilter('all')}
								>
									Todos
								</Button>
							</div>
							<div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
								La secretaria puede revisar rápidamente qué fechas tienen disponibilidad, cuáles están completas o bloqueadas, y entrar directo al día exacto para asignar paciente y consulta.
							</div>
						</div>
						</div>
						<div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
							<div className="space-y-5">
							{selectedAppointmentPlannerDay && (
								<div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
									<div className="mb-3 flex flex-wrap items-center justify-between gap-3">
										<div>
											<div className="text-sm font-semibold text-sky-950 capitalize">Turnos del día: {selectedAppointmentPlannerDay.label}</div>
											<div className="text-xs text-sky-800">Elegí un horario con lugar y se abrirá el formulario para asignar paciente y consulta.</div>
										</div>
										<div className="flex flex-wrap items-center gap-2">
											<Button
												type="button"
												size="sm"
												variant={appointmentPlannerQuickFilter === 'all' ? 'default' : 'outline'}
												onClick={() => setAppointmentPlannerQuickFilter('all')}
											>
												Todos
											</Button>
											<Button
												type="button"
												size="sm"
												variant={appointmentPlannerQuickFilter === 'available' ? 'default' : 'outline'}
												onClick={() => setAppointmentPlannerQuickFilter('available')}
											>
												Disponibles
											</Button>
											<Button
												type="button"
												size="sm"
												variant={appointmentPlannerQuickFilter === 'occupied' ? 'default' : 'outline'}
												onClick={() => setAppointmentPlannerQuickFilter('occupied')}
											>
												Ocupados
											</Button>
											<Button type="button" variant="outline" size="sm" onClick={() => setAppointmentPlannerSelectedDate(null)}>
												Volver a fechas
											</Button>
										</div>
									</div>
									{filteredSelectedAppointmentPlannerSlots.length === 0 ? (
										<p className="text-sm text-sky-900">No hay slots configurados para este día en la agenda.</p>
									) : (
										<div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
											{filteredSelectedAppointmentPlannerSlots.map((slot) => {
												const canSchedule = slot.status === 'available' || slot.status === 'partial'
												const toneClasses = slot.status === 'available'
													? 'border-emerald-300 bg-emerald-50 text-emerald-950 hover:bg-emerald-100'
													: slot.status === 'partial'
														? 'border-sky-300 bg-sky-50 text-sky-950 hover:bg-sky-100'
														: slot.status === 'blocked'
															? 'border-amber-300 bg-amber-50 text-amber-950'
															: 'border-rose-300 bg-rose-50 text-rose-950'

												return (
													<button
														key={`${slot.date}-${slot.startTime}-${slot.endTime}`}
														type="button"
														onClick={() => canSchedule && openAppointmentSlotModal(slot)}
														disabled={!canSchedule || loadingAction === 'appointment'}
														className={`rounded-lg border px-3 py-3 text-left transition ${canSchedule ? toneClasses : `${toneClasses} cursor-not-allowed opacity-80`}`}
													>
														<div className="flex items-center justify-between gap-2">
															<div className="text-sm font-semibold">{slot.startTime} - {slot.endTime}</div>
															<Badge variant={slot.status === 'partial' ? 'secondary' : 'default'}>
																		{slot.status === 'available' ? 'Libre' : slot.status === 'partial' ? 'Parcial' : slot.status === 'blocked' ? 'Bloqueado' : 'Ocupado'}
															</Badge>
														</div>
														<div className="mt-2 space-y-1 text-xs">
																	{slot.status === 'available' && <div>{slot.availableCapacity} lugar(es) disponible(s)</div>}
																	{slot.status === 'partial' && <div>{slot.availableCapacity} lugar(es) libre(s)</div>}
																	{slot.appointmentSummaries.map((appointment) => (
																		<div key={appointment.id} className="rounded-md bg-white/70 px-2 py-1 text-[11px] leading-tight">
																			<div className="font-semibold">{appointment.patientName}</div>
																			<div className="opacity-80">{appointment.serviceLabel}</div>
																		</div>
																	))}
																	{slot.blockTitle && <div>{slot.blockTitle}</div>}
																	{canSchedule && <div>Click para agendar</div>}
														</div>
													</button>
												)
											})}
										</div>
									)}
								</div>
							)}
							{filteredAppointmentPreviewDays.length === 0 ? (
								<p className="text-sm text-gray-500">No hay fechas disponibles dentro del rango seleccionado para esta agenda.</p>
							) : (
								<div className="grid gap-2 pr-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
									{filteredAppointmentPreviewDays.map((day) => {
										const toneClasses = day.statusTone === 'available'
											? 'border-emerald-200 bg-emerald-50 text-emerald-900'
											: day.statusTone === 'blocked'
												? 'border-amber-200 bg-amber-50 text-amber-900'
												: day.statusTone === 'occupied'
													? 'border-rose-200 bg-rose-50 text-rose-900'
													: 'border-gray-200 bg-white text-gray-800'

										return (
											<div key={day.date} className={`rounded-lg border p-3 ${toneClasses}`}>
												<div className="flex items-start justify-between gap-2">
													<div>
														<div className="text-sm font-semibold capitalize leading-tight">{day.label}</div>
														<div className="text-[11px] opacity-80">{day.date}</div>
													</div>
													<Badge className="px-2 py-0 text-[10px]" variant={day.statusTone === 'muted' ? 'secondary' : 'default'}>{day.statusLabel}</Badge>
												</div>
												<div className="mt-3 grid grid-cols-2 gap-2 text-xs leading-tight">
													<div className="rounded-md bg-white/60 px-2 py-1.5">
														<div className="text-[10px] uppercase tracking-wide opacity-100">Disponibles</div>
														<div className="mt-0.5 font-semibold">{day.availableSlots} / {day.totalSlots || 0}</div>
													</div>
													<div className="rounded-md bg-white/60 px-2 py-1.5">
														<div className="text-[10px] uppercase tracking-wide opacity-100">Agendados</div>
														<div className="mt-0.5 font-semibold">{day.bookedCapacity || 0 }</div>
													</div>
													<div className="rounded-md bg-white/60 px-2 py-1.5">
														<div className="text-[10px] uppercase tracking-wide opacity-100">Bloqueados</div>
														<div className="mt-0.5 font-semibold">{day.blockedSlots}</div>
													</div>
													
													{day.firstAvailableSlot && (
														<div className="col-span-2 rounded-md bg-white/45 px-2 py-1.5 text-[11px]">
															<span className="opacity-70">Primer turno:</span> <span className="font-semibold">{day.firstAvailableSlot.startTime}</span>
														</div>
													)}
													{!day.hasRules && <div className="col-span-2 text-[11px] opacity-80">Ese día no forma parte de la agenda configurada.</div>}
												</div>
												<div className="mt-3 flex flex-wrap gap-1.5">
													<Button type="button" size="sm" variant={day.totalSlots > 0 ? 'default' : 'outline'} onClick={() => setAppointmentPlannerSelectedDate(day.date)} disabled={!appointmentScheduleContext || day.totalSlots === 0}>
														Ver turnos
													</Button>
													<Button type="button" size="sm" variant="ghost" onClick={() => appointmentScheduleContext && openAppointmentsForSchedule(appointmentScheduleContext, day.date)} disabled={!appointmentScheduleContext || day.totalSlots === 0}>
														Abrir día
													</Button>
												</div>
											</div>
										)
									})}
								</div>
							)}
						</div>
					</div>
					<DialogFooter className="shrink-0 border-t border-gray-200 bg-white px-6 py-4 sm:justify-between">
						<div className="text-xs text-gray-500">
							{selectedAppointmentPlannerDay
								? `Día seleccionado: ${selectedAppointmentPlannerDay.label}`
								: 'Seleccioná una fecha para ver los turnos del día.'}
						</div>
						<Button type="button" variant="outline" onClick={() => closeAppointmentPlanner(false)}>
							Cerrar
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<AppointmentSlotModal
				open={isAppointmentModalOpen}
				onOpenChange={closeAppointmentModal}
				loading={loadingAction === 'appointment'}
				medicalServices={medicalServices}
				slot={selectedAppointmentSlot}
				appointment={selectedAppointment}
				onSearchPatients={searchPatients}
				onSubmit={submitAppointment}
			/>

			<Dialog open={isBlockModalOpen} onOpenChange={closeBlockModal}>
				<DialogContent className="h-[92vh] w-[98vw] max-w-[98vw] overflow-hidden p-0 sm:w-[96vw] sm:max-w-[96vw] 2xl:w-450 2xl:max-w-450">
					<div className="flex h-full flex-col overflow-hidden p-6">
						<DialogHeader>
							<DialogTitle>{blockId ? 'Editar bloqueo' : isBlockMode ? 'Bloquear agenda' : 'Desbloquear agenda'}</DialogTitle>
							<DialogDescription>
								{blockScheduleContext ? `${blockScheduleContext.professional_name} · ${blockScheduleContext.name}` : 'Completá los datos del bloqueo y elegí los slots desde la grilla.'}
							</DialogDescription>
						</DialogHeader>
						<form className="flex min-h-0 flex-1 flex-col gap-5 overflow-hidden" onSubmit={submitBlock}>
							<div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
								<div className="grid gap-4">
									<div>
										<label className="mb-1 block text-sm font-medium text-gray-700">Desde</label>
										<input type="date" value={blockRangeStartDate} onChange={(event) => setBlockRangeStartDate(event.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" disabled={isScheduleInteractionLocked} required />
									</div>
									<div>
										<label className="mb-1 block text-sm font-medium text-gray-700">Hasta</label>
										<input type="date" value={blockRangeEndDate} onChange={(event) => setBlockRangeEndDate(event.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" disabled={isScheduleInteractionLocked} required />
									</div>
									<div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 text-xs text-gray-600">
										Este rango solo define qué días y turnos cargar en pantalla. Después elegís los slots que querés bloquear o desbloquear.
									</div>
									{!blockId && (
										<div className="rounded-lg border border-gray-200 bg-white p-3">
											<div className="mb-2 text-xs text-gray-500">Acción</div>
											<div className="flex gap-2">
												<Button type="button" size="sm" variant={isBlockMode ? 'default' : 'outline'} onClick={() => setBlockMode('block')} disabled={isScheduleInteractionLocked}>Bloquear</Button>
												<Button type="button" size="sm" variant={!isBlockMode ? 'default' : 'outline'} onClick={() => setBlockMode('unblock')} disabled={isScheduleInteractionLocked}>Desbloquear</Button>
											</div>
											<div className="mt-2 text-xs text-gray-500">La grilla solo habilita slots compatibles con el modo activo.</div>
										</div>
									)}
								</div>
								<div className="rounded-lg border border-gray-200 bg-white p-4">
									<div className="mb-4 flex flex-wrap items-start justify-between gap-3">
										<div>
											<div className="text-sm font-medium text-gray-900">Slots del rango</div>
											<div className="text-xs text-gray-500">Seleccioná los slots que querés afectar desde la grilla.</div>
										</div>
										<div className="flex flex-wrap items-center gap-2">
											{selectedPreviewSlots.length > 0 && <div className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">{selectedPreviewSlots.length} slot(s) marcados{!isBlockMode ? ` · ${selectedBlockedIds.length} bloqueo(s) a quitar` : ''}</div>}
											{selectedBlockSlotKeys.length > 0 && <Button type="button" size="sm" variant="ghost" onClick={clearBlockSelection} disabled={isScheduleInteractionLocked}>Limpiar selección</Button>}
										</div>
									</div>
									{blockPreviewDays.every((day) => day.slots.length === 0) && <p className="text-sm text-gray-500">No hay slots calculados para esta agenda en la fecha seleccionada.</p>}
									<div className="max-h-[42vh] overflow-auto pr-1">
										<div className="min-w-180 space-y-4">
											{blockPreviewDays.map((day) => (
												<div key={day.date} className="rounded-lg border border-gray-100 p-3">
													<div className="mb-3 flex flex-wrap items-center justify-between gap-2">
														<div>
															<div className="text-sm font-medium text-gray-900 capitalize">{day.label}</div>
															<div className="text-xs text-gray-500">{day.date}</div>
														</div>
														<Button type="button" size="sm" variant="outline" onClick={() => toggleDaySelection(day)} disabled={isScheduleInteractionLocked || loadingAction === 'block' || day.slots.every((slot) => slot.status !== selectableStatus || (!isBlockMode && !slot.block_id))}>
															{day.slots.filter((slot) => slot.status === selectableStatus && (isBlockMode || Boolean(slot.block_id))).every((slot) => selectedBlockSlotKeys.includes(getBlockSlotKey(slot))) ? (isBlockMode ? 'Quitar día' : 'Quitar bloqueados') : (isBlockMode ? 'Seleccionar día' : 'Seleccionar bloqueados')}
														</Button>
													</div>
													{day.slots.length === 0 ? (
														<p className="text-sm text-gray-500">No hay slots configurados para este día.</p>
													) : (
														<div className="grid gap-1.5 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
															{day.slots.map((slot) => {
																const isSelected = selectedBlockSlotKeys.includes(getBlockSlotKey(slot))
																const isDisabledForMode = isScheduleInteractionLocked || loadingAction === 'block' || (isBlockMode ? slot.status === 'blocked' : slot.status !== 'blocked' || !slot.block_id)
																return (
																	<button key={`${slot.date}-${slot.start_time}-${slot.end_time}`} type="button" onClick={() => toggleBlockSlotSelection(slot)} disabled={isDisabledForMode} className={`rounded-md border px-2 py-1.5 text-left text-xs leading-tight transition ${slot.status === 'blocked' ? (isSelected ? 'border-blue-700 bg-blue-600 text-white shadow-sm' : isBlockMode ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-500' : 'border-blue-300 bg-blue-50 text-blue-800 hover:border-blue-400 hover:bg-blue-100') : slot.status === 'occupied' ? 'border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300' : slot.status === 'partial' ? 'border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-300' : isSelected ? 'border-emerald-700 bg-emerald-600 text-white shadow-sm' : 'border-emerald-300 bg-emerald-50 text-gray-800 hover:border-emerald-400 hover:bg-emerald-100'}`}>
																	<div className="font-medium">{slot.start_time} - {slot.end_time}</div>
																	<div className="mt-0.5 text-[11px]">
																		{slot.status === 'blocked' && (
																			<TooltipProvider delayDuration={150}>
																				<Tooltip>
																					<TooltipTrigger asChild><span className="block truncate">{getBlockedSlotReason(slot.block_title)}</span></TooltipTrigger>
																					<TooltipContent className="max-w-sm">
																						<p>Tipo: {getBlockTypeLabel(slot.block_type)}</p>
																						<p>Motivo: {getBlockedSlotReason(slot.block_title)}</p>
																						{getBlockedSlotDescription(slot.block_notes) && <p>Descripción: {getBlockedSlotDescription(slot.block_notes)}</p>}
																					</TooltipContent>
																				</Tooltip>
																			</TooltipProvider>
																		)}
																		{slot.status === 'occupied' && `Tiene ${slot.appointments_count || 0} cita(s). Click para precargar el formulario manual.`}
																		{slot.status === 'partial' && `Parcial con ${slot.appointments_count || 0} cita(s). Click para precargar el formulario manual.`}
																		{slot.status === 'available' && (isSelected ? 'Seleccionado para bloquear' : 'Click para seleccionar')}
																		{slot.status === 'blocked' && !isBlockMode && (isSelected ? 'Seleccionado para desbloquear' : 'Click para desbloquear')}
																	</div>
																</button>
															)
														})}
														</div>
													)}
												</div>
											))}
										</div>
									</div>
								</div>
								</div>
								<div className="overflow-y-auto pr-1">
									<div className="grid gap-4 md:grid-cols-2">
										{isBlockMode ? (
											<Collapsible open={isBlockDetailsOpen} onOpenChange={setIsBlockDetailsOpen} className="md:col-span-2">
												<div className="rounded-lg border border-gray-200 bg-gray-50">
													<CollapsibleTrigger asChild>
														<button type="button" className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left">
															<div>
																<div className="text-sm font-medium text-gray-900">Detalles del bloqueo</div>
																<div className="text-xs text-gray-500">Configurá tipo y título cuando necesites más control.</div>
															</div>
															<ChevronRight className={`h-4 w-4 text-gray-500 transition-transform ${isBlockDetailsOpen ? 'rotate-90' : ''}`} />
														</button>
													</CollapsibleTrigger>
													<CollapsibleContent className="border-t border-gray-200 px-4 py-4">
														<div className="grid gap-4 md:grid-cols-2">
															<div>
																<label className="mb-1 block text-sm font-medium text-gray-700">Tipo</label>
																<SelectItem value={blockType} onValueChange={(value) => setBlockType(value as 'travel' | 'conference' | 'holiday' | 'vacation' | 'other')} required className="">
																	<option value="travel">Viaje</option>
																	<option value="conference">Congreso</option>
																	<option value="holiday">Feriado</option>
																	<option value="vacation">Vacaciones</option>
																	<option value="other">Otro</option>
																</SelectItem>
															</div>
															<div>
																<label className="mb-1 block text-sm font-medium text-gray-700">Estado del bloqueo</label>
																<div className="rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-700">{getBlockStatusLabel(blockStatus)}</div>
																<p className="mt-1 text-xs text-gray-500">Es solo una referencia del bloqueo. La disponibilidad general de la agenda se controla desde su estado principal.</p>
															</div>
															<div className="md:col-span-2">
																<label className="mb-1 block text-sm font-medium text-gray-700">Título</label>
																<input value={blockTitle} onChange={(event) => setBlockTitle(event.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" required disabled={isScheduleInteractionLocked} />
																{isMultiSlotSelectionMode && <p className="mt-1 text-xs text-gray-500">Este título se aplicará a los {selectedBlockGroups.length} bloqueos que se generen al confirmar.</p>}
															</div>
														</div>
													</CollapsibleContent>
												</div>
											</Collapsible>
										) : (
											<div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-4 text-sm text-blue-900 md:col-span-2">
												<div className="font-medium">Desbloqueo desde slots seleccionados</div>
												<div className="mt-1 text-xs text-blue-700">Para liberar horarios, seleccioná en la grilla los slots bloqueados que quieras quitar.</div>
												{selectedBlockedIds.length > 0 && <div className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-200">{selectedBlockedIds.length} bloqueo{selectedBlockedIds.length === 1 ? '' : 's'} seleccionado{selectedBlockedIds.length === 1 ? '' : 's'} para quitar</div>}
											</div>
										)}
										<div className="md:col-span-2">
											<label className="mb-1 block text-sm font-medium text-gray-700">{isBlockMode ? 'Notas' : 'Comentario'}</label>
											<textarea value={blockNotes} onChange={(event) => setBlockNotes(event.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" rows={3} placeholder={isBlockMode ? 'Opcional' : 'Motivo u observación del desbloqueo (opcional)'} disabled={isScheduleInteractionLocked} />
										</div>
									</div>
								</div>
								<DialogFooter className="border-t pt-4">
									<Button type="button" variant="outline" onClick={() => closeBlockModal(false)}>Cancelar</Button>
									<Button type="submit" disabled={isScheduleInteractionLocked || loadingAction === 'block' || !blockProfessionalId || (!blockId && isBlockMode && selectedBlockGroups.length === 0) || (!blockId && !isBlockMode && selectedBlockedIds.length === 0)}>
										{blockId ? 'Guardar cambios' : !isBlockMode ? 'Quitar bloqueo' : 'Aplicar bloqueo'}
									</Button>
								</DialogFooter>
							</form>
						</div>
					</DialogContent>
				</Dialog>

				{error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
			</div>
		</AppLayout>
	)
}