import React, { useState, useCallback } from 'react'
import { Head, router, usePage } from '@inertiajs/react'
import { MoreHorizontal, Plus, Eye, Edit2, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import AppLayout from '@/layouts/app-layout'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface User {
  id: number
  name: string
  email: string
  created_at: string
  roles?: Array<{ name: string }>
}

interface PaginationLink {
  url: string | null
  label: string
  active: boolean
}

interface Props {
  users: {
    data: User[]
    current_page: number
    last_page: number
    per_page: number
    total: number
    links?: PaginationLink[]
  }
  filters?: { search?: string }
}

export default function UsersIndex({ users, filters }: Props) {
  const [search, setSearch] = useState(filters?.search ?? '')

  const handleSearch = useCallback((value: string) => {
    router.get('/users', { search: value || undefined }, { preserveState: true, replace: true })
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch(search)
  }

  const clearSearch = () => {
    setSearch('')
    router.get('/users', {}, { preserveState: true, replace: true })
  }

  return (
    <AppLayout>
      <Head title="Usuarios" />
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
          <p className="text-gray-500 mt-2">Gestiona los usuarios del sistema</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Buscar por nombre o email..."
              className="pl-9 pr-8 w-64"
            />
            {search && (
              <button onClick={clearSearch} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button variant="outline" onClick={() => handleSearch(search)}>
            Buscar
          </Button>
          <Button onClick={() => router.get('/users/create')}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Usuario
          </Button>
        </div>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuarios</CardTitle>
          <CardDescription>
            Total: {users.total} usuario{users.total !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.data.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Registrado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.data.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {user.roles && user.roles.length > 0 ? (
                          <div className="flex gap-1 flex-wrap">
                            {user.roles.map((role) => (
                              <span
                                key={role.name}
                                className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
                              >
                                {role.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-500">Sin roles</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString('es-ES')}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menú</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.get(`/users/${user.id}`)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.get(`/users/${user.id}/edit`)}>
                              <Edit2 className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-gray-500">No hay usuarios registrados</p>
            </div>
          )}

          {users.last_page > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-gray-500">
                Mostrando {users.data.length} de {users.total} usuarios — página {users.current_page} de {users.last_page}
              </p>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={users.current_page === 1}
                  onClick={() => router.get('/users', { page: users.current_page - 1 }, { preserveState: true })}
                >
                  Anterior
                </Button>
                {Array.from({ length: users.last_page }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === users.last_page || Math.abs(p - users.current_page) <= 1)
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
                        variant={p === users.current_page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => router.get('/users', { page: p }, { preserveState: true })}
                      >
                        {p}
                      </Button>
                    )
                  )}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={users.current_page === users.last_page}
                  onClick={() => router.get('/users', { page: users.current_page + 1 }, { preserveState: true })}
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
