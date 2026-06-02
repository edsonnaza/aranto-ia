import { Head, Link, router } from '@inertiajs/react'
import { useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import AppLayout from '@/layouts/app-layout'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { DataTable, DataTableColumnHeader } from '@/components/ui/data-table'
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
  collected_at: string
  patient?: { first_name: string; last_name: string }
  sample_type?: { name: string }
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
  if (status === 'received') return { label: 'Recibida', className: 'bg-green-100 text-green-800' }
  if (status === 'in_analysis') return { label: 'En análisis', className: 'bg-blue-100 text-blue-800' }
  if (status === 'completed') return { label: 'Completada', className: 'bg-emerald-100 text-emerald-800' }
  if (status === 'rejected') return { label: 'Rechazada', className: 'bg-red-100 text-red-800' }
  return { label: status, className: 'bg-gray-100 text-gray-800' }
}

export default function SamplesIndex({ samples, sampleTypes }: SamplesIndexProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editSample, setEditSample] = useState<Sample | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleteSample, setDeleteSample] = useState<Sample | null>(null)

  const { destroy, loading } = useLabSamples()

  const handleCreate = () => {
    router.visit('/medical/laboratory/create')
  }

  const handleEdit = (sample: Sample) => {
    setEditSample(sample)
    setModalOpen(true)
  }

  const handleClose = () => {
    setModalOpen(false)
    setEditSample(null)
  }

  const handleDelete = (sample: Sample) => {
    setDeleteSample(sample)
    setConfirmOpen(true)
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
      accessorKey: 'sample_type',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tipo" />,
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
        <span className="text-sm">
          {new Date(row.original.collected_at).toLocaleString('es-ES', {
            dateStyle: 'short',
            timeStyle: 'short',
          })}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="text-right">
          <button
            onClick={() => handleEdit(row.original)}
            className="text-emerald-600 dark:text-emerald-400 hover:underline mr-2"
          >
            Editar
          </button>
          <button
            onClick={() => handleDelete(row.original)}
            className="text-red-600 dark:text-red-400 hover:underline"
          >
            Eliminar
          </button>
        </div>
      ),
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
                { value: 'received', label: 'Recibida' },
                { value: 'in_analysis', label: 'En análisis' },
                { value: 'completed', label: 'Completada' },
                { value: 'rejected', label: 'Rechazada' },
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
          sample={editSample}
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
    </AppLayout>
  )
}
