import { ColumnDef } from '@/components/ui/data-table'
import { Appointment } from './Appointments'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export const appointmentStatusColor: Record<Appointment['status'], string> = {
  scheduled: 'bg-blue-100 text-blue-700 border border-blue-300',
  checked_in: 'bg-green-100 text-green-700 border border-green-300',
  completed: 'bg-gray-100 text-gray-700 border border-gray-300',
  cancelled: 'bg-red-100 text-red-700 border border-red-300',
  no_show: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
}

export const columns: ColumnDef<Appointment>[] = [
  {
    accessorKey: 'patient_name',
    header: 'Paciente',
    cell: ({ row }) => <span>{row.original.patient_name}</span>,
    enableSorting: true,
  },
  {
    accessorKey: 'medical_service_name',
    header: 'Servicio',
    cell: ({ row }) => <span>{row.original.medical_service_name || (row.original.medical_service_names?.join(', ') ?? '')}</span>,
    enableSorting: true,
  },
  {
    accessorKey: 'start_time',
    header: 'Horario',
    cell: ({ row }) => (
      <span>{row.original.appointment_date} {row.original.start_time} - {row.original.end_time}</span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => (
      <Badge className={appointmentStatusColor[row.original.status] + ' h-6 px-2 text-xs font-semibold'}>{
        row.original.status === 'scheduled' ? 'Agendada' :
        row.original.status === 'checked_in' ? 'Confirmado' :
        row.original.status === 'completed' ? 'Completada' :
        row.original.status === 'cancelled' ? 'Cancelada' :
        row.original.status === 'no_show' ? 'No asistió' : row.original.status
      }</Badge>
    ),
    enableSorting: true,
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => (
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => row.original.onEdit?.(row.original)}>Editar</Button>
        <Button size="sm" variant="secondary" onClick={() => row.original.onReception?.(row.original)}>Recepción</Button>
        {row.original.status === 'scheduled' && (
          <Button size="sm" variant="destructive" onClick={() => row.original.onCancel?.(row.original)}>Cancelar</Button>
        )}
      </div>
    ),
    enableSorting: false,
  },
]
