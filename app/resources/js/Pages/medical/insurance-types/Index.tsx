import React from 'react'
import { Head, Link, router } from '@inertiajs/react'
import { ColumnDef } from '@tanstack/react-table'
import { PlusCircle, Pencil, Eye, Trash2, Shield, Users } from 'lucide-react'
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
import { InsuranceType, PaginatedData, InsuranceTypeStats } from '@/types/medical'
import { type BreadcrumbItem } from '@/types'

interface InsuranceTypesIndexProps {
  insuranceTypes: PaginatedData<InsuranceType>
  stats: InsuranceTypeStats
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
    title: 'Tipos de Seguro',
    href: '/medical/insurance-types',
  },
]

export default function InsuranceTypesIndex({ 
  insuranceTypes, 
  stats,
}: InsuranceTypesIndexProps) {
  const handleDelete = async (id: number) => {
    try {
      router.delete(`/medical/insurance-types/${id}`, {
        preserveScroll: true,
        onSuccess: () => {
          toast.success('Tipo de seguro eliminado correctamente')
        },
        onError: () => {
          toast.error('Error al eliminar el tipo de seguro')
        },
      })
    } catch {
      toast.error('Error al eliminar el tipo de seguro')
    }
  }

  const columns: ColumnDef<InsuranceType>[] = [
    {
      accessorKey: 'name',
      header: 'Nombre',
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('name')}</div>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Descripción',
      cell: ({ row }) => {
        const description = row.getValue('description') as string
        return (
          <div className="max-w-[300px] truncate text-sm text-gray-600">
            {description || 'Sin descripción'}
          </div>
        )
      },
    },
    {
      accessorKey: 'coverage_percentage',
      header: 'Cobertura',
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.getValue('coverage_percentage')}%
        </Badge>
      ),
    },
    {
      accessorKey: 'active',
      header: 'Estado',
      cell: ({ row }) => {
        const active = row.getValue('active') as boolean
        return (
          <Badge variant={active ? 'default' : 'secondary'}>
            {active ? 'Activo' : 'Inactivo'}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Creado',
      cell: ({ row }) => {
        const date = new Date(row.getValue('created_at'))
        return <div className="text-sm text-gray-600">{date.toLocaleDateString()}</div>
      },
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => {
        const insuranceType = row.original
        return (
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="ghost">
              <Link href={`/medical/insurance-types/${insuranceType.id}`}>
                <Eye className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="sm" variant="ghost">
              <Link href={`/medical/insurance-types/${insuranceType.id}/edit`}>
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
                    Esta acción eliminará permanentemente el tipo de seguro "{insuranceType.name}".
                    Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDelete(insuranceType.id)}
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
      <Head title="Tipos de Seguro - Sistema Médico" />

      <div className="space-y-6">
        <HeadingSmall
          title="Tipos de Seguro"
          description="Gestión de tipos de seguros médicos y cobertura de pacientes"
        />

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tipos</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{insuranceTypes.total}</div>
              <p className="text-xs text-muted-foreground">
                Tipos de seguro registrados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pacientes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_patients}</div>
              <p className="text-xs text-muted-foreground">
                Pacientes con seguro
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pacientes Activos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active_patients}</div>
              <p className="text-xs text-muted-foreground">
                Con seguro activo
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Servicios</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_services}</div>
              <p className="text-xs text-muted-foreground">
                Servicios utilizados
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
                  Listado de Tipos de Seguro
                </h3>
                <p className="text-sm text-muted-foreground">
                  Gestiona los tipos de seguros médicos disponibles
                </p>
              </div>
              <Button asChild>
                <Link href="/medical/insurance-types/create">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Nuevo Tipo de Seguro
                </Link>
              </Button>
            </div>
          </div>

          <div className="p-6 pt-0">
            {/* Data Table */}
            <DataTable
              data={insuranceTypes}
              columns={columns}
              searchPlaceholder="Buscar por nombre o descripción..."
              searchKey="search"
            />
          </div>
        </div>
      </div>
    </AppLayout>
  )
}