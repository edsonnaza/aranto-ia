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
import type { PatientSearchResult } from '@/hooks/medical/useSearch'
import { useSearch } from '@/hooks/medical'
import type { AppointmentPayload } from '@/hooks/medical/useSchedule'

type MedicalServiceOption = {
  id: number
  name: string
  duration_minutes: number
}

type AppointmentRecord = {
  id: number
  professional_id: number
  professional_name: string
  patient_id: number
  patient_name: string
  medical_service_id?: number | null
  medical_service_ids?: number[] | null
  medical_service_name?: string | null
  medical_service_names?: string[] | null
  appointment_date: string
  start_time: string
  end_time: string
  duration_minutes: number
  status: 'scheduled' | 'checked_in' | 'completed' | 'cancelled' | 'no_show'
  source: 'agenda' | 'reception' | 'manual'
  notes?: string | null
  cancellation_reason?: string | null
}

type SlotContext = {
  professionalId: number
  professionalName: string
  date: string
  startTime: string
  endTime: string
  durationMinutes: number
}

interface AppointmentSlotModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  loading: boolean
  medicalServices: MedicalServiceOption[]
  slot: SlotContext | null
  appointment: AppointmentRecord | null
  onSearchPatients: (query: string) => Promise<PatientSearchResult[]>
  onSubmit: (payload: AppointmentPayload, appointmentId?: number) => void
}

export default function AppointmentSlotModal({
  open,
  onOpenChange,
  loading,
  medicalServices,
  slot,
  appointment,
  onSearchPatients,
  onSubmit,
}: AppointmentSlotModalProps) {
  const { searchServices } = useSearch()
  const [selectedPatient, setSelectedPatient] = useState<{ id: number; name: string } | null>(null)
  const [selectedServices, setSelectedServices] = useState<Array<{ id: number; name: string; durationMinutes: number }>>([])
  const [appointmentStatus, setAppointmentStatus] = useState<'scheduled' | 'checked_in' | 'completed' | 'cancelled' | 'no_show'>('scheduled')
  const [appointmentSource, setAppointmentSource] = useState<'agenda' | 'reception' | 'manual'>('agenda')
  const [appointmentNotes, setAppointmentNotes] = useState('')
  const [cancellationReason, setCancellationReason] = useState('')

  useEffect(() => {
    if (!open) {
      return
    }

    if (!appointment) {
      setSelectedPatient(null)
      setSelectedServices([])
      setAppointmentStatus('scheduled')
      setAppointmentSource('agenda')
      setAppointmentNotes('')
      setCancellationReason('')
      return
    }

    setSelectedPatient({ id: appointment.patient_id, name: appointment.patient_name })
    const serviceIds = appointment.medical_service_ids?.length
      ? appointment.medical_service_ids
      : (appointment.medical_service_id ? [appointment.medical_service_id] : [])

    const serviceNames = appointment.medical_service_names?.length
      ? appointment.medical_service_names
      : (appointment.medical_service_name ? appointment.medical_service_name.split(',').map((name) => name.trim()).filter(Boolean) : [])

    setSelectedServices(
      serviceIds.map((serviceId, index) => {
        const service = medicalServices.find((item) => item.id === serviceId)

        return {
          id: serviceId,
          name: service?.name || serviceNames[index] || '',
          durationMinutes: service?.duration_minutes || 30,
        }
      })
    )
    setAppointmentStatus(appointment.status)
    setAppointmentSource(appointment.source)
    setAppointmentNotes(appointment.notes || '')
    setCancellationReason(appointment.cancellation_reason || '')
  }, [appointment, medicalServices, open])

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()

    if (!slot || !selectedPatient) {
      return
    }

    const calculatedDuration = selectedServices.reduce((total, service) => total + service.durationMinutes, 0)

    onSubmit({
      professional_id: slot.professionalId,
      patient_id: selectedPatient.id,
      medical_service_id: selectedServices[0]?.id,
      medical_service_ids: selectedServices.map((service) => service.id),
      appointment_date: slot.date,
      start_time: slot.startTime,
      duration_minutes: calculatedDuration > 0 ? calculatedDuration : slot.durationMinutes,
      status: appointmentStatus,
      source: appointmentSource,
      notes: appointmentNotes || undefined,
      cancellation_reason: cancellationReason || undefined,
    }, appointment?.id)
  }

  const addService = (service: { id: number; label?: string; value?: number; estimated_duration?: number }) => {
    const serviceId = typeof service.value === 'number' ? service.value : service.id

    if (!serviceId || selectedServices.some((item) => item.id === serviceId)) {
      return
    }

    const serviceMetadata = medicalServices.find((item) => item.id === serviceId)

    setSelectedServices((current) => [
      ...current,
      {
        id: serviceId,
        name: service.label || serviceMetadata?.name || '',
        durationMinutes: serviceMetadata?.duration_minutes || service.estimated_duration || 30,
      },
    ])
  }

  const removeService = (serviceId: number) => {
    setSelectedServices((current) => current.filter((service) => service.id !== serviceId))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{appointment ? 'Editar cita' : 'Asignar cita'}</DialogTitle>
          <DialogDescription>
            {slot ? `${slot.professionalName} · ${slot.date} · ${slot.startTime} a ${slot.endTime}` : 'Seleccioná un slot para cargar la cita.'}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Paciente</label>
              <SearchableInput
                placeholder="Buscar paciente"
                value={selectedPatient?.name || ''}
                onSelect={(patient) => setSelectedPatient({ id: patient.id, name: patient.label })}
                onSearch={onSearchPatients}
                className="w-full"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Servicio</label>
              <SearchableInput
                placeholder="Buscar servicio"
                value=""
                onSelect={addService}
                onSearch={searchServices}
                minSearchLength={1}
                maxResults={10}
                className="w-full"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedServices.length === 0 && <span className="text-xs text-gray-500">Podés agregar uno o varios servicios para la misma cita.</span>}
                {selectedServices.map((service) => (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => removeService(service.id)}
                    className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                  >
                    {service.name || `Servicio #${service.id}`} · {service.durationMinutes} min
                    <span className="ml-2 text-blue-500">×</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Estado</label>
              <SelectItem value={appointmentStatus} onValueChange={(value) => setAppointmentStatus(value as 'scheduled' | 'checked_in' | 'completed' | 'cancelled' | 'no_show')}>
                <option value="scheduled">Agendada</option>
                <option value="checked_in">Confirmado / llegó</option>
                <option value="completed">Completada</option>
                <option value="cancelled">Cancelada</option>
                <option value="no_show">No asistió</option>
              </SelectItem>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Origen</label>
              <SelectItem value={appointmentSource} onValueChange={(value) => setAppointmentSource(value as 'agenda' | 'reception' | 'manual')}>
                <option value="agenda">Agenda</option>
                <option value="manual">Manual</option>
                <option value="reception">Recepción</option>
              </SelectItem>
            </div>
          </div>

          {appointmentStatus === 'cancelled' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Motivo de cancelación</label>
              <textarea value={cancellationReason} onChange={(event) => setCancellationReason(event.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2" rows={2} />
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Motivo / consulta</label>
            <textarea value={appointmentNotes} onChange={(event) => setAppointmentNotes(event.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2" rows={3} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
            <Button type="submit" disabled={loading || !selectedPatient || !slot}>
              {appointment ? 'Guardar cambios' : 'Asignar cita'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}