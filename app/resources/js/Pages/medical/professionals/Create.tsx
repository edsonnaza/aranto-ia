import React from 'react'
import { Head, useForm } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, UserPlus, Save, X } from 'lucide-react'

interface MedicalService {
  id: number
  name: string
  code: string
}

interface Specialty {
  id: number
  name: string
}

interface Props {
  services: MedicalService[]
  specialties: Specialty[]
}

export default function Create({ services = [], specialties = [] }: Props) {
  const { data, setData, post, processing, errors } = useForm({
    first_name: '',
    last_name: '',
    identification: '',
    email: '',
    phone: '',
    license_number: '',
    commission_percentage: 10,
    address: '',
    is_active: true,
    services: [] as number[],
    specialties: [] as number[]
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    post('/medical/professionals', {
      preserveScroll: true,
      onSuccess: () => {
        // Toast será manejado por FlashMessageProvider
      },
      onError: (errors) => {
        console.error('Professional creation failed:', errors)
      }
    })
  }

  const handleServiceToggle = (serviceId: number, checked: boolean) => {
    if (checked) {
      setData('services', [...data.services, serviceId])
    } else {
      setData('services', data.services.filter(id => id !== serviceId))
    }
  }

  const handleSpecialtyToggle = (specialtyId: number, checked: boolean) => {
    if (checked) {
      setData('specialties', [...data.specialties, specialtyId])
    } else {
      setData('specialties', data.specialties.filter(id => id !== specialtyId))
    }
  }

  return (
    <AppLayout>
      <Head title="Crear Profesional" />
      
      <div className="py-6">
        <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.history.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft size={16} />
                Volver
              </Button>
              <div className="flex items-center gap-2">
                <UserPlus className="text-emerald-600" size={24} />
                <h1 className="text-2xl font-semibold text-gray-900">Crear Profesional</h1>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Complete la información para registrar un nuevo profesional médico
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle>Información Personal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">Nombres *</Label>
                    <Input
                      id="first_name"
                      value={data.first_name}
                      onChange={(e) => setData('first_name', e.target.value)}
                      className={errors.first_name ? 'border-red-500' : ''}
                      placeholder="Ingrese los nombres"
                    />
                    {errors.first_name && (
                      <p className="text-sm text-red-600 mt-1">{errors.first_name}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="last_name">Apellidos *</Label>
                    <Input
                      id="last_name"
                      value={data.last_name}
                      onChange={(e) => setData('last_name', e.target.value)}
                      className={errors.last_name ? 'border-red-500' : ''}
                      placeholder="Ingrese los apellidos"
                    />
                    {errors.last_name && (
                      <p className="text-sm text-red-600 mt-1">{errors.last_name}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="identification">Identificación</Label>
                    <Input
                      id="identification"
                      value={data.identification}
                      onChange={(e) => setData('identification', e.target.value)}
                      className={errors.identification ? 'border-red-500' : ''}
                      placeholder="Cédula o documento"
                    />
                    {errors.identification && (
                      <p className="text-sm text-red-600 mt-1">{errors.identification}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      value={data.phone}
                      onChange={(e) => setData('phone', e.target.value)}
                      className={errors.phone ? 'border-red-500' : ''}
                      placeholder="Número de teléfono"
                    />
                    {errors.phone && (
                      <p className="text-sm text-red-600 mt-1">{errors.phone}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    className={errors.email ? 'border-red-500' : ''}
                    placeholder="correo@ejemplo.com"
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600 mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="address">Dirección</Label>
                  <Textarea
                    id="address"
                    value={data.address}
                    onChange={(e) => setData('address', e.target.value)}
                    className={errors.address ? 'border-red-500' : ''}
                    placeholder="Dirección completa"
                    rows={2}
                  />
                  {errors.address && (
                    <p className="text-sm text-red-600 mt-1">{errors.address}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Professional Information */}
            <Card>
              <CardHeader>
                <CardTitle>Información Profesional</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="license_number">Número de Licencia</Label>
                    <Input
                      id="license_number"
                      value={data.license_number}
                      onChange={(e) => setData('license_number', e.target.value)}
                      className={errors.license_number ? 'border-red-500' : ''}
                      placeholder="Número de licencia profesional"
                    />
                    {errors.license_number && (
                      <p className="text-sm text-red-600 mt-1">{errors.license_number}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="commission_percentage">Porcentaje de Comisión (%)</Label>
                    <Input
                      id="commission_percentage"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={data.commission_percentage}
                      onChange={(e) => setData('commission_percentage', parseFloat(e.target.value) || 0)}
                      className={errors.commission_percentage ? 'border-red-500' : ''}
                      placeholder="10.00"
                    />
                    {errors.commission_percentage && (
                      <p className="text-sm text-red-600 mt-1">{errors.commission_percentage}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_active"
                    checked={data.is_active}
                    onCheckedChange={(checked) => setData('is_active', Boolean(checked))}
                  />
                  <Label htmlFor="is_active">Activo</Label>
                </div>
              </CardContent>
            </Card>

            {/* Specialties */}
            {specialties && specialties.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Especialidades *</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {specialties.map((specialty) => (
                      <div key={specialty.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`specialty-${specialty.id}`}
                          checked={data.specialties.includes(specialty.id)}
                          onCheckedChange={(checked) => {
                            handleSpecialtyToggle(specialty.id, Boolean(checked))
                          }}
                        />
                        <Label 
                          htmlFor={`specialty-${specialty.id}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {specialty.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {errors.specialties && (
                    <p className="text-sm text-red-600 mt-1">{errors.specialties}</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Services */}
            {services && services.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Servicios Médicos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {services.map((service) => (
                      <div key={service.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`service-${service.id}`}
                          checked={data.services.includes(service.id)}
                          onCheckedChange={(checked) => {
                            handleServiceToggle(service.id, Boolean(checked))
                          }}
                        />
                        <Label 
                          htmlFor={`service-${service.id}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {service.name}
                          <span className="text-gray-500 ml-1">({service.code})</span>
                        </Label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => window.history.back()}
                disabled={processing}
                className="flex items-center gap-2"
              >
                <X size={16} />
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={processing}
                className="flex items-center gap-2"
              >
                <Save size={16} />
                {processing ? 'Creando...' : 'Crear Profesional'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  )
}