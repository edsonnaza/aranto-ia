import React from 'react'
import { Head, Link, router } from '@inertiajs/react'
import { ColumnDef } from '@tanstack/react-table'
import { PlusCircle, Pencil, Eye, Trash2, Users, Star, Briefcase, DollarSign, Activity } from 'lucide-react'
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
import { Professional, PaginatedData } from '@/types/medical'
import { type BreadcrumbItem } from '@/types'
import { formatPercentage } from '@/utils/formatters'

interface ProfessionalsIndexProps {
  professionals: PaginatedData<Professional>
  stats: {
    total: number
    active: number
    inactive: number
    specialties: number
    avg_commission: number
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
    title: 'Profesionales',
    href: '/medical/professionals',
  },
]

export default function ProfessionalsIndex({ 
  professionals, 
  stats,
}: ProfessionalsIndexProps) {
  const handleDelete = async (id: number) => {
    try {
      router.delete(`/medical/professionals/${id}`, {
        preserveScroll: true,
        onSuccess: () => {
          toast.success('Profesional eliminado correctamente')
        },
        onError: () => {
          toast.error('Error al eliminar el profesional')
        },
      })
    } catch {
      toast.error('Error al eliminar el profesional')
    }
  }

  const columns: ColumnDef<Professional>[] = [
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
      accessorKey: 'specialties',
      header: 'Especialidad',
      cell: ({ row }) => {
        const professional = row.original as Professional
        const specialties = professional.specialties || []
        
        if (specialties.length === 0) {
          return <Badge variant="outline">No especificada</Badge>
        }
        
        if (specialties.length === 1) {
          return <Badge variant="outline">{specialties[0].name}</Badge>
        }
        
        return (
          <div className="flex flex-wrap gap-1">
            <Badge variant="outline">{specialties[0].name}</Badge>
            {specialties.length > 1 && (
              <Badge variant="secondary">+{specialties.length - 1}</Badge>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'license_number',
      header: 'Licencia',
      cell: ({ row }) => (
        <div className="text-sm font-mono text-gray-600">
          {row.getValue('license_number') || 'No registrada'}
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
            {email || 'No registrado'}
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
            {phone || 'No registrado'}
          </div>
        )
      },
    },
    {
      accessorKey: 'commission_percentage',
      header: 'Comisión',
      cell: ({ row }) => {
        const commission = row.getValue('commission_percentage') as number
        return commission ? (
          <Badge variant="secondary">
            {formatPercentage(commission)}
          </Badge>
        ) : (
          <span className="text-sm text-gray-400">No definida</span>
        )
      },
    },
    {
      accessorKey: 'is_active',
      header: 'Estado',
      cell: ({ row }) => {
        const isActive = row.getValue('is_active') as boolean
        return (
          <Badge variant={isActive ? 'default' : 'secondary'}>
            {isActive ? 'Activo' : 'Inactivo'}
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
        const professional = row.original
        return (
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="ghost">
              <Link href={`/medical/professionals/${professional.id}`}>
                <Eye className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="sm" variant="ghost">
              <Link href={`/medical/professionals/${professional.id}/edit`}>
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
                    Esta acción eliminará permanentemente el profesional "{professional.first_name} {professional.last_name}".
                    Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDelete(professional.id)}
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
      <Head title="Profesionales - Sistema Médico" />

      <div className="space-y-6">
        <HeadingSmall
          title="Profesionales Médicos"
          description="Gestión de profesionales de la salud y especialistas"
        />

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Profesionales</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                Registrados en sistema
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activos</CardTitle>
              <Activity className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <p className="text-xs text-muted-foreground">
                Profesionales activos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Especialidades</CardTitle>
              <Star className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.specialties}</div>
              <p className="text-xs text-muted-foreground">
                Diferentes especialidades
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Comisión Promedio</CardTitle>
              <DollarSign className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {typeof stats.avg_commission === 'number' && stats.avg_commission > 0 
                  ? formatPercentage(stats.avg_commission)
                  : '0%'}
              </div>
              <p className="text-xs text-muted-foreground">
                Por servicios médicos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Con Licencia</CardTitle>
              <Briefcase className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {professionals.data.filter(p => p.license_number).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Licencia registrada
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
                  Listado de Profesionales
                </h3>
                <p className="text-sm text-muted-foreground">
                  Gestiona los profesionales médicos y sus especialidades
                </p>
              </div>
              <Button asChild>
                <Link href="/medical/professionals/create">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Nuevo Profesional
                </Link>
              </Button>
            </div>
          </div>

          <div className="p-6 pt-0">
            {/* Data Table */}
            <DataTable
              data={professionals}
              columns={columns}
              searchPlaceholder="Buscar por nombre, especialidad o licencia..."
              searchKey="search"
            />
          </div>
        </div>
      </div>
    </AppLayout>
  )
}