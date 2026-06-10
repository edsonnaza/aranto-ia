import React, { useEffect, useMemo, useState } from 'react'
import { Head, useForm } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, Save, Search, ShieldCheck, UserPlus, X } from 'lucide-react'

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
  const { data, setData, post, processing, errors, transform } = useForm({
    first_name: '',
    last_name: '',
    identification: '',
    email: '',
    phone: '',
    license_number: '',
    commission_percentage: 10,
    address: '',
    signature: null as File | null,
    stamp: null as File | null,
    is_lab_signer: false,
    is_active: true,
    services: [] as number[],
    specialties: [] as number[]
  })
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null)
  const [stampPreview, setStampPreview] = useState<string | null>(null)
  const [serviceSearch, setServiceSearch] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    transform((currentData) => {
      const payload = { ...currentData }

      if (!payload.signature) {
        delete payload.signature
      }

      if (!payload.stamp) {
        delete payload.stamp
      }

      return payload
    })

    post('/medical/professionals', {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: () => {
        // Toast será manejado por FlashMessageProvider
      },
      onError: (errors) => {
        console.error('Professional creation failed:', errors)
      }
    })
  }

  const handleFileChange = (field: 'signature' | 'stamp', file: File | null) => {
    setData(field, file)

    const setPreview = field === 'signature' ? setSignaturePreview : setStampPreview
    setPreview((previous) => {
      if (previous?.startsWith('blob:')) {
        URL.revokeObjectURL(previous)
      }

      return file ? URL.createObjectURL(file) : null
    })
  }

  useEffect(() => {
    return () => {
      if (signaturePreview?.startsWith('blob:')) URL.revokeObjectURL(signaturePreview)
      if (stampPreview?.startsWith('blob:')) URL.revokeObjectURL(stampPreview)
    }
  }, [signaturePreview, stampPreview])

  const filteredServices = useMemo(() => {
    const query = serviceSearch.trim().toLowerCase()
    if (!query) return services

    return services.filter((service) =>
      service.name.toLowerCase().includes(query) || service.code.toLowerCase().includes(query)
    )
  }, [serviceSearch, services])

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
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Personal Information */}
            <Card className="p-0">
              <CardHeader className="px-4 py-3">
                <CardTitle className="text-base">Información Personal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 px-4 py-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="space-y-1.5">
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

                  <div className="space-y-1.5">
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="space-y-1.5">
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

                  <div className="space-y-1.5">
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

                <div className="space-y-1.5">
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

                <div className="space-y-1.5">
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
            <Card className="p-0">
              <CardHeader className="px-4 py-3">
                <CardTitle className="text-base">Información Profesional</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 px-4 py-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="space-y-1.5">
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

                  <div className="space-y-1.5">
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

                <div className="flex items-center space-x-2 mt-2">
                  <Checkbox
                    id="is_active"
                    checked={data.is_active}
                    onCheckedChange={(checked) => setData('is_active', Boolean(checked))}
                  />
                  <Label htmlFor="is_active">Activo</Label>
                </div>

                <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-700" />
                    <div className="space-y-2">
                      <div>
                        <Label htmlFor="is_lab_signer" className="text-sm font-medium text-emerald-900">
                          Autorizado para firmar informes de laboratorio
                        </Label>
                        <p className="text-xs text-emerald-800/80">
                          Si está activo, este profesional podrá figurar como firmante en los PDFs del laboratorio cuando valide estudios.
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="is_lab_signer"
                          checked={data.is_lab_signer}
                          onCheckedChange={(checked) => setData('is_lab_signer', Boolean(checked))}
                        />
                        <Label htmlFor="is_lab_signer" className="font-normal">Habilitar firma de laboratorio</Label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="signature">Firma escaneada</Label>
                    <Input
                      id="signature"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) => handleFileChange('signature', e.target.files?.[0] ?? null)}
                    />
                    {signaturePreview && (
                      <img src={signaturePreview} alt="Vista previa de firma" className="h-20 rounded border bg-white object-contain p-2" />
                    )}
                    {errors.signature && <p className="text-sm text-red-600 mt-1">{errors.signature}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="stamp">Sello profesional</Label>
                    <Input
                      id="stamp"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) => handleFileChange('stamp', e.target.files?.[0] ?? null)}
                    />
                    {stampPreview && (
                      <img src={stampPreview} alt="Vista previa de sello" className="h-20 rounded border bg-white object-contain p-2" />
                    )}
                    {errors.stamp && <p className="text-sm text-red-600 mt-1">{errors.stamp}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Specialties */}
            {specialties && specialties.length > 0 && (
              <Card className="p-0">
                <CardHeader className="px-4 py-3">
                  <CardTitle className="text-base">Especialidades *</CardTitle>
                </CardHeader>
                <CardContent className="px-4 py-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
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
              <Card className="p-0">
                <CardHeader className="px-4 py-3">
                  <CardTitle className="text-base">Servicios Médicos</CardTitle>
                </CardHeader>
                <CardContent className="px-4 py-3">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="relative max-w-sm flex-1">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <Input
                        value={serviceSearch}
                        onChange={(e) => setServiceSearch(e.target.value)}
                        placeholder="Buscar servicio por nombre o código..."
                        className="pl-9"
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      {data.services.length} seleccionados
                    </p>
                  </div>

                  <div className="grid max-h-72 grid-cols-1 gap-2 overflow-y-auto rounded-md border p-3 md:grid-cols-2 lg:grid-cols-3">
                    {filteredServices.map((service) => (
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
                  {filteredServices.length === 0 && (
                    <p className="mt-3 text-sm text-gray-500">No se encontraron servicios con esa búsqueda.</p>
                  )}
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
