import React, { useMemo } from 'react'
import { Head, Link } from '@inertiajs/react'
import { ColumnDef } from '@tanstack/react-table'
import { Eye } from 'lucide-react'
import HeadingSmall from '@/components/heading-small'
import AppLayout from '@/layouts/app-layout'
import { DataTable } from '@/components/ui/data-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { type BreadcrumbItem } from '@/types'

interface AuditLog {
  id: number
  model_type: string
  model_id: number
  event: string
  user_id: number | null
  user?: {
    id: number
    name: string
    email: string
  } | null
  old_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
  ip_address: string | null
  user_agent: string | null
  description: string | null
  created_at: string
}

interface AuditIndexProps {
  auditLogs: {
    data: AuditLog[]
    total: number
    per_page: number
    current_page: number
    last_page: number
    from: number | null
    to: number | null
    links: Array<{
      url: string | null
      label: string
      active: boolean
    }>
  }
  filters: {
    model_type?: string
    event?: string
    user_id?: number
    date_from?: string
    date_to?: string
  }
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
  },
  {
    title: 'Configuración',
    href: '/settings',
  },
  {
    title: 'Auditoría',
    href: '/settings/audit',
  },
]

const EVENT_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  created: { label: 'Creado', variant: 'default' },
  updated: { label: 'Actualizado', variant: 'secondary' },
  deleted: { label: 'Eliminado', variant: 'destructive' },
  inactivated: { label: 'Inactivado', variant: 'outline' },
  restored: { label: 'Restaurado', variant: 'default' },
}

export default function AuditIndex({ auditLogs }: AuditIndexProps) {
  const columns: ColumnDef<AuditLog>[] = useMemo(
    () => [
      {
        accessorKey: 'created_at',
        header: 'Fecha y Hora',
        cell: ({ row }) => {
          const date = new Date(row.getValue('created_at') as string)
          return (
            <div className="text-sm text-gray-600">
              {date.toLocaleDateString('es-PY')} {date.toLocaleTimeString('es-PY')}
            </div>
          )
        },
      },
      {
        accessorKey: 'model_type',
        header: 'Entidad',
        cell: ({ row }) => (
          <div className="text-sm font-medium">{row.getValue('model_type')}</div>
        ),
      },
      {
        accessorKey: 'event',
        header: 'Acción',
        cell: ({ row }) => {
          const event = row.getValue('event') as string
          const eventInfo = EVENT_LABELS[event] || { label: event, variant: 'default' as const }
          return (
            <Badge variant={eventInfo.variant}>{eventInfo.label}</Badge>
          )
        },
      },
      {
        accessorKey: 'user',
        header: 'Usuario',
        cell: ({ row }) => {
          const user = row.original.user
          return (
            <div className="text-sm text-gray-600">
              {user ? (
                <div>
                  <div className="font-medium">{user.name}</div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </div>
              ) : (
                <span className="text-gray-400">Sistema</span>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: 'ip_address',
        header: 'IP',
        cell: ({ row }) => (
          <div className="text-xs text-gray-500 font-mono">
            {row.getValue('ip_address') || '-'}
          </div>
        ),
      },
      {
        accessorKey: 'description',
        header: 'Descripción',
        cell: ({ row }) => (
          <div className="text-sm text-gray-600 max-w-xs truncate">
            {row.getValue('description') || '-'}
          </div>
        ),
      },
      {
        id: 'details',
        header: '',
        cell: ({ row }) => (
          <Link
            href={`/settings/audit/${row.original.id}`}
            className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
          >
            <Eye className="h-4 w-4" />
            Ver
          </Link>
        ),
      },
    ],
    [],
  )

  return (
    <>
      <Head title="Auditoría del Sistema" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="space-y-6">
          <HeadingSmall
            title="Auditoría del Sistema"
            description="Registro de todas las operaciones realizadas en el sistema"
          />

          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total de cambios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{auditLogs.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Creaciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {auditLogs.data.filter(a => a.event === 'created').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Actualizaciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {auditLogs.data.filter(a => a.event === 'updated').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Inactivaciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {auditLogs.data.filter(a => a.event === 'inactivated').length}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Registro de Actividad</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable columns={columns} data={{ ...auditLogs, from: auditLogs.from ?? 1, to: auditLogs.to ?? 0 }} />
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </>
  )
}
