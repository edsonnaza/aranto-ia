import { Head } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'
import { useServiceRequests } from '@/hooks/medical'
import { getReceptionTypeLabel } from '@/hooks/medical/useReceptionTypeLabel'
import type { ServiceRequestsIndexData, ServiceRequest } from '@/hooks/medical'

interface ServiceRequestWithPayment extends ServiceRequest {
  payment_status?: string
}

// Simple SVG Icons
const EyeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
)

const EditIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)

const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
)

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
)

interface ServiceRequestsIndexProps {
  data: ServiceRequestsIndexData['data']
  links: ServiceRequestsIndexData['links']
  meta: ServiceRequestsIndexData['meta']
  filters?: {
    search?: string
    status?: string
    patient_id?: string
    reception_type?: string
  }
}

export default function ServiceRequestsIndex({ 
  data, 
  links, 
  meta, 
  filters = {} 
}: ServiceRequestsIndexProps) {
  const { 
    loading, 
    error, 
    confirmServiceRequest, 
    cancelServiceRequest, 
    navigateToCreate, 
    navigateToShow, 
    navigateToEdit 
  } = useServiceRequests()

  const breadcrumbs = [
    { href: '/medical', title: 'Sistema Médico' },
    { href: '/medical/service-requests', title: 'Solicitudes de Servicio', current: true }
  ]

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pendiente', classes: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: 'Confirmado', classes: 'bg-blue-100 text-blue-800' },
      in_progress: { label: 'En Progreso', classes: 'bg-indigo-100 text-indigo-800' },
      completed: { label: 'Completado', classes: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Cancelado', classes: 'bg-red-100 text-red-800' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || { 
      label: status, 
      classes: 'bg-gray-100 text-gray-800' 
    }

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.classes}`}>
        {config.label}
      </span>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { label: 'Baja', classes: 'bg-gray-100 text-gray-800' },
      normal: { label: 'Normal', classes: 'bg-blue-100 text-blue-800' },
      high: { label: 'Alta', classes: 'bg-orange-100 text-orange-800' },
      urgent: { label: 'Urgente', classes: 'bg-red-100 text-red-800' }
    }

    const config = priorityConfig[priority as keyof typeof priorityConfig] || { 
      label: priority, 
      classes: 'bg-gray-100 text-gray-800' 
    }

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.classes}`}>
        {config.label}
      </span>
    )
  }

  const getPaymentStatusBadge = (paymentStatus: string) => {
    const statusConfig = {
      pending: { label: 'Pendiente', classes: 'bg-red-50 text-red-700' },
      partial: { label: 'Parcial', classes: 'bg-yellow-50 text-yellow-700' },
      paid: { label: 'Pagado', classes: 'bg-green-50 text-green-700' },
    }

    const config = statusConfig[paymentStatus as keyof typeof statusConfig] || { label: paymentStatus, classes: 'bg-gray-50 text-gray-700' }

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.classes}`}>
        {config.label}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Solicitudes de Servicio" />
      
      <div className="p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Solicitudes de Servicio</h1>
            <p className="mt-1 text-sm text-gray-500">
              Gestiona todas las solicitudes de servicios médicos
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              onClick={navigateToCreate}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Nueva Solicitud
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-4 mb-6">
          <form className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buscar
              </label>
              <input
                type="text"
                defaultValue={filters.search || ''}
                placeholder="Número, paciente..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                defaultValue={filters.status || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                <option value="">Todos los estados</option>
                <option value="pending">Pendiente</option>
                <option value="confirmed">Confirmado</option>
                <option value="in_progress">En Progreso</option>
                <option value="completed">Completado</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Recepción
              </label>
              <select
                defaultValue={filters.reception_type || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                <option value="">Todos los tipos</option>
                <option value="scheduled">Programada</option>
                <option value="walk_in">Walk-in</option>
                <option value="emergency">Emergencia</option>
                <option value="inpatient_discharge">Alta Hospitalaria</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-gray-600 hover:bg-gray-700"
              >
                Filtrar
              </button>
            </div>
          </form>
        </div>

        {/* Results Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Solicitud
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paciente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo/Prioridad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No se encontraron solicitudes de servicio.
                    </td>
                  </tr>
                ) : (
                  data.map((request: ServiceRequest) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            #{request.request_number}
                          </div>
                          <div className="text-sm text-gray-500">
                            {request.service_details?.length || 0} servicio(s)
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {request.patient?.name} {request.patient?.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {request.patient?.phone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="text-sm text-gray-900">
                            {getReceptionTypeLabel(request.reception_type)}
                          </div>
                          {getPriorityBadge(request.priority)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          {getStatusBadge(request.status)}
                          <div>{getPaymentStatusBadge((request as ServiceRequestWithPayment).payment_status || 'pending')}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900">
                            {formatDate(request.request_date)}
                          </div>
                          {request.request_time && (
                            <div className="text-sm text-gray-500">
                              {request.request_time}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(request.total_amount || 0)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => navigateToShow(request.id)}
                            className="text-gray-400 hover:text-gray-600"
                            title="Ver detalles"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          
                          {request.status === 'pending' && (
                            <>
                              <button
                                onClick={() => navigateToEdit(request.id)}
                                className="text-indigo-400 hover:text-indigo-600"
                                title="Editar"
                                disabled={loading}
                              >
                                <EditIcon className="h-4 w-4" />
                              </button>
                              
                              <button
                                onClick={() => confirmServiceRequest(request.id)}
                                className="text-green-400 hover:text-green-600"
                                title="Confirmar"
                                disabled={loading}
                              >
                                <CheckIcon className="h-4 w-4" />
                              </button>
                              
                              <button
                                onClick={() => cancelServiceRequest(request.id, 'Cancelado desde la lista')}
                                className="text-red-400 hover:text-red-600"
                                title="Cancelar"
                                disabled={loading}
                              >
                                <XIcon className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta.total > 0 && (
            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Mostrando <span className="font-medium">{meta.from || 0}</span> a{' '}
                  <span className="font-medium">{meta.to || 0}</span> de{' '}
                  <span className="font-medium">{meta.total}</span> resultados
                </div>
                
                <div className="flex space-x-2">
                  {links.prev && (
                    <a
                      href={links.prev}
                      className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Anterior
                    </a>
                  )}
                  
                  {links.next && (
                    <a
                      href={links.next}
                      className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Siguiente
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}