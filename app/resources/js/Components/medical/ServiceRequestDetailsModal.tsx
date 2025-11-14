import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

// Icons
const EyeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
)

const XCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

interface ServiceItem {
  id: number
  service_id: number
  service_name: string
  service_code: string
  quantity: number
  unit_price: number
  total_price: number
  insurance_type: string
  professional_name?: string
  notes?: string
}

interface ServiceRequestDetail {
  id: number
  request_number: string
  patient_name: string
  patient_document: string
  status: string
  priority: string
  total_amount: number
  request_date: string
  request_time: string
  notes?: string
  services: ServiceItem[]
  payment_status: string
}

interface ServiceRequestDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  requestId: number | null
  onCancelRequest?: (requestId: number) => void
}

export default function ServiceRequestDetailsModal({
  isOpen,
  onClose,
  requestId,
  onCancelRequest
}: ServiceRequestDetailsModalProps) {
  const [details, setDetails] = useState<ServiceRequestDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [canceling, setCanceling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch details when modal opens
  useEffect(() => {
    if (isOpen && requestId) {
      fetchServiceDetails(requestId)
    }
  }, [isOpen, requestId])

  const fetchServiceDetails = async (id: number) => {
    setLoading(true)
    setError(null)
    try {
      // Using fetch to get JSON response for modal
      const response = await fetch(`/medical/service-requests/${id}`, {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        }
      })
      
      if (!response.ok) {
        throw new Error('Error al cargar los detalles')
      }
      
      const data = await response.json()
      setDetails(data.props.serviceRequest as ServiceRequestDetail)
    } catch (err) {
      setError('Error al cargar los detalles del servicio')
      console.error('Error fetching service details:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelRequest = async () => {
    if (!details || !requestId) return

    setCanceling(true)
    try {
      const response = await fetch(`/medical/service-requests/${requestId}/cancel`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({
          cancellation_reason: 'Cancelado desde la recepción'
        })
      })
      
      if (!response.ok) {
        throw new Error('Error al cancelar la solicitud')
      }
      
      onCancelRequest?.(requestId)
      onClose()
    } catch (err) {
      setError('Error al cancelar la solicitud')
      console.error('Error canceling request:', err)
    } finally {
      setCanceling(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending_confirmation: { label: 'Pendiente Confirmación', className: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: 'Confirmado', className: 'bg-blue-100 text-blue-800' },
      in_progress: { label: 'En Proceso', className: 'bg-orange-100 text-orange-800' },
      pending_payment: { label: 'Pendiente Pago', className: 'bg-purple-100 text-purple-800' },
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

  // Only allow cancellation if status is pending_payment
  const canCancel = details?.payment_status === 'pending'

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw]! max-w-[900px]! max-h-[95vh]! overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <EyeIcon className="h-5 w-5 text-gray-600" />
            Detalles de Solicitud de Servicio
          </DialogTitle>
          <DialogDescription>
            Información completa de la solicitud y servicios incluidos
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="mt-2 text-sm text-gray-500">Cargando detalles...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {details && !loading && (
            <div className="space-y-6">
              {/* Request Info - Diseño horizontal mejorado */}
              <div className="bg-white border-2 border-gray-100 rounded-lg overflow-hidden">
                {/* Header Principal */}
                <div className="bg-slate-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <h3 className="text-lg font-bold text-gray-900">Solicitud de Servicio</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(details.status)}
                      {getPriorityBadge(details.priority)}
                    </div>
                  </div>
                </div>

                {/* Información Principal en dos filas */}
                <div className="p-6">
                  {/* Fila 1: Datos básicos */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                        Número de Solicitud
                      </span>
                      <span className="font-mono text-sm font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-md border">
                        {details.request_number}
                      </span>
                    </div>
                    
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                        Paciente
                      </span>
                      <span className="text-lg font-semibold text-gray-900 truncate">
                        {details.patient_name}
                      </span>
                    </div>
                    
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                        Documento
                      </span>
                      <span className="font-mono text-base text-gray-700">
                        {details.patient_document}
                      </span>
                    </div>
                    
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                        Fecha y Hora
                      </span>
                      <span className="text-base text-gray-900">
                        {details.request_date}
                      </span>
                      <span className="text-sm text-gray-600">
                        {details.request_time}
                      </span>
                    </div>
                  </div>

                  {/* Fila 2: Total destacado */}
                  <div className="bg-gradient-to-r rounded-lg p-4 border border-emerald-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-right gap-3">
                         
                        <div>
                          <span className="text-xs font-medium text-emerald-700 uppercase tracking-wide block">
                            Total de la Solicitud
                          </span>
                          <span className="font-mono text-2xl font-bold text-emerald-800">
                            ₲ {Number(details.total_amount).toLocaleString('es-PY')}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <span className="text-xs text-emerald-600 block">Servicios:</span>
                        <span className="font-semibold text-emerald-700">
                          {details.services.length} item{details.services.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {details.notes && (
                  <div className=" border-t border-amber-200-200 px-6 py-4">
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5  mt-0.5">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800 mb-1">Notas Adicionales</h4>
                        <p className="text-gray-700 text-sm italic">"{details.notes}"</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Services List */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">
                  Servicios Solicitados ({details.services.length})
                </h4>
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Servicio
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cantidad
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Precio Unit.
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Seguro
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Profesional
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Subtotal
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {details.services.map((service, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-3">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{service.service_name}</div>
                              <div className="text-sm text-gray-500">{service.service_code}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {service.quantity}
                          </td>
                          <td className="px-4 py-3 text-sm font-mono text-gray-900">
                            ₲ {Number(service.unit_price).toLocaleString('es-PY')}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {service.insurance_type}
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-900">
                              {service.professional_name || 'No asignado'}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm font-mono font-medium text-gray-900">
                            ₲ {Number(service.total_price).toLocaleString('es-PY')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {details && canCancel && (
            <button
              onClick={handleCancelRequest}
              disabled={canceling}
              className="inline-flex justify-center items-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {canceling ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Cancelando...
                </>
              ) : (
                <>
                  <XCircleIcon className="h-4 w-4 mr-2" />
                  Cancelar Solicitud
                </>
              )}
            </button>
          )}
          <button
            onClick={onClose}
            className="inline-flex justify-center items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Cerrar
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}