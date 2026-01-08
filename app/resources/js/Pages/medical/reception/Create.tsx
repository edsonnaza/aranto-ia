import { Head } from '@inertiajs/react'
import { useState, useMemo, useCallback } from 'react'
import AppLayout from '@/layouts/app-layout'
import { useServiceRequests, useSearch, useServicePricing } from '@/hooks/medical'
import { getReceptionTypeOptions } from '@/hooks/medical/useReceptionTypeLabel'
import type { ReceptionCreateData } from '@/hooks/medical'
import SearchableInput from '@/components/ui/SearchableInput'
import TotalDisplay from '@/components/ui/TotalDisplay'
import ServiceCartTable from '@/components/ui/ServiceCartTable'
import SelectItem from '../../../components/ui/SelectItem'

// Simple SVG Icons
const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
)

interface ServiceItem {
  id: string
  medical_service_id: number
  service_name?: string
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

interface ReceptionCreateProps {
  patients: ReceptionCreateData['patients']
  medicalServices: ReceptionCreateData['medicalServices']
  professionals: ReceptionCreateData['professionals']
  insuranceTypes: ReceptionCreateData['insuranceTypes']
}

export default function ReceptionCreate({ 
  medicalServices = [],
  professionals = [],
  insuranceTypes = []
}: ReceptionCreateProps) {
  const { loading, error, createServiceRequest } = useServiceRequests()
  const { searchPatients, searchServices } = useSearch()
  const { getServicePriceFromData } = useServicePricing()

  // Form state
  const [selectedPatient, setSelectedPatient] = useState<{ id: number, name: string } | null>(null)
  const [receptionType, setReceptionType] = useState('scheduled')
  const [priority, setPriority] = useState('normal')
  const [requestDate, setRequestDate] = useState(new Date().toISOString().split('T')[0])
  const [requestTime, setRequestTime] = useState('')
  const [notes, setNotes] = useState('')
  
  // Expandible sections
  const [expandedPatient, setExpandedPatient] = useState(true)
  const [expandedInfo, setExpandedInfo] = useState(true)
  
  // Services cart
  const [services, setServices] = useState<ServiceItem[]>([])

  // Flatten services for select options
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const flatServices = useMemo((): any[] => {
    if (!medicalServices || !Array.isArray(medicalServices) || medicalServices.length === 0) {
      return []
    }
    
    return medicalServices.flatMap(category => {
      if (!category || !category.services || !Array.isArray(category.services)) {
        return []
      }
      
      return category.services.map(service => ({
        value: service.value,
        label: service.label,
        name: service.name,
        code: service.code,
        base_price: service.base_price || 0,
        estimated_duration: service.estimated_duration || 30,
        category: category.category
      }))
    })
  }, [medicalServices])

  // Transform professionals for SelectOption format
  const professionalOptions = useMemo(() => {
    if (!professionals || !Array.isArray(professionals)) return []
    return professionals.map(prof => ({
      value: prof.value,
      label: prof.label
    }))
  }, [professionals])

  // Transform insurance types for SelectOption format
  const insuranceOptions = useMemo(() => {
    if (!insuranceTypes || !Array.isArray(insuranceTypes)) return []
    return insuranceTypes.map(insurance => ({
      value: insurance.value,
      label: insurance.label
    }))
  }, [insuranceTypes])

  const breadcrumbs = [
    { href: '/medical', title: 'Sistema Médico' },
    { href: '/medical/reception', title: 'Recepción' },
    { href: '/medical/reception/create', title: 'Nueva Solicitud', current: true }
  ]

  // Handle patient selection
  const handlePatientSelect = (patient: { id: number; label: string }) => {
    setSelectedPatient({ 
      id: patient.id, 
      name: patient.label 
    })
  }

  // Handle service selection
  const handleServiceSelect = (service: { value: number; base_price: number; label?: string; estimated_duration?: number }, serviceItemId: string) => {
    setServices(services.map(item => {
      if (item.id === serviceItemId) {
        const updated = {
          ...item,
          medical_service_id: service.value || 0,
          service_name: service.label || 'Servicio',
          unit_price: service.base_price || 0,
          estimated_duration: service.estimated_duration || 30
        }
        return updated
      }
      return item
    }))
  }

  const addServiceToCart = () => {
    const newService: ServiceItem = {
      id: Date.now().toString(),
      medical_service_id: 0,
      service_name: undefined,
      professional_id: 0,
      insurance_type_id: 0,
      scheduled_date: requestDate,
      scheduled_time: '',
      estimated_duration: 30,
      unit_price: 0,
      quantity: 1,
      discount_percentage: 0,
      discount_amount: 0,
      preparation_instructions: '',
      notes: ''
    }
    setServices([...services, newService])
  }

  const removeServiceFromCart = (id: string) => {
    setServices(services.filter(service => service.id !== id))
  }

  const updateService = useCallback((id: string, field: keyof ServiceItem, value: string | number) => {
    setServices(services.map(service => {
      if (service.id === id) {
        const updated = { ...service, [field]: value }
        
        // Auto-update price when service changes
        if (field === 'medical_service_id') {
          const selectedService = flatServices.find(s => s.value === value)
          if (selectedService) {
            // Si ya hay un tipo de seguro seleccionado, usar el precio específico
            if (service.insurance_type_id > 0) {
              updated.unit_price = getServicePriceFromData(selectedService, service.insurance_type_id)
            } else {
              updated.unit_price = selectedService.base_price
            }
            updated.estimated_duration = selectedService.estimated_duration || 30
          }
        }
        
        // Auto-update price when insurance type changes
        if (field === 'insurance_type_id' && service.medical_service_id > 0) {
          const selectedService = flatServices.find(s => s.value === service.medical_service_id)
          if (selectedService) {
            updated.unit_price = getServicePriceFromData(selectedService, Number(value))
          }
        }
        
        return updated
      }
      return service
    }))
  }, [services, flatServices, getServicePriceFromData])

  const calculateServiceTotal = (service: ServiceItem) => {
    const unitPrice = service.unit_price || 0
    const quantity = service.quantity || 1
    const subtotal = unitPrice * quantity
    const discountFromPercentage = (subtotal * (service.discount_percentage || 0)) / 100
    const totalDiscount = discountFromPercentage + (service.discount_amount || 0)
    return Math.max(0, subtotal - totalDiscount)
  }

  const calculateSubtotal = () => {
    return services.reduce((total, service) => {
      const unitPrice = service.unit_price || 0
      const quantity = service.quantity || 1
      return total + (unitPrice * quantity)
    }, 0)
  }

  const calculateTotalDiscount = () => {
    return services.reduce((total, service) => {
      const unitPrice = service.unit_price || 0
      const quantity = service.quantity || 1
      const subtotal = unitPrice * quantity
      const discountFromPercentage = (subtotal * (service.discount_percentage || 0)) / 100
      const totalDiscount = discountFromPercentage + (service.discount_amount || 0)
      return total + totalDiscount
    }, 0)
  }

  const calculateGrandTotal = () => {
    const total = services.reduce((total, service) => total + calculateServiceTotal(service), 0)
    return isNaN(total) ? 0 : total
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedPatient || services.length === 0) {
      return
    }

    const formData = {
      patient_id: selectedPatient.id,
      reception_type: receptionType,
      priority,
      request_date: requestDate,
      request_time: requestTime || undefined,
      notes: notes || undefined,
      services: services.map(service => ({
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

    createServiceRequest(formData)
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Recepcion - Solicitud de Servicio" />
      
      <div className="min-h-screen bg-gray-50">
        {/* Shopping Cart Style Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl  px-4 sm:px-6 lg:px-6">
            <div className="py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Recepción - Servicios Médicos</h1>
                    <p className="text-sm text-gray-500">Agregar servicios al carrito</p>
                  </div>
                  
                  {/* Patient Info Pill */}
                  {selectedPatient && (
                    <div className="bg-blue-50 border border-blue-200 rounded-full px-4 py-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-blue-700">Paciente:</span>
                        <span className="text-sm text-blue-600">{selectedPatient.name}</span>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Quick Actions */}
                <div className="flex items-right space-x-3">
                  <span className="text-sm text-gray-500">{services.length} servicio{services.length !== 1 ? 's' : ''}</span>
                  <button
                    type="button"
                    onClick={() => window.history.back()}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="max-w-12xl mx-auto px-4 sm:px-6 lg:px-2 py-3">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            
            {/* Main Cart Area - Left Side */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Patient Selection */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    1. Seleccionar Paciente
                  </h2>
                  <button
                    type="button"
                    onClick={() => setExpandedPatient(!expandedPatient)}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    <svg className={`h-5 w-5 transform transition-transform ${expandedPatient ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </button>
                </div>
                
                {expandedPatient && (
                  <SearchableInput
                    placeholder="Buscar paciente por nombre, documento..."
                    value={selectedPatient?.name || ''}
                    onSelect={handlePatientSelect}
                    onSearch={searchPatients}
                    className="w-full"
                  />
                )}
              </div>

              {/* Basic Info */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    2. Información de la Solicitud
                  </h2>
                  <button
                    type="button"
                    onClick={() => setExpandedInfo(!expandedInfo)}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    <svg className={`h-5 w-5 transform transition-transform ${expandedInfo ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </button>
                </div>
                
                {expandedInfo && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo
                    </label>
                    <SelectItem
                      value={receptionType}
                      onValueChange={setReceptionType}
                      required
                    >
                      {getReceptionTypeOptions().map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </SelectItem>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prioridad
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hora
                    </label>
                    <input
                      type="time"
                      value={requestTime}
                      onChange={(e) => setRequestTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                )}
              </div>

              {/* Services Cart */}
              <div className="bg-white rounded-lg shadow-sm p-6 relative z-0">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    3. Servicios Solicitados
                  </h2>
                  <button
                    type="button"
                    onClick={addServiceToCart}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Agregar
                  </button>
                </div>

                {services.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <PlusIcon className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-lg font-medium">Carrito vacío</p>
                    <p className="text-sm">Agrega servicios para comenzar</p>
                  </div>
                ) : (
                  <ServiceCartTable
                    services={services}
                    flatServices={flatServices}
                    professionals={professionalOptions}
                    insuranceTypes={insuranceOptions}
                    onUpdate={updateService}
                    onRemove={removeServiceFromCart}
                    onServiceSelect={handleServiceSelect}
                    onSearchServices={searchServices}
                    calculateTotal={calculateServiceTotal}
                    getServicePriceFromData={getServicePriceFromData}
                  />
                )}
              </div>

              {/* Notes */}
              {selectedPatient && services.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    4. Notas Adicionales
                  </h2>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Notas adicionales sobre la solicitud..."
                  />
                </div>
              )}
            </div>

            {/* Right Sidebar - Totals & Actions */}
            <div className="lg:col-span-1">
              <div className="sticky top-6 space-y-6">
                
                {/* Total Display LED */}
                <div className="bg-white rounded-lg shadow-sm p-4 max-w-xs">
                  <TotalDisplay 
                    total={calculateGrandTotal()} 
                    subtotal={calculateSubtotal()}
                    discount={calculateTotalDiscount()}
                    currency="₲"
                    size="sm"
                  />
                </div>
 
                

                {/* Action Buttons */}
                <div className="bg-white rounded-lg shadow-sm p-6 max-w-xs">
                  <div className="space-y-3">
                    <button
                      type="submit"
                      disabled={loading || !selectedPatient || services.length === 0}
                      className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Procesando...' : 'Confimar Solicitud'}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => window.history.back()}
                      className="w-full py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="text-sm text-red-700">{error}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}