import React from 'react'
import { Head, Link, router } from '@inertiajs/react'
import { BarChart3, FileText, CheckCircle2, Clock, Beaker } from 'lucide-react'
import AppLayout from '@/layouts/app-layout'
import Modal from '@/components/ui/Modal'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { type BreadcrumbItem } from '@/types'
import HeadingSmall from '@/components/heading-small'
import { DataTable, DataTableColumnHeader } from '@/components/ui/data-table'
import { type ColumnDef } from '@tanstack/react-table'

interface LabDashboardProps {
  stats: {
    total_samples: number
    pending_samples: number
    total_results: number
    pending_validations: number
  }
  samples: {
    data: Array<{
      id: number
      sample_number: string
      barcode?: string | null
      status: string
      collected_at: string | null
      patient?: { first_name?: string; last_name?: string } | null
      sample_type?: { name?: string } | null
      service_request_detail?: {
        medical_service?: { name?: string } | null
      } | null
    }>
    current_page: number
    per_page: number
    total: number
    last_page: number
    from: number
    to: number
    links: Array<{ url: string | null; label: string; active: boolean }>
  }
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: 'Laboratorio',
    href: { url: '/medical/laboratory', method: 'get' },
  },
  {
    label: 'Bandeja de Trabajo',
    active: true,
  },
]

const statCards = [
  {
    title: 'Total de Muestras',
    value: '0',
    icon: Beaker,
    color: 'bg-blue-500',
    href: '/medical/laboratory/samples',
  },
  {
    title: 'Muestras Pendientes',
    value: '0',
    icon: Clock,
    color: 'bg-yellow-500',
    href: '/medical/laboratory/samples',
  },
  {
    title: 'Resultados Registrados',
    value: '0',
    icon: CheckCircle2,
    color: 'bg-green-500',
    href: '/medical/laboratory/results',
  },
  {
    title: 'Validaciones Pendientes',
    value: '0',
    icon: FileText,
    color: 'bg-orange-500',
    href: '/medical/laboratory/validations',
  },
]

const getStatusConfig = (status: string) => {
  if (status === 'pending_collection' || status === 'pending') {
    return { label: 'Pendiente Toma', className: 'bg-yellow-100 text-yellow-800' }
  }
  if (status === 'collected') {
    return { label: 'Tomada', className: 'bg-indigo-100 text-indigo-800' }
  }
  if (status === 'received') return { label: 'Recibida', className: 'bg-green-100 text-green-800' }
  if (status === 'processing' || status === 'in_analysis') return { label: 'En análisis', className: 'bg-blue-100 text-blue-800' }
  if (status === 'pending_validation') return { label: 'Pendiente Validación', className: 'bg-orange-100 text-orange-800' }
  if (status === 'validated') return { label: 'Validada', className: 'bg-teal-100 text-teal-800' }
  if (status === 'reported') return { label: 'Informada', className: 'bg-cyan-100 text-cyan-800' }
  if (status === 'completed') return { label: 'Completada', className: 'bg-emerald-100 text-emerald-800' }
  if (status === 'cancelled') return { label: 'Cancelada', className: 'bg-slate-100 text-slate-700' }
  if (status === 'rejected') return { label: 'Rechazada', className: 'bg-red-100 text-red-800' }
  return { label: status, className: 'bg-gray-100 text-gray-800' }
}

export default function LabDashboard({ stats, samples }: LabDashboardProps) {
  const [rejectModalOpen, setRejectModalOpen] = React.useState(false)
  const [rejectSampleId, setRejectSampleId] = React.useState<number | null>(null)
  const [rejectSampleNumber, setRejectSampleNumber] = React.useState('')
  const [rejectSamplePatient, setRejectSamplePatient] = React.useState('')
  const [rejectSampleStudy, setRejectSampleStudy] = React.useState('')
  const [rejectReason, setRejectReason] = React.useState('')
  const [rejectObservation, setRejectObservation] = React.useState('')

  const handleReceive = (sampleId: number) => {
    router.post(`/medical/laboratory/samples/${sampleId}/receive`, {}, {
      preserveScroll: true,
    })
  }

  const handleReject = (sampleId: number) => {
    const sample = samples.data.find((item) => item.id === sampleId)
    setRejectSampleId(sampleId)
    setRejectSampleNumber(sample?.sample_number || '')
    setRejectSamplePatient(sample?.patient ? `${sample.patient.first_name || ''} ${sample.patient.last_name || ''}`.trim() : '')
    setRejectSampleStudy(sample?.service_request_detail?.medical_service?.name || '')
    setRejectReason('')
    setRejectObservation('')
    setRejectModalOpen(true)
  }

  const handleSubmitReject = () => {
    if (!rejectSampleId || !rejectReason || !rejectObservation.trim()) {
      return
    }

    const remarks = `${rejectReason}. ${rejectObservation.trim()}`

    router.post(`/medical/laboratory/samples/${rejectSampleId}/reject`, {
      remarks,
    }, {
      preserveScroll: true,
      onSuccess: () => {
        setRejectModalOpen(false)
        setRejectSampleId(null)
      },
    })
  }

  const formatCollectedAt = (collectedAt?: string | null) => {
    if (!collectedAt) return '-'

    const date = new Date(collectedAt)
    if (Number.isNaN(date.getTime())) return '-'

    return date.toLocaleString('es-ES', {
      dateStyle: 'short',
      timeStyle: 'short',
    })
  }

  const columns: ColumnDef<LabDashboardProps['samples']['data'][number]>[] = [
    {
      accessorKey: 'sample_number',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Número" />,
      cell: ({ row }) => (
        <Link
          href={`/medical/laboratory/samples/${row.original.id}`}
          className="font-mono text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          {row.getValue('sample_number') as string}
        </Link>
      ),
    },
    {
      accessorKey: 'patient_name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Paciente" />,
      cell: ({ row }) => {
        const patient = row.original.patient
        const fullName = [patient?.first_name, patient?.last_name].filter(Boolean).join(' ').trim()
        return <span className="font-medium">{fullName || 'N/A'}</span>
      },
    },
    {
      accessorKey: 'requested_study',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Estudio" />,
      cell: ({ row }) => <span>{row.original.service_request_detail?.medical_service?.name || 'N/A'}</span>,
    },
    {
      accessorKey: 'sample_type',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tipo de muestra" />,
      cell: ({ row }) => <span>{row.original.sample_type?.name || 'N/A'}</span>,
    },
    {
      accessorKey: 'barcode',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Barcode" />,
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.barcode || '-'}</span>,
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
      cell: ({ row }) => {
        const config = getStatusConfig(row.original.status)
        return <span className={`inline-flex px-2 py-1 rounded text-xs ${config.className}`}>{config.label}</span>
      },
    },
    {
      accessorKey: 'collected_at',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Recolección" />,
      cell: ({ row }) => (
        <span className="text-sm">{formatCollectedAt(row.original.collected_at)}</span>
      ),
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.status === 'pending_collection' && (
            <Link
              href={`/medical/laboratory/samples/${row.original.id}/collect`}
              className="text-indigo-600 hover:underline mr-2"
            >
              Tomar Muestra
            </Link>
          )}
          {row.original.status === 'collected' && (
            <>
              <Link
                href={`/medical/laboratory/samples/${row.original.id}/collect`}
                className="text-amber-600 hover:underline mr-2"
              >
                Editar Toma
              </Link>
              <button
                onClick={() => handleReceive(row.original.id)}
                className="text-emerald-600 hover:underline mr-2"
              >
                Recibir
              </button>
              <button
                onClick={() => handleReject(row.original.id)}
                className="text-red-600 hover:underline mr-2"
              >
                Rechazar
              </button>
            </>
          )}
          <Link
            href={`/medical/laboratory/samples/${row.original.id}`}
            className="text-indigo-600 hover:underline mr-2"
          >
            Ver
          </Link>
          <Link
            href="/medical/laboratory/samples"
            className="text-emerald-600 hover:underline"
          >
            Gestionar
          </Link>
        </div>
      ),
    },
  ]

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Laboratorio - Bandeja de Trabajo" />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <HeadingSmall
            title="Bandeja de Trabajo"
            description="Gestión integral del módulo de laboratorio"
            icon={<BarChart3 className="h-6 w-6" />}
          />
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card, index) => {
            const Icon = card.icon
            const value = Object.values(stats)[index] || 0
            return (
              <Link
                key={card.title}
                href={card.href}
                className="group"
              >
                <Card className="cursor-pointer transition-all hover:shadow-lg hover:scale-105">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {card.title}
                    </CardTitle>
                    <div className={`${card.color} p-2 rounded-lg text-white`}>
                      <Icon className="h-4 w-4" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{value}</div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/medical/laboratory/samples">
            <Button variant="outline" className="w-full justify-start">
              <Beaker className="mr-2 h-4 w-4" />
              Recepción de Muestras
            </Button>
          </Link>
          <Link href="/medical/laboratory/results">
            <Button variant="outline" className="w-full justify-start">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Registrar Resultados
            </Button>
          </Link>
          <Link href="/medical/laboratory/validations">
            <Button variant="outline" className="w-full justify-start">
              <FileText className="mr-2 h-4 w-4" />
              Validar Resultados
            </Button>
          </Link>
          <Link href="/medical/laboratory/reports">
            <Button variant="outline" className="w-full justify-start">
              <BarChart3 className="mr-2 h-4 w-4" />
              Informes
            </Button>
          </Link>
        </div>

        <div className="rounded-xl border bg-white dark:bg-emerald-950 border-slate-200 dark:border-emerald-900/60 shadow-sm">
          <div className="px-6 pt-6 pb-2 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg leading-6 font-semibold text-black dark:text-white">
                Muestras Registradas
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Búsqueda, filtros y paginación de muestras de laboratorio
              </p>
            </div>
            <Link href="/medical/reception">
              <Button>Nueva Solicitud (Recepción)</Button>
            </Link>
          </div>
          <div className="px-6 pb-6">
            <DataTable
              columns={columns}
              data={samples}
              searchable={true}
              searchPlaceholder="Buscar por número de muestra o barcode..."
              emptyMessage="No hay muestras registradas."
              statusFilterable={true}
              statusOptions={[
                { value: 'pending_collection', label: 'Pendiente Toma' },
                { value: 'collected', label: 'Tomada' },
                { value: 'received', label: 'Recibida' },
                { value: 'processing', label: 'En análisis (legacy)' },
                { value: 'in_analysis', label: 'En análisis' },
                { value: 'pending_validation', label: 'Pendiente validación' },
                { value: 'validated', label: 'Validada' },
                { value: 'reported', label: 'Informada' },
                { value: 'completed', label: 'Completada' },
                { value: 'rejected', label: 'Rechazada' },
                { value: 'cancelled', label: 'Cancelada' },
              ]}
              onStatusChange={(status) => {
                const url = new URL(window.location.href)
                if (status !== 'all') url.searchParams.set('status', status)
                else url.searchParams.delete('status')
                url.searchParams.set('page', '1')
                router.visit(url.toString(), { preserveState: true })
              }}
            />
          </div>
        </div>
      </div>

      <Modal
        open={rejectModalOpen}
        onClose={() => {
          setRejectModalOpen(false)
          setRejectSampleId(null)
        }}
      >
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Rechazar Muestra</h3>
          <p className="text-sm text-gray-500">
            Complete motivo y observación para registrar el rechazo de la muestra {rejectSampleNumber}. Paciente: {rejectSamplePatient || 'N/A'}. Estudio: {rejectSampleStudy || 'N/A'}.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Motivo de rechazo *</label>
            <select
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="">Seleccionar motivo</option>
              <option value="Muestra insuficiente">Muestra insuficiente</option>
              <option value="Muestra hemolizada">Muestra hemolizada</option>
              <option value="Tubo incorrecto">Tubo incorrecto</option>
              <option value="Sin identificación">Sin identificación</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observación *</label>
            <textarea
              value={rejectObservation}
              onChange={(e) => setRejectObservation(e.target.value)}
              rows={4}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="Detalle de la incidencia detectada..."
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setRejectModalOpen(false)
                setRejectSampleId(null)
                setRejectSamplePatient('')
                setRejectSampleStudy('')
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmitReject}
              className="px-4 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
              disabled={!rejectReason || !rejectObservation.trim()}
            >
              Confirmar rechazo
            </button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  )
}
