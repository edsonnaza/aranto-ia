import { Head, router } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'
import { useReception, useReceptionPaymentNotifications, useReceptionStats, useProfessionals } from '@/hooks/medical'
import type { ReceptionStats } from '@/hooks/medical'
import { useDateFormat } from '@/hooks/useDateFormat'
import { DataTable, DataTableColumnHeader } from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ColumnDef } from '@tanstack/react-table'
import { Link } from '@inertiajs/react'
import { useState } from 'react'
import ServiceRequestDetailsModal from '@/components/medical/ServiceRequestDetailsModal'
import SearchableInput from '@/components/ui/SearchableInput'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import {  getPaymentStatusBadgeConfig, getReceptionTypeBadgeConfig, getQueueStatusLabel } from '@/utils/formatters'
import { toast } from 'sonner'
 
// Simple SVG Icons
const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const DocumentTextIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

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

const EyeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
)

const TransferIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h10M7 7l3-3m-3 3l3 3M17 17H7m10 0l-3-3m3 3l-3 3" />
  </svg>
)

interface ReceptionIndexProps {
  stats: ReceptionStats
  // paginated server-side data
  requests: PaginatedRequests
  filters?: {
    date_from?: string
    date_to?: string
  }
}

type RequestRow = {
  id: number
  request_number: string
  patient_name: string
  patient_document: string
  status: string
  priority: string
  reception_type: string
  services_count: number
  total_amount: number
  paid_amount?: number
  request_date: string
  created_at: string
  insurance_type_name?: string
  payment_status?: string
  professional_names?: string
  primary_professional_id?: number
  primary_professional_name?: string
  is_queued?: boolean
  queue_id?: number
  queue_doctor_id?: number
  queue_doctor_name?: string
  queue_status?: string
  queue_priority?: string
}

interface PaginatedRequests {
  data: RequestRow[]
  current_page: number
  per_page: number
  total: number
  last_page: number
  from: number
  to: number
  links: Array<{ url: string | null; label: string; active: boolean }>
}

export default function ReceptionIndex({  requests, filters }: ReceptionIndexProps) {
  const { 
    loading, 
    error, 
    navigateToCreateServiceRequest, 
    refreshCurrentPage 
  } = useReception()
  
  const { toBackend, toFrontend } = useDateFormat()

  // Date filters state - initialize from props (backend format) or URL params
  const [dateFrom, setDateFrom] = useState(() => {
    if (filters?.date_from) {
      return toFrontend(filters.date_from)
    }
    const params = new URLSearchParams(window.location.search)
    const fromParam = params.get('date_from')
    if (fromParam) return toFrontend(fromParam)
    // Default to today in frontend format
    const today = new Date()
    return toFrontend(today.toISOString().split('T')[0])
  })
  
  const [dateTo, setDateTo] = useState(() => {
    if (filters?.date_to) {
      return toFrontend(filters.date_to)
    }
    const params = new URLSearchParams(window.location.search)
    const toParam = params.get('date_to')
    if (toParam) return toFrontend(toParam)
    // Default to today in frontend format
    const today = new Date()
    return toFrontend(today.toISOString().split('T')[0])
  })

  // Fetch dynamic stats from API with date filters
  // Convert frontend format (dd-mm-yyyy) to backend format (yyyy-mm-dd) for API
  const { stats: dynamicStats, loading: statsLoading, refresh: refreshStats } = useReceptionStats(
    dateFrom ? toBackend(dateFrom) : undefined, 
    dateTo ? toBackend(dateTo) : undefined
  )

  useReceptionPaymentNotifications((event) => {
    const patientName = event.service_request.patient_name
    const notificationMessage = patientName
      ? `${event.message} · ${patientName}`
      : event.message

    if (event.service_request.payment_status === 'paid') {
      toast.success(notificationMessage)
    } else {
      toast.info(notificationMessage)
    }

    router.reload({
      only: ['requests'],
      preserveUrl: true,
    })

    void refreshStats()
  })

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null)

  const handleDateRangeChange = ({ from, to }: { from: string | null; to: string | null }) => {
    // Update local state for stats to respond immediately
    if (from) setDateFrom(from)
    if (to) setDateTo(to)
    
    // Update URL for server-side filtering
    const params = new URLSearchParams(window.location.search)
    if (from) params.set('date_from', toBackend(from))
    else params.delete('date_from')
    if (to) params.set('date_to', toBackend(to))
    else params.delete('date_to')
    params.set('page', '1')
    const url = window.location.pathname + '?' + params.toString()
    router.get(url, {}, { preserveState: true, replace: true })
  }

  const handleViewDetails = (requestId: number) => {
    setSelectedRequestId(requestId)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedRequestId(null)
  }

  const handleCancelRequest = () => {
    // Refresh the page to show updated data
    refreshCurrentPage()
  }

  // Professionals list for quick send-to-consultorio from reception
  const { professionals} = useProfessionals()

  const [openSendFor, setOpenSendFor] = useState<number | null>(null)
  const [selectedDoctor, setSelectedDoctor] = useState<number | null>(null)
  const [selectedDoctorLabel, setSelectedDoctorLabel] = useState<string>('')
  const [selectedPriority, setSelectedPriority] = useState<string>('normal')
  const [sendingToConsultorio, setSendingToConsultorio] = useState(false)
  const [confirmSendOpen, setConfirmSendOpen] = useState(false)

  const sendToConsultorio = (requestId: number) => {
    if (!selectedDoctor) {
      toast.error('Selecciona un profesional para enviar a consultorio.')
      return
    }

    setSendingToConsultorio(true)
    router.post(`/medical/reception/service-requests/${requestId}/send-to-consultorio`, {
      doctor_id: selectedDoctor,
      priority: selectedPriority,
    }, {
      preserveState: true,
      onSuccess: () => {
        toast.success('Paciente enviado a la cola de consultorio.')
        setOpenSendFor(null)
        setSelectedDoctor(null)
        refreshCurrentPage()
      },
      onError: () => {
        toast.error('Error al enviar a consultorio.')
      },
      onFinish: () => setSendingToConsultorio(false),
    })
  }

  const searchProfessionalsForSend = async (query: string, currentProfessionalId?: number) => {
    const normalized = query.trim().toLowerCase()
    return professionals
      .filter((p) => p.id !== currentProfessionalId)
      .filter((p) => {
        if (!normalized) return true
        return p.full_name.toLowerCase().includes(normalized)
      })
      .slice(0, 15)
      .map((p) => ({ id: p.id, label: p.full_name, subtitle: `ID: ${p.id}` }))
  }

  // Define columns for DataTable (service requests table)
  const columns: ColumnDef<RequestRow>[] = [
    {
      accessorKey: 'request_number',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Número" />
      ),
      cell: ({ row }) => (
        <Link 
          href={`/medical/service-requests/${row.original.id}`}
          className="font-mono text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          {row.getValue('request_number')}
        </Link>
      ),
    },
    {
      accessorKey: 'patient_name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Paciente" />
      ),
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.getValue('patient_name')}</div>
          <div className="text-sm text-gray-500">{row.original.patient_document}</div>
        </div>
      ),
    },
    {
      accessorKey: 'professional_names',
      header: 'Profesional',
      cell: ({ row }) => (
        <span className="text-sm">
          {row.getValue('professional_names') || 'No asignado'}
        </span>
      ),
    },
    {
      accessorKey: 'reception_type',
      header: 'Tipo de Servicio',
      cell: ({ row }) => {
        const config = getReceptionTypeBadgeConfig(row.getValue('reception_type') as string)
        return <Badge variant={config.variant}>{config.label}</Badge>
      },
    },
    {
      accessorKey: 'services_count',
      header: 'Servicios',
      cell: ({ row }) => (
        <span className="text-sm">
          {row.getValue('services_count')} servicio{row.getValue('services_count') !== 1 ? 's' : ''}
        </span>
      ),
    },
    {
      accessorKey: 'insurance_type_name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Seguro" />
      ),
      cell: ({ row }) => (
        <span className="text-sm">
          {row.getValue('insurance_type_name') || 'Sin seguro'}
        </span>
      ),
    },
    {
      accessorKey: 'payment_status',
      header: 'Estado Pago',
      cell: ({ row }) => {
        const config = getPaymentStatusBadgeConfig(row.getValue('payment_status') as string || 'pending')
        return <Badge variant={config.variant}>₲ {config.label}</Badge>
      },
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Fecha y Hora" />
      ),
      cell: ({ row }) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">
            {row.original.request_date}
          </div>
          <div className="text-gray-500">
            {row.getValue('created_at')}
          </div>
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <Link
            href={`/medical/service-requests/${row.original.id}`}
            className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            title="Ir a solicitud para transferir profesional"
          >
            <TransferIcon className="h-4 w-4" />
          </Link>
          <button
            onClick={() => handleViewDetails(row.original.id)}
            className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
            title="Ver detalles"
          >
            <EyeIcon className="h-4 w-4" />
          </button>

          {/* Enviar a consultorio - abre modal con búsqueda y confirmación */}
          <div className="relative">
            <button
              onClick={() => {
                if (openSendFor === row.original.id) {
                  setOpenSendFor(null)
                  setSelectedDoctor(null)
                  setSelectedDoctorLabel('')
                  setSelectedPriority('normal')
                } else {
                  setOpenSendFor(row.original.id)
                  // Prefer existing queue doctor if already enqueued, otherwise primary assigned professional
                  const preId = row.original.queue_doctor_id ?? row.original.primary_professional_id ?? null
                  setSelectedDoctor(preId)
                  const pre = professionals.find((p) => p.id === preId)
                  setSelectedDoctorLabel(pre ? pre.full_name : '')
                  setSelectedPriority(row.original.queue_priority ?? row.original.priority ?? 'normal')
                }
              }}
              className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              title="Enviar a consultorio"
            >
              <TransferIcon className="h-4 w-4" />
            </button>

            <Dialog open={openSendFor === row.original.id} onOpenChange={(open) => (!open ? setOpenSendFor(null) : null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Enviar a consultorio</DialogTitle>
                  <DialogDescription>Confirmá el profesional y la prioridad para enviar al paciente a la cola de consultorio.</DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <p className="text-sm text-gray-600">Solicitud: <span className="font-medium">{row.original.request_number}</span></p>
                  <p className="text-sm text-gray-600">Paciente: <span className="font-medium">{row.original.patient_name}</span></p>
                  <p className="text-sm text-gray-600">Profesional asignado: <span className="font-medium">{row.original.primary_professional_name ?? 'No asignado'}</span></p>
                  {row.original.is_queued && (
                    <p className="text-sm text-blue-600">Paciente ya en cola: <span className="font-medium">{row.original.queue_doctor_name || '—'}</span> · Estado: <span className="font-medium">{getQueueStatusLabel(row.original.queue_status || '')}</span></p>
                  )}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Profesional</label>
                    <SearchableInput
                      placeholder="Buscar profesional..."
                      value={selectedDoctorLabel}
                      onSearch={(q) => searchProfessionalsForSend(q, row.original.primary_professional_id)}
                      onSelect={(item) => {
                        setSelectedDoctor(item.id)
                        setSelectedDoctorLabel(item.label)
                      }}
                      minSearchLength={0}
                      maxResults={12}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Prioridad</label>
                    <select
                      value={selectedPriority}
                      onChange={(e) => setSelectedPriority(e.target.value)}
                      className="w-full border rounded px-2 py-1 text-sm"
                    >
                      <option value="normal">Normal</option>
                      <option value="urgent">Urgente</option>
                    </select>
                  </div>
                </div>

                <DialogFooter>
                  <button
                    type="button"
                    onClick={() => { setOpenSendFor(null); setSelectedDoctor(null); setSelectedDoctorLabel('') }}
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmSendOpen(true)}
                    disabled={sendingToConsultorio || !selectedDoctor}
                    className="rounded-md bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                  >
                    {row.original.is_queued ? 'Actualizar' : 'Continuar'}
                  </button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <AlertDialog open={confirmSendOpen} onOpenChange={setConfirmSendOpen}>
                <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{row.original.is_queued ? 'Confirmar actualización' : 'Confirmar envío a consultorio'}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {row.original.is_queued
                      ? `Se actualizará la entrada en la cola para ${row.original.patient_name} con el profesional seleccionado.`
                      : `Se enviará al paciente ${row.original.patient_name} a la cola del profesional seleccionado.`}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={sendingToConsultorio}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction disabled={sendingToConsultorio} onClick={() => sendToConsultorio(row.original.id)}>
                    {row.original.is_queued ? 'Confirmar actualización' : 'Confirmar envío'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      ),
    },
  ]

  const breadcrumbs = [
    { href: '/medical', title: 'Sistema Médico' },
    { href: '/medical/reception', title: 'Recepción', current: true }
  ]

  // Stats cards estilo dashboard neutro
  const statsCards = [
    {
      title: 'Total Solicitudes',
      value: dynamicStats?.total_requests ?? 0,
      icon: DocumentTextIcon
    },
    {
      title: 'Sin Pagar',
      value: dynamicStats?.total_pending_count ?? 0,
      icon: ClockIcon
    },
    {
      title: 'Pagadas',
      value: dynamicStats?.total_paid_count ?? 0,
      icon: DocumentTextIcon
    }
  ]

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Recepción - Dashboard" />
      
      <div className="p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard de Recepción</h1>
            <p className="mt-1 text-sm text-gray-500">
              Gestión de solicitudes de servicio y atención de pacientes
            </p>
          </div>
          
          <div className="flex space-x-3 mt-4 sm:mt-0">
            <button
              onClick={refreshCurrentPage}
              disabled={loading || statsLoading}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <RefreshIcon className={`h-4 w-4 mr-2 ${loading || statsLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
            
            <button
              onClick={navigateToCreateServiceRequest}
              disabled={loading || statsLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Nueva Solicitud
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {statsCards.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Requests Data Table */}
        <div className="rounded-xl border bg-white dark:bg-emerald-950 border-slate-200 dark:border-emerald-900/60 shadow-sm">
          <div className="px-6 pt-6 pb-2">
            <h3 className="text-lg leading-6 font-semibold text-black dark:text-white">
              Solicitudes Recientes (Últimos 7 días)
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Todas las solicitudes de servicios con paginación y búsqueda
            </p>
          </div>
          <div className="px-6 pb-6">
            <DataTable
              columns={columns}
              data={requests}
              searchable={true}
              searchPlaceholder="Buscar por número, paciente o documento..."
              emptyMessage="No hay solicitudes registradas hoy."
              loading={loading}
              dateRangeFilterable={true}
              initialDateFrom={dateFrom}
              initialDateTo={dateTo}
              onDateRangeChange={handleDateRangeChange}
            />
          </div>
        </div>

        {/* Service Request Details Modal */}
        <ServiceRequestDetailsModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          requestId={selectedRequestId}
          onCancelRequest={handleCancelRequest}
        />
      </div>
    </AppLayout>
  )
}