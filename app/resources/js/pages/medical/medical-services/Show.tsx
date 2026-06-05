import { Head } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'
import { router } from '@inertiajs/react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
//import { useEffect } from 'react'

// Icons
const ArrowLeftIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
)

const PencilIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)

const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const CalendarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const DocumentTextIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

const CurrencyDollarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
  </svg>
)

// Tipos
interface ServiceCategory {
  id: number
  name: string
  description?: string
}

interface InsuranceType {
  id: number
  name: string
  code: string
}

interface ServicePrice {
  id: number
  price: number
  effective_from: string
  effective_until?: string
  notes?: string
  insurance_type: InsuranceType
  created_at: string
  updated_at: string
}

interface PriceByInsurance {
  insurance: InsuranceType
  current_price?: ServicePrice
  has_price: boolean
}

interface MedicalService {
  id: number
  name: string
  code?: string
  description?: string
  duration_minutes: number
  requires_appointment: boolean
  requires_preparation: boolean
  preparation_instructions?: string
  default_commission_percentage: number
  status: string
  created_at: string
  updated_at: string
  category: ServiceCategory
  total_prices_count: number
  active_prices_count: number
}

interface ShowMedicalServiceProps {
  service: MedicalService
  pricesByInsurance: PriceByInsurance[]
  recentPrices: ServicePrice[]
  insuranceTypes: InsuranceType[]
}

const StatusBadge = ({ status }: { status: string }) => {
  const colors = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
  }

  const labels = {
    active: 'Activo',
    inactive: 'Inactivo',
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status as keyof typeof colors] || colors.inactive}`}>
      {labels[status as keyof typeof labels] || status}
    </span>
  )
}

export default function ShowMedicalService({ 
  service, 
  pricesByInsurance, 
  recentPrices 
}: ShowMedicalServiceProps) {
  const breadcrumbs = [
    { href: '/medical', title: 'Sistema Médico' },
    { href: '/medical/medical-services', title: 'Servicios Médicos' },
    { href: `/medical/medical-services/${service.id}`, title: service.name, current: true }
  ]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: es })
  }

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy 'a las' HH:mm", { locale: es })
  }

  const activePrices = pricesByInsurance.filter(item => item.has_price)

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Servicio: ${service.name}`} />
      
      <div className="p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
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
                <div className="flex items-center space-x-3">
                  <h1 className="text-2xl font-semibold text-gray-900">{service.name}</h1>
                  <StatusBadge status={service.status} />
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Detalles del servicio médico
                  {service.code && <span> • Código: {service.code}</span>}
                </p>
              </div>
            </div>
            <button
              onClick={() => router.get(`/medical/medical-services/${service.id}/edit`)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              Editar
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4H7a2 2 0 01-2-2v-4a2 2 0 012-2h10a2 2 0 012 2v4a2 2 0 01-2 2zm2-6a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Imprimir
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Información básica */}
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-6">Información Básica</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Categoría</label>
                    <p className="text-sm text-gray-900">{service.category.name}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Duración</label>
                    <div className="flex items-center text-sm text-gray-900">
                      <ClockIcon className="h-4 w-4 mr-2 text-gray-400" />
                      {service.duration_minutes} minutos
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Comisión por Defecto</label>
                    <p className="text-sm text-gray-900">{service.default_commission_percentage}%</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Estado</label>
                    <StatusBadge status={service.status} />
                  </div>
                </div>

                {service.description && (
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-500 mb-2">Descripción</label>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{service.description}</p>
                  </div>
                )}
              </div>

              {/* Configuración */}
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-6">Configuración</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <CalendarIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <span className={`text-sm ${service.requires_appointment ? 'text-green-600' : 'text-gray-500'}`}>
                      {service.requires_appointment ? 'Requiere cita previa' : 'No requiere cita previa'}
                    </span>
                  </div>
                  
                  <div className="flex items-start">
                    <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <span className={`text-sm ${service.requires_preparation ? 'text-orange-600' : 'text-gray-500'}`}>
                        {service.requires_preparation ? 'Requiere preparación del paciente' : 'No requiere preparación'}
                      </span>
                      {service.requires_preparation && service.preparation_instructions && (
                        <p className="mt-2 text-sm text-gray-600 pl-0 whitespace-pre-wrap">
                          {service.preparation_instructions}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Precios por Seguro */}
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-medium text-gray-900">Precios por Tipo de Seguro</h2>
                  <div className="flex items-center text-sm text-gray-500">
                    <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                    {activePrices.length} precio(s) configurado(s)
                  </div>
                </div>

                <div className="space-y-4">
                  {pricesByInsurance.map((item) => (
                    <div key={item.insurance.id} className={`border rounded-lg p-4 ${item.has_price ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{item.insurance.name}</h4>
                          <p className="text-sm text-gray-500">Código: {item.insurance.code}</p>
                        </div>
                        <div className="text-right">
                          {item.has_price && item.current_price ? (
                            <>
                              <p className="text-lg font-semibold text-green-700">
                                {formatCurrency(item.current_price.price)}
                              </p>
                              <p className="text-xs text-gray-500">
                                Vigente desde: {formatDate(item.current_price.effective_from)}
                                {item.current_price.effective_until && (
                                  <span> hasta: {formatDate(item.current_price.effective_until)}</span>
                                )}
                              </p>
                            </>
                          ) : (
                            <p className="text-sm text-gray-400">Sin precio configurado</p>
                          )}
                        </div>
                      </div>
                      {item.current_price?.notes && (
                        <p className="mt-2 text-sm text-gray-600">{item.current_price.notes}</p>
                      )}
                    </div>
                  ))}
                </div>

                {activePrices.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <CurrencyDollarIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p>No hay precios configurados para este servicio</p>
                    <p className="text-sm">Use el botón "Editar" para agregar precios</p>
                  </div>
                )}
              </div>

              {/* Historial de Precios */}
              {recentPrices.length > 0 && (
                <div className="bg-white shadow rounded-lg p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-6">Historial Reciente de Precios</h2>
                  <div className="space-y-3">
                    {recentPrices.slice(0, 5).map((price) => (
                      <div key={price.id} className="border border-gray-100 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">{price.insurance_type.name}</h4>
                            <p className="text-xs text-gray-500">
                              {formatDateTime(price.created_at)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">{formatCurrency(price.price)}</p>
                            <p className="text-xs text-gray-500">
                              {formatDate(price.effective_from)}
                              {price.effective_until && ` - ${formatDate(price.effective_until)}`}
                            </p>
                          </div>
                        </div>
                        {price.notes && (
                          <p className="mt-1 text-xs text-gray-600">{price.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Estadísticas */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Estadísticas</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Precios activos</span>
                    <span className="text-sm font-medium text-gray-900">{service.active_prices_count}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Total precios</span>
                    <span className="text-sm font-medium text-gray-900">{service.total_prices_count}</span>
                  </div>
                </div>
              </div>

              {/* Información de registro */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Información de Registro</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-500">Creado:</span>
                    <p className="text-gray-900">{formatDateTime(service.created_at)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Última modificación:</span>
                    <p className="text-gray-900">{formatDateTime(service.updated_at)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          
          @page {
            size: A4;
            margin: 0.5cm;
          }
          
          /* Ocultar elementos no necesarios para impresión */
          .print\\:hidden,
          button,
          .bg-white.shadow:first-child,
          .flex.items-center.justify-between:first-of-type {
            display: none !important;
          }
          
          /* Estilos para impresión */
          .print-container {
            width: 14.8cm; /* Mitad de A4 ancho */
            height: 10.5cm;
            page-break-after: avoid;
            border: 1px solid #000;
            padding: 0.5cm;
            font-family: Arial, sans-serif;
            font-size: 11pt;
          }
          
          .print-header {
            text-align: center;
            margin-bottom: 0.3cm;
            font-weight: bold;
            font-size: 13pt;
            border-bottom: 2px solid #000;
            padding-bottom: 0.2cm;
          }
          
          .print-section {
            margin-bottom: 0.3cm;
            page-break-inside: avoid;
          }
          
          .print-label {
            font-weight: bold;
            font-size: 10pt;
            color: #333;
          }
          
          .print-value {
            font-size: 10pt;
            color: #000;
          }
          
          .print-row {
            display: flex;
            justify-content: space-between;
            page-break-inside: avoid;
            margin-bottom: 0.15cm;
          }
          
          .print-row-label {
            flex: 0 0 40%;
            font-weight: 600;
            font-size: 10pt;
          }
          
          .print-row-value {
            flex: 0 0 60%;
            text-align: right;
            font-size: 10pt;
          }
          
          /* Mostrar solo lo necesario */
          .lg\\:col-span-2 {
            display: block !important;
            width: 100%;
            max-width: none;
          }
          
          .grid {
            display: block !important;
          }
          
          .space-y-6 > * + * {
            margin-top: 0 !important;
          }
          
          /* Estilos generales para impresión */
          * {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </AppLayout>
  )
}