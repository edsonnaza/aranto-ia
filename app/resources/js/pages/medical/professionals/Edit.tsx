import React, { useEffect, useMemo, useState } from 'react'
import { Head, useForm, router } from '@inertiajs/react'
import { toast } from 'sonner'

// Layout
import AppLayout from '@/layouts/app-layout'

// UI Components
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import { FileUploadField } from '@/components/ui/file-upload-field'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { ArrowLeft, Check, ChevronsUpDown, Save, Search, ShieldCheck, UserCog, X } from 'lucide-react'

// Types
interface MedicalService {
  id: number
  name: string
  code: string
}

interface Specialty {
  id: number
  name: string
}

interface LinkableUser {
  id: number
  name: string
  email: string
  roles: string[]
}

interface Professional {
  id: number
  first_name: string
  last_name: string
  identification: string
  email: string
  phone?: string
  license_number: string
  commission_percentage: number
  address?: string
  signature_url?: string | null
  stamp_url?: string | null
  is_lab_signer?: boolean
  is_active: boolean
  user_id?: number | null
  services?: MedicalService[]
  specialties?: Specialty[]
}

interface Props {
  professional: Professional
  services: MedicalService[]
  specialties: Specialty[]
  users: LinkableUser[]
  can_manage_linked_user: boolean
}

export default function Edit({ professional, services, specialties, users, can_manage_linked_user }: Props) {
  // Get professional's service IDs
  const professionalServiceIds = professional.services?.map(s => s.id) || []
  // Get professional's specialty IDs
  const professionalSpecialtyIds = professional.specialties?.map(s => s.id) || []

  // Simple Inertia form
  const { data, setData, post, processing, errors, transform } = useForm({
    _method: 'patch' as const,
    user_id: professional.user_id ?? null,
    first_name: professional.first_name || '',
    last_name: professional.last_name || '',
    identification: professional.identification || '',
    email: professional.email || '',
    phone: professional.phone || '',
    license_number: professional.license_number || '',
    commission_percentage: professional.commission_percentage || 0,
    address: professional.address || '',
    signature: null as File | null,
    stamp: null as File | null,
    is_lab_signer: professional.is_lab_signer ?? false,
    is_active: professional.is_active,
    services: professionalServiceIds,
    specialties: professionalSpecialtyIds
  })
  const [signaturePreview, setSignaturePreview] = useState<string | null>(professional.signature_url || null)
  const [stampPreview, setStampPreview] = useState<string | null>(professional.stamp_url || null)
  const [signatureFileName, setSignatureFileName] = useState<string | null>(null)
  const [stampFileName, setStampFileName] = useState<string | null>(null)
  const [serviceSearch, setServiceSearch] = useState('')
  const [userOpen, setUserOpen] = useState(false)

  const transparencyWarning = (fileName: string | null) => {
    if (!fileName) return null

    const extension = fileName.split('.').pop()?.toLowerCase()
    if (extension === 'jpg' || extension === 'jpeg') {
      return 'JPG no conserva transparencia real. Para una firma limpia en PDF, usá PNG transparente.'
    }

    return null
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    setData('_method', 'patch')
    transform((currentData) => {
      const payload = { ...currentData } as Record<string, unknown>

      if (!payload.signature) {
        delete payload.signature
      }

      if (!payload.stamp) {
        delete payload.stamp
      }

      return payload
    })

    post(`/medical/professionals/${professional.id}`, {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: () => {
        toast.success('Profesional actualizado exitosamente')
      },
      onError: (errors) => {
        console.error('Professional update failed:', errors)
        toast.error('Error al actualizar el profesional')
      }
    })
  }

  const handleFileChange = (field: 'signature' | 'stamp', file: File | null) => {
    setData(field, file)

    if (field === 'signature') {
      setSignatureFileName(file?.name ?? null)
    } else {
      setStampFileName(file?.name ?? null)
    }

    const fallback = field === 'signature' ? professional.signature_url : professional.stamp_url
    const setPreview = field === 'signature' ? setSignaturePreview : setStampPreview

    setPreview((previous) => {
      if (previous?.startsWith('blob:')) {
        URL.revokeObjectURL(previous)
      }

      return file ? URL.createObjectURL(file) : (fallback || null)
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

  const selectedUser = useMemo(
    () => users.find((user) => user.id === data.user_id) ?? null,
    [data.user_id, users],
  )

  // Handle service selection
  const handleServiceToggle = (serviceId: number, checked: boolean) => {
    const currentServices = data.services || []
    const updatedServices = checked
      ? [...currentServices, serviceId]
      : currentServices.filter(id => id !== serviceId)
    
    setData('services', updatedServices)
  }

  // Handle specialty selection
  const handleSpecialtyToggle = (specialtyId: number, checked: boolean) => {
    const currentSpecialties = data.specialties || []
    const updatedSpecialties = checked
      ? [...currentSpecialties, specialtyId]
      : currentSpecialties.filter(id => id !== specialtyId)
    
    setData('specialties', updatedSpecialties)
  }

  return (
    <AppLayout>
      <Head title={`Editar Profesional - ${professional.first_name} ${professional.last_name}`} />
      
      <div className="py-6">
        <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.visit(`/medical/professionals/${professional.id}`)}
                className="flex items-center gap-2"
              >
                <ArrowLeft size={16} />
                Volver
              </Button>
              <div className="flex items-center gap-2">
                <UserCog className="text-blue-600" size={24} />
                <h1 className="text-2xl font-semibold text-gray-900">
                  Editar Profesional
                </h1>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Modificar la información de {professional.first_name} {professional.last_name}
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
                      required
                    />
                    {errors.first_name && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.first_name}
                      </p>
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
                      required
                    />
                    {errors.last_name && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.last_name}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="identification">Identificación</Label>
                    <Input
                      id="identification"
                      value={data.identification}
                      onChange={(e) => setData('identification', e.target.value)}
                      className={errors.identification ? 'border-red-500' : ''}
                      placeholder="Número de identificación"
                    />
                    {errors.identification && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.identification}
                      </p>
                    )}
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
                      <p className="text-sm text-red-600 mt-1">
                        {errors.email}
                      </p>
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
                      <p className="text-sm text-red-600 mt-1">
                        {errors.phone}
                      </p>
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
                      rows={3}
                    />
                    {errors.address && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.address}
                      </p>
                    )}
                  </div>
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
                  <div className="md:col-span-2">
                    <Label htmlFor="linked-user">Usuario vinculado</Label>
                    <Popover open={userOpen} onOpenChange={setUserOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          id="linked-user"
                          type="button"
                          variant="outline"
                          role="combobox"
                          aria-expanded={userOpen}
                          disabled={!can_manage_linked_user}
                          className={cn(
                            'mt-2 w-full justify-between',
                            !selectedUser && 'text-muted-foreground',
                          )}
                        >
                          <span className="truncate text-left">
                            {selectedUser
                              ? `${selectedUser.name} (${selectedUser.email})`
                              : 'Buscar usuario vinculado'}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Buscar usuario..." />
                          <CommandList>
                            <CommandEmpty>No se encontraron usuarios disponibles.</CommandEmpty>
                            <CommandGroup>
                              <CommandItem
                                value="Sin vincular"
                                onSelect={() => {
                                  setData('user_id', null)
                                  setUserOpen(false)
                                }}
                              >
                                <Check className={cn('mr-2 h-4 w-4', data.user_id === null ? 'opacity-100' : 'opacity-0')} />
                                Sin vincular usuario
                              </CommandItem>
                              {users.map((user) => (
                                <CommandItem
                                  key={user.id}
                                  value={`${user.name} ${user.email} ${user.roles.join(' ')}`}
                                  onSelect={() => {
                                    setData('user_id', user.id)
                                    setUserOpen(false)
                                  }}
                                >
                                  <Check className={cn('mr-2 h-4 w-4', data.user_id === user.id ? 'opacity-100' : 'opacity-0')} />
                                  <div className="min-w-0">
                                    <div className="truncate font-medium">{user.name}</div>
                                    <div className="truncate text-xs text-muted-foreground">
                                      {user.email}
                                      {user.roles.length > 0 ? ` · ${user.roles.join(', ')}` : ''}
                                    </div>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <p className="mt-2 text-xs text-gray-500">
                      {can_manage_linked_user
                        ? 'El usuario vinculado es quien puede quedar habilitado para validar y firmar resultados de laboratorio con este profesional.'
                        : 'Podés ver el usuario vinculado, pero solo un administrador puede cambiarlo.'}
                    </p>
                    {errors.user_id && (
                      <p className="text-sm text-red-600 mt-1">{errors.user_id}</p>
                    )}
                  </div>

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
                      <p className="text-sm text-red-600 mt-1">
                        {errors.license_number}
                      </p>
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
                      placeholder="0.00"
                    />
                    {errors.commission_percentage && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.commission_percentage}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_active"
                      checked={data.is_active}
                      onCheckedChange={(checked) => setData('is_active', !!checked)}
                    />
                    <Label htmlFor="is_active">Profesional Activo</Label>
                  </div>
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
                          Este profesional podrá aparecer en el PDF del laboratorio si valida estudios y tiene firma/sello cargados.
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

                <div className="grid grid-cols-1 gap-3 pt-2 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="signature">Firma escaneada</Label>
                    <FileUploadField
                      id="signature"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(file) => handleFileChange('signature', file)}
                      fileName={signatureFileName}
                      hasExistingFile={Boolean(signaturePreview)}
                      placeholder="Subir firma del profesional"
                      hint="Ideal: PNG transparente, recortado y sin fondo extra. Máximo 2 MB."
                      note={transparencyWarning(signatureFileName)}
                      error={errors.signature}
                    />
                    {signaturePreview && (
                      <div
                        className="flex h-24 items-center justify-center rounded border p-2"
                        style={{
                          backgroundColor: '#ffffff',
                          backgroundImage:
                            'linear-gradient(45deg, #eef2f7 25%, transparent 25%), linear-gradient(-45deg, #eef2f7 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #eef2f7 75%), linear-gradient(-45deg, transparent 75%, #eef2f7 75%)',
                          backgroundSize: '16px 16px',
                          backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                        }}
                      >
                        <img src={signaturePreview} alt="Vista previa de firma" className="h-20 max-w-full object-contain" />
                      </div>
                    )}
                    <p className="text-xs text-gray-500">Si en la vista previa ves cuadros dentro de la firma, el fondo quedó incorporado en la imagen.</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="stamp">Sello profesional</Label>
                    <FileUploadField
                      id="stamp"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(file) => handleFileChange('stamp', file)}
                      fileName={stampFileName}
                      hasExistingFile={Boolean(stampPreview)}
                      placeholder="Subir sello profesional"
                      hint="Ideal: PNG transparente o sello limpio sobre fondo claro. Máximo 2 MB."
                      note={transparencyWarning(stampFileName)}
                      error={errors.stamp}
                    />
                    {stampPreview && (
                      <div
                        className="flex h-24 items-center justify-center rounded border p-2"
                        style={{
                          backgroundColor: '#ffffff',
                          backgroundImage:
                            'linear-gradient(45deg, #eef2f7 25%, transparent 25%), linear-gradient(-45deg, #eef2f7 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #eef2f7 75%), linear-gradient(-45deg, transparent 75%, #eef2f7 75%)',
                          backgroundSize: '16px 16px',
                          backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                        }}
                      >
                        <img src={stampPreview} alt="Vista previa de sello" className="h-20 max-w-full object-contain" />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Services */}
            <Card>
              <CardHeader>
                <CardTitle>Servicios Médicos</CardTitle>
                <p className="text-sm text-gray-600">
                  Seleccione los servicios que puede realizar este profesional
                </p>
              </CardHeader>
              <CardContent>
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

                <div className="grid max-h-72 grid-cols-1 gap-3 overflow-y-auto rounded-md border p-3 md:grid-cols-2 lg:grid-cols-3">
                  {filteredServices.map((service) => (
                    <div key={service.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`service-${service.id}`}
                        checked={(data.services || []).includes(service.id)}
                        onCheckedChange={(checked) => handleServiceToggle(service.id, !!checked)}
                      />
                      <Label 
                        htmlFor={`service-${service.id}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {service.name}
                      </Label>
                    </div>
                  ))}
                </div>
                {filteredServices.length === 0 && (
                  <p className="mt-3 text-sm text-gray-500">No se encontraron servicios con esa búsqueda.</p>
                )}
                {errors.services && (
                  <p className="text-sm text-red-600 mt-2">
                    {errors.services}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Specialties */}
            {specialties && specialties.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Especialidades *</CardTitle>
                  <p className="text-sm text-gray-600">
                    Seleccione las especialidades del profesional
                  </p>
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
                    <p className="text-sm text-red-600 mt-2">
                      {errors.specialties}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.visit(`/medical/professionals/${professional.id}`)}
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
                {processing ? 'Actualizando...' : 'Actualizar Profesional'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  )
}
