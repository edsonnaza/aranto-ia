import React from 'react'
import { Head, useForm, Link } from '@inertiajs/react'
import { ArrowLeft, Pencil } from 'lucide-react'
import HeadingSmall from '@/components/heading-small'
import AppLayout from '@/layouts/app-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { InsuranceType } from '@/types/medical'
import { type BreadcrumbItem } from '@/types'

interface InsuranceTypesEditProps {
  insuranceType: InsuranceType
}

const breadcrumbs = (insuranceType: InsuranceType): BreadcrumbItem[] => [
  {
    title: 'Dashboard',
    href: '/dashboard',
  },
  {
    title: 'Sistema Médico',
    href: '/medical',
  },
  {
    title: 'Tipos de Seguro',
    href: '/medical/insurance-types',
  },
  {
    title: insuranceType.name,
    href: `/medical/insurance-types/${insuranceType.id}`,
  },
  {
    title: 'Editar',
    href: `/medical/insurance-types/${insuranceType.id}/edit`,
  },
]

export default function InsuranceTypesEdit({ insuranceType }: InsuranceTypesEditProps) {
  const { data, setData, put, processing, errors } = useForm({
    name: insuranceType.name,
    description: insuranceType.description || '',
    coverage_percentage: insuranceType.coverage_percentage,
    active: insuranceType.active,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    put(`/medical/insurance-types/${insuranceType.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success('Tipo de seguro actualizado correctamente')
      },
      onError: () => {
        toast.error('Error al actualizar el tipo de seguro')
      },
    })
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs(insuranceType)}>
      <Head title={`Editar ${insuranceType.name} - Sistema Médico`} />

      <div className="space-y-6">
        <HeadingSmall
          title={`Editar: ${insuranceType.name}`}
          description="Modificar la información del tipo de seguro"
        />

        {/* Back Button */}
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/medical/insurance-types">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Listado
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/medical/insurance-types/${insuranceType.id}`}>
              Ver Detalles
            </Link>
          </Button>
        </div>

        {/* Form Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-blue-600" />
              Editar Información del Tipo de Seguro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Nombre del Tipo de Seguro *
                  </Label>
                  <Input
                    id="name"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    placeholder="Ej: Seguro Social, Privado, etc."
                    className={errors.name ? 'border-red-500' : ''}
                    disabled={processing}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="coverage_percentage">
                    Porcentaje de Cobertura *
                  </Label>
                  <div className="relative">
                    <Input
                      id="coverage_percentage"
                      type="number"
                      min="0"
                      max="100"
                      value={data.coverage_percentage}
                      onChange={(e) => setData('coverage_percentage', parseInt(e.target.value) || 0)}
                      placeholder="100"
                      className={errors.coverage_percentage ? 'border-red-500' : ''}
                      disabled={processing}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                      %
                    </div>
                  </div>
                  {errors.coverage_percentage && (
                    <p className="text-sm text-red-600">{errors.coverage_percentage}</p>
                  )}
                  <p className="text-sm text-gray-600">
                    Porcentaje que cubre este tipo de seguro (0-100%)
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">
                  Descripción
                </Label>
                <Textarea
                  id="description"
                  value={data.description}
                  onChange={(e) => setData('description', e.target.value)}
                  placeholder="Descripción opcional del tipo de seguro..."
                  rows={4}
                  className={errors.description ? 'border-red-500' : ''}
                  disabled={processing}
                />
                {errors.description && (
                  <p className="text-sm text-red-600">{errors.description}</p>
                )}
              </div>

              {/* Status */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="active"
                  checked={data.active}
                  onCheckedChange={(checked) => setData('active', !!checked)}
                  disabled={processing}
                />
                <Label htmlFor="active" className="text-sm font-medium leading-none">
                  Tipo de seguro activo
                </Label>
              </div>
              {errors.active && (
                <p className="text-sm text-red-600">{errors.active}</p>
              )}

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  asChild
                  disabled={processing}
                >
                  <Link href={`/medical/insurance-types/${insuranceType.id}`}>
                    Cancelar
                  </Link>
                </Button>
                <Button 
                  type="submit" 
                  disabled={processing}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {processing ? 'Actualizando...' : 'Actualizar Tipo de Seguro'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}