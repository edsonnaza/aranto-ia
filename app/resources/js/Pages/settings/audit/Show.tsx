import React from 'react'
import { Head, Link } from '@inertiajs/react'
import HeadingSmall from '@/components/heading-small'
import AppLayout from '@/layouts/app-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import { type BreadcrumbItem } from '@/types'

interface User {
  id: number
  nombre: string
  correo: string
}

interface AuditLog {
  id: number
  entidad: string
  idEntidad: number
  evento: string
  usuarioId: number | null
  usuario?: User | null
  valoresAnteriores: Record<string, unknown> | null
  valoresNuevos: Record<string, unknown> | null
  direccionIp: string | null
  agenteUsuario: string | null
  descripcion: string | null
  fechaHora: string
}

interface AuditShowProps {
  auditLog: AuditLog
}

const EVENT_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  created: { label: 'Creado', variant: 'default' },
  updated: { label: 'Actualizado', variant: 'secondary' },
  deleted: { label: 'Eliminado', variant: 'destructive' },
  inactivated: { label: 'Inactivado', variant: 'outline' },
  restored: { label: 'Restaurado', variant: 'default' },
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

export default function AuditShow({ auditLog }: AuditShowProps) {
  const eventInfo = EVENT_LABELS[auditLog.evento] || { label: auditLog.evento, variant: 'default' as const }
  const date = new Date(auditLog.fechaHora)
  const formattedDate = date.toLocaleDateString('es-PY')
  const formattedTime = date.toLocaleTimeString('es-PY')

  return (
    <>
      <Head title={`Auditoría - ${auditLog.entidad} #${auditLog.idEntidad}`} />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <HeadingSmall
              title={`Detalle de Auditoría`}
              description={`${auditLog.entidad} #${auditLog.idEntidad} - ${eventInfo.label}`}
            />
            <Link href="/settings/audit">
              <Button variant="outline" size="sm" className="gap-2">
                <ChevronLeft className="h-4 w-4" />
                Volver
              </Button>
            </Link>
          </div>

          {/* Información General */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información General</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-sm text-gray-500 font-medium">Fecha y Hora</label>
                  <p className="text-base text-gray-900 mt-1">
                    {formattedDate} {formattedTime}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500 font-medium">Acción</label>
                  <div className="mt-1">
                    <Badge variant={eventInfo.variant}>{eventInfo.label}</Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-500 font-medium">Entidad</label>
                  <p className="text-base text-gray-900 mt-1">{auditLog.entidad}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500 font-medium">ID de Entidad</label>
                  <p className="text-base text-gray-900 mt-1">{auditLog.idEntidad}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información del Usuario */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información del Usuario</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-sm text-gray-500 font-medium">Usuario</label>
                  {auditLog.usuario ? (
                    <div className="mt-1">
                      <p className="text-base font-medium text-gray-900">{auditLog.usuario.nombre}</p>
                      <p className="text-sm text-gray-500">{auditLog.usuario.correo}</p>
                    </div>
                  ) : (
                    <p className="text-base text-gray-400 mt-1">Sistema</p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-gray-500 font-medium">Dirección IP</label>
                  <p className="text-base text-gray-900 font-mono mt-1">
                    {auditLog.direccionIp || '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Valores Anteriores */}
          {auditLog.valoresAnteriores && Object.keys(auditLog.valoresAnteriores).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Valores Anteriores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-red-50 rounded-lg p-4 font-mono text-sm text-red-900 overflow-x-auto">
                  <pre>{JSON.stringify(auditLog.valoresAnteriores, null, 2)}</pre>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Valores Nuevos */}
          {auditLog.valoresNuevos && Object.keys(auditLog.valoresNuevos).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Valores Nuevos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-green-50 rounded-lg p-4 font-mono text-sm text-green-900 overflow-x-auto">
                  <pre>{JSON.stringify(auditLog.valoresNuevos, null, 2)}</pre>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Descripción */}
          {auditLog.descripcion && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Descripción</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base text-gray-700">{auditLog.descripcion}</p>
              </CardContent>
            </Card>
          )}

          {/* User Agent */}
          {auditLog.agenteUsuario && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Información del Navegador</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 font-mono wrap-break-words">{auditLog.agenteUsuario}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </AppLayout>
    </>
  )
}
