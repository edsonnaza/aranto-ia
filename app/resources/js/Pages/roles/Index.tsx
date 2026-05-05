import React, { useState, useCallback } from 'react'
import { Head, router } from '@inertiajs/react'
import { Plus, Edit2, Trash2, Shield, Search, X } from 'lucide-react'
import AppLayout from '@/layouts/app-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface Permission {
  id: number
  name: string
}

interface Role {
  id: number
  name: string
  users_count: number
  permissions: Permission[]
}

interface Props {
  roles: {
    data: Role[]
    current_page: number
    last_page: number
    total: number
  }
  filters?: { search?: string }
  flash?: { success?: string; error?: string }
}

export default function RolesIndex({ roles, filters, flash }: Props) {
  const [search, setSearch] = useState(filters?.search ?? '')

  const handleSearch = useCallback((value: string) => {
    router.get('/roles', { search: value || undefined }, { preserveState: true, replace: true })
  }, [])

  const clearSearch = () => {
    setSearch('')
    router.get('/roles', {}, { preserveState: true, replace: true })
  }

  const handleDelete = (role: Role) => {
    if (role.users_count > 0) return
    if (!confirm(`¿Eliminar el rol "${role.name}"?`)) return
    router.delete(`/roles/${role.id}`)
  }

  return (
    <AppLayout>
      <Head title="Roles y Permisos" />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Roles y Permisos</h1>
            <p className="text-gray-500 mt-2">Gestiona los grupos de acceso del sistema</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch(search)}
                placeholder="Buscar rol..."
                className="pl-9 pr-8 w-56"
              />
              {search && (
                <button onClick={clearSearch} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button variant="outline" onClick={() => handleSearch(search)}>Buscar</Button>
            <Button onClick={() => router.get('/roles/create')}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Rol
            </Button>
          </div>
        </div>

        {flash?.error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
            {flash.error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Roles del sistema</CardTitle>
            <CardDescription>Total: {roles.total} rol{roles.total !== 1 ? 'es' : ''}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rol</TableHead>
                  <TableHead>Permisos</TableHead>
                  <TableHead>Usuarios asignados</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.data.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-blue-500" />
                        {role.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-md">
                        {role.permissions.length > 0 ? (
                          role.permissions.slice(0, 4).map((p) => (
                            <span key={p.id} className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                              {p.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-sm">Sin permisos</span>
                        )}
                        {role.permissions.length > 4 && (
                          <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                            +{role.permissions.length - 4} más
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`font-medium ${role.users_count > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                        {role.users_count}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => router.get(`/roles/${role.id}/edit`)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={role.users_count > 0}
                          onClick={() => handleDelete(role)}
                          className="text-red-500 hover:text-red-700 disabled:opacity-30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {roles.last_page > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-gray-500">
                  Página {roles.current_page} de {roles.last_page}
                </p>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={roles.current_page === 1}
                    onClick={() => router.get('/roles', { search: search || undefined, page: roles.current_page - 1 }, { preserveState: true })}
                  >
                    Anterior
                  </Button>
                  {Array.from({ length: roles.last_page }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === roles.last_page || Math.abs(p - roles.current_page) <= 1)
                    .reduce<(number | '...')[]>((acc, p, i, arr) => {
                      if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...')
                      acc.push(p)
                      return acc
                    }, [])
                    .map((p, i) =>
                      p === '...' ? (
                        <span key={`ellipsis-${i}`} className="px-3 py-1 text-sm text-gray-400">…</span>
                      ) : (
                        <Button
                          key={p}
                          variant={p === roles.current_page ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => router.get('/roles', { search: search || undefined, page: p }, { preserveState: true })}
                        >
                          {p}
                        </Button>
                      )
                    )}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={roles.current_page === roles.last_page}
                    onClick={() => router.get('/roles', { search: search || undefined, page: roles.current_page + 1 }, { preserveState: true })}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
