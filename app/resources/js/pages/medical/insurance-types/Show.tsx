import React from 'react'
import { Head, Link } from '@inertiajs/react'
import { ArrowLeft, Shield, Users, Pencil, Calendar, Activity } from 'lucide-react'
import HeadingSmall from '@/components/heading-small'
import AppLayout from '@/layouts/app-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { InsuranceType, Patient, InsuranceTypeStats } from '@/types/medical'
import { type BreadcrumbItem } from '@/types'

interface InsuranceTypesShowProps {
  insuranceType: InsuranceType
  stats: InsuranceTypeStats
  recentPatients: Patient[]
}

const breadcrumbs = (insuranceType: InsuranceType): BreadcrumbItem[] => [
  {
    title: 'Dashboard',
    href: '/dashboard',
  },
  {
    title: 'Sistema Médico',
    href: '/medical',
  },
  {
    title: 'Tipos de Seguro',
    href: '/medical/insurance-types',
  },
  {
    title: insuranceType.name,
    href: `/medical/insurance-types/${insuranceType.id}`,
  },
]

export default function InsuranceTypesShow({ 
  insuranceType, 
  stats,
  recentPatients 
}: InsuranceTypesShowProps) {
  return (
    <AppLayout breadcrumbs={breadcrumbs(insuranceType)}>
      <Head title={`${insuranceType.name} - Sistema Médico`} />

      <div className="space-y-6">
        <HeadingSmall
          title={insuranceType.name}
          description="Información detallada del tipo de seguro médico"
        />

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/medical/insurance-types">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Listado
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/medical/insurance-types/${insuranceType.id}/edit`}>
              <Pencil className="h-4 w-4 mr-2" />
              Editar
            </Link>
          </Button>
        </div>

        {/* Main Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Información Básica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Nombre</label>
                <p className="text-lg font-semibold">{insuranceType.name}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Porcentaje de Cobertura</label>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-blue-600">
                    {insuranceType.coverage_percentage}%
                  </span>
                  <Badge variant={insuranceType.coverage_percentage >= 80 ? 'default' : 'secondary'}>
                    {insuranceType.coverage_percentage >= 80 ? 'Cobertura Alta' : 'Cobertura Parcial'}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Estado</label>
                <div>
                  <Badge variant={insuranceType.active ? 'default' : 'secondary'}>
                    {insuranceType.active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </div>

              {insuranceType.description && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Descripción</label>
                  <p className="text-gray-900">{insuranceType.description}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-500">Fecha de Creación</label>
                <p className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {new Date(insuranceType.created_at).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-600" />
                Estadísticas de Uso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{stats.total_patients}</div>
                  <div className="text-sm text-gray-600">Total Pacientes</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.active_patients}</div>
                  <div className="text-sm text-gray-600">Pacientes Activos</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{stats.total_services}</div>
                  <div className="text-sm text-gray-600">Servicios Utilizados</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {stats.total_revenue ? `$${stats.total_revenue.toLocaleString()}` : '$0'}
                  </div>
                  <div className="text-sm text-gray-600">Ingresos Total</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Patients */}
        {recentPatients.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Pacientes Recientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentPatients.map((patient) => (
                  <div key={patient.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {patient.first_name} {patient.last_name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {patient.email || patient.phone || 'Sin contacto'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={patient.status === 'active' ? 'default' : 'secondary'}>
                        {patient.status === 'active' ? 'Activo' : 'Inactivo'}
                      </Badge>
                      <p className="text-sm text-gray-600 mt-1">
                        {patient.insurance_number || 'Sin número de póliza'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/medical/patients?insurance_type=${insuranceType.id}`}>
                    Ver Todos los Pacientes con este Seguro
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}