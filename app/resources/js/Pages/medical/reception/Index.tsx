import { Head } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'
import { useReception } from '@/hooks/medical'
import type { ReceptionStats, RecentRequest } from '@/hooks/medical'
import { DataTable, DataTableColumnHeader } from '@/components/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { Link } from '@inertiajs/react'

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

const CalendarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const UserGroupIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
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

interface ReceptionIndexProps {
  stats: ReceptionStats
  recentRequests: RecentRequest[]
  // paginated server-side data
  requests: PaginatedRequests
}

type RequestRow = {
  id: number
  request_number: string
  patient_name: string
  patient_document: string
  status: string
  priority: string
  services_count: number
  total_amount: number
  request_date: string
  created_at: string
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

export default function ReceptionIndex({ stats, recentRequests, requests }: ReceptionIndexProps) {
  const { 
    loading, 
    error, 
    navigateToCreateServiceRequest, 
    refreshCurrentPage 
  } = useReception()

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
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => getStatusBadge(row.getValue('status')),
    },
    {
      accessorKey: 'priority',
      header: 'Prioridad',
      cell: ({ row }) => getPriorityBadge(row.getValue('priority')),
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
      accessorKey: 'total_amount',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Total" />
      ),
      cell: ({ row }) => (
        <span className="font-mono">
          ₲ {Number(row.getValue('total_amount')).toLocaleString('es-PY')}
        </span>
      ),
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
  ]

  const breadcrumbs = [
    { href: '/medical', title: 'Sistema Médico' },
    { href: '/medical/reception', title: 'Recepción', current: true }
  ]

  const statsCards = [
    {
      title: 'Pendientes Confirmación',
      value: stats.pending_requests,
      icon: ClockIcon,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-700',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'Confirmadas',
      value: stats.confirmed_requests,
      icon: CalendarIcon,
      color: 'bg-blue-500',
      textColor: 'text-blue-700',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'En Proceso',
      value: stats.in_progress_requests,
      icon: UserGroupIcon,
      color: 'bg-orange-500',
      textColor: 'text-orange-700',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Completadas Hoy',
      value: stats.completed_requests,
      icon: DocumentTextIcon,
      color: 'bg-green-500',
      textColor: 'text-green-700',
      bgColor: 'bg-green-50'
    }
  ]

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending_confirmation: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: 'Confirmado', className: 'bg-blue-100 text-blue-800' },
      in_progress: { label: 'En Proceso', className: 'bg-orange-100 text-orange-800' },
      pending_payment: { label: 'Pend. Pago', className: 'bg-purple-100 text-purple-800' },
      paid: { label: 'Pagado', className: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Cancelado', className: 'bg-red-100 text-red-800' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending_confirmation
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { label: 'Baja', className: 'bg-gray-100 text-gray-800' },
      normal: { label: 'Normal', className: 'bg-blue-100 text-blue-800' },
      high: { label: 'Alta', className: 'bg-yellow-100 text-yellow-800' },
      urgent: { label: 'Urgente', className: 'bg-red-100 text-red-800' }
    }
    
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.normal
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    )
  }

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
              disabled={loading}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <RefreshIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
            
            <button
              onClick={navigateToCreateServiceRequest}
              disabled={loading}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
            />
          </div>
        </div>

        {/* Recent Requests Summary (keeping original component for quick overview) */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Resumen de Últimas Solicitudes
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Vista rápida de las últimas 10 solicitudes
            </p>
          </div>
          
          {recentRequests.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {recentRequests.map((request) => (
                <li key={request.id}>
                  <div className="px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center min-w-0 flex-1">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-3">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {request.request_number}
                          </p>
                          {getStatusBadge(request.status)}
                          {getPriorityBadge(request.priority)}
                        </div>
                        <div className="mt-1">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">{request.patient_name}</span>
                            <span className="mx-2">•</span>
                            <span className="text-gray-500">{request.patient_document}</span>
                          </p>
                        </div>
                        <div className="mt-1 flex items-center text-sm text-gray-500 space-x-4">
                          <span>{request.services_count} servicio{request.services_count !== 1 ? 's' : ''}</span>
                          <span>€{Number(request.total_amount).toFixed(2)}</span>
                          <span>Hora: {request.created_at}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-8 text-center">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Sin solicitudes</h3>
              <p className="mt-1 text-sm text-gray-500">
                No hay solicitudes de servicio para mostrar hoy.
              </p>
              <div className="mt-6">
                <button
                  onClick={navigateToCreateServiceRequest}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Crear Primera Solicitud
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}