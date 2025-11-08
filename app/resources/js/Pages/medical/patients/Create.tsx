import React from 'react'
import { Head, useForm, Link, router } from '@inertiajs/react'
import { ArrowLeft, User, Heart } from 'lucide-react'
import HeadingSmall from '@/components/heading-small'
import AppLayout from '@/layouts/app-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { InsuranceType } from '@/types/medical'
import { type BreadcrumbItem } from '@/types'
import MultipleInsuranceSelector, { PatientInsurance } from '@/components/medical/MultipleInsuranceSelector'

interface PatientsCreateProps {
  insuranceTypes: InsuranceType[]
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
  },
  {
    title: 'Sistema Médico',
    href: '/medical',
  },
  {
    title: 'Pacientes',
    href: '/medical/patients',
  },
  {
    title: 'Crear',
    href: '/medical/patients/create',
  },
]

export default function PatientsCreate({ insuranceTypes }: PatientsCreateProps) {
  const { data, setData, processing, errors } = useForm({
    // Información personal
    document_type: 'CI',
    document_number: '',
    first_name: '',
    last_name: '',
    birth_date: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    
    // Contacto de emergencia
    emergency_contact_name: '',
    emergency_contact_phone: '',
    
    // Seguros múltiples
    insurances: [] as PatientInsurance[],
    
    // Estado
    status: 'active',
    notes: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Preparar datos para envío - solo el seguro primario por ahora para compatibilidad
    const primaryInsurance = data.insurances.find(ins => ins.is_primary)
    const formData = {
      ...data,
      // Si hay seguros, tomar el primario para backward compatibility
      primary_insurance_type_id: primaryInsurance?.insurance_type_id || '',
      primary_insurance_number: primaryInsurance?.insurance_number || '',
      primary_insurance_valid_until: primaryInsurance?.valid_until || '',
      primary_insurance_coverage_percentage: primaryInsurance?.coverage_percentage || '',
    }

    // Crear objeto sin el array de seguros para que no interfiera
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { insurances: _, ...submissionData } = formData
    
    router.post('/medical/patients', submissionData, {
      onSuccess: () => {
        // Toast de éxito ya se maneja por el sistema
      },
      onError: () => {
        // Toast de error ya se maneja por el sistema
      }
    })
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Crear Paciente - Sistema Médico" />

      <div className="space-y-6">
        <HeadingSmall
          title="Crear Nuevo Paciente"
          description="Registra un nuevo paciente en el sistema médico"
        />

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Personal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Información Personal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Información de Documento */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="document_type">
                    Tipo de Documento <span className="text-red-500">*</span>
                  </Label>
                  <Select value={data.document_type} onValueChange={(value) => setData('document_type', value)}>
                    <SelectTrigger className={errors.document_type ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Seleccionar tipo de documento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CI">Cédula de Identidad</SelectItem>
                      <SelectItem value="RUC">RUC</SelectItem>
                      <SelectItem value="PASSPORT">Pasaporte</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.document_type && (
                    <p className="text-sm text-red-500">{errors.document_type}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="document_number">
                    Número de Documento <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="document_number"
                    type="text"
                    value={data.document_number}
                    onChange={(e) => setData('document_number', e.target.value)}
                    placeholder="Número del documento"
                    className={errors.document_number ? 'border-red-500' : ''}
                    required
                  />
                  {errors.document_number && (
                    <p className="text-sm text-red-500">{errors.document_number}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">
                    Nombre <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="first_name"
                    type="text"
                    value={data.first_name}
                    onChange={(e) => setData('first_name', e.target.value)}
                    placeholder="Nombre del paciente"
                    className={errors.first_name ? 'border-red-500' : ''}
                    required
                  />
                  {errors.first_name && (
                    <p className="text-sm text-red-500">{errors.first_name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name">
                    Apellido <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="last_name"
                    type="text"
                    value={data.last_name}
                    onChange={(e) => setData('last_name', e.target.value)}
                    placeholder="Apellido del paciente"
                    className={errors.last_name ? 'border-red-500' : ''}
                    required
                  />
                  {errors.last_name && (
                    <p className="text-sm text-red-500">{errors.last_name}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    placeholder="email@ejemplo.com"
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={data.phone}
                    onChange={(e) => setData('phone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className={errors.phone ? 'border-red-500' : ''}
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-500">{errors.phone}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="birth_date">Fecha de Nacimiento</Label>
                  <Input
                    id="birth_date"
                    type="date"
                    value={data.birth_date}
                    onChange={(e) => setData('birth_date', e.target.value)}
                    className={errors.birth_date ? 'border-red-500' : ''}
                  />
                  {errors.birth_date && (
                    <p className="text-sm text-red-500">{errors.birth_date}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Género</Label>
                  <Select value={data.gender} onValueChange={(value) => setData('gender', value)}>
                    <SelectTrigger className={errors.gender ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Seleccionar género" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Masculino</SelectItem>
                      <SelectItem value="F">Femenino</SelectItem>
                      <SelectItem value="OTHER">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.gender && (
                    <p className="text-sm text-red-500">{errors.gender}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Dirección</Label>
                  <Textarea
                    id="address"
                    value={data.address}
                    onChange={(e) => setData('address', e.target.value)}
                    placeholder="Dirección completa del paciente"
                    rows={2}
                    className={errors.address ? 'border-red-500' : ''}
                  />
                  {errors.address && (
                    <p className="text-sm text-red-500">{errors.address}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">Ciudad</Label>
                  <Input
                    id="city"
                    type="text"
                    value={data.city}
                    onChange={(e) => setData('city', e.target.value)}
                    placeholder="Ciudad de residencia"
                    className={errors.city ? 'border-red-500' : ''}
                  />
                  {errors.city && (
                    <p className="text-sm text-red-500">{errors.city}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="state">Departamento/Estado</Label>
                  <Input
                    id="state"
                    type="text"
                    value={data.state}
                    onChange={(e) => setData('state', e.target.value)}
                    placeholder="Departamento o estado"
                    className={errors.state ? 'border-red-500' : ''}
                  />
                  {errors.state && (
                    <p className="text-sm text-red-500">{errors.state}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postal_code">Código Postal</Label>
                  <Input
                    id="postal_code"
                    type="text"
                    value={data.postal_code}
                    onChange={(e) => setData('postal_code', e.target.value)}
                    placeholder="Código postal"
                    className={errors.postal_code ? 'border-red-500' : ''}
                  />
                  {errors.postal_code && (
                    <p className="text-sm text-red-500">{errors.postal_code}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contacto de Emergencia */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Contacto de Emergencia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_name">Nombre del Contacto</Label>
                  <Input
                    id="emergency_contact_name"
                    type="text"
                    value={data.emergency_contact_name}
                    onChange={(e) => setData('emergency_contact_name', e.target.value)}
                    placeholder="Nombre del contacto de emergencia"
                    className={errors.emergency_contact_name ? 'border-red-500' : ''}
                  />
                  {errors.emergency_contact_name && (
                    <p className="text-sm text-red-500">{errors.emergency_contact_name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_phone">Teléfono de Emergencia</Label>
                  <Input
                    id="emergency_contact_phone"
                    type="tel"
                    value={data.emergency_contact_phone}
                    onChange={(e) => setData('emergency_contact_phone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className={errors.emergency_contact_phone ? 'border-red-500' : ''}
                  />
                  {errors.emergency_contact_phone && (
                    <p className="text-sm text-red-500">{errors.emergency_contact_phone}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información de Seguros Múltiples */}
          <MultipleInsuranceSelector 
            insuranceTypes={insuranceTypes}
            value={data.insurances}
            onChange={(insurances) => setData('insurances', insurances)}
            errors={errors}
          />

          {/* Estado y Notas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Estado y Notas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="active"
                  checked={data.status === 'active'}
                  onCheckedChange={(checked) => setData('status', checked ? 'active' : 'inactive')}
                />
                <div className="space-y-1 leading-none">
                  <Label htmlFor="active">Paciente activo</Label>
                  <p className="text-sm text-muted-foreground">
                    Los pacientes inactivos no aparecerán en las búsquedas activas
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  value={data.notes}
                  onChange={(e) => setData('notes', e.target.value)}
                  placeholder="Notas adicionales sobre el paciente"
                  rows={3}
                  className={errors.notes ? 'border-red-500' : ''}
                />
                {errors.notes && (
                  <p className="text-sm text-red-500">{errors.notes}</p>
                )}
              </div>

              {errors.status && (
                <p className="text-sm text-red-500">{errors.status}</p>
              )}
            </CardContent>
          </Card>

          {/* Acciones */}
          <div className="flex justify-between pt-6">
            <Button type="button" variant="outline" asChild>
              <Link href="/medical/patients">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Link>
            </Button>
            <Button type="submit" disabled={processing}>
              {processing ? 'Guardando...' : 'Crear Paciente'}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}