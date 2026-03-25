import { useEffect, useState } from 'react'
import SearchableInput from '@/components/ui/SearchableInput'
import SelectItem from '@/components/ui/SelectItem'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { ProfessionalSearchResult } from '@/hooks/medical/useSearch'
import type { SchedulePayload } from '@/hooks/medical/useSchedule'

type ProfessionalOption = {
  id: number
  full_name: string
  specialties: string[]
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

type WeekRuleForm = {
  weekday: number
  enabled: boolean
  start_time: string
  end_time: string
  capacity: number
}

interface ScheduleFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  professionals: ProfessionalOption[]
  initialRange: {
    startDate: string
    endDate: string
  }
  loading: boolean
  schedule?: ScheduleConfig | null
  onSearchProfessionals: (query: string) => Promise<ProfessionalSearchResult[]>
  onSubmit: (payload: SchedulePayload, scheduleId?: number) => void
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

const defaultSlotDurationOptions = ['15', '30', '45', '60']

const emptyWeekRuleMap = (): WeekRuleForm[] => (
  weekDays.map((day) => ({
    weekday: day.value,
    enabled: false,
    start_time: '08:00',
    end_time: '12:00',
    capacity: 1,
  }))
)

export default function ScheduleFormModal({
  open,
  onOpenChange,
  professionals,
  initialRange,
  loading,
  schedule,
  onSearchProfessionals,
  onSubmit,
}: ScheduleFormModalProps) {
  const [scheduleProfessionalId, setScheduleProfessionalId] = useState('')
  const [scheduleName, setScheduleName] = useState('')
  const [scheduleStartDate, setScheduleStartDate] = useState(initialRange.startDate)
  const [scheduleEndDate, setScheduleEndDate] = useState(initialRange.endDate)
  const [slotDuration, setSlotDuration] = useState('30')
  const [scheduleStatus, setScheduleStatus] = useState<'active' | 'inactive'>('active')
  const [scheduleNotes, setScheduleNotes] = useState('')
  const [weekRules, setWeekRules] = useState<WeekRuleForm[]>(emptyWeekRuleMap)

  useEffect(() => {
    if (!open) {
      return
    }

    if (!schedule) {
      setScheduleProfessionalId('')
      setScheduleName('')
      setScheduleStartDate(initialRange.startDate)
      setScheduleEndDate(initialRange.endDate)
      setSlotDuration('30')
      setScheduleStatus('active')
      setScheduleNotes('')
      setWeekRules(emptyWeekRuleMap())
      return
    }

    setScheduleProfessionalId(String(schedule.professional_id))
    setScheduleName(schedule.name)
    setScheduleStartDate(schedule.start_date)
    setScheduleEndDate(schedule.end_date || '')
    setSlotDuration(String(schedule.slot_duration_minutes))
    setScheduleStatus(schedule.status)
    setScheduleNotes(schedule.notes || '')
    setWeekRules(
      weekDays.map((day) => {
        const rule = schedule.rules.find((item) => item.weekday === day.value)

        return {
          weekday: day.value,
          enabled: Boolean(rule),
          start_time: rule?.start_time || '08:00',
          end_time: rule?.end_time || '12:00',
          capacity: rule?.capacity || 1,
        }
      })
    )
  }, [initialRange.endDate, initialRange.startDate, open, schedule])

  const getProfessionalName = (professionalId: string) => {
    if (!professionalId) {
      return ''
    }

    return professionals.find((professional) => String(professional.id) === professionalId)?.full_name || ''
  }

  const handleWeekRuleChange = (weekday: number, field: 'enabled' | 'start_time' | 'end_time' | 'capacity', value: string | boolean) => {
    setWeekRules((current) => current.map((rule) => {
      if (rule.weekday !== weekday) {
        return rule
      }

      return {
        ...rule,
        [field]: field === 'capacity' ? Number(value) : value,
      }
    }))
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()

    const rules = weekRules
      .filter((rule) => rule.enabled)
      .map((rule) => ({
        weekday: rule.weekday,
        start_time: rule.start_time,
        end_time: rule.end_time,
        capacity: Number(rule.capacity),
        is_active: true,
      }))

    onSubmit({
      professional_id: Number(scheduleProfessionalId),
      name: scheduleName,
      start_date: scheduleStartDate,
      end_date: scheduleEndDate || undefined,
      slot_duration_minutes: Number(slotDuration),
      status: scheduleStatus,
      notes: scheduleNotes || undefined,
      rules,
    }, schedule?.id)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{schedule ? 'Editar agenda' : 'Nueva agenda'}</DialogTitle>
          <DialogDescription>
            Configurá el profesional, la vigencia y las reglas semanales en un solo formulario.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Profesional</label>
              <SearchableInput
                placeholder="Prof."
                value={getProfessionalName(scheduleProfessionalId)}
                onSelect={(professional) => setScheduleProfessionalId(String(professional.id))}
                onSearch={onSearchProfessionals}
                minSearchLength={1}
                maxResults={10}
                className="w-full"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Nombre</label>
              <input value={scheduleName} onChange={(event) => setScheduleName(event.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2" required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Inicio</label>
              <input type="date" value={scheduleStartDate} onChange={(event) => setScheduleStartDate(event.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2" required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Fin</label>
              <input type="date" value={scheduleEndDate || ''} onChange={(event) => setScheduleEndDate(event.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Duración del slot</label>
              <SelectItem value={slotDuration} onValueChange={setSlotDuration} required>
                {!defaultSlotDurationOptions.includes(slotDuration) && slotDuration && (
                  <option value={slotDuration}>{slotDuration} minutos</option>
                )}
                <option value="15">15 minutos</option>
                <option value="30">30 minutos</option>
                <option value="45">45 minutos</option>
                <option value="60">60 minutos</option>
              </SelectItem>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Estado</label>
              <SelectItem value={scheduleStatus} onValueChange={(value) => setScheduleStatus(value as 'active' | 'inactive')} required>
                <option value="active">Activa</option>
                <option value="inactive">Inactiva</option>
              </SelectItem>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <div className="mb-3 font-medium text-gray-900">Reglas semanales</div>
            <div className="space-y-3">
              {weekRules.map((rule) => (
                <div key={rule.weekday} className="grid items-center gap-3 md:grid-cols-[150px,1fr,1fr,120px]">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <input type="checkbox" checked={rule.enabled} onChange={(event) => handleWeekRuleChange(rule.weekday, 'enabled', event.target.checked)} />
                    {weekDays.find((day) => day.value === rule.weekday)?.label}
                  </label>
                  <input type="time" value={rule.start_time} onChange={(event) => handleWeekRuleChange(rule.weekday, 'start_time', event.target.value)} disabled={!rule.enabled} className="rounded-md border border-gray-300 px-3 py-2" />
                  <input type="time" value={rule.end_time} onChange={(event) => handleWeekRuleChange(rule.weekday, 'end_time', event.target.value)} disabled={!rule.enabled} className="rounded-md border border-gray-300 px-3 py-2" />
                  <input type="number" min="1" max="20" value={rule.capacity} onChange={(event) => handleWeekRuleChange(rule.weekday, 'capacity', event.target.value)} disabled={!rule.enabled} className="rounded-md border border-gray-300 px-3 py-2" />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Notas</label>
            <textarea value={scheduleNotes} onChange={(event) => setScheduleNotes(event.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2" rows={3} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {schedule ? 'Guardar cambios' : 'Guardar agenda'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}