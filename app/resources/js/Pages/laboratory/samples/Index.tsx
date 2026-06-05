import { Head, Link, router } from '@inertiajs/react'
import { useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import AppLayout from '@/layouts/app-layout'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { DataTable, DataTableColumnHeader } from '@/components/ui/data-table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MoreHorizontal } from 'lucide-react'
import { useLabSamples } from '@/hooks/useLabSamples'
import SampleForm from './SampleForm'
import { toast } from 'sonner'

const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
)

const RefreshIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
)

interface Sample {
  id: number
  sample_number: string
  barcode?: string
  status: string
  collected_at: string | null
  latest_collection?: {
    collected_at?: string | null
    container_type?: string | null
    volume?: string | number | null
    volume_unit?: string | null
    sample_condition?: string | null
    collection_site?: string | null
    collection_notes?: string | null
  } | null
  patient?: { first_name: string; last_name: string }
  sample_type?: { name: string }
  service_request_detail?: {
    medical_service?: { name?: string }
  }
}

interface SampleType {
  id: number
  name: string
}

interface PaginatedSamples {
  data: Sample[]
  current_page: number
  per_page: number
  total: number
  last_page: number
  from: number
  to: number
  links: Array<{ url: string | null; label: string; active: boolean }>
}

interface SamplesIndexProps {
  samples: PaginatedSamples
  sampleTypes: SampleType[]
}

const getStatusConfig = (status: string) => {
  if (status === 'pending_collection' || status === 'pending') {
    return { label: 'Pendiente Toma', className: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300' }
  }
  if (status === 'collected') {
    return { label: 'Tomada', className: 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300' }
  }
  if (status === 'received') {
    return { label: 'Recibida', className: 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300' }
  }
  if (status === 'processing' || status === 'in_analysis') {
    return { label: 'En análisis', className: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' }
  }
  if (status === 'pending_validation') {
    return { label: 'Pendiente Validación', className: 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300' }
  }
  if (status === 'validated') {
    return { label: 'Validada', className: 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300' }
  }
  if (status === 'reported') {
    return { label: 'Informada', className: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300' }
  }
  if (status === 'completed') {
    return { label: 'Completada', className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' }
  }
  if (status === 'cancelled') {
    return { label: 'Cancelada', className: 'bg-slate-50 text-slate-700 dark:bg-slate-900 dark:text-slate-300' }
  }
  if (status === 'rejected') {
    return { label: 'Rechazada', className: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300' }
  }
  return { label: status, className: 'bg-gray-50 text-gray-700 dark:bg-gray-900 dark:text-gray-300' }
}

const getSampleConditionRisk = (sampleCondition?: string | null) => {
  const value = (sampleCondition || '').trim().toLowerCase()

  if (!value || value === 'adecuada') {
    return null
  }

  if (['hemolizada', 'coagulada', 'insuficiente', 'contaminada'].includes(value)) {
    return {
      title: 'Condicion de muestra observada',
      description: `La muestra fue registrada como "${sampleCondition}". Revise si corresponde confirmar la recepcion o rechazarla.`,
      className: 'border-amber-300 bg-amber-50 text-amber-900',
    }
  }

  return {
    title: 'Revision recomendada',
    description: `La condicion registrada es "${sampleCondition}". Verifique si la muestra puede continuar en el flujo.`,
    className: 'border-slate-300 bg-slate-50 text-slate-800',
  }
}

export default function SamplesIndex({ samples, sampleTypes }: SamplesIndexProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editSample, setEditSample] = useState<Sample | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleteSample, setDeleteSample] = useState<Sample | null>(null)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectSample, setRejectSample] = useState<Sample | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectObservation, setRejectObservation] = useState('')
  const [receiveModalOpen, setReceiveModalOpen] = useState(false)
  const [receiveSample, setReceiveSample] = useState<Sample | null>(null)
  const [receiveAlertOpen, setReceiveAlertOpen] = useState(false)
  const [rejectAlertOpen, setRejectAlertOpen] = useState(false)
  const [pendingRejectSample, setPendingRejectSample] = useState<Sample | null>(null)

  const receiveConditionRisk = getSampleConditionRisk(receiveSample?.latest_collection?.sample_condition)

  const { destroy, loading } = useLabSamples()

  const handleCreate = () => {
    router.visit('/medical/reception')
  }

  // const handleEdit = (sample: Sample) => {
  //   setEditSample(sample)
  //   setModalOpen(true)
  // }

  const handleClose = () => {
    setModalOpen(false)
    setEditSample(null)
  }

  const handleDelete = (sample: Sample) => {
    setDeleteSample(sample)
    setConfirmOpen(true)
  }

  const handleReceive = (sample: Sample) => {
    setReceiveSample(sample)
    setReceiveModalOpen(true)
  }

  const handleConfirmReceive = () => {
    if (!receiveSample) return

    router.post(`/medical/laboratory/samples/${receiveSample.id}/receive`, {}, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success('Muestra recibida correctamente')
        setReceiveModalOpen(false)
        setReceiveSample(null)
      },
    })
  }

  const handleRequestReceiveConfirmation = () => {
    if (!receiveSample) return
    setReceiveAlertOpen(true)
  }

  const handleRequestReject = (sample: Sample) => {
    setPendingRejectSample(sample)
    setRejectAlertOpen(true)
  }

  const handleConfirmRejectAlert = () => {
    if (!pendingRejectSample) return

    setRejectAlertOpen(false)
    handleReject(pendingRejectSample)
    setPendingRejectSample(null)
  }

  const handleReject = (sample: Sample) => {
    setReceiveModalOpen(false)
    setReceiveSample(null)
    setRejectSample(sample)
    setRejectReason('')
    setRejectObservation('')
    setRejectModalOpen(true)
  }

  const handleSubmitReject = () => {
    if (!rejectSample || !rejectReason || !rejectObservation.trim()) {
      toast.error('Seleccione un motivo y complete la observación')
      return
    }

    const remarks = `${rejectReason}. ${rejectObservation.trim()}`

    router.post(`/medical/laboratory/samples/${rejectSample.id}/reject`, {
      remarks,
    }, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success('Muestra rechazada correctamente')
        setRejectModalOpen(false)
        setRejectSample(null)
      },
    })
  }

  const handleConfirmDelete = () => {
    if (deleteSample) {
      destroy(deleteSample.id, () => {
        toast.success('Muestra eliminada correctamente')
      })
    }

    setDeleteSample(null)
    setConfirmOpen(false)
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

  const columns: ColumnDef<Sample>[] = [
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
        return (
          <span className="font-medium">
            {patient ? `${patient.first_name} ${patient.last_name}` : 'N/A'}
          </span>
        )
      },
    },
    {
      accessorKey: 'requested_study',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Estudio" />,
      cell: ({ row }) => (
        <span>{row.original.service_request_detail?.medical_service?.name || 'N/A'}</span>
      ),
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
        return <Badge className={config.className}>{config.label}</Badge>
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
      header: () => <span className="sr-only">Acciones</span>,
      cell: ({ row }) => {
        const sample = row.original
       // const canEditSample = ['pending_collection', 'collected'].includes(sample.status)

        const primaryAction = (() => {
          if (sample.status === 'pending_collection') {
            return (
              <Button asChild size="sm" className="h-8 bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400">
                <Link href={`/medical/laboratory/samples/${sample.id}/collect`}>
                  Tomar muestra
                </Link>
              </Button>
            )
          }
          if (sample.status === 'collected') {
            return (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleReceive(sample)}
                className="h-8 border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-900/20 dark:text-emerald-200 dark:hover:bg-emerald-900/40"
              >
                Recibir
              </Button>
            )
          }
          if (sample.status === 'received') {
            return (
              <Button asChild size="sm" variant="outline" className="h-8 border-emerald-500 bg-white text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-400 dark:bg-emerald-950 dark:text-emerald-200 dark:hover:bg-emerald-900/40">
                <Link href={`/medical/laboratory/samples/${sample.id}/start-analysis`}>
                  Iniciar análisis
                </Link>
              </Button>
            )
          }
          if (['in_analysis', 'pending_validation'].includes(sample.status)) {
            return (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => router.post(`/medical/laboratory/samples/${sample.id}/start-analysis`)}
                className="h-8 bg-emerald-100 text-emerald-900 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-100 dark:hover:bg-emerald-800/40"
              >
                Continuar análisis
              </Button>
            )
          }
          return null
        })()

        return (
          <div className="flex items-center justify-end gap-2">
            {primaryAction}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <span className="sr-only">Abrir menú</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {sample.status === 'collected' && (
                  <DropdownMenuItem asChild>
                    <Link href={`/medical/laboratory/samples/${sample.id}/collect`}>Editar muestra</Link>
                  </DropdownMenuItem>
                )}
               
                {sample.status === 'collected' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleReject(sample)}
                      className="text-amber-600 focus:text-amber-600"
                    >
                      Rechazar
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleDelete(sample)}
                  className="text-destructive focus:text-destructive"
                >
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]

  const breadcrumbs = [
    { href: '/medical', title: 'Sistema Médico' },
    { href: '/medical/laboratory', title: 'Laboratorio' },
    { href: '/medical/laboratory/samples', title: 'Muestras', current: true },
  ]

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Muestras de Laboratorio" />

      <div className="p-4 md:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Muestras de Laboratorio</h1>
            <p className="mt-1 text-sm text-gray-500">
              Recepción y seguimiento de solicitudes de laboratorio
            </p>
          </div>

          <div className="flex space-x-3 mt-4 sm:mt-0">
            <button
              onClick={() => router.reload({ only: ['samples'] })}
              disabled={loading}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>

            <button
              onClick={handleCreate}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Recibir Solicitud
            </button>
          </div>
        </div>

        <div className="rounded-xl border bg-white dark:bg-emerald-950 border-slate-200 dark:border-emerald-900/60 shadow-sm">
          <div className="px-6 pt-6 pb-2">
            <h3 className="text-lg leading-6 font-semibold text-black dark:text-white">
              Muestras Registradas
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Búsqueda, filtros y paginación de muestras de laboratorio
            </p>
          </div>
          <div className="px-6 pb-6">
            <DataTable
              columns={columns}
              data={samples}
              searchable={true}
              searchPlaceholder="Buscar por número de muestra o barcode..."
              emptyMessage="No hay muestras registradas."
              loading={loading}
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

      <Modal open={modalOpen} onClose={handleClose}>
        <SampleForm
          sample={editSample ? { ...editSample, collected_at: editSample.collected_at ?? '' } : null}
          sampleTypes={sampleTypes}
          onSuccess={() => {
            handleClose()
            toast.success(editSample ? 'Muestra actualizada' : 'Muestra creada')
          }}
        />
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => {
          setConfirmOpen(false)
          setDeleteSample(null)
        }}
        onConfirm={handleConfirmDelete}
        title="¿Eliminar muestra?"
        description={deleteSample ? `¿Seguro que deseas eliminar la muestra #${deleteSample.sample_number}?` : ''}
      />

      <Modal
        open={receiveModalOpen}
        onClose={() => {
          setReceiveModalOpen(false)
          setReceiveSample(null)
        }}
        contentClassName="w-[96vw] max-w-4xl p-0"
      >
        <div className="p-6 space-y-5 sm:p-8">
          <h3 className="pr-8 text-lg font-semibold text-gray-900 dark:text-white">Confirmar recepción de muestra</h3>
          <p className="max-w-2xl text-sm text-gray-500">
            Revise los datos de extracción antes de marcar la muestra como recibida en laboratorio.
          </p>

          {receiveConditionRisk && (
            <div className={`rounded-lg border px-4 py-3 ${receiveConditionRisk.className}`}>
              <p className="text-sm font-semibold">{receiveConditionRisk.title}</p>
              <p className="mt-1 text-sm">{receiveConditionRisk.description}</p>
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-xl border bg-slate-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/30">
              <h4 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">Datos del paciente</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border bg-white px-3 py-2 dark:border-emerald-900/60 dark:bg-emerald-950">
                  <p className="text-xs text-gray-500">Muestra</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{receiveSample?.sample_number || 'N/A'}</p>
                </div>
                <div className="rounded-lg border bg-white px-3 py-2 dark:border-emerald-900/60 dark:bg-emerald-950">
                  <p className="text-xs text-gray-500">Código de barras</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{receiveSample?.barcode || 'N/A'}</p>
                </div>
                <div className="rounded-lg border bg-white px-3 py-2 sm:col-span-2 dark:border-emerald-900/60 dark:bg-emerald-950">
                  <p className="text-xs text-gray-500">Paciente</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{receiveSample?.patient ? `${receiveSample.patient.first_name} ${receiveSample.patient.last_name}` : 'N/A'}</p>
                </div>
                <div className="rounded-lg border bg-white px-3 py-2 sm:col-span-2 dark:border-emerald-900/60 dark:bg-emerald-950">
                  <p className="text-xs text-gray-500">Estudio</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{receiveSample?.service_request_detail?.medical_service?.name || 'N/A'}</p>
                </div>
                <div className="rounded-lg border bg-white px-3 py-2 sm:col-span-2 dark:border-emerald-900/60 dark:bg-emerald-950">
                  <p className="text-xs text-gray-500">Tipo de muestra</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{receiveSample?.sample_type?.name || 'N/A'}</p>
                </div>
              </div>
            </section>

            <section className="rounded-xl border bg-slate-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/30">
              <h4 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">Datos de extracción</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border bg-white px-3 py-2 sm:col-span-2 dark:border-emerald-900/60 dark:bg-emerald-950">
                  <p className="text-xs text-gray-500">Fecha y hora de extracción</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{formatCollectedAt(receiveSample?.latest_collection?.collected_at || receiveSample?.collected_at)}</p>
                </div>
                <div className="rounded-lg border bg-white px-3 py-2 dark:border-emerald-900/60 dark:bg-emerald-950">
                  <p className="text-xs text-gray-500">Contenedor utilizado</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{receiveSample?.latest_collection?.container_type || 'N/A'}</p>
                </div>
                <div className="rounded-lg border bg-white px-3 py-2 dark:border-emerald-900/60 dark:bg-emerald-950">
                  <p className="text-xs text-gray-500">Volumen</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{receiveSample?.latest_collection?.volume != null ? `${receiveSample.latest_collection.volume} ${receiveSample.latest_collection.volume_unit || ''}`.trim() : 'N/A'}</p>
                </div>
                <div className="rounded-lg border bg-white px-3 py-2 dark:border-emerald-900/60 dark:bg-emerald-950">
                  <p className="text-xs text-gray-500">Estado de la muestra</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{receiveSample?.latest_collection?.sample_condition || 'N/A'}</p>
                </div>
                <div className="rounded-lg border bg-white px-3 py-2 dark:border-emerald-900/60 dark:bg-emerald-950">
                  <p className="text-xs text-gray-500">Sitio de colección</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{receiveSample?.latest_collection?.collection_site || 'N/A'}</p>
                </div>
                <div className="rounded-lg border bg-white px-3 py-2 sm:col-span-2 dark:border-emerald-900/60 dark:bg-emerald-950">
                  <p className="text-xs text-gray-500">Observaciones</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{receiveSample?.latest_collection?.collection_notes || 'Sin observaciones'}</p>
                </div>
              </div>
            </section>
          </div>

          <div className="flex flex-col gap-4 border-t border-slate-200 pt-5 lg:flex-row lg:items-center lg:justify-between">
            <p className="max-w-xl text-xs leading-5 text-slate-500">
              Confirmar recepción continúa el flujo. Rechazar abre el registro formal de rechazo.
            </p>

            <div className="flex flex-1 flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setReceiveModalOpen(false)
                  setReceiveSample(null)
                }}
                className="min-w-35 flex-1 sm:flex-none"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => receiveSample && handleRequestReject(receiveSample)}
                className={`min-w-45 flex-1 sm:flex-none ${
                  receiveConditionRisk
                    ? 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800'
                    : 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800'
                }`}
              >
                {receiveConditionRisk ? 'Sugerido: rechazar muestra' : 'Rechazar muestra'}
              </Button>
              <Button
                type="button"
                onClick={handleRequestReceiveConfirmation}
                className="min-w-45 flex-1 bg-emerald-600 hover:bg-emerald-700 sm:flex-none"
              >
                Confirmar recepción
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={rejectModalOpen}
        onClose={() => {
          setRejectModalOpen(false)
          setRejectSample(null)
        }}
      >
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Rechazar Muestra</h3>
          <p className="text-sm text-gray-500">
            Complete motivo y observación para registrar el rechazo de la muestra {rejectSample?.sample_number}. Paciente: {rejectSample?.patient ? `${rejectSample.patient.first_name} ${rejectSample.patient.last_name}` : 'N/A'}. Estudio: {rejectSample?.service_request_detail?.medical_service?.name || 'N/A'}.
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
                setRejectSample(null)
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmitReject}
              className="px-4 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700"
            >
              Confirmar rechazo
            </button>
          </div>
        </div>
      </Modal>

      <AlertDialog open={rejectAlertOpen} onOpenChange={(open) => {
        setRejectAlertOpen(open)
        if (!open) setPendingRejectSample(null)
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar cambio a rechazo?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingRejectSample
                ? `La muestra ${pendingRejectSample.sample_number} saldrá del flujo de recepción y pasará al formulario de rechazo para registrar motivo y observación.`
                : 'Se abrirá el formulario de rechazo para completar la incidencia.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRejectAlert}>
              Sí, continuar con rechazo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={receiveAlertOpen} onOpenChange={setReceiveAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar recepción?</AlertDialogTitle>
            <AlertDialogDescription>
              {receiveSample
                ? `La muestra ${receiveSample.sample_number} se marcará como recibida en laboratorio y podrá continuar al análisis.`
                : 'Se confirmará la recepción de la muestra.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmReceive}>
              Sí, confirmar recepción
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  )
}
