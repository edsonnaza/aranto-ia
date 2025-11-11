import { Head } from '@inertiajs/react'
import { useState, useMemo } from 'react'
import AppLayout from '@/layouts/app-layout'
import { useServiceRequests } from '@/hooks/medical'
import type { ReceptionCreateData } from '@/hooks/medical'
import SelectItem from '@/components/ui/SelectItem'

// Simple SVG Icons
const TrashIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

interface ServiceItem {
  id: string | number
  medical_service_id: number
  professional_id: number
  insurance_type_id: number
  scheduled_date: string
  scheduled_time: string
  estimated_duration: number
  unit_price: number
  quantity: number
  discount_percentage: number
  discount_amount: number
  preparation_instructions: string
  notes: string
}

interface ExistingServiceRequest {
  id: number
  request_number: string
  patient_id: number
  reception_type: string
  priority: string
  request_date: string
  request_time?: string
  notes?: string
  status: string
  service_details: Array<{
    id: number
    medical_service_id: number
    professional_id: number
    insurance_type_id: number
    scheduled_date?: string
    scheduled_time?: string
    estimated_duration: number
    unit_price: number
    quantity: number
    discount_percentage: number
    discount_amount: number
    preparation_instructions?: string
    notes?: string
  }>
}

interface ServiceRequestEditProps extends ReceptionCreateData {
  serviceRequest: ExistingServiceRequest
}

export default function ServiceRequestEdit({ 
  patients, 
  medicalServices, 
  professionals, 
  insuranceTypes,
  serviceRequest 
}: ServiceRequestEditProps) {
  const { loading, error, updateServiceRequest } = useServiceRequests()

  // Form state initialized with existing data
  const [patientId, setPatientId] = useState<number>(serviceRequest.patient_id)
  const [receptionType, setReceptionType] = useState(serviceRequest.reception_type)
  const [priority, setPriority] = useState(serviceRequest.priority)
  const [requestDate, setRequestDate] = useState(serviceRequest.request_date)
  const [requestTime, setRequestTime] = useState(serviceRequest.request_time || '')
  const [notes, setNotes] = useState(serviceRequest.notes || '')
  
  // Services cart initialized with existing services
  const [services, setServices] = useState<ServiceItem[]>(() => {
    return serviceRequest.service_details.map((service) => ({
      id: service.id,
      medical_service_id: service.medical_service_id,
      professional_id: service.professional_id,
      insurance_type_id: service.insurance_type_id,
      scheduled_date: service.scheduled_date || serviceRequest.request_date,
      scheduled_time: service.scheduled_time || '',
      estimated_duration: service.estimated_duration,
      unit_price: service.unit_price,
      quantity: service.quantity,
      discount_percentage: service.discount_percentage,
      discount_amount: service.discount_amount,
      preparation_instructions: service.preparation_instructions || '',
      notes: service.notes || ''
    }))
  })

  // Flatten services for select options
  const flatServices = useMemo(() => {
    return medicalServices.flatMap(category => 
      category.services.map(service => ({
        ...service,
        category: category.category
      }))
    )
  }, [medicalServices])

  const breadcrumbs = [
    { href: '/medical', title: 'Sistema Médico' },
    { href: '/medical/service-requests', title: 'Solicitudes de Servicio' },
    { href: `/medical/service-requests/${serviceRequest.id}`, title: `#${serviceRequest.request_number}` },
    { href: `/medical/service-requests/${serviceRequest.id}/edit`, title: 'Editar', current: true }
  ]

  const removeServiceFromCart = (id: string | number) => {
    setServices(services.filter(service => service.id !== id))
  }

  const updateService = (id: string | number, field: keyof ServiceItem, value: string | number) => {
    setServices(services.map(service => {
      if (service.id === id) {
        const updated = { ...service, [field]: value }
        
        // Auto-update price when service changes
        if (field === 'medical_service_id') {
          const selectedService = flatServices.find(s => s.value === value)
          if (selectedService) {
            updated.unit_price = selectedService.base_price
            updated.estimated_duration = selectedService.estimated_duration || 30
          }
        }
        
        return updated
      }
      return service
    }))
  }

  const calculateServiceTotal = (service: ServiceItem) => {
    const subtotal = service.unit_price * service.quantity
    const discountFromPercentage = (subtotal * service.discount_percentage) / 100
    const totalDiscount = discountFromPercentage + service.discount_amount
    return Math.max(0, subtotal - totalDiscount)
  }

  const calculateGrandTotal = () => {
    return services.reduce((total, service) => total + calculateServiceTotal(service), 0)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!patientId || services.length === 0) {
      return
    }

    const formData = {
      patient_id: patientId,
      reception_type: receptionType,
      priority,
      request_date: requestDate,
      request_time: requestTime || undefined,
      notes: notes || undefined,
      services: services.map(service => ({
        id: typeof service.id === 'number' ? service.id : undefined, // Include ID for existing services
        medical_service_id: service.medical_service_id,
        professional_id: service.professional_id,
        insurance_type_id: service.insurance_type_id,
        scheduled_date: service.scheduled_date || undefined,
        scheduled_time: service.scheduled_time || undefined,
        estimated_duration: service.estimated_duration,
        unit_price: service.unit_price,
        quantity: service.quantity,
        discount_percentage: service.discount_percentage,
        discount_amount: service.discount_amount,
        preparation_instructions: service.preparation_instructions || undefined,
        notes: service.notes || undefined
      }))
    }

    updateServiceRequest(serviceRequest.id, formData)
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Editar Solicitud #${serviceRequest.request_number}`} />
      
      <div className="p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">
              Editar Solicitud #{serviceRequest.request_number}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Modifica los detalles de la solicitud de servicio médico
            </p>
          </div>

          {/* Status Warning */}
          {serviceRequest.status !== 'pending' && (
            <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="text-sm text-yellow-800">
                ⚠️ Esta solicitud está en estado "{serviceRequest.status}". 
                Algunos cambios pueden no estar permitidos.
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Patient and Basic Info */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Información Básica</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Paciente *
                  </label>
                  <SelectItem
                    value={patientId.toString()}
                    onValueChange={(value: string) => setPatientId(Number(value))}
                    required
                  >
                    <option value="0">Seleccionar paciente...</option>
                    {patients.map((patient) => (
                      <option key={patient.value} value={patient.value.toString()}>
                        {patient.label}
                      </option>
                    ))}
                  </SelectItem>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Recepción *
                  </label>
                  <SelectItem
                    value={receptionType}
                    onValueChange={setReceptionType}
                    required
                  >
                    <option value="scheduled">Programada</option>
                    <option value="walk_in">Walk-in</option>
                    <option value="emergency">Emergencia</option>
                    <option value="inpatient_discharge">Alta Hospitalaria</option>
                  </SelectItem>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prioridad *
                  </label>
                  <SelectItem
                    value={priority}
                    onValueChange={setPriority}
                    required
                  >
                    <option value="low">Baja</option>
                    <option value="normal">Normal</option>
                    <option value="high">Alta</option>
                    <option value="urgent">Urgente</option>
                  </SelectItem>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Solicitud *
                  </label>
                  <input
                    type="date"
                    value={requestDate}
                    onChange={(e) => setRequestDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora de Solicitud
                  </label>
                  <input
                    type="time"
                    value={requestTime}
                    onChange={(e) => setRequestTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Notas adicionales sobre la solicitud..."
                  />
                </div>
              </div>
            </div>

            {/* Services Cart */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">Servicios Solicitados</h2>
              </div>

              {services.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay servicios en esta solicitud.
                </div>
              ) : (
                <div className="space-y-4">
                  {services.map((service, index) => (
                    <div key={service.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium text-gray-900">Servicio #{index + 1}</h3>
                        {services.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeServiceFromCart(service.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Servicio Médico *
                          </label>
                          <SelectItem
                            value={service.medical_service_id.toString()}
                            onValueChange={(value: string) => updateService(service.id, 'medical_service_id', Number(value))}
                            required
                          >
                            <option value="0">Seleccionar servicio...</option>
                            {flatServices.map((flatService) => (
                              <option key={flatService.value} value={flatService.value.toString()}>
                                {flatService.category} - {flatService.label}
                              </option>
                            ))}
                          </SelectItem>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Profesional *
                          </label>
                          <SelectItem
                            value={service.professional_id.toString()}
                            onValueChange={(value: string) => updateService(service.id, 'professional_id', Number(value))}
                            required
                          >
                            <option value="0">Seleccionar profesional...</option>
                            {professionals.map((professional) => (
                              <option key={professional.value} value={professional.value.toString()}>
                                {professional.label}
                              </option>
                            ))}
                          </SelectItem>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Seguro *
                          </label>
                          <SelectItem
                            value={service.insurance_type_id.toString()}
                            onValueChange={(value: string) => updateService(service.id, 'insurance_type_id', Number(value))}
                            required
                          >
                            <option value="0">Seleccionar seguro...</option>
                            {insuranceTypes.map((insurance) => (
                              <option key={insurance.value} value={insurance.value.toString()}>
                                {insurance.label}
                              </option>
                            ))}
                          </SelectItem>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Precio Unitario (€)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={service.unit_price}
                            onChange={(e) => updateService(service.id, 'unit_price', Number(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Cantidad
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={service.quantity}
                            onChange={(e) => updateService(service.id, 'quantity', Number(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Total
                          </label>
                          <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900 font-medium">
                            €{calculateServiceTotal(service).toFixed(2)}
                          </div>
                        </div>

                        <div className="md:col-span-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Instrucciones de Preparación
                          </label>
                          <textarea
                            value={service.preparation_instructions}
                            onChange={(e) => updateService(service.id, 'preparation_instructions', e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Instrucciones especiales para el paciente..."
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Cart Total */}
              {services.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-gray-900">Total General:</span>
                    <span className="text-xl font-bold text-indigo-600">
                      €{calculateGrandTotal().toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !patientId || services.length === 0}
                className="px-4 py-2 border border-transparent rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Actualizando...' : 'Actualizar Solicitud'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  )
}