import { Head } from '@inertiajs/react'
import { useState, useEffect, useRef } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import AppLayout from '@/layouts/app-layout'
import { router } from '@inertiajs/react'
import { useServiceCodeGenerator } from '@/hooks/medical'

// Icons
const ArrowLeftIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
)

const RefreshIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
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

// Schema de validación
const medicalServiceSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  code: z.string().optional(),
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
  code: string
}

interface ServicePrice {
  id: string
  insurance_type_id: number
  price: number
  effective_from: string
  effective_until?: string
  notes?: string
}

interface CreateMedicalServiceProps {
  categories: ServiceCategory[]
  statusOptions: StatusOption[]
  insuranceTypes?: InsuranceType[]
}

export default function CreateMedicalService({ 
  categories, 
  statusOptions,
  insuranceTypes = []
}: CreateMedicalServiceProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [prices, setPrices] = useState<ServicePrice[]>([])
  const [showPricesSection, setShowPricesSection] = useState(false)
  
  // Hook para generación automática de código
  const {
    generatedCode,
    isGenerating,
    isCodeEditable,
    error: codeError,
    generateCode,
    setCodeEditable,
  } = useServiceCodeGenerator()

  const breadcrumbs = [
    { href: '/medical', title: 'Sistema Médico' },
    { href: '/medical/medical-services', title: 'Servicios Médicos' },
    { href: '/medical/medical-services/create', title: 'Nuevo Servicio', current: true }
  ]

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    control,
  } = useForm<MedicalServiceFormData>({
    resolver: zodResolver(medicalServiceSchema),
    defaultValues: {
      requires_appointment: false,
      requires_preparation: false,
      default_commission_percentage: 0,
      status: 'active',
      code: '', // Valor inicial controlado
    },
  })

  const requiresPreparation = watch('requires_preparation')
  const serviceName = useWatch({ control, name: 'name', defaultValue: '' })
  const categoryId = useWatch({ control, name: 'category_id', defaultValue: '' })

  // Ref para evitar llamadas duplicadas
  const lastCodeGeneration = useRef({ name: '', categoryId: '' })

  // Generar código automáticamente cuando cambia el nombre o categoría
  useEffect(() => {
    const currentName = serviceName || ''
    const currentCategoryId = categoryId || ''
    
    // Solo generar si:
    // 1. El nombre tiene al menos 3 caracteres
    // 2. Hay una categoría seleccionada
    // 3. No se está editando manualmente el código
    // 4. Los valores han cambiado desde la última generación
    if (
      currentName.length >= 3 && 
      currentCategoryId && 
      !isCodeEditable &&
      (lastCodeGeneration.current.name !== currentName || lastCodeGeneration.current.categoryId !== currentCategoryId)
    ) {
      // Guardar los valores actuales para evitar duplicados
      lastCodeGeneration.current = { name: currentName, categoryId: currentCategoryId }
      
      generateCode({
        name: currentName,
        categoryId: currentCategoryId
      })
    }
  }, [serviceName, categoryId, isCodeEditable, generateCode])

  // Actualizar el campo 'code' cuando llegue generatedCode
  useEffect(() => {
    if (generatedCode && !isCodeEditable) {
      setValue('code', generatedCode)
    }
  }, [generatedCode, isCodeEditable, setValue])

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
        code: data.code || generatedCode, // Usar código generado si no se especifica uno manualmente
        category_id: Number(data.category_id),
        preparation_instructions: data.requires_preparation ? (data.preparation_instructions || '') : '', // Asegurar que siempre esté presente
        prices: prices.map(price => ({
          insurance_type_id: price.insurance_type_id,
          price: price.price,
          effective_from: price.effective_from,
          effective_until: price.effective_until || null,
          notes: price.notes || null,
        }))
      }
      
      router.post('/medical/medical-services', formData, {
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
      <Head title="Nuevo Servicio Médico" />
      
      <div className="p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.get('/medical/medical-services')}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Nuevo Servicio Médico</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Registra un nuevo servicio médico y configura sus precios por seguro
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Información Básica */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-6">Información Básica</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Servicio *
                  </label>
                  <input
                    type="text"
                    {...register('name')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Ej: Consulta Médica General"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código del Servicio
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        {...register('code')}
                        onClick={() => {
                          if (!isCodeEditable) {
                            setCodeEditable(true)
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Ej: CMG-001"
                        readOnly={!isCodeEditable && !!generatedCode}
                      />
                      {generatedCode && !isCodeEditable && (
                        <p className="mt-1 text-xs text-green-600 flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Código único generado automáticamente. Haz clic para personalizarlo.
                        </p>
                      )}
                      {isCodeEditable && (
                        <p className="mt-1 text-xs text-amber-600 flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          Modo manual: Asegúrate de que el código sea único.
                        </p>
                      )}
                      {codeError && (
                        <p className="mt-1 text-xs text-red-500">
                          {codeError}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => generateCode({ name: serviceName, categoryId })}
                      disabled={isGenerating || !serviceName}
                      className="px-3 py-2 border border-gray-300 rounded-md text-gray-600 hover:text-gray-800 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                      title={isCodeEditable ? "Volver a generar automáticamente" : "Regenerar código único"}
                    >
                      <RefreshIcon className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                  {errors.code && (
                    <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>
                  )}
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

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Describe el servicio médico..."
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Configuración del Servicio */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-6">Configuración</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duración (minutos) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    {...register('duration_minutes', { valueAsNumber: true })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="30"
                  />
                  {errors.duration_minutes && (
                    <p className="mt-1 text-sm text-red-600">{errors.duration_minutes.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comisión por Defecto (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    {...register('default_commission_percentage', { valueAsNumber: true })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="0.00"
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
                    {statusOptions.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                  {errors.status && (
                    <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
                  )}
                </div>
              </div>

              <div className="mt-6 space-y-4">
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
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  {showPricesSection ? 'Ocultar' : 'Configurar Precios'}
                </button>
              </div>

              {showPricesSection && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-gray-500">
                      Configura los precios del servicio para diferentes tipos de seguro
                    </p>
                    <button
                      type="button"
                      onClick={addPrice}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Agregar Precio
                    </button>
                  </div>

                  {prices.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No hay precios configurados</p>
                      <p className="text-sm">Los precios se pueden configurar después de crear el servicio</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {prices.map((price, index) => (
                        <div key={price.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-medium text-gray-900">Precio #{index + 1}</h4>
                            <button
                              type="button"
                              onClick={() => removePrice(price.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tipo de Seguro
                              </label>
                              <select
                                value={price.insurance_type_id}
                                onChange={(e) => updatePrice(price.id, 'insurance_type_id', Number(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                                Precio (₲)
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={price.price}
                                onChange={(e) => updatePrice(price.id, 'price', Number(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Vigente Hasta
                              </label>
                              <input
                                type="date"
                                value={price.effective_until || ''}
                                onChange={(e) => updatePrice(price.id, 'effective_until', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>
                          </div>

                          <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Notas
                            </label>
                            <textarea
                              value={price.notes || ''}
                              onChange={(e) => updatePrice(price.id, 'notes', e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              placeholder="Notas adicionales sobre este precio..."
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Botones de Acción */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.get('/medical/medical-services')}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Guardando...' : 'Crear Servicio'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  )
}

