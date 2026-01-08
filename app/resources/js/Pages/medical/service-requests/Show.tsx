import { Head } from '@inertiajs/react'
import { useDateFormat } from '@/hooks/useDateFormat'
import AppLayout from '@/layouts/app-layout'
import { useServiceRequests } from '@/hooks/medical'
import { getReceptionTypeLabel } from '@/hooks/medical/useReceptionTypeLabel'

// Simple SVG Icons
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

const UserIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

const CalendarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const ClipboardIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
)

interface DetailedServiceRequest {
  id: number
  request_number: string
  request_date: string
  request_time: string
  status: string
  reception_type: string
  priority: string
  total_amount: number
  paid_amount: number
  payment_status: string
  remaining_amount: number
  created_at: string
  patient: {
    id: number
    name: string
    last_name: string
    document_type: string
    document_number: string
    phone?: string
    email?: string
    date_of_birth?: string
  }
  service_details: Array<{
    id: number
    medical_service_name: string
    professional_name: string
    insurance_type_name: string
    scheduled_date?: string
    scheduled_time?: string
    estimated_duration: number
    unit_price: number
    quantity: number
    discount_percentage: number
    discount_amount: number
    subtotal: number
    total: number
    preparation_instructions?: string
    notes?: string
    status: string
  }>
  notes?: string
  created_by_name: string
  updated_by_name?: string
  updated_at?: string
}

interface ServiceRequestShowProps {
  serviceRequest: DetailedServiceRequest
}

export default function ServiceRequestShow({ serviceRequest }: ServiceRequestShowProps) {
  const { toFrontend } = useDateFormat();
  const { 
    loading, 
    error, 
    confirmServiceRequest, 
    cancelServiceRequest, 
    navigateToEdit,
    navigateToIndex 
  } = useServiceRequests()

  const breadcrumbs = [
    { href: '/medical', title: 'Sistema Médico' },
    { href: '/medical/service-requests', title: 'Solicitudes de Servicio' },
    { href: `/medical/service-requests/${serviceRequest.id}`, title: `#${serviceRequest.request_number}`, current: true }
  ]

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pendiente', classes: 'bg-yellow-100 text-yellow-800' },
      pending_confirmation: { label: 'Pendiente', classes: 'bg-yellow-100 text-yellow-800' },
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
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${config.classes}`}>
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
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${config.classes}`}>
        {config.label}
      </span>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'PYG'
    }).format(amount)
  }

  const handlePrint = () => {
    window.print()
  }

  const calculateAge = (birthDate: string) => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    
    return age
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Solicitud #${serviceRequest.request_number}`} />
      
      <div className="p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <div>
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-semibold text-gray-900">
                  Solicitud #{serviceRequest.request_number}
                </h1>
                {getStatusBadge(serviceRequest.status)}
                {getPriorityBadge(serviceRequest.priority)}
              </div>
              <p className="mt-1 text-sm text-gray-500">
                {getReceptionTypeLabel(serviceRequest.reception_type)} • {toFrontend(serviceRequest.request_date)}
                {serviceRequest.request_time && ` • ${serviceRequest.request_time}`}
              </p>
            </div>
            
            <div className="mt-4 lg:mt-0 flex space-x-3">
              <button
                onClick={() => navigateToIndex()}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Volver a la Lista
              </button>

              <button
                onClick={handlePrint}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                title="Imprimir solicitud"
              >
                🖨️ Imprimir
              </button>
              
              {serviceRequest.status === 'pending' && (
                <>
                  <button
                    onClick={() => navigateToEdit(serviceRequest.id)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                    disabled={loading}
                  >
                    <EditIcon className="h-4 w-4 mr-2" />
                    Editar
                  </button>
                  
                  <button
                    onClick={() => confirmServiceRequest(serviceRequest.id)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-white bg-green-600 hover:bg-green-700"
                    disabled={loading}
                  >
                    <CheckIcon className="h-4 w-4 mr-2" />
                    Confirmar
                  </button>
                  
                  <button
                    onClick={() => cancelServiceRequest(serviceRequest.id, 'Cancelado desde detalle')}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-white bg-red-600 hover:bg-red-700"
                    disabled={loading}
                  >
                    <XIcon className="h-4 w-4 mr-2" />
                    Cancelar
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Patient Information */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center mb-4">
                <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                <h2 className="text-lg font-medium text-gray-900">Información del Paciente</h2>
              </div>
              
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    {serviceRequest.patient.name} {serviceRequest.patient.last_name}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Documento:</span> {serviceRequest.patient.document_type} {serviceRequest.patient.document_number}
                </div>
                
                {serviceRequest.patient.date_of_birth && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Edad:</span> {calculateAge(serviceRequest.patient.date_of_birth)} años
                  </div>
                )}
                
                {serviceRequest.patient.phone && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Teléfono:</span> {serviceRequest.patient.phone}
                  </div>
                )}
                
                {serviceRequest.patient.email && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Email:</span> {serviceRequest.patient.email}
                  </div>
                )}
              </div>
            </div>

            {/* Request Details */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center mb-4">
                <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                <h2 className="text-lg font-medium text-gray-900">Detalles de la Solicitud</h2>
              </div>
              
              <div className="space-y-3">
                <div className="text-sm">
                  <span className="font-medium text-gray-900">Fecha de Solicitud:</span>
                  <div className="text-gray-600">{toFrontend(serviceRequest.request_date)}</div>
                </div>
                
                {serviceRequest.request_time && (
                  <div className="text-sm">
                    <span className="font-medium text-gray-900">Hora:</span>
                    <div className="text-gray-600">{serviceRequest.request_time}</div>
                  </div>
                )}
                
                <div className="text-sm">
                  <span className="font-medium text-gray-900">Tipo de Recepción:</span>
                  <div className="text-gray-600">{getReceptionTypeLabel(serviceRequest.reception_type)}</div>
                </div>
                
                <div className="text-sm">
                  <span className="font-medium text-gray-900">Creado por:</span>
                  <div className="text-gray-600">{serviceRequest.created_by_name}</div>
                </div>
                
                <div className="text-sm">
                  <span className="font-medium text-gray-900">Fecha de Creación:</span>
                  <div className="text-gray-600">{toFrontend(serviceRequest.created_at)}{serviceRequest.request_time ? ` ${serviceRequest.request_time}` : ''}</div>
                </div>
                
                {serviceRequest.updated_at && serviceRequest.updated_by_name && (
                  <div className="text-sm">
                    <span className="font-medium text-gray-900">Última Actualización:</span>
                    <div className="text-gray-600">{toFrontend(serviceRequest.updated_at || '')} por {serviceRequest.updated_by_name}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center mb-4">
                <ClipboardIcon className="h-5 w-5 text-gray-400 mr-2" />
                <h2 className="text-lg font-medium text-gray-900">Resumen Financiero</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Subtotal:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(serviceRequest.service_details?.reduce((sum, service) => sum + (service.subtotal || 0), 0) || 0)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Descuentos:</span>
                  <span className="text-sm font-medium text-red-600">
                    -{formatCurrency(serviceRequest.service_details?.reduce((sum, service) => sum + (service.discount_amount || 0), 0) || 0)}
                  </span>
                </div>
                
                <div className="flex justify-between text-lg font-medium pt-3 border-t">
                  <span className="text-gray-900">Total:</span>
                  <span className="text-gray-900">{formatCurrency(serviceRequest.service_details?.reduce((sum, service) => sum + (service.total || 0), 0) || 0)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Pagado:</span>
                  <span className="text-sm font-medium text-green-600">
                    {formatCurrency(serviceRequest.paid_amount || 0)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Pendiente:</span>
                  <span className="text-sm font-medium text-orange-600">
                    {formatCurrency(serviceRequest.remaining_amount || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Services Details */}
          <div className="mt-6 bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Servicios Solicitados</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Servicio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Profesional
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha/Hora
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Precio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cantidad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {serviceRequest.service_details?.map((service) => (
                    <tr key={service.id}>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {service.medical_service_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {service.insurance_type_name}
                          </div>
                          {service.preparation_instructions && (
                            <div className="text-xs text-blue-600 mt-1">
                              Preparación: {service.preparation_instructions}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {service.professional_name}
                        <div className="text-xs text-gray-500">
                          {service.estimated_duration} min
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {service.scheduled_date ? (
                          <div>
                            <div className="text-sm text-gray-900">
                              {toFrontend(service.scheduled_date || '')}
                            </div>
                            {service.scheduled_time && (
                              <div className="text-sm text-gray-500">
                                {service.scheduled_time}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Por programar</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatCurrency(service.unit_price)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {service.quantity}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(service.total)}
                        </div>
                        {service.discount_amount > 0 && (
                          <div className="text-xs text-red-600">
                            Desc: -{formatCurrency(service.discount_amount)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(service.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes */}
          {serviceRequest.notes && (
            <div className="mt-6 bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Notas</h2>
              <div className="text-sm text-gray-600 whitespace-pre-wrap">
                {serviceRequest.notes}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media print {
          * {
            margin: 0;
            padding: 0;
          }

          html, body {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
          }

          @page {
            size: A4;
            margin: 10mm;
          }

          /* Ocultar TODOS los botones y controles */
          button,
          button * {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
            width: 0 !important;
            overflow: hidden !important;
          }

          /* Ocultar los badges de estado y prioridad en impresión */
          .flex.items-center.space-x-4 span {
            display: none !important;
            visibility: hidden !important;
          }

          /* Pero mostrar el h1 si está dentro */
          .flex.items-center.space-x-4 h1 {
            display: block !important;
            visibility: visible !important;
            width: 100% !important;
            margin-bottom: 8px !important;
          }

          /* Ajustar párrafo de fecha y tipo */
          .flex.items-center.space-x-4 + p {
            margin-top: 0 !important;
          }

          /* Forzar que el header se muestre en una columna */
          .flex.flex-col.lg\:flex-row.lg\:items-center.lg\:justify-between.mb-6 > div:first-child {
            width: 100% !important;
            display: block !important;
          }

          /* Ocultar navegación y headers */
          nav,
          header,
          footer,
          a,
          .breadcrumb,
          [role="navigation"] {
            display: none !important;
            visibility: hidden !important;
          }

          /* Mostrar solo el contenedor principal */
          .p-4,
          .md\:p-6 {
            padding: 0 !important;
            margin: 0 !important;
          }

          .max-w-6xl {
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Asegurar que el header se muestre en impresión */
          .flex.flex-col.lg\:flex-row.lg\:items-center.lg\:justify-between.mb-6 {
            display: flex !important;
            flex-direction: row !important;
            justify-content: space-between !important;
            align-items: flex-start !important;
            margin-bottom: 15px !important;
            visibility: visible !important;
            page-break-inside: avoid !important;
          }

          /* Mostrar el contenedor del número y estado */
          .flex.items-center.space-x-4 {
            display: flex !important;
            visibility: visible !important;
            flex: 1;
          }

          /* Ocultar solo el div de botones a la derecha */
          .mt-4.lg\:mt-0.flex.space-x-3 {
            display: none !important;
            visibility: hidden !important;
            width: 0 !important;
            height: 0 !important;
          }

          /* Header con título */
          h1 {
            font-size: 18px !important;
            margin-bottom: 5px !important;
            display: block !important;
            visibility: visible !important;
            color: black !important;
            font-weight: bold !important;
          }

          h2 {
            font-size: 13px !important;
            margin: 10px 0 5px 0 !important;
            font-weight: bold !important;
          }

          /* Grid layout para impresión */
          .grid {
            display: grid !important;
            grid-template-columns: 1fr 1fr 1fr !important;
            gap: 10px !important;
            margin-bottom: 15px !important;
          }

          /* Cards */
          .bg-white.shadow {
            box-shadow: none !important;
            border: 1px solid #ddd !important;
            page-break-inside: avoid !important;
            padding: 8px !important;
            margin: 0 !important;
          }

          /* Información general */
          .space-y-3 > div {
            margin-bottom: 4px !important;
            font-size: 11px !important;
          }

          .space-y-4 > div {
            margin-bottom: 5px !important;
            font-size: 11px !important;
          }

          /* Tabla de servicios */
          .mt-6 {
            margin-top: 15px !important;
            page-break-inside: avoid !important;
          }

          .overflow-x-auto {
            overflow: visible !important;
          }

          table {
            width: 100% !important;
            border-collapse: collapse !important;
            font-size: 10px !important;
            margin-top: 5px !important;
          }

          thead {
            background-color: #f5f5f5 !important;
            display: table-header-group !important;
          }

          th {
            border: 1px solid #999 !important;
            padding: 3px 4px !important;
            text-align: left !important;
            font-weight: bold !important;
            font-size: 9px !important;
          }

          td {
            border: 1px solid #ddd !important;
            padding: 3px 4px !important;
          }

          /* Notas */
          .whitespace-pre-wrap {
            font-size: 11px !important;
          }

          /* Badges y estados */
          span {
            background: transparent !important;
            color: black !important;
          }

          /* Colores para impresión en escala de grises */
          .text-gray-600,
          .text-gray-500 {
            color: #666 !important;
          }

          .text-red-600 {
            color: #333 !important;
          }

          .text-green-600 {
            color: #333 !important;
          }

          .text-orange-600 {
            color: #333 !important;
          }

          /* Texto */
          .text-sm {
            font-size: 11px !important;
          }

          .text-xs {
            font-size: 9px !important;
          }

          .text-lg {
            font-size: 12px !important;
          }

          .text-2xl {
            font-size: 14px !important;
          }

          /* Eliminar colores de fondo */
          .bg-yellow-100,
          .bg-blue-100,
          .bg-indigo-100,
          .bg-green-100,
          .bg-red-100,
          .bg-gray-100,
          .bg-gray-50 {
            background: transparent !important;
          }

          /* Separadores */
          .border-t,
          .border-b,
          .border-gray-200 {
            border-color: #999 !important;
          }

          /* Flex para impresión */
          .flex.flex-col,
          .flex.items-center {
            display: block !important;
          }

          .flex-1,
          .w-0 {
            width: auto !important;
          }

          /* Ocultar iconos */
          svg {
            display: none !important;
          }
        }
      `}</style>
    </AppLayout>
  )
}