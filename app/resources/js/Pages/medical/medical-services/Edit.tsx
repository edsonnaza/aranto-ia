import { Head } from '@inertiajs/react'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import AppLayout from '@/layouts/app-layout'
import { router } from '@inertiajs/react'

// Icons
const ArrowLeftIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
)

const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
)

const TrashIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

// Schema de validación (código no editable)
const medicalServiceSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  description: z.string().optional(),
  category_id: z.string().min(1, 'Debe seleccionar una categoría'),
  duration_minutes: z.number().min(1, 'La duración debe ser mayor a 0'),
  requires_appointment: z.boolean(),
  requires_preparation: z.boolean(),
  preparation_instructions: z.string().optional(),
  default_commission_percentage: z.number().min(0).max(100),
  status: z.string().min(1, 'Debe seleccionar un estado'),
})

type MedicalServiceFormData = z.infer<typeof medicalServiceSchema>

interface ServiceCategory {
  id: number
  name: string
}

interface StatusOption {
  value: string
  label: string
}

interface InsuranceType {
  id: number
  name: string
  code?: string
}

interface ServicePrice {
  id: string
  insurance_type_id: number
  price: number
  effective_from: string
  effective_until?: string
  notes?: string
}

interface MedicalService {
  id: number
  name: string
  code: string
  description?: string
  category_id?: number
  duration_minutes: number
  requires_appointment: boolean
  requires_preparation: boolean
  preparation_instructions?: string
  default_commission_percentage: number
  status: 'active' | 'inactive'
  prices?: Array<{
    id: number
    insurance_type_id: number
    price: string
    effective_from: string
    effective_until?: string
    notes?: string
    insurance_type: {
      id: number
      name: string
    }
  }>
  category?: {
    id: number
    name: string
  }
}

interface EditMedicalServiceProps {
  service: MedicalService
  categories: ServiceCategory[]
  statusOptions: StatusOption[]
  insuranceTypes: InsuranceType[]
}

export default function EditMedicalService({ 
  service,
  categories, 
  statusOptions,
  insuranceTypes = []
}: EditMedicalServiceProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [prices, setPrices] = useState<ServicePrice[]>([])
  const [showPricesSection, setShowPricesSection] = useState(false)

  const breadcrumbs = [
    { href: '/medical', title: 'Sistema Médico' },
    { href: '/medical/medical-services', title: 'Servicios Médicos' },
    { href: `/medical/medical-services/${service.id}`, title: service.name },
    { href: `/medical/medical-services/${service.id}/edit`, title: 'Editar', current: true }
  ]

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<MedicalServiceFormData>({
    resolver: zodResolver(medicalServiceSchema),
    defaultValues: {
      name: service.name,
      description: service.description || '',
      category_id: service.category_id?.toString() || '',
      duration_minutes: service.duration_minutes,
      requires_appointment: service.requires_appointment,
      requires_preparation: service.requires_preparation,
      preparation_instructions: service.preparation_instructions || '',
      default_commission_percentage: service.default_commission_percentage,
      status: service.status,
    },
  })

  const requiresPreparation = watch('requires_preparation')

  // Inicializar precios existentes
  useEffect(() => {
    if (service.prices && service.prices.length > 0) {
      const existingPrices = service.prices.map((price) => ({
        id: `existing-${price.id}`,
        insurance_type_id: price.insurance_type_id,
        price: parseFloat(price.price),
        effective_from: price.effective_from,
        effective_until: price.effective_until || '',
        notes: price.notes || '',
      }))
      setPrices(existingPrices)
      setShowPricesSection(true)
    }
  }, [service.prices])

  const addPrice = () => {
    const newPrice: ServicePrice = {
      id: Date.now().toString(),
      insurance_type_id: 0,
      price: 0,
      effective_from: new Date().toISOString().split('T')[0],
      notes: ''
    }
    setPrices([...prices, newPrice])
  }

  const removePrice = (id: string) => {
    setPrices(prices.filter(price => price.id !== id))
  }

  const updatePrice = (id: string, field: keyof ServicePrice, value: string | number) => {
    setPrices(prices.map(price => 
      price.id === id ? { ...price, [field]: value } : price
    ))
  }

  const onSubmit = async (data: MedicalServiceFormData) => {
    setIsSubmitting(true)
    
    try {
      const formData = {
        ...data,
        category_id: Number(data.category_id),
        preparation_instructions: data.requires_preparation ? (data.preparation_instructions || '') : '',
        prices: prices.map(price => ({
          insurance_type_id: price.insurance_type_id,
          price: price.price,
          effective_from: price.effective_from,
          effective_until: price.effective_until || null,
          notes: price.notes || null,
        }))
      }
      
      router.put(`/medical/medical-services/${service.id}`, formData, {
        onSuccess: () => {
          // Router will handle redirect
        },
        onError: (errors) => {
          console.error('Errores de validación:', errors)
        },
        onFinish: () => setIsSubmitting(false)
      })
    } catch (error) {
      console.error('Error:', error)
      setIsSubmitting(false)
    }
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Editar ${service.name}`} />
      
      <div className="p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.get('/medical/medical-services')}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Editar Servicio Médico</h1>
                <p className="text-gray-600">{service.name}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Información Básica */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Información Básica</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Servicio *
                  </label>
                  <input
                    type="text"
                    {...register('name')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Ej: Consulta General"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código del Servicio *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={service.code}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H8m13-9a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    El código se generó automáticamente y no se puede modificar para mantener la unicidad.
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Descripción detallada del servicio..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoría *
                  </label>
                  <select
                    {...register('category_id')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Seleccionar categoría...</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {errors.category_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.category_id.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duración (minutos) *
                  </label>
                  <input
                    type="number"
                    {...register('duration_minutes', { valueAsNumber: true })}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="30"
                  />
                  {errors.duration_minutes && (
                    <p className="mt-1 text-sm text-red-600">{errors.duration_minutes.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comisión por Defecto (%) *
                  </label>
                  <input
                    type="number"
                    {...register('default_commission_percentage', { valueAsNumber: true })}
                    min="0"
                    max="100"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="10.00"
                  />
                  {errors.default_commission_percentage && (
                    <p className="mt-1 text-sm text-red-600">{errors.default_commission_percentage.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado *
                  </label>
                  <select
                    {...register('status')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.status && (
                    <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Configuración de Citas */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Configuración de Citas</h2>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('requires_appointment')}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">
                    Requiere cita previa
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('requires_preparation')}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">
                    Requiere preparación del paciente
                  </label>
                </div>

                {requiresPreparation && (
                  <div className="ml-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Instrucciones de Preparación
                    </label>
                    <textarea
                      {...register('preparation_instructions')}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Describe las instrucciones que debe seguir el paciente..."
                    />
                    {errors.preparation_instructions && (
                      <p className="mt-1 text-sm text-red-600">{errors.preparation_instructions.message}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Precios por Seguro - Opcional */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">Precios por Tipo de Seguro</h2>
                <button
                  type="button"
                  onClick={() => setShowPricesSection(!showPricesSection)}
                  className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
                >
                  {showPricesSection ? 'Ocultar' : 'Mostrar'} Sección de Precios
                </button>
              </div>

              {showPricesSection && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Configure precios específicos para diferentes tipos de seguros. Si no configura precios aquí, 
                    podrá hacerlo más tarde desde la vista del servicio.
                  </p>

                  {prices.map((price) => (
                    <div key={price.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tipo de Seguro
                          </label>
                          <select
                            value={price.insurance_type_id}
                            onChange={(e) => updatePrice(price.id, 'insurance_type_id', Number(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          >
                            <option value={0}>Seleccionar...</option>
                            {insuranceTypes.map((insurance) => (
                              <option key={insurance.id} value={insurance.id}>
                                {insurance.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Precio (BOB)
                          </label>
                          <input
                            type="number"
                            value={price.price}
                            onChange={(e) => updatePrice(price.id, 'price', Number(e.target.value))}
                            min="0"
                            step="0.01"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Vigente Desde
                          </label>
                          <input
                            type="date"
                            value={price.effective_from}
                            onChange={(e) => updatePrice(price.id, 'effective_from', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          />
                        </div>

                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={() => removePrice(price.id)}
                            className="p-2 text-red-600 hover:text-red-800"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Vigente Hasta (opcional)
                          </label>
                          <input
                            type="date"
                            value={price.effective_until}
                            onChange={(e) => updatePrice(price.id, 'effective_until', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notas (opcional)
                          </label>
                          <input
                            type="text"
                            value={price.notes}
                            onChange={(e) => updatePrice(price.id, 'notes', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            placeholder="Notas adicionales..."
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addPrice}
                    className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors flex items-center justify-center"
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Agregar Precio
                  </button>
                </div>
              )}
            </div>

            {/* Botones de Acción */}
            <div className="flex items-center justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={() => router.get('/medical/medical-services')}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Guardando...' : 'Actualizar Servicio'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  )
}