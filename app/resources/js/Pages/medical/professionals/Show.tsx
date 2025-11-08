import React from 'react'
import { Head, router } from '@inertiajs/react'
import { formatCurrency } from '@/lib/utils'
import { formatPercentage } from '@/utils/formatters'

// Layout
import AppLayout from '@/layouts/app-layout'

// UI Components
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft, 
  User, 
  Edit, 
  Mail, 
  Phone, 
  MapPin,
  GraduationCap,
  CreditCard,
  Stethoscope,
  DollarSign,
  Calendar,
  TrendingUp,
  Activity
} from 'lucide-react'

// Types
interface MedicalService {
  id: number
  name: string
  code: string
  pivot?: {
    created_at: string
  }
}

interface Commission {
  id: number
  commission_amount: string
  created_at: string
  patient: {
    id: number
    first_name: string
    last_name: string
  }
}

interface Professional {
  id: number
  first_name: string
  last_name: string
  identification: string
  email: string
  phone?: string
  specialty: string
  license_number: string
  commission_percentage: number
  address?: string
  is_active: boolean
  created_at: string
  services?: MedicalService[]
  commissions?: Commission[]
}

interface CommissionStats {
  total_amount: string
  total_count: number
  current_month: string
  avg_per_service: string
}

interface Props {
  professional: Professional
  commissionStats: CommissionStats
}

export default function Show({ professional, commissionStats }: Props) {
  const fullName = `${professional.first_name} ${professional.last_name}`

  return (
    <AppLayout>
      <Head title={`Profesional - ${fullName}`} />
      
      <div className="py-6">
        <div className="max-w-6xl mx-auto sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.visit('/medical/professionals')}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft size={16} />
                  Volver
                </Button>
                <div className="flex items-center gap-2">
                  <User className="text-blue-600" size={24} />
                  <div>
                    <h1 className="text-2xl font-semibold text-gray-900">
                      {fullName}
                    </h1>
                    <p className="text-sm text-gray-600">{professional.specialty}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Badge 
                  variant={professional.is_active ? "default" : "secondary"}
                  className={professional.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                >
                  {professional.is_active ? 'Activo' : 'Inactivo'}
                </Badge>
                <Button
                  onClick={() => router.visit(`/medical/professionals/${professional.id}/edit`)}
                  className="flex items-center gap-2"
                >
                  <Edit size={16} />
                  Editar
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Professional Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User size={20} />
                    Información Personal
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Identificación</label>
                      <p className="text-gray-900">{professional.identification}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Nombres</label>
                      <p className="text-gray-900">{professional.first_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Apellidos</label>
                      <p className="text-gray-900">{professional.last_name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={16} className="text-gray-400" />
                      <div>
                        <label className="text-sm font-medium text-gray-500">Email</label>
                        <p className="text-gray-900">
                          <a 
                            href={`mailto:${professional.email}`}
                            className="text-blue-600 hover:underline"
                          >
                            {professional.email}
                          </a>
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {professional.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={16} className="text-gray-400" />
                      <div>
                        <label className="text-sm font-medium text-gray-500">Teléfono</label>
                        <p className="text-gray-900">
                          <a 
                            href={`tel:${professional.phone}`}
                            className="text-blue-600 hover:underline"
                          >
                            {professional.phone}
                          </a>
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {professional.address && (
                    <div className="flex items-start gap-2">
                      <MapPin size={16} className="text-gray-400 mt-0.5" />
                      <div>
                        <label className="text-sm font-medium text-gray-500">Dirección</label>
                        <p className="text-gray-900">{professional.address}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Professional Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap size={20} />
                    Información Profesional
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Stethoscope size={16} className="text-gray-400" />
                      <div>
                        <label className="text-sm font-medium text-gray-500">Especialidad</label>
                        <p className="text-gray-900">{professional.specialty}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CreditCard size={16} className="text-gray-400" />
                      <div>
                        <label className="text-sm font-medium text-gray-500">Licencia</label>
                        <p className="text-gray-900">{professional.license_number}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign size={16} className="text-gray-400" />
                      <div>
                        <label className="text-sm font-medium text-gray-500">Comisión</label>
                        <p className="text-gray-900">{formatPercentage(professional.commission_percentage)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-gray-400" />
                      <div>
                        <label className="text-sm font-medium text-gray-500">Registrado</label>
                        <p className="text-gray-900">
                          {new Date(professional.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Services */}
              {professional.services && professional.services.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity size={20} />
                      Servicios Médicos
                      <Badge variant="secondary">{professional.services.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {professional.services.map((service) => (
                        <div
                          key={service.id}
                          className="p-3 rounded-lg border border-gray-200 bg-gray-50"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">{service.name}</p>
                              <p className="text-sm text-gray-500">{service.code}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent Commissions */}
              {professional.commissions && professional.commissions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign size={20} />
                      Comisiones Recientes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {professional.commissions.map((commission) => (
                        <div key={commission.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
                          <div>
                            <p className="font-medium text-gray-900">
                              {commission.patient.first_name} {commission.patient.last_name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(commission.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-green-600">
                              {formatCurrency(parseFloat(commission.commission_amount))}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Commission Statistics */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp size={20} />
                    Estadísticas de Comisiones
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(parseFloat(commissionStats.total_amount))}
                    </p>
                    <p className="text-sm text-gray-600">Total Comisiones</p>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Este Mes</span>
                      <span className="font-medium">
                        {formatCurrency(parseFloat(commissionStats.current_month))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Servicios Realizados</span>
                      <span className="font-medium">{commissionStats.total_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Promedio por Servicio</span>
                      <span className="font-medium">
                        {formatCurrency(parseFloat(commissionStats.avg_per_service || '0'))}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Acciones Rápidas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => router.visit(`/medical/professionals/${professional.id}/edit`)}
                  >
                    <Edit size={16} className="mr-2" />
                    Editar Información
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => router.visit(`/medical/professionals/${professional.id}/commissions`)}
                  >
                    <DollarSign size={16} className="mr-2" />
                    Ver Comisiones
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => window.print()}
                  >
                    <User size={16} className="mr-2" />
                    Imprimir Ficha
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}