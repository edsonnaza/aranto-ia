import { Head, router } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'
import { useReception, useReceptionStats } from '@/hooks/medical'
import type { ReceptionStats } from '@/hooks/medical'
import { useDateFormat } from '@/hooks/useDateFormat'
import { DataTable, DataTableColumnHeader } from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge'
import { ColumnDef } from '@tanstack/react-table'
import { Link } from '@inertiajs/react'
import { useState } from 'react'
import ServiceRequestDetailsModal from '@/components/medical/ServiceRequestDetailsModal'
import {  getPaymentStatusBadgeConfig, getReceptionTypeBadgeConfig } from '@/utils/formatters'
//import { useCurrencyFormatter } from '@/stores/currency'

// interface ReceptionStats {
//   pending_requests: number
//   confirmed_requests: number
//   completed_requests: number
//   total_revenue: number
// }

// interface RecentRequest {
//   id: number
//   request_number: string
//   patient_name: string
//   status: string
//   created_at: string
// }

// interface ReceptionIndexProps {
//   stats: ReceptionStats
//   recentRequests: RecentRequest[]
// }

// export default function ReceptionIndex({ stats, recentRequests }: ReceptionIndexProps) {
//   const breadcrumbs = [
//     { href: '/medical', title: 'Sistema Médico' },
//     { href: '/medical/reception', title: 'Recepción', current: true }
//   ]

//   return (
//     <AppLayout breadcrumbs={breadcrumbs}>
//       <Head title="Recepción - Dashboard" />
      
//       <div className="p-4 md:p-6">
//         <div>
//           <h1 className="text-2xl font-semibold text-gray-900">Dashboard de Recepción</h1>
//           <p className="mt-1 text-sm text-gray-500">
//             Gestión de solicitudes de servicios médicos y recepción de pacientes
//           </p>
//         </div>

//         <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//           <div className="bg-white rounded-lg shadow p-6">
//             <h3 className="text-sm font-medium text-gray-500">Solicitudes Pendientes</h3>
//             <p className="text-2xl font-bold text-gray-900">{stats.pending_requests}</p>
//           </div>
          
//           <div className="bg-white rounded-lg shadow p-6">
//             <h3 className="text-sm font-medium text-gray-500">Confirmadas Hoy</h3>
//             <p className="text-2xl font-bold text-gray-900">{stats.confirmed_requests}</p>
//           </div>
          
//           <div className="bg-white rounded-lg shadow p-6">
//             <h3 className="text-sm font-medium text-gray-500">Completadas</h3>
//             <p className="text-2xl font-bold text-gray-900">{stats.completed_requests}</p>
//           </div>
          
//           <div className="bg-white rounded-lg shadow p-6">
//             <h3 className="text-sm font-medium text-gray-500">Ingresos del Día</h3>
//             <p className="text-2xl font-bold text-gray-900">
//               ₲ {stats.total_revenue?.toLocaleString('es-PY') || '0'}
//             </p>
//           </div>
//         </div>

//         <div className="mt-8 bg-white rounded-lg shadow">
//           <div className="p-6">
//             <h2 className="text-lg font-medium text-gray-900 mb-4">Solicitudes Recientes</h2>
//             {recentRequests?.length > 0 ? (
//               <div className="space-y-3">
//                 {recentRequests.map((request) => (
//                   <div key={request.id} className="flex items-center justify-between p-3 border border-gray-200 rounded">
//                     <div>
//                       <p className="font-medium text-gray-900">#{request.request_number}</p>
//                       <p className="text-sm text-gray-500">{request.patient_name}</p>
//                     </div>
//                     <div>
//                       <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
//                         {request.status}
//                       </span>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             ) : (
//               <p className="text-gray-500 text-center py-4">No hay solicitudes recientes</p>
//             )}
//           </div>
//         </div>
//       </div>
//     </AppLayout>
//   )
// }


// Simple SVG Icons
const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

// const CalendarIcon = ({ className }: { className?: string }) => (
//   <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
//     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
//   </svg>
// )

// const UserGroupIcon = ({ className }: { className?: string }) => (
//   <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
//     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
//   </svg>
// )

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
  const { stats: dynamicStats, loading: statsLoading } = useReceptionStats(
    dateFrom ? toBackend(dateFrom) : undefined, 
    dateTo ? toBackend(dateTo) : undefined
  )

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
        <div className="flex space-x-2">
          <button
            onClick={() => handleViewDetails(row.original.id)}
            className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            title="Ver detalles"
          >
            <EyeIcon className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  const breadcrumbs = [
    { href: '/medical', title: 'Sistema Médico' },
    { href: '/medical/reception', title: 'Recepción', current: true }
  ]

  // Stats cards with dynamic data
  const statsCards = [
    {
      title: 'Total Solicitudes',
      value: dynamicStats?.total_requests ?? 0,
      icon: DocumentTextIcon,
      color: 'bg-blue-500',
      textColor: 'text-blue-700',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Sin Pagar',
      value: dynamicStats?.total_pending_count ?? 0,
      icon: ClockIcon,
      color: 'bg-orange-500',
      textColor: 'text-orange-700',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Pagadas',
      value: dynamicStats?.total_paid_count ?? 0,
      icon: DocumentTextIcon,
      color: 'bg-green-500',
      textColor: 'text-green-700',
      bgColor: 'bg-green-50'
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
              <div key={index} className={`${stat.bgColor} overflow-hidden shadow rounded-lg`}>
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="shrink-0">
                      <Icon className={`h-6 w-6 ${stat.textColor}`} />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          {stat.title}
                        </dt>
                        <dd>
                          <div className="text-lg font-medium text-gray-900">
                            {stat.value}
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Requests Data Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Solicitudes Recientes (Últimos 7 días)
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Todas las solicitudes de servicios con paginación y búsqueda
            </p>
          </div>
          
          <div className="px-4 pb-5">
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