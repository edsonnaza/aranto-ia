import React from 'react'
import { Link, usePage } from '@inertiajs/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User, Phone, Mail, Shield, Heart, Calendar} from 'lucide-react'
import { calculateAge, formatBirthDate } from '@/utils/date-utils'

export default function PatientSidebarCard({ patient }: any) {
  const page: any = usePage()
  const user = page.props?.auth?.user
  const roles = user?.roles || []
  const permissions = user?.permissions || []
  const isDoctor = roles.some((r: any) => r.name === 'doctor') || permissions.includes('medical.record.create')

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
    <div className="w-[320px]">
      <div className="sticky top-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User className="h-4 w-4"/> Información Clínica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm text-gray-500">Nombre</div>
              <div className="font-medium">{patient.first_name} {patient.last_name}</div>
            </div>
             <div>
                <p className="text-sm font-medium text-gray-500">Fecha de Nacimiento</p>
                <p className="text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatBirthDate(patient.birth_date)}
                </p>
            </div>

            <div>
              <div className="text-sm text-gray-500">Edad</div>
             <p className="text-base">
                {patient.birth_date ? calculateAge(patient.birth_date) : 'No calculable'}
            </p>
            </div>

            <div>
              <div className="text-sm text-gray-500">Documento</div>
              <div className="font-mono text-sm">{patient.document_number || '—'}</div>
            </div>

            <div>
              <div className="text-sm text-gray-500">Sexo</div>
              <div>

                  <p className="text-base">{getGenderLabel(patient.gender || '')}</p>
                </div>
            </div>

            <div className="pt-2">
              {isDoctor && (
                <Link href={`/medical/patients/${patient.id}/medical-records/create`} className="block">
                  <Button className="w-full">Nueva Consulta</Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Phone className="h-4 w-4"/> Contacto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">{patient.phone || 'No registrado'}</div>
            <div className="text-sm mt-2 flex items-center gap-2"><Mail className="h-4 w-4"/>{patient.email || 'No registrado'}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Heart className="h-4 w-4"/> Emergencia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">{patient.emergency_contact_name || '—'}</div>
            <div className="text-sm mt-1">{patient.emergency_contact_phone || '—'}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Shield className="h-4 w-4"/> Seguro</CardTitle>
          </CardHeader>
          <CardContent>
            {patient.insurance_type ? (
              <div>
                <div className="text-sm font-medium">{patient.insurance_type.name}</div>
                <div className="text-sm text-gray-500">Cobertura: {patient.insurance_type.coverage_percentage}%</div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">Sin seguro registrado</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">Historial</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href={`/medical/patients/${patient.id}/vitals`} className="block">
              <Button className="w-full">Ver historial de signos</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
