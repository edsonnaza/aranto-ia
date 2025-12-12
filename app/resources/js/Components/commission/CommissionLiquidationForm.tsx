import React, { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CalendarIcon, Calculator, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import ProfessionalSelector from './ProfessionalSelector'
import { useCommissionLiquidations } from '@/hooks/medical'
import type { Professional, CommissionData } from '@/types'

const commissionFormSchema = z.object({
  professional_id: z.number().min(1, 'Debe seleccionar un profesional'),
  period_start: z.string().min(1, 'La fecha de inicio es requerida'),
  period_end: z.string().min(1, 'La fecha de fin es requerida'),
}).refine((data) => {
  const start = new Date(data.period_start)
  const end = new Date(data.period_end)
  return start <= end
}, {
  message: 'La fecha de inicio debe ser anterior o igual a la fecha de fin',
  path: ['period_end'],
})

type CommissionFormData = z.infer<typeof commissionFormSchema>

interface CommissionLiquidationFormProps {
  professionals: Professional[]
  onSuccess?: () => void
  onCancel?: () => void
}

export default function CommissionLiquidationForm({
  professionals,
  onSuccess,
  onCancel,
}: CommissionLiquidationFormProps) {
  const [commissionData, setCommissionData] = useState<CommissionData | null>(null)
  const [selectedServices, setSelectedServices] = useState<number[]>([])
  const [calculating, setCalculating] = useState(false)
  const [startDateOpen, setStartDateOpen] = useState(false)
  const [endDateOpen, setEndDateOpen] = useState(false)

  const { createLiquidation, getCommissionData, loading, error } = useCommissionLiquidations()

  const form = useForm<CommissionFormData>({
    resolver: zodResolver(commissionFormSchema),
    defaultValues: {
      professional_id: 0,
      period_start: '',
      period_end: '',
    },
  })

  const selectedProfessional = (professionals || []).find(
    p => p.id === form.watch('professional_id')
  )

  const periodStart = form.watch('period_start')
  const periodEnd = form.watch('period_end')

  // Calculate commission data when professional or period changes
  useEffect(() => {
    const calculateCommission = async () => {
      const professionalId = form.getValues('professional_id')
      const startDate = form.getValues('period_start')
      const endDate = form.getValues('period_end')

      if (professionalId && professionalId > 0 && startDate && endDate) {
        setCalculating(true)
        try {
          const data = await getCommissionData(professionalId, startDate, endDate)
          setCommissionData(data)
          setSelectedServices(data?.services.map(s => s.service_request_id) || []) // Selecciona todos por defecto
        } catch (err) {
          console.error('Error calculating commission:', err)
          setCommissionData(null)
          setSelectedServices([])
        } finally {
          setCalculating(false)
        }
      } else {
        setCommissionData(null)
        setSelectedServices([])
      }
    }

    const timeoutId = setTimeout(calculateCommission, 500)
    return () => clearTimeout(timeoutId)
  }, [periodStart, periodEnd, form, getCommissionData])

  const onSubmit = (data: CommissionFormData) => {
    if (selectedServices.length === 0) return
    createLiquidation({ ...data, service_request_ids: selectedServices }, {
      onSuccess: () => {
        if (onSuccess) onSuccess()
      },
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Generar Liquidación de Comisiones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Professional Selection */}
              <FormField
                control={form.control}
                name="professional_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profesional Médico</FormLabel>
                    <FormControl>
                      <ProfessionalSelector
                        professionals={professionals}
                        selectedProfessional={selectedProfessional || null}
                        onProfessionalSelect={(professional) => {
                          field.onChange(professional?.id || 0)
                        }}
                        placeholder="Seleccionar profesional..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Period Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="period_start"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fecha de Inicio</FormLabel>
                      <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(new Date(field.value + 'T00:00:00'), "PPP", { locale: es })
                              ) : (
                                <span>Seleccionar fecha</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value + 'T00:00:00') : undefined}
                            onSelect={(date) => {
                              field.onChange(date instanceof Date ? format(date, 'yyyy-MM-dd') : '')
                              setStartDateOpen(false)
                            }}
                            disabled={(date) => {
                              const endDate = form.getValues('period_end')
                              if (endDate) {
                                const end = new Date(endDate + 'T00:00:00')
                                const current = new Date(date)
                                current.setHours(0, 0, 0, 0)
                                return current > end
                              }
                              return false
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="period_end"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fecha de Fin</FormLabel>
                      <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(new Date(field.value + 'T00:00:00'), "PPP", { locale: es })
                              ) : (
                                <span>Seleccionar fecha</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value + 'T00:00:00') : undefined}
                            onSelect={(date) => {
                              field.onChange(date instanceof Date ? format(date, 'yyyy-MM-dd') : '')
                              setEndDateOpen(false)
                            }}
                            disabled={(date) => {
                              const startDate = form.getValues('period_start')
                              if (startDate) {
                                const start = new Date(startDate + 'T00:00:00')
                                const current = new Date(date)
                                current.setHours(0, 0, 0, 0)
                                return current < start
                              }
                              return false
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Commission Preview */}
              {commissionData && (
                <Card className="border-blue-200 bg-blue-50/50">
                  <CardHeader>
                    <CardTitle className="text-lg text-blue-900">
                      Vista Previa de la Liquidación
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {commissionData.summary.total_services}
                        </div>
                        <div className="text-sm text-blue-600">Servicios</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(commissionData.summary.gross_amount)}
                        </div>
                        <div className="text-sm text-green-600">Monto Bruto</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {commissionData.summary.commission_percentage}%
                        </div>
                        <div className="text-sm text-orange-600">Porcentaje</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {formatCurrency(commissionData.summary.commission_amount)}
                        </div>
                        <div className="text-sm text-purple-600">Comisión Total</div>
                      </div>
                    </div>

                    {commissionData.services.length > 0 && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-blue-900">
                            Servicios Incluidos ({commissionData.services.length})
                          </h4>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={selectedServices.length === commissionData.services.length}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedServices(commissionData.services.map(s => s.service_request_id))
                                } else {
                                  setSelectedServices([])
                                }
                              }}
                            />
                            <span className="text-sm text-blue-700">Seleccionar todos</span>
                          </div>
                        </div>
                        <div className="border rounded-md bg-white">
                          <div className="max-h-96 overflow-y-auto">
                            <Table>
                              <TableHeader className="sticky top-0 bg-white z-10">
                                <TableRow>
                                  <TableHead className="w-[50px]"></TableHead>
                                  <TableHead>Paciente</TableHead>
                                  <TableHead>Servicio</TableHead>
                                  <TableHead className="text-right">Precio</TableHead>
                                  <TableHead className="text-center">Comisión %</TableHead>
                                  <TableHead className="text-right">A Cobrar</TableHead>
                                  <TableHead>Fecha</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {commissionData.services.map((service, index) => (
                                  <TableRow key={index}>
                                    <TableCell>
                                      <Checkbox
                                        checked={selectedServices.includes(service.service_request_id)}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            setSelectedServices(prev => [...prev, service.service_request_id])
                                          } else {
                                            setSelectedServices(prev => prev.filter(id => id !== service.service_request_id))
                                          }
                                        }}
                                      />
                                    </TableCell>
                                    <TableCell className="font-medium">
                                      {service.patient_name || 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                      {service.service_name || `Servicio #${service.service_request_id}`}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {formatCurrency(service.service_amount)}
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                        {service.commission_percentage}%
                                      </span>
                                    </TableCell>
                                    <TableCell className="text-right font-semibold text-green-700">
                                      {formatCurrency(service.commission_amount)}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                      {format(new Date(service.service_date + 'T00:00:00'), 'dd/MM/yyyy', { locale: es })}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Calculating State */}
              {calculating && (
                <Alert>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <AlertDescription>
                    Calculando comisiones para el período seleccionado...
                  </AlertDescription>
                </Alert>
              )}

              {/* Error Display */}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Form Actions */}
              <div className="flex justify-end gap-4">
                {onCancel && (
                  <Button type="button" variant="outline" onClick={onCancel}>
                    Cancelar
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={loading || !commissionData || selectedServices.length === 0}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    'Generar Liquidación'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}