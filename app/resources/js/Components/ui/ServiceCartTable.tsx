import { useState, useEffect, useRef } from 'react'
import SearchableInput from '@/components/ui/SearchableInput'
import { useSearch, useServicePricing } from '@/hooks/medical'
import { useCurrencyFormatter } from '@/stores/currency'

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

interface ServiceCartTableProps {
  services: ServiceItem[]
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getServicePriceFromData?: (serviceData: any, insuranceTypeId: number) => number
}

const TrashIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

export default function ServiceCartTable({
  services,
  flatServices,
  professionals,
  insuranceTypes,
  onUpdate,
  onRemove,
  onServiceSelect,
  onSearchServices,
  calculateTotal,
  getServicePriceFromData
}: ServiceCartTableProps) {
  const { searchProfessionals } = useSearch()
  const { getServicePrice } = useServicePricing()
  const { format: formatCurrency, parse: parseCurrency, config: currencyConfig } = useCurrencyFormatter()
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const debounceTimersRef = useRef<Record<string, NodeJS.Timeout>>({})
  // Local state for discount inputs to show user input immediately
  const [localDiscountPercentage, setLocalDiscountPercentage] = useState<Record<string, string>>({})
  const [localDiscountAmount, setLocalDiscountAmount] = useState<Record<string, string>>({})

  // Helper function to format number with thousand separators (no currency symbol)
  const formatNumberDisplay = (value: number | string): string => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(numValue)) return ''
    
    const hasDecimals = numValue % 1 !== 0
    const decimalPlaces = hasDecimals ? 2 : 0
    const fixedAmount = numValue.toFixed(decimalPlaces)
    const [integerPart, decimalPart] = fixedAmount.split('.')
    
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, currencyConfig.thousandsSeparator)
    
    if (hasDecimals && decimalPart) {
      return formattedInteger + currencyConfig.decimalSeparator + decimalPart
    }
    return formattedInteger
  }

  // Debounced discount handlers
  const handleDiscountPercentageChange = (serviceId: string, percentage: number, service: ServiceItem) => {
    // Update local state immediately for user feedback
    setLocalDiscountPercentage(prev => ({
      ...prev,
      [serviceId]: percentage.toString()
    }))

    // Clear existing timer for this service
    if (debounceTimersRef.current[`pct-${serviceId}`]) {
      clearTimeout(debounceTimersRef.current[`pct-${serviceId}`])
    }

    // Set new timer for debounced update
    debounceTimersRef.current[`pct-${serviceId}`] = setTimeout(() => {
      onUpdate(serviceId, 'discount_percentage', percentage)
      // Auto-calculate discount amount
      const subtotal = service.unit_price * service.quantity
      const amount = (subtotal * percentage) / 100
      onUpdate(serviceId, 'discount_amount', amount)
      // Clear local amount since we're updating it
      setLocalDiscountAmount(prev => ({
        ...prev,
        [serviceId]: amount.toString()
      }))
    }, 300)
  }

  // Handle discount amount change
  const handleDiscountAmountChange = (serviceId: string, amount: number, service: ServiceItem) => {
    // Update local state immediately for user feedback
    setLocalDiscountAmount(prev => ({
      ...prev,
      [serviceId]: amount.toString()
    }))

    // Clear existing timer for this service
    if (debounceTimersRef.current[`amt-${serviceId}`]) {
      clearTimeout(debounceTimersRef.current[`amt-${serviceId}`])
    }

    // Set new timer for debounced update
    debounceTimersRef.current[`amt-${serviceId}`] = setTimeout(() => {
      onUpdate(serviceId, 'discount_amount', amount)
      // Auto-calculate percentage
      const subtotal = service.unit_price * service.quantity
      const percentage = subtotal > 0 ? (amount / subtotal) * 100 : 0
      onUpdate(serviceId, 'discount_percentage', Math.min(percentage, 100))
      // Clear local percentage since we're updating it
      setLocalDiscountPercentage(prev => ({
        ...prev,
        [serviceId]: Math.min(percentage, 100).toString()
      }))
    }, 300)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleServiceSelection = (selectedService: any, serviceItemId: string) => {
    onServiceSelect(selectedService, serviceItemId)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleProfessionalSelection = (selectedProfessional: any, serviceItemId: string) => {
    onUpdate(serviceItemId, 'professional_id', selectedProfessional.value || selectedProfessional.id)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleInsuranceSelection = (selectedInsurance: any, serviceItemId: string) => {
    onUpdate(serviceItemId, 'insurance_type_id', selectedInsurance.value || selectedInsurance.id)
    
    // Auto-update price when insurance changes - fetch from service_prices via API
    const service = services.find(s => s.id === serviceItemId)
    
    if (service && service.medical_service_id > 0) {
      const insuranceId = selectedInsurance.value || selectedInsurance.id
      
      // Call API to get price from service_prices table
      getServicePrice(service.medical_service_id, insuranceId)
        .then((price) => {
          // Only update if price changed and is valid
          if (price && price > 0 && price !== service.unit_price) {
            console.log('🟢 Insurance selected - Setting price from API:', price)
            onUpdate(serviceItemId, 'unit_price', price)
          } else if ((!price || price === 0) && getServicePriceFromData) {
            // Fallback to local data if API returns 0
            const selectedServiceData = flatServices.find(fs => fs.value === service.medical_service_id)
            if (selectedServiceData) {
              const localPrice = getServicePriceFromData(selectedServiceData, insuranceId)
              if (localPrice && localPrice > 0 && localPrice !== service.unit_price) {
                console.log('🟢 Insurance selected - Setting price from local data:', localPrice)
                onUpdate(serviceItemId, 'unit_price', localPrice)
              }
            }
          }
        })
        .catch((error) => {
          console.error('🔴 Error fetching price from service_prices:', error)
          // Fallback to local data on error
          if (getServicePriceFromData) {
            const selectedServiceData = flatServices.find(fs => fs.value === service.medical_service_id)
            if (selectedServiceData) {
              const localPrice = getServicePriceFromData(selectedServiceData, insuranceId)
              if (localPrice && localPrice > 0 && localPrice !== service.unit_price) {
                onUpdate(serviceItemId, 'unit_price', localPrice)
              }
            }
          }
        })
    }
  }

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

  // Effect to load prices when service or insurance changes for each service item
  useEffect(() => {
    services.forEach((service) => {
      // Only load price if both service and insurance are selected
      if (service.medical_service_id > 0 && service.insurance_type_id > 0) {
        // Call API to fetch price from service_prices table
        getServicePrice(service.medical_service_id, service.insurance_type_id)
          .then((price) => {
            // Only update if the price is different from current value
            // This prevents infinite loop
            if (price && price > 0 && price !== service.unit_price) {
              console.log('🟡 Auto-loading price from API:', { serviceId: service.medical_service_id, insuranceId: service.insurance_type_id, price })
              onUpdate(service.id, 'unit_price', price)
            } else if ((!price || price === 0) && getServicePriceFromData) {
              // Try local data if API returns 0
              const selectedServiceData = flatServices.find(fs => fs.value === service.medical_service_id)
              if (selectedServiceData) {
                const localPrice = getServicePriceFromData(selectedServiceData, service.insurance_type_id)
                if (localPrice && localPrice > 0 && localPrice !== service.unit_price) {
                  console.log('🟡 Auto-loading price from local data:', localPrice)
                  onUpdate(service.id, 'unit_price', localPrice)
                }
              }
            }
          })
          .catch((error) => {
            console.error('🔴 Error auto-loading price:', error)
            // Fallback to local data on error
            if (getServicePriceFromData) {
              const selectedServiceData = flatServices.find(fs => fs.value === service.medical_service_id)
              if (selectedServiceData) {
                const localPrice = getServicePriceFromData(selectedServiceData, service.insurance_type_id)
                if (localPrice && localPrice > 0 && localPrice !== service.unit_price) {
                  onUpdate(service.id, 'unit_price', localPrice)
                }
              }
            }
          })
      }
    })
  }, [services, flatServices, getServicePrice, getServicePriceFromData, onUpdate])

  const selectedService = (serviceId: number) => {
    return flatServices.find(s => s.value === serviceId)
  }

  const selectedProfessional = (professionalId: number) => {
    return professionals.find(p => p.value === professionalId)
  }

  const selectedInsurance = (insuranceId: number) => {
    return insuranceTypes.find(i => i.value === insuranceId)
  }

  if (services.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-lg font-medium">Carrito vacío</p>
        <p className="text-sm">Agrega servicios para comenzar</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm min-h-50 flex flex-col">
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Servicio</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Profesional</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Seguro</th>
              <th className="px-4 py-3 text-center font-medium text-gray-700">Cant.</th>
              <th className="px-4 py-3 text-right font-medium text-gray-700">Precio Unit.</th>
              <th className="px-4 py-3 text-right font-medium text-gray-700">Descuento</th>
              <th className="px-4 py-3 text-right font-medium text-gray-700">Total</th>
              <th className="px-4 py-3 text-center font-medium text-gray-700"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {services.map((service) => (
              <tr key={service.id} className="hover:bg-gray-50 transition-colors">
                {/* Service Name */}
                <td className="px-4 py-4">
                  <div className="w-96">
                    <SearchableInput
                      placeholder="Buscar servicio..."
                      value={selectedService(service.medical_service_id)?.label || ''}
                      onSelect={(s) => handleServiceSelection(s, service.id)}
                      onSearch={onSearchServices}
                      className="w-full"
                    />
                  </div>
                </td>

                {/* Professional */}
                <td className="px-4 py-4">
                  <div className="w-48">
                    <SearchableInput
                      placeholder="Profesional..."
                      value={selectedProfessional(service.professional_id)?.label || ''}
                      onSelect={(p) => handleProfessionalSelection(p, service.id)}
                      onSearch={searchProfessionals}
                      minSearchLength={1}
                      maxResults={10}
                      className="w-full"
                    />
                  </div>
                </td>

                {/* Insurance */}
                <td className="px-4 py-4">
                  <div className="w-40 relative z-50">
                    <SearchableInput
                      placeholder="Seguro..."
                      value={selectedInsurance(service.insurance_type_id)?.label || ''}
                      onSelect={(i) => handleInsuranceSelection(i, service.id)}
                      onSearch={searchInsuranceTypes}
                      minSearchLength={1}
                      maxResults={20}
                      className="w-full"
                    />
                  </div>
                </td>

                {/* Quantity */}
                <td className="px-4 py-4 text-center">
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={service.quantity || 1}
                    onChange={(e) => onUpdate(service.id, 'quantity', Number(e.target.value))}
                    className="w-16 px-2 py-2 border border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </td>

                {/* Unit Price */}
                <td className="px-4 py-4 text-right">
                  <div className="flex items-center justify-end">
                    <input
                      type="text"
                      value={formatCurrency(service.unit_price || 0)}
                      readOnly
                      className="w-32 px-2 py-2 border border-gray-300 rounded-md text-right bg-gray-100 text-gray-600 cursor-not-allowed"
                    />
                  </div>
                </td>

                {/* Discount - Expandable */}
                <td className="px-4 py-4 text-right">
                  <button
                    type="button"
                    onClick={() => setExpandedRow(expandedRow === service.id ? null : service.id)}
                    className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                  >
                    {service.discount_percentage > 0 || service.discount_amount > 0
                      ? formatCurrency(service.discount_amount || 0)
                      : 'Agregar'}
                  </button>
                </td>

                {/* Total */}
                <td className="px-4 py-4 text-right">
                  <span className="font-bold text-indigo-600">
                    {formatCurrency(calculateTotal(service))}
                  </span>
                </td>

                {/* Delete Button */}
                <td className="px-4 py-4 text-center">
                  <button
                    type="button"
                    onClick={() => onRemove(service.id)}
                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                    title="Eliminar servicio"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Discount Expansion Panel */}
      {expandedRow && (
        <div className="border-t border-gray-200 bg-gray-50 p-4">
          {services.map(service => {
            if (service.id !== expandedRow) return null
            
            const serviceName = service.service_name || 'Servicio'
            
            return (
              <div key={service.id} className="max-w-md">
                <h4 className="font-medium text-gray-900 mb-4">
                  Descuentos para: {serviceName}
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {/* Discount Percentage */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descuento (%)
                    </label>
                    <input
                      type="text"
                      value={localDiscountPercentage[service.id] !== undefined ? localDiscountPercentage[service.id] : (service.discount_percentage || '')}
                      onChange={(e) => {
                        const val = e.target.value === '' ? 0 : Number(e.target.value)
                        if (!isNaN(val) && val >= 0 && val <= 100) {
                          handleDiscountPercentageChange(service.id, val, service)
                        }
                      }}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Discount Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descuento (₲)
                    </label>
                    <input
                      type="text"
                      value={localDiscountAmount[service.id] !== undefined ? formatNumberDisplay(localDiscountAmount[service.id]) : (service.discount_amount ? formatNumberDisplay(service.discount_amount) : '')}
                      onChange={(e) => {
                        const val = parseCurrency(e.target.value)
                        if (!isNaN(val) && val >= 0) {
                          handleDiscountAmountChange(service.id, val, service)
                        }
                      }}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Calculation Display */}
                <div className="mt-4 p-3 bg-white rounded-md border border-gray-200">
                  <div className="text-sm space-y-1 text-gray-600">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="font-medium">{formatCurrency(service.unit_price * service.quantity)}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>Descuento:</span>
                      <span className="font-medium">-{formatCurrency(service.discount_amount || 0)}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-1 mt-1 flex justify-between font-bold text-indigo-600">
                      <span>Total:</span>
                      <span>{formatCurrency(calculateTotal(service))}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    // Clear local discount values when closing panel
                    setLocalDiscountPercentage(prev => {
                      const newState = { ...prev }
                      delete newState[service.id]
                      return newState
                    })
                    setLocalDiscountAmount(prev => {
                      const newState = { ...prev }
                      delete newState[service.id]
                      return newState
                    })
                    setExpandedRow(null)
                  }}
                  className="mt-4 w-full py-2 px-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md font-medium transition-colors"
                >
                  Cerrar
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
