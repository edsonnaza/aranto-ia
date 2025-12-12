import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Settings, Save, User, Percent, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'

import type { CommissionSettings as CommissionSettingsType, Professional } from '@/types'

const commissionSettingsSchema = z.object({
  default_commission_percentage: z.number().min(0).max(100),
  minimum_commission_amount: z.number().min(0),
  maximum_commission_amount: z.number().min(0),
  auto_approve_threshold: z.number().min(0),
  payment_deadline_days: z.number().min(1).max(365),
})

type CommissionSettingsFormData = z.infer<typeof commissionSettingsSchema>

const professionalCommissionSchema = z.object({
  professional_id: z.number(),
  commission_percentage: z.number().min(0).max(100),
})

type ProfessionalCommissionFormData = z.infer<typeof professionalCommissionSchema>

interface CommissionSettingsProps {
  professionals: Professional[]
}

export default function CommissionSettings({ professionals }: CommissionSettingsProps) {
  const [settings] = useState<CommissionSettingsType | null>({
    default_commission_percentage: 10,
    minimum_commission_amount: 10000,
    maximum_commission_amount: 100000,
    auto_approve_threshold: 50000,
    payment_deadline_days: 30,
  })
  const [professionalCommissions] = useState<Record<number, number>>({ 1: 12 })
  const [editingProfessional, setEditingProfessional] = useState<number | null>(null)

  // Simulación temporal de loading y error
  const loading = false
  const error = null

  const settingsForm = useForm<CommissionSettingsFormData>({
    resolver: zodResolver(commissionSettingsSchema),
    defaultValues: {
      default_commission_percentage: 0,
      minimum_commission_amount: 0,
      maximum_commission_amount: 0,
      auto_approve_threshold: 0,
      payment_deadline_days: 30,
    },
  })

  const professionalForm = useForm<ProfessionalCommissionFormData>({
    resolver: zodResolver(professionalCommissionSchema),
    defaultValues: {
      professional_id: 0,
      commission_percentage: 0,
    },
  })

  // Simulación temporal de settings y comisiones




  const startEditingProfessional = (professionalId: number, currentPercentage: number) => {
    setEditingProfessional(professionalId)
    professionalForm.reset({
      professional_id: professionalId,
      commission_percentage: currentPercentage,
    })
  }

  const cancelEditing = () => {
    setEditingProfessional(null)
    professionalForm.reset()
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuración de Comisiones
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Form {...settingsForm}>
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={settingsForm.control}
                  name="default_commission_percentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Porcentaje de Comisión Predeterminado</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <Percent className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      </FormControl>
                      <FormDescription>
                        Porcentaje aplicado cuando no hay configuración específica por profesional
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={settingsForm.control}
                  name="payment_deadline_days"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Días Límite para Pago</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="365"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 30)}
                        />
                      </FormControl>
                      <FormDescription>
                        Días después de la aprobación para realizar el pago
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={settingsForm.control}
                  name="minimum_commission_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monto Mínimo de Comisión</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        Monto mínimo para generar una liquidación (0 = sin límite)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={settingsForm.control}
                  name="maximum_commission_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monto Máximo de Comisión</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        Monto máximo por liquidación (0 = sin límite)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={settingsForm.control}
                  name="auto_approve_threshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Umbral de Auto-Aprobación</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        Liquidaciones por debajo de este monto se aprueban automáticamente (0 = desactivado)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Guardar Configuración
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Professional Commissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Comisiones por Profesional
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {professionals.map((professional) => {
              const currentPercentage = professionalCommissions[professional.id] || settings?.default_commission_percentage || 0
              const isEditing = editingProfessional === professional.id

              return (
                <div key={professional.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">{professional.first_name} {professional.last_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {professional.specialties && professional.specialties.length > 0
                        ? professional.specialties[0].name
                        : 'Sin especialidad'}
                    </div>
                  </div>

                  {isEditing ? (
                    <Form {...professionalForm}>
                      <form
                        // Sin lógica de envío
                        className="flex items-center gap-2"
                      >
                        <FormField
                          control={professionalForm.control}
                          name="commission_percentage"
                          render={({ field }) => (
                            <FormItem className="flex items-center gap-2">
                              <FormControl>
                                <div className="relative w-20">
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </div>
                              </FormControl>
                              <Percent className="h-4 w-4 text-muted-foreground" />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" size="sm" disabled={loading}>
                          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar'}
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={cancelEditing}>
                          Cancelar
                        </Button>
                      </form>
                    </Form>
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-medium">{currentPercentage}%</div>
                        <div className="text-sm text-muted-foreground">
                          {professionalCommissions[professional.id] !== undefined ? 'Personalizado' : 'Predeterminado'}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEditingProfessional(professional.id, currentPercentage)}
                      >
                        Editar
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}