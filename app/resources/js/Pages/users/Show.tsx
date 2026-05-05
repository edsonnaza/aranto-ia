import React from 'react'
import { Head, router } from '@inertiajs/react'
import { ArrowLeft, Edit2, Shield } from 'lucide-react'
import AppLayout from '@/layouts/app-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Permission {
  id: number
  name: string
}

interface Role {
  id: number
  name: string
  permissions: Permission[]
}

interface User {
  id: number
  name: string
  email: string
  created_at: string
  roles: Role[]
}

interface Props {
  user: User
}

export default function UsersShow({ user }: Props) {
  const allPermissions = user.roles.flatMap((r) => r.permissions)
  const uniquePermissions = allPermissions.filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i)

  return (
    <AppLayout>
      <Head title={user.name} />
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => router.get('/users')}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Volver
            </Button>
            <h1 className="text-2xl font-bold">{user.name}</h1>
          </div>
          <Button size="sm" onClick={() => router.get(`/users/${user.id}/edit`)}>
            <Edit2 className="h-4 w-4 mr-2" /> Editar
          </Button>
        </div>

        <Card>
          <CardHeader><CardTitle>Información</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Email</span>
              <span className="font-medium">{user.email}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Registrado</span>
              <span className="font-medium">{new Date(user.created_at).toLocaleDateString('es-ES')}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Roles asignados</CardTitle></CardHeader>
          <CardContent>
            {user.roles.length > 0 ? (
              <div className="space-y-3">
                {user.roles.map((role) => (
                  <div key={role.id} className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 border border-blue-100">
                    <Shield className="h-4 w-4 text-blue-500 shrink-0" />
                    <span className="font-medium text-sm">{role.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">Sin roles asignados</p>
            )}
          </CardContent>
        </Card>

        {uniquePermissions.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Permisos efectivos</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {uniquePermissions.map((p) => (
                  <span key={p.id} className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700">
                    {p.name}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}
