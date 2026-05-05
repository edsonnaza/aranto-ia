import React, { useState } from 'react'
import { Head, router } from '@inertiajs/react'
import { ArrowLeft, Save } from 'lucide-react'
import AppLayout from '@/layouts/app-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Permission {
  id: number
  name: string
}

interface Role {
  id: number
  name: string
  permissions: Permission[]
}

interface Props {
  role: Role
  permissionGroups: Record<string, Permission[]>
}

export default function RolesEdit({ role, permissionGroups }: Props) {
  const [name, setName] = useState(role.name)
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>(
    role.permissions.map((p) => p.id)
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [processing, setProcessing] = useState(false)

  const togglePermission = (id: number) => {
    setSelectedPermissions((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  const toggleGroup = (permissions: Permission[]) => {
    const ids = permissions.map((p) => p.id)
    const allSelected = ids.every((id) => selectedPermissions.includes(id))
    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((id) => !ids.includes(id)))
    } else {
      setSelectedPermissions((prev) => [...new Set([...prev, ...ids])])
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setProcessing(true)
    router.put(`/roles/${role.id}`, { name, permissions: selectedPermissions }, {
      onError: (errs) => { setErrors(errs); setProcessing(false) },
      onFinish: () => setProcessing(false),
    })
  }

  return (
    <AppLayout>
      <Head title={`Editar Rol: ${role.name}`} />
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.get('/roles')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Editar Rol</h1>
            <p className="text-gray-500 text-sm">Modifica el nombre y permisos del rol</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Información del rol</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del rol</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Permisos</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(permissionGroups).map(([group, permissions]) => {
                const allSelected = permissions.every((p) => selectedPermissions.includes(p.id))
                return (
                  <div key={group}>
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={() => toggleGroup(permissions)}
                        className="h-4 w-4 rounded"
                        id={`group-${group}`}
                      />
                      <label htmlFor={`group-${group}`} className="font-semibold text-sm capitalize cursor-pointer">
                        {group.replace(/_/g, ' ')}
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pl-6">
                      {permissions.map((p) => (
                        <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedPermissions.includes(p.id)}
                            onChange={() => togglePermission(p.id)}
                            className="h-4 w-4 rounded"
                          />
                          {p.name}
                        </label>
                      ))}
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => router.get('/roles')}>Cancelar</Button>
            <Button type="submit" disabled={processing}>
              <Save className="h-4 w-4 mr-2" />
              {processing ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}
