import React from 'react'
import { Head, Link, router } from '@inertiajs/react'
import { ColumnDef } from '@tanstack/react-table'
import { PlusCircle, Pencil, Eye, Trash2, Users, Calendar, Phone, Shield } from 'lucide-react'
import HeadingSmall from '@/components/heading-small'
import AppLayout from '@/layouts/app-layout'
import { DataTable } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { Patient, PaginatedData } from '@/types/medical'
import { type BreadcrumbItem } from '@/types'

interface PatientsIndexProps {
  patients: PaginatedData<Patient>
  stats: {
    total: number
    active: number
    inactive: number
    with_insurance: number
    recent_appointments: number
  }
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
  {
    title: 'Pacientes',
    href: '/medical/patients',
  },
]

export default function PatientsIndex({ 
  patients, 
  stats,
}: PatientsIndexProps) {
  const handleDelete = async (id: number) => {
    try {
      router.delete(`/medical/patients/${id}`, {
        preserveScroll: true,
        onSuccess: () => {
          toast.success('Paciente eliminado correctamente')
        },
        onError: () => {
          toast.error('Error al eliminar el paciente')
        },
      })
    } catch {
      toast.error('Error al eliminar el paciente')
    }
  }

  const columns: ColumnDef<Patient>[] = [
    {
      accessorKey: 'first_name',
      header: 'Nombre',
      cell: ({ row }) => (
        <div className="font-medium">
          {row.getValue('first_name')} {row.original.last_name}
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => {
        const email = row.getValue('email') as string
        return (
          <div className="text-sm text-gray-600">
            {email || 'Sin email'}
          </div>
        )
      },
    },
    {
      accessorKey: 'phone',
      header: 'Teléfono',
      cell: ({ row }) => {
        const phone = row.getValue('phone') as string
        return (
          <div className="text-sm text-gray-600">
            {phone || 'Sin teléfono'}
          </div>
        )
      },
    },
    {
      accessorKey: 'birth_date',
      header: 'Fecha de Nacimiento',
      cell: ({ row }) => {
        const birthDate = row.getValue('birth_date') as string
        return (
          <div className="text-sm text-gray-600">
            {birthDate ? new Date(birthDate).toLocaleDateString() : 'No especificada'}
          </div>
        )
      },
    },
    {
      accessorKey: 'insurance_info',
      header: 'Seguro',
      cell: ({ row }) => {
        const insuranceInfo = row.original.insurance_info
        const primaryInsurance = row.original.primary_insurance_info
        const totalInsurances = row.original.total_insurances || 0
        
        if (primaryInsurance) {
          return (
            <div className="flex items-center gap-1">
              <Badge variant="outline">
                {primaryInsurance.name}
              </Badge>
              {totalInsurances > 1 && (
                <Badge variant="secondary" className="text-xs">
                  +{totalInsurances - 1} más
                </Badge>
              )}
            </div>
          )
        } else if (insuranceInfo && insuranceInfo !== 'Sin seguro válido') {
          return (
            <Badge variant="outline">
              {insuranceInfo}
            </Badge>
          )
        } else {
          return (
            <span className="text-sm text-gray-400">Sin seguro</span>
          )
        }
      },
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => {
        const status = row.getValue('status') as string
        return (
          <Badge variant={status === 'active' ? 'default' : 'secondary'}>
            {status === 'active' ? 'Activo' : 'Inactivo'}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Registrado',
      cell: ({ row }) => {
        const date = new Date(row.getValue('created_at'))
        return <div className="text-sm text-gray-600">{date.toLocaleDateString()}</div>
      },
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => {
        const patient = row.original
        return (
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="ghost">
              <Link href={`/medical/patients/${patient.id}`}>
                <Eye className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="sm" variant="ghost">
              <Link href={`/medical/patients/${patient.id}/edit`}>
                <Pencil className="h-4 w-4" />
              </Link>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción eliminará permanentemente el paciente "{patient.first_name} {patient.last_name}".
                    Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDelete(patient.id)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )
      },
    },
  ]

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Pacientes - Sistema Médico" />

      <div className="space-y-6">
        <HeadingSmall
          title="Pacientes"
          description="Gestión de pacientes y sus datos médicos"
        />

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pacientes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                Pacientes registrados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activos</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <p className="text-xs text-muted-foreground">
                Pacientes activos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Con Seguro</CardTitle>
              <Shield className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.with_insurance}</div>
              <p className="text-xs text-muted-foreground">
                Tienen seguro médico
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Citas Recientes</CardTitle>
              <Calendar className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.recent_appointments}</div>
              <p className="text-xs text-muted-foreground">
                Últimos 30 días
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contacto</CardTitle>
              <Phone className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {patients.data.filter(p => p.phone).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Con teléfono registrado
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Action Bar */}
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-semibold leading-none tracking-tight">
                  Listado de Pacientes
                </h3>
                <p className="text-sm text-muted-foreground">
                  Gestiona los pacientes y su información médica
                </p>
              </div>
              <Button asChild>
                <Link href="/medical/patients/create">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Nuevo Paciente
                </Link>
              </Button>
            </div>
          </div>

          <div className="p-6 pt-0">
            {/* Data Table */}
            <DataTable
              data={patients}
              columns={columns}
              searchPlaceholder="Buscar por nombre, email o teléfono..."
              searchKey="search"
            />
          </div>
        </div>
      </div>
    </AppLayout>
  )
}