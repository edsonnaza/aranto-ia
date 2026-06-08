import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getPaymentMethodLabel } from '@/utils/formatters'

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

// interface ServiceItem {
//   id: number
//   service_id: number
//   service_name: string
//   service_code: string
//   quantity: number
//   unit_price: number
//   total_price: number
//   insurance_type: string
//   professional_name?: string
//   notes?: string
// }

interface ServiceRequestDetail {
  id: number
  request_number: string
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
  status: string
  priority: string
  total_amount: number
  paid_amount: number
  remaining_amount: number
  request_date: string
  request_time: string
  notes?: string
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
  payment_status: string
  created_by_name: string
  transactions: Array<{
    id: number
    amount: number
    type: string
    method: string
    status: string
    date: string
    time: string
    reference?: string
    notes?: string
  }>
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

  // Only allow cancellation if status is pending_payment
  const canCancel = details?.payment_status === 'pending'

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[78vw]! max-w-6xl! max-h-[95vh]! overflow-y-auto">
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
                  </div>
                </div>

                {/* Información Principal en dos filas */}
                <div className="p-2">
                  {/* Fila 1: Datos básicos */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">
                        Número de Solicitud
                      </span>
                      <span className="font-mono text-sm font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded text-center">
                        {details.request_number}
                      </span>
                    </div>
                    
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">
                        Paciente
                      </span>
                      <span className="text-sm font-semibold text-gray-900 truncate">
                        {details.patient?.name} {details.patient?.last_name}
                      </span>
                    </div>
                    
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">
                        Documento
                      </span>
                      <span className="font-mono text-sm text-gray-700">
                        {details.patient?.document_type}: {details.patient?.document_number}
                      </span>
                    </div>
                    
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">
                        Fecha y Hora
                      </span>
                      <span className="text-sm text-gray-900">
                        {details.request_date} {details.request_time}
                      </span>
                    </div>
                  </div>

                  {/* Fila 2: Total destacado */}
                 
                </div>
                
                {details.notes && (
                  <div className="border-t border-amber-200 px-4 py-2">
                    <div className="flex items-start gap-2">
                      <div className="w-4 h-4 mt-0.5 shrink-0">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-medium text-gray-800 text-sm">Notas</h4>
                        <p className="text-gray-700 text-xs italic">{details.notes}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Services List - Tabla Compacta */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">
                  Servicios Solicitados ({details.service_details?.length || 0})
                </h4>
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-900">Servicio</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-900">Profesional</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-900">Seguro</th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-900">Cant.</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-900">Precio Unit.</th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-900">Desc.</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-900">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {(details.service_details || []).map((service, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-gray-900">{service.medical_service_name}</td>
                          <td className="px-4 py-3 text-gray-700">{service.professional_name}</td>
                          <td className="px-4 py-3 text-gray-700">{service.insurance_type_name}</td>
                          <td className="px-4 py-3 text-center text-gray-700">{service.quantity}</td>
                          <td className="px-4 py-3 text-right text-gray-700">₲ {Number(service.unit_price).toLocaleString('es-PY')}</td>
                          <td className="px-4 py-3 text-center text-gray-700">
                            {service.discount_percentage > 0 ? `${service.discount_percentage}%` : '-'}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-900">₲ {Number(service.total).toLocaleString('es-PY')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Resumen Final de Costos */}
              <div className="bg-linear-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2 text-sm">Resumen Final</h4>
                <div className="space-y-1">
                  {/* Precio Original */}
                  <div className="flex items-center justify-between py-1.5">
                    <div className="text-xs text-gray-600">Precio Original</div>
                    <div className="text-sm font-semibold text-gray-700">₲ {Number(details.service_details?.reduce((sum, s) => sum + (Number(s.unit_price) * Number(s.quantity)), 0) || 0).toLocaleString('es-PY')}</div>
                  </div>

                  {/* Total Descuentos */}
                  {(details.service_details?.reduce((sum, s) => sum + Number(s.discount_amount), 0) || 0) > 0 && (
                    <div className="flex items-center justify-between py-1.5 border-y border-blue-100">
                      <div className="text-xs text-gray-600">Descuentos</div>
                      <div className="text-sm font-semibold text-red-600">- ₲ {Number(details.service_details?.reduce((sum, s) => sum + Number(s.discount_amount), 0) || 0).toLocaleString('es-PY')}</div>
                    </div>
                  )}

                  {/* Precio Final */}
                  <div className="flex items-center justify-between py-2 bg-white rounded px-2">
                    <div className="text-sm font-semibold text-gray-900">Precio Final</div>
                    <div className="text-lg font-bold text-blue-700">₲ {Number(details.total_amount).toLocaleString('es-PY')}</div>
                  </div>

                  {/* Saldo Pendiente */}
                  <div className="flex items-center justify-between py-2 bg-white rounded px-2">
                    <div className="text-sm font-semibold text-gray-900">Saldo Pendiente</div>
                    <div className={`font-bold text-sm ${
                      details.remaining_amount <= 0
                        ? 'text-green-700'
                        : 'text-orange-700'
                    }`}>
                      {details.remaining_amount <= 0 ? (
                        <span>✓ Pagado</span>
                      ) : (
                        <span>₲ {Number(details.remaining_amount).toLocaleString('es-PY')}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment History */}
              {details.transactions && details.transactions.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">
                    Historial de Transacciones ({details.transactions.length})
                  </h4>
                  <div className="space-y-2">
                    {details.transactions.map((transaction, index) => (
                      <div key={transaction.id || index} className="bg-white border border-gray-200 rounded-lg p-4 flex justify-between items-center hover:shadow-md transition-shadow">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${transaction.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {transaction.type === 'payment' ? 'Pago' : 'Reembolso'} - {getPaymentMethodLabel(transaction.method)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {transaction.date} a las {transaction.time}
                                {transaction.reference && ` • Ref: ${transaction.reference}`}
                              </div>
                              {transaction.notes && (
                                <div className="text-xs text-gray-600 italic mt-1">{transaction.notes}</div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className={`text-sm font-bold ${transaction.type === 'payment' ? 'text-green-700' : 'text-red-700'}`}>
                            {transaction.type === 'payment' ? '+' : '-'} ₲ {Number(transaction.amount).toLocaleString('es-PY')}
                          </div>
                          <div className="text-xs text-gray-500 capitalize">{transaction.status}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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