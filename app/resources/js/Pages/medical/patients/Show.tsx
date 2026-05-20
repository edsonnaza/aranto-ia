import { Head, Link } from '@inertiajs/react'
import { ArrowLeft, Shield } from 'lucide-react'
import HeadingSmall from '@/components/heading-small'
import AppLayout from '@/layouts/app-layout'
import PatientSidebarCard from '@/components/medical/PatientSidebarCard'
import MedicalTimeline from '@/components/medical/MedicalTimeline'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PlusCircle } from 'lucide-react'
import { Patient } from '@/types/medical'
import { type BreadcrumbItem } from '@/types'

interface PatientsShowProps {
  patient: Patient
  medicalRecords?: any[]
}

export default function PatientsShow({ patient, medicalRecords = [] }: PatientsShowProps) {
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
            <Button asChild>
              <Link href={`/medical/patients/${patient.id}/medical-records/create`} className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                Nueva Consulta
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

        <div className="lg:flex lg:items-start lg:gap-6">
          <aside className="hidden lg:block">
            <PatientSidebarCard patient={patient} />
          </aside>

          <main className="flex-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Historia Clínica / Consultas</span>
                  <span className="text-sm text-muted-foreground">Total: {medicalRecords.length}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MedicalTimeline records={medicalRecords} />
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </AppLayout>
  )
}