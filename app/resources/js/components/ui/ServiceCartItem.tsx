import { useEffect } from 'react'
import SearchableInput from '@/components/ui/SearchableInput'
import { useSearch } from '@/hooks/medical'
import { useServicePricing } from '@/hooks/medical'

interface ServiceItem {
  id: string
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

// interface SelectOption {
//   value: string | number
//   label: string
// }

interface ServiceCartItemProps {
  service: ServiceItem
  index: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  flatServices: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  professionals: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  insuranceTypes: any[]
  onUpdate: (id: string, field: keyof ServiceItem, value: string | number) => void
  onRemove: (id: string) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onServiceSelect: (service: any, serviceItemId: string) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSearchServices: (query: string) => Promise<any[]>
  calculateTotal: (service: ServiceItem) => number
}

const TrashIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

export default function ServiceCartItem({
  service,
  index,
  flatServices,
  professionals,
  insuranceTypes,
  onUpdate,
  onRemove,
  onServiceSelect,
  onSearchServices,
  calculateTotal
}: ServiceCartItemProps) {
  const { searchProfessionals } = useSearch()
  const { getServicePrice } = useServicePricing()
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleServiceSelection = (selectedService: any) => {
    onServiceSelect(selectedService, service.id)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleProfessionalSelection = (selectedProfessional: any) => {
    onUpdate(service.id, 'professional_id', selectedProfessional.value || selectedProfessional.id)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleInsuranceSelection = (selectedInsurance: any) => {
    onUpdate(service.id, 'insurance_type_id', selectedInsurance.value || selectedInsurance.id)
  }

  // Effect to fetch price when service or insurance changes
  useEffect(() => {
    if (service.medical_service_id > 0 && service.insurance_type_id > 0) {
      const fetchPrice = async () => {
        try {
          const price = await getServicePrice(service.medical_service_id, service.insurance_type_id)
          if (price !== null && price !== undefined && price > 0) {
            onUpdate(service.id, 'unit_price', price)
          }
        } catch (error) {
          console.error('Error fetching service price:', error)
        }
      }

      fetchPrice()
    }
  }, [service.medical_service_id, service.insurance_type_id, service.id, onUpdate, getServicePrice])

  // Local search for insurance types
  const searchInsuranceTypes = async (query: string) => {
    if (!Array.isArray(insuranceTypes) || insuranceTypes.length === 0) {
      return []
    }
    
    // If query is empty, return all insurance types
    if (!query || query.trim() === '') {
      return insuranceTypes.map(i => ({
        id: i.value || i.id,
        label: i.label || i.name || '',
      }))
    }
    
    // Filter by query
    return insuranceTypes
      .filter(i => {
        const label = (i.label || i.name || '').toLowerCase()
        return label.includes(query.toLowerCase())
      })
      .map(i => ({
        id: i.value || i.id,
        label: i.label || i.name || '',
      }))
  }

  const selectedService = flatServices.find(s => s.value === service.medical_service_id)

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      {/* Service Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 text-sm font-medium">
            {index + 1}
          </span>
          <h3 className="font-medium text-gray-900">
            {selectedService ? selectedService.label : 'Nuevo Servicio'}
          </h3>
        </div>
        
        <button
          type="button"
          onClick={() => onRemove(service.id)}
          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
          title="Eliminar servicio"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Service Selection Row */}
      <div className="grid grid-cols-2 md:grid-cols-2 gap-4 mb-4">
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Servicio Médico *
          </label>
          <SearchableInput
            placeholder="Buscar servicio por nombre..."
            value={selectedService?.label || ''}
            onSelect={handleServiceSelection}
            onSearch={onSearchServices}
            className="w-full"
          />
        </div>
         <div className="md:col-span-1 max-w-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Seguro *
          </label>
          <SearchableInput
            placeholder="Seguro..."
            value={service.insurance_type_id > 0 ? insuranceTypes.find(i => (i.value || i.id) === service.insurance_type_id)?.label || '' : ''}
            onSelect={handleInsuranceSelection}
            onSearch={searchInsuranceTypes}
            minSearchLength={1}
            maxResults={10}
            className="w-full"
          />
        </div>
      </div>

      {/* Service Details Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Profesional *
          </label>
          <SearchableInput
            placeholder="Buscar profesional..."
            value={service.professional_id > 0 ? professionals.find(p => (p.value || p.id) === service.professional_id)?.label || '' : ''}
            onSelect={handleProfessionalSelection}
            onSearch={searchProfessionals}
            minSearchLength={1}
            maxResults={10}
            className="w-full"
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
            value={service.quantity || 1}
            onChange={(e) => onUpdate(service.id, 'quantity', Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Precio Unit.
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500 text-sm">₲</span>
            <input
              type="number"
              min="0"
              value={service.unit_price || 0}
              readOnly
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Total Row */}
      <div className="flex justify-between items-center pt-3 border-t border-gray-200">
        <span className="text-sm font-medium text-gray-700">Subtotal:</span>
        <span className="text-lg font-bold text-indigo-600">
          ₲ {(() => {
            const total = calculateTotal(service)
            return (isNaN(total) ? 0 : total).toLocaleString('es-PY')
          })()}
        </span>
      </div>
    </div>
  )
}