import React from 'react'
import { Head, Link } from '@inertiajs/react'
import { ArrowLeft, User, Heart, Shield, Calendar, Phone, Mail, MapPin } from 'lucide-react'
import HeadingSmall from '@/components/heading-small'
import AppLayout from '@/layouts/app-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Patient } from '@/types/medical'
import { type BreadcrumbItem } from '@/types'

interface PatientsShowProps {
  patient: Patient
}

export default function PatientsShow({ patient }: PatientsShowProps) {
  const breadcrumbs: BreadcrumbItem[] = [
    {
      title: 'Dashboard',
      href: '/dashboard',
    },
    {
      title: 'Sistema Médico',
      href: '/medical',
    },
    {
      title: 'Pacientes',
      href: '/medical/patients',
    },
    {
      title: `${patient.first_name} ${patient.last_name}`,
      href: `/medical/patients/${patient.id}`,
    },
  ]

  const getAge = (birthDate: string) => {
    if (!birthDate) return 'No especificada'
    try {
      // Manejar tanto fecha como timestamp
      const today = new Date()
      const birth = new Date(birthDate)
      
      if (isNaN(birth.getTime())) {
        return 'Fecha inválida'
      }
      
      let age = today.getFullYear() - birth.getFullYear()
      const monthDiff = today.getMonth() - birth.getMonth()
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--
      }
      
      return `${age} años`
    } catch {
      return 'Error al calcular'
    }
  }

  const getGenderLabel = (gender: string) => {
    const genderMap: { [key: string]: string } = {
      'M': 'Masculino',
      'F': 'Femenino',
      'OTHER': 'Otro',
      'male': 'Masculino',
      'female': 'Femenino',
      'other': 'Otro',
    }
    return genderMap[gender] || 'No especificado'
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`${patient.first_name} ${patient.last_name} - Pacientes`} />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <HeadingSmall
            title={`${patient.first_name} ${patient.last_name}`}
            description="Información detallada del paciente"
          />
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/medical/patients/${patient.id}/edit`}>
                Editar Paciente
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/medical/patients">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Link>
            </Button>
          </div>
        </div>

        {/* Estado del Paciente */}
        <div className="flex items-center gap-4">
          <Badge variant={patient.status === 'active' ? 'default' : 'secondary'} className="text-sm px-3 py-1">
            {patient.status === 'active' ? 'Activo' : 'Inactivo'}
          </Badge>
          {patient.insurance_type && (
            <Badge variant="outline" className="text-sm px-3 py-1">
              <Shield className="h-3 w-3 mr-1" />
              {patient.insurance_type.name}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Información Personal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Información Personal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Nombre Completo</p>
                  <p className="text-base">{patient.first_name} {patient.last_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Estado</p>
                  <Badge variant={patient.status === 'active' ? 'default' : 'secondary'}>
                    {patient.status === 'active' ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Fecha de Nacimiento</p>
                  <p className="text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {patient.birth_date 
                      ? new Date(patient.birth_date).toLocaleDateString('es-PY', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : 'No especificada'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Edad</p>
                  <p className="text-base">
                    {patient.birth_date ? getAge(patient.birth_date) : 'No calculable'}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Género</p>
                <p className="text-base">
                  {getGenderLabel(patient.gender || '')}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Registrado</p>
                <p className="text-base">
                  {new Date(patient.created_at).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Información de Contacto */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Información de Contacto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-base flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {patient.email || 'No registrado'}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Teléfono</p>
                <p className="text-base flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {patient.phone || 'No registrado'}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Dirección</p>
                <p className="text-base flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-1" />
                  <span>
                    {patient.address || 'No registrada'}
                    {patient.city && (
                      <span className="block text-sm text-gray-600">
                        {patient.city}
                      </span>
                    )}
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contacto de Emergencia */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Contacto de Emergencia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Nombre del Contacto</p>
                <p className="text-base">
                  {patient.emergency_contact_name || 'No registrado'}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Teléfono de Emergencia</p>
                <p className="text-base flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {patient.emergency_contact_phone || 'No registrado'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Información de Seguro */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Información de Seguro
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {patient.insurance_type ? (
                <>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Tipo de Seguro</p>
                    <p className="text-base font-medium">
                      {patient.insurance_type.name}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500">Cobertura</p>
                    <Badge variant="outline" className="text-sm">
                      {patient.insurance_type.coverage_percentage}% de cobertura
                    </Badge>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500">Número de Póliza</p>
                    <p className="text-base font-mono">
                      {patient.insurance_number || 'No registrado'}
                    </p>
                  </div>

                  {patient.insurance_type.description && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Descripción</p>
                      <p className="text-sm text-gray-600">
                        {patient.insurance_type.description}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-6">
                  <Shield className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500">No tiene seguro registrado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}