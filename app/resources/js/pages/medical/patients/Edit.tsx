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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Patient, InsuranceType } from '@/types/medical'
import { type BreadcrumbItem } from '@/types'
import MultipleInsuranceSelector, { PatientInsurance } from '@/components/medical/MultipleInsuranceSelector'
import { formatDateForInput } from '@/utils/date-utils'

interface PatientsEditProps {
  patient: Patient
  insuranceTypes: InsuranceType[]
}

export default function PatientsEdit({ patient, insuranceTypes }: PatientsEditProps) {
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
      title: 'Editar',
      href: `/medical/patients/${patient.id}/edit`,
    },
  ]

  // Convertir datos existentes del paciente al formato de múltiples seguros
  const initializeInsurances = (): PatientInsurance[] => {
    const insurances: PatientInsurance[] = []

    // Tipado local para los seguros con pivot (relación many-to-many)
    type InsuranceWithPivot = {
      id: number
      pivot?: {
        insurance_number?: string
        valid_from?: string
        valid_until?: string
        coverage_percentage?: number
        is_primary?: boolean
        status?: string
        notes?: string
      }
    }

    const patientWithInsurances = patient as Patient & { insurances?: InsuranceWithPivot[] }

    // Normaliza el estado para que coincida con el tipo '"active" | "inactive" | "expired"'
    const normalizeStatus = (s?: string): 'active' | 'inactive' | 'expired' => {
      if (s === 'inactive' || s === 'expired') return s
      return 'active'
    }
    
    // Si el paciente tiene seguros asociados (many-to-many), usarlos
    if (patientWithInsurances.insurances && patientWithInsurances.insurances.length > 0) {
      patientWithInsurances.insurances.forEach((insurance, index: number) => {
        insurances.push({
          id: 1000 + index, // ID estático para evitar re-renders
          insurance_type_id: insurance.id.toString(),
          insurance_number: insurance.pivot?.insurance_number || '',
          valid_from: insurance.pivot?.valid_from || '',
          valid_until: insurance.pivot?.valid_until || '',
          coverage_percentage: insurance.pivot?.coverage_percentage || 100,
          is_primary: insurance.pivot?.is_primary || false,
          status: normalizeStatus(insurance.pivot?.status),
          notes: insurance.pivot?.notes || ''
        })
      })
    } else if (patient.insurance_type_id) {
      // Compatibilidad con formato anterior - convertir seguro único
      insurances.push({
        id: 1000,
        insurance_type_id: patient.insurance_type_id.toString(),
        insurance_number: patient.insurance_number || '',
        valid_from: '',
        valid_until: patient.insurance_valid_until || '',
        coverage_percentage: patient.insurance_coverage_percentage || 100,
        is_primary: true,
        status: 'active',
        notes: ''
      })
    }
    
    return insurances
  }

  // Función para normalizar género de BD al formato del Select
  const normalizeGenderForForm = (gender: string | null | undefined): string => {
    if (!gender) return ''
    const genderMap: { [key: string]: string } = {
      'M': 'male',
      'F': 'female',
      'OTHER': 'other',
      'male': 'male',
      'female': 'female',
      'other': 'other'
    }
    return genderMap[gender] || ''
  }

  const { data, setData, processing, errors } = useForm({
    document_type: patient.document_type || 'CI',
    document_number: patient.document_number || '',
    first_name: patient.first_name || '',
    last_name: patient.last_name || '',
    email: patient.email || '',
    phone: patient.phone || '',
    birth_date: formatDateForInput(patient.birth_date),
    gender: normalizeGenderForForm(patient.gender),
    address: patient.address || '',
    city: patient.city || '',
    state: patient.state || '',
    postal_code: patient.postal_code || '',
    emergency_contact_name: patient.emergency_contact_name || '',
    emergency_contact_phone: patient.emergency_contact_phone || '',
    insurances: initializeInsurances(),
    status: patient.status || 'active',
    notes: patient.notes || '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Preparar datos para envío - solo el seguro primario por ahora para compatibilidad
    const primaryInsurance = data.insurances.find(ins => ins.is_primary)
    const submissionData = {
      ...data,
      // Si hay seguros, tomar el primario para backward compatibility
      primary_insurance_type_id: primaryInsurance?.insurance_type_id || '',
      primary_insurance_number: primaryInsurance?.insurance_number || '',
      primary_insurance_valid_until: primaryInsurance?.valid_until || '',
      primary_insurance_coverage_percentage: primaryInsurance?.coverage_percentage || '',
    }

    // Crear objeto sin el array de seguros para que no interfiera
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { insurances: _, ...submissionDataClean } = submissionData
    
    router.put(`/medical/patients/${patient.id}`, submissionDataClean, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success('Paciente actualizado correctamente')
      },
      onError: () => {
        toast.error('Error al actualizar el paciente')
      },
    })
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Editar ${patient.first_name} ${patient.last_name} - Pacientes`} />

      <div className="space-y-6">
        <HeadingSmall
          title={`Editar ${patient.first_name} ${patient.last_name}`}
          description="Modifica la información del paciente"
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
                      <SelectItem value="male">Masculino</SelectItem>
                      <SelectItem value="female">Femenino</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
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
                    placeholder="Número de teléfono de emergencia"
                    className={errors.emergency_contact_phone ? 'border-red-500' : ''}
                  />
                  {errors.emergency_contact_phone && (
                    <p className="text-sm text-red-500">{errors.emergency_contact_phone}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información de Seguro */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Información de Seguros Médicos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <MultipleInsuranceSelector
                value={data.insurances}
                insuranceTypes={insuranceTypes}
                onChange={(insurances) => setData('insurances', insurances)}
              />

              <div className="space-y-2">
                <Label htmlFor="status">Estado del Paciente</Label>
                <Select 
                  value={data.status} 
                  onValueChange={(value) => setData('status', value as 'active' | 'inactive')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && (
                  <p className="text-sm text-red-500">{errors.status}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Acciones */}
          <div className="flex justify-between pt-6 mb-6">
            <Button type="button" variant="outline" asChild>
              <Link href="/medical/patients">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Link>
            </Button>
            <Button type="submit" disabled={processing}>
              {processing ? 'Guardando...' : 'Actualizar Paciente'}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}