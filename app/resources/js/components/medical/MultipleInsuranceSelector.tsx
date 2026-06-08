import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Shield, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { InsuranceType } from '@/types/medical'

export interface PatientInsurance {
  id?: number
  insurance_type_id: string
  insurance_number: string
  valid_from?: string
  valid_until?: string
  coverage_percentage: number
  is_primary: boolean
  status: 'active' | 'inactive' | 'expired'
  notes?: string
  // Para mostrar en UI
  insurance_type?: InsuranceType
}

interface MultipleInsuranceSelectorProps {
  insuranceTypes: InsuranceType[]
  value: PatientInsurance[]
  onChange: (insurances: PatientInsurance[]) => void
  errors?: Record<string, string>
  disabled?: boolean
}

export default function MultipleInsuranceSelector({ 
  insuranceTypes, 
  value = [], 
  onChange, 
  errors = {},
  disabled = false 
}: MultipleInsuranceSelectorProps) {
  const [insurances, setInsurances] = useState<PatientInsurance[]>(value)

  // Sincronizar con el valor externo
  useEffect(() => {
    setInsurances(value)
  }, [value])

  // Agregar seguro por defecto "Particular" si no hay ninguno
  useEffect(() => {
    if (insurances.length === 0) {
      const particularInsurance = insuranceTypes.find(type => type.code === 'PARTICULAR')
      if (particularInsurance) {
        const defaultInsurance: PatientInsurance = {
          insurance_type_id: particularInsurance.id.toString(),
          insurance_number: '',
          coverage_percentage: 100,
          is_primary: true,
          status: 'active',
          insurance_type: particularInsurance
        }
        setInsurances([defaultInsurance])
        onChange([defaultInsurance])
      }
    }
  }, [insuranceTypes, insurances.length, onChange])

  const addInsurance = () => {
    const newInsurance: PatientInsurance = {
      insurance_type_id: '',
      insurance_number: '',
      coverage_percentage: 100,
      is_primary: false,
      status: 'active',
      notes: ''
    }
    
    const updated = [...insurances, newInsurance]
    setInsurances(updated)
    onChange(updated)
  }

  const removeInsurance = (index: number) => {
    if (insurances.length <= 1) return // No permitir eliminar el último seguro
    
    const updated = insurances.filter((_, i) => i !== index)
    
    // Si eliminamos el primario, hacer primario al primer seguro restante
    if (insurances[index].is_primary && updated.length > 0) {
      updated[0].is_primary = true
    }
    
    setInsurances(updated)
    onChange(updated)
  }

  const updateInsurance = (index: number, field: keyof PatientInsurance, value: string | number | boolean) => {
    const updated = [...insurances]
    updated[index] = { ...updated[index], [field]: value }

    // Si marcamos como primario, quitar primario de otros
    if (field === 'is_primary' && value === true) {
      updated.forEach((insurance, i) => {
        if (i !== index) {
          insurance.is_primary = false
        }
      })
    }

    // Agregar información del tipo de seguro para UI
    if (field === 'insurance_type_id') {
      const selectedType = insuranceTypes.find(type => type.id.toString() === value)
      updated[index].insurance_type = selectedType
      
      // Auto-generar número si es PARTICULAR
      if (selectedType?.code === 'PARTICULAR' && !updated[index].insurance_number) {
        updated[index].insurance_number = 'PARTICULAR-'
      }
    }

    setInsurances(updated)
    onChange(updated)
  }

  const getAvailableInsuranceTypes = (currentIndex: number) => {
    const usedTypeIds = insurances
      .filter((_, index) => index !== currentIndex)
      .map(insurance => insurance.insurance_type_id)
    
    return insuranceTypes.filter(type => !usedTypeIds.includes(type.id.toString()))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Seguros Médicos
          <Badge variant="secondary">{insurances.length}</Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Gestiona los seguros médicos del paciente. El seguro "Particular" se asigna automáticamente.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {insurances.map((insurance, index) => {
          const availableTypes = getAvailableInsuranceTypes(index)
          const errorPrefix = `insurances.${index}`
          
          return (
            <div key={index} className="relative">
              <Card className={`${insurance.is_primary ? 'border-blue-500 bg-blue-50/50' : ''} ${disabled ? 'opacity-60' : ''}`}>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium">
                        Seguro {index + 1}
                        {insurance.is_primary && (
                          <Badge variant="default" className="ml-2">
                            <Star className="h-3 w-3 mr-1" />
                            Primario
                          </Badge>
                        )}
                      </h4>
                    </div>
                    
                    {!disabled && insurances.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeInsurance(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`insurance_type_${index}`}>
                        Tipo de Seguro <span className="text-red-500">*</span>
                      </Label>
                      <Select 
                        value={insurance.insurance_type_id} 
                        onValueChange={(value) => updateInsurance(index, 'insurance_type_id', value)}
                        disabled={disabled}
                      >
                        <SelectTrigger className={errors[`${errorPrefix}.insurance_type_id`] ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Seleccionar tipo de seguro" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id.toString()}>
                              <div className="flex items-center gap-2">
                                <span>{type.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {type.code}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                          {availableTypes.length === 0 && (
                            <SelectItem value="no-options" disabled>
                              No hay tipos de seguro disponibles
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      {errors[`${errorPrefix}.insurance_type_id`] && (
                        <p className="text-sm text-red-500">{errors[`${errorPrefix}.insurance_type_id`]}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`insurance_number_${index}`}>
                        Número de Seguro <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id={`insurance_number_${index}`}
                        type="text"
                        value={insurance.insurance_number}
                        onChange={(e) => updateInsurance(index, 'insurance_number', e.target.value)}
                        placeholder="Número de póliza o afiliación"
                        className={errors[`${errorPrefix}.insurance_number`] ? 'border-red-500' : ''}
                        disabled={disabled}
                      />
                      {errors[`${errorPrefix}.insurance_number`] && (
                        <p className="text-sm text-red-500">{errors[`${errorPrefix}.insurance_number`]}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`valid_from_${index}`}>Válido Desde</Label>
                      <Input
                        id={`valid_from_${index}`}
                        type="date"
                        value={insurance.valid_from || ''}
                        onChange={(e) => updateInsurance(index, 'valid_from', e.target.value)}
                        className={errors[`${errorPrefix}.valid_from`] ? 'border-red-500' : ''}
                        disabled={disabled}
                      />
                      {errors[`${errorPrefix}.valid_from`] && (
                        <p className="text-sm text-red-500">{errors[`${errorPrefix}.valid_from`]}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`valid_until_${index}`}>Válido Hasta</Label>
                      <Input
                        id={`valid_until_${index}`}
                        type="date"
                        value={insurance.valid_until || ''}
                        onChange={(e) => updateInsurance(index, 'valid_until', e.target.value)}
                        className={errors[`${errorPrefix}.valid_until`] ? 'border-red-500' : ''}
                        disabled={disabled}
                      />
                      {errors[`${errorPrefix}.valid_until`] && (
                        <p className="text-sm text-red-500">{errors[`${errorPrefix}.valid_until`]}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`coverage_percentage_${index}`}>% Cobertura</Label>
                      <Input
                        id={`coverage_percentage_${index}`}
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={insurance.coverage_percentage}
                        onChange={(e) => updateInsurance(index, 'coverage_percentage', parseFloat(e.target.value) || 0)}
                        className={errors[`${errorPrefix}.coverage_percentage`] ? 'border-red-500' : ''}
                        disabled={disabled}
                      />
                      {errors[`${errorPrefix}.coverage_percentage`] && (
                        <p className="text-sm text-red-500">{errors[`${errorPrefix}.coverage_percentage`]}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`is_primary_${index}`}
                        checked={insurance.is_primary}
                        onCheckedChange={(checked) => updateInsurance(index, 'is_primary', checked as boolean)}
                        disabled={disabled}
                      />
                      <Label htmlFor={`is_primary_${index}`}>Seguro Primario</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Label htmlFor={`status_${index}`}>Estado:</Label>
                      <Select 
                        value={insurance.status} 
                        onValueChange={(value) => updateInsurance(index, 'status', value)}
                        disabled={disabled}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Activo</SelectItem>
                          <SelectItem value="inactive">Inactivo</SelectItem>
                          <SelectItem value="expired">Vencido</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {insurance.notes !== undefined && (
                    <div className="space-y-2">
                      <Label htmlFor={`notes_${index}`}>Notas</Label>
                      <Textarea
                        id={`notes_${index}`}
                        value={insurance.notes || ''}
                        onChange={(e) => updateInsurance(index, 'notes', e.target.value)}
                        placeholder="Notas adicionales sobre este seguro"
                        rows={2}
                        className={errors[`${errorPrefix}.notes`] ? 'border-red-500' : ''}
                        disabled={disabled}
                      />
                      {errors[`${errorPrefix}.notes`] && (
                        <p className="text-sm text-red-500">{errors[`${errorPrefix}.notes`]}</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )
        })}

        {!disabled && (
          <Button
            type="button"
            variant="outline"
            onClick={addInsurance}
            className="w-full"
            disabled={insurances.length >= insuranceTypes.length}
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Otro Seguro
          </Button>
        )}

        {errors.general && (
          <p className="text-sm text-red-500">{errors.general}</p>
        )}
      </CardContent>
    </Card>
  )
}