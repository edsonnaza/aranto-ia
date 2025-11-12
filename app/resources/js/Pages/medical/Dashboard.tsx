import React from 'react'
import { Head, Link } from '@inertiajs/react'
import { Users, Shield, Heart, UserCheck, Calendar, Activity, TrendingUp, AlertCircle, ClipboardList, Plus } from 'lucide-react'
import HeadingSmall from '@/components/heading-small'
import AppLayout from '@/layouts/app-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { type BreadcrumbItem } from '@/types'

interface MedicalDashboardProps {
  stats: {
    total_patients: number
    active_patients: number
    total_professionals: number
    active_professionals: number
    total_insurance_types: number
    total_service_categories: number
    total_services: number
    recent_appointments: number
    monthly_revenue: number
    pending_appointments: number
  }
  recentActivity: Array<{
    id: number
    type: 'patient' | 'appointment' | 'service'
    description: string
    created_at: string
  }>
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
  },
  {
    title: 'Sistema Médico',
    href: '/medical',
  },
]

export default function MedicalDashboard({ stats, recentActivity = [] }: MedicalDashboardProps) {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Sistema Médico - Dashboard" />

      <div className="space-y-6">
        <HeadingSmall
          title="Sistema Médico"
          description="Panel de control y estadísticas del sistema médico"
        />

        {/* Main Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pacientes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_patients}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">{stats.active_patients}</span> activos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profesionales</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_professionals}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">{stats.active_professionals}</span> disponibles
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Servicios Médicos</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_services}</div>
              <p className="text-xs text-muted-foreground">
                En {stats.total_service_categories} categorías
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Mensuales</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats.monthly_revenue?.toLocaleString() || '0'}
              </div>
              <p className="text-xs text-muted-foreground">
                Este mes
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions and Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                Acciones Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-2">
                <Button asChild className="justify-start">
                  <Link href="/medical/reception">
                    <ClipboardList className="h-4 w-4 mr-2" />
                    Dashboard de Recepción
                  </Link>
                </Button>
                
                <Button asChild className="justify-start">
                  <Link href="/medical/reception/create">
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Solicitud de Servicio
                  </Link>
                </Button>
                
                <Button asChild variant="outline" className="justify-start">
                  <Link href="/medical/service-requests">
                    <Calendar className="h-4 w-4 mr-2" />
                    Ver Solicitudes de Servicio
                  </Link>
                </Button>
                
                <Button asChild variant="outline" className="justify-start">
                  <Link href="/medical/patients/create">
                    <Users className="h-4 w-4 mr-2" />
                    Registrar Nuevo Paciente
                  </Link>
                </Button>
                
                <Button asChild variant="outline" className="justify-start">
                  <Link href="/medical/insurance-types">
                    <Shield className="h-4 w-4 mr-2" />
                    Gestionar Tipos de Seguro
                  </Link>
                </Button>
                
                <Button asChild variant="outline" className="justify-start">
                  <Link href="/medical/service-categories">
                    <Activity className="h-4 w-4 mr-2" />
                    Categorías de Servicios
                  </Link>
                </Button>
                
                <Button asChild variant="outline" className="justify-start">
                  <Link href="/medical/professionals">
                    <UserCheck className="h-4 w-4 mr-2" />
                    Ver Profesionales
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Status and Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                Estado del Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Citas Pendientes</span>
                  <Badge variant={stats.pending_appointments > 0 ? 'destructive' : 'default'}>
                    {stats.pending_appointments}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Citas Recientes</span>
                  <Badge variant="outline">
                    {stats.recent_appointments}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Tipos de Seguro</span>
                  <Badge variant="outline">
                    {stats.total_insurance_types}
                  </Badge>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <Button asChild variant="outline" className="w-full">
                  <Link href="/medical/reports">
                    Ver Reportes Completos
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-green-600" />
                Actividad Reciente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-center gap-4 p-3 border rounded-lg">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      {activity.type === 'patient' && <Users className="h-4 w-4 text-blue-600" />}
                      {activity.type === 'appointment' && <Calendar className="h-4 w-4 text-green-600" />}
                      {activity.type === 'service' && <Heart className="h-4 w-4 text-red-600" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.description}</p>
                      <p className="text-xs text-gray-600">
                        {new Date(activity.created_at).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {activity.type === 'patient' && 'Paciente'}
                      {activity.type === 'appointment' && 'Cita'}
                      {activity.type === 'service' && 'Servicio'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation Links */}
        <Card>
          <CardHeader>
            <CardTitle>Módulos Disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link 
                href="/medical/patients" 
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-blue-600 group-hover:text-blue-700" />
                  <div>
                    <h3 className="font-medium">Pacientes</h3>
                    <p className="text-sm text-gray-600">Gestión de pacientes</p>
                  </div>
                </div>
              </Link>

              <Link 
                href="/medical/professionals" 
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <UserCheck className="h-8 w-8 text-green-600 group-hover:text-green-700" />
                  <div>
                    <h3 className="font-medium">Profesionales</h3>
                    <p className="text-sm text-gray-600">Médicos y especialistas</p>
                  </div>
                </div>
              </Link>

              <Link 
                href="/medical/insurance-types" 
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Shield className="h-8 w-8 text-purple-600 group-hover:text-purple-700" />
                  <div>
                    <h3 className="font-medium">Seguros</h3>
                    <p className="text-sm text-gray-600">Tipos de seguro</p>
                  </div>
                </div>
              </Link>

              <Link 
                href="/medical/medical-services" 
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Heart className="h-8 w-8 text-red-600 group-hover:text-red-700" />
                  <div>
                    <h3 className="font-medium">Servicios</h3>
                    <p className="text-sm text-gray-600">Servicios médicos</p>
                  </div>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}