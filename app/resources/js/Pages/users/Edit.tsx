import React, { useState } from 'react'
import { Head, router } from '@inertiajs/react'
import { ArrowLeft, Save } from 'lucide-react'
import AppLayout from '@/layouts/app-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Role {
  id: number
  name: string
}

interface User {
  id: number
  name: string
  email: string
  roles: Role[]
}

interface Props {
  user: User
  roles: Role[]
}

export default function UsersEdit({ user, roles }: Props) {
  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    password: '',
    password_confirmation: '',
  })
  const [selectedRoles, setSelectedRoles] = useState<number[]>(user.roles.map((r) => r.id))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [processing, setProcessing] = useState(false)

  const set = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }))

  const toggleRole = (id: number) => {
    setSelectedRoles((prev) => prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id])
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setProcessing(true)
    router.put(`/users/${user.id}`, { ...form, roles: selectedRoles }, {
      onError: (errs) => { setErrors(errs); setProcessing(false) },
      onFinish: () => setProcessing(false),
    })
  }

  return (
    <AppLayout>
      <Head title={`Editar: ${user.name}`} />
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.get('/users')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Editar Usuario</h1>
            <p className="text-gray-500 text-sm">{user.email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Datos del usuario</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre completo</Label>
                <Input id="name" value={form.name} onChange={(e) => set('name', e.target.value)} />
                {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
                {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Nueva contraseña <span className="text-gray-400 text-xs">(dejar vacío para no cambiar)</span></Label>
                <Input id="password" type="password" value={form.password} onChange={(e) => set('password', e.target.value)} />
                {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password_confirmation">Confirmar contraseña</Label>
                <Input id="password_confirmation" type="password" value={form.password_confirmation} onChange={(e) => set('password_confirmation', e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Roles asignados</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {roles.map((role) => (
                  <label key={role.id} className={`flex items-center gap-2 cursor-pointer p-3 rounded-lg border transition-colors ${selectedRoles.includes(role.id) ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'}`}>
                    <input
                      type="checkbox"
                      checked={selectedRoles.includes(role.id)}
                      onChange={() => toggleRole(role.id)}
                      className="h-4 w-4 rounded"
                    />
                    <span className="text-sm font-medium">{role.name}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => router.get('/users')}>Cancelar</Button>
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
