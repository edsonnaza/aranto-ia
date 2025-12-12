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
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/ui/data-table'
import { cn } from '@/lib/utils'
import ProfessionalSelector from './ProfessionalSelector'
import { useCommissionLiquidations } from '@/hooks/medical'
import type { Professional, CommissionData } from '@/types'

interface ServiceRow {
  service_request_id: number
  patient_name: string
  service_name: string
  service_amount: number
  commission_percentage: number
  commission_amount: number
  service_date: string
}

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

type CommissionLiquidationFormData = CommissionFormData & {
  service_request_ids: number[]
}

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


  // Calculate totals based on selected services
  const selectedTotals = useMemo(() => {
    if (!commissionData) {
      return {
        count: 0,
        grossAmount: 0,
        commissionAmount: 0
      }
    }

    const selectedServicesList = commissionData.services.filter(s => 
      selectedServices.includes(s.service_request_id)
    )

    return {
      count: selectedServicesList.length,
      grossAmount: selectedServicesList.reduce((sum, s) => sum + s.service_amount, 0),
      commissionAmount: selectedServicesList.reduce((sum, s) => sum + s.commission_amount, 0)
    }
  }, [commissionData, selectedServices])

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

    // Call calculateCommission when dependencies change
    calculateCommission()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.watch('professional_id'), form.watch('period_start'), form.watch('period_end')])

  const onSubmit = (data: CommissionFormData) => {
    if (selectedServices.length === 0) return
    const payload: CommissionLiquidationFormData = { ...data, service_request_ids: selectedServices }
    createLiquidation(payload, {
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

  // Define columns for DataTable
  const columns = useMemo<ColumnDef<ServiceRow>[]>(() => [
    {
      id: 'select',
      header: () => {
        const allServiceIds = commissionData?.services.map(s => s.service_request_id) || []
        const allSelected = allServiceIds.length > 0 && allServiceIds.every(id => selectedServices.includes(id))
        
        return (
          <Checkbox
            checked={allSelected}
            onCheckedChange={(value) => {
              if (value) {
                setSelectedServices(allServiceIds)
              } else {
                setSelectedServices([])
              }
            }}
            aria-label="Seleccionar todos"
          />
        )
      },
      cell: ({ row }) => (
        <Checkbox
          checked={selectedServices.includes(row.original.service_request_id)}
          onCheckedChange={(value) => {
            if (value) {
              setSelectedServices(prev => [...prev, row.original.service_request_id])
            } else {
              setSelectedServices(prev => prev.filter(id => id !== row.original.service_request_id))
            }
          }}
          aria-label="Seleccionar fila"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'patient_name',
      header: 'Paciente',
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('patient_name') || 'N/A'}</div>
      ),
    },
    {
      accessorKey: 'service_name',
      header: 'Servicio',
      cell: ({ row }) => (
        <div>{row.getValue('service_name') || `Servicio #${row.original.service_request_id}`}</div>
      ),
    },
    {
      accessorKey: 'service_amount',
      header: () => (
        <div className="text-right">Precio</div>
      ),
      cell: ({ row }) => (
        <div className="text-right">{formatCurrency(row.getValue('service_amount'))}</div>
      ),
    },
    {
      accessorKey: 'commission_percentage',
      header: () => (
        <div className="text-right">Comisión %</div>
      ),
      cell: ({ row }) => (
        <div className="text-right">
          <Badge variant="secondary">
            {row.getValue('commission_percentage')}%
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: 'commission_amount',
      header: () => (
        <div className="text-right">A Cobrar</div>
      ),
      cell: ({ row }) => (
        <div className="text-right font-semibold text-green-700">
          {formatCurrency(row.getValue('commission_amount'))}
        </div>
      ),
    },
    {
      accessorKey: 'service_date',
      header: 'Fecha',
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {format(new Date(row.getValue('service_date') + 'T00:00:00'), 'dd/MM/yyyy', { locale: es })}
        </div>
      ),
    },
  ], [commissionData, selectedServices])

  // Prepare data for DataTable
  const tableData = useMemo(() => {
    if (!commissionData) return { data: [], current_page: 1, per_page: 100, total: 0, last_page: 1, from: 0, to: 0, links: [] }

    // Map each service to ServiceRow shape
    const data: ServiceRow[] = commissionData.services.map((s) => ({
      service_request_id: s.service_request_id,
      patient_name: s.patient_name ?? `Paciente #${s.patient_id ?? ''}`,
      service_name: s.service_name ?? (s.service_id ? `Servicio #${s.service_id}` : 'Servicio'),
      service_amount: s.service_amount,
      commission_percentage: s.commission_percentage,
      commission_amount: s.commission_amount,
      service_date: s.service_date,
    }))

    return {
      data,
      current_page: 1,
      per_page: 100,
      total: data.length,
      last_page: 1,
      from: 1,
      to: data.length,
      links: []
    }
  }, [commissionData])

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
                            // isDateDisabled removed: Calendar does not support this prop
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
                            // isDateDisabled removed: Calendar does not support this prop
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
                          {selectedTotals.count}
                        </div>
                        <div className="text-sm text-blue-600">
                          Servicios Seleccionados
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          de {commissionData.summary.total_services} totales
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(selectedTotals.grossAmount)}
                        </div>
                        <div className="text-sm text-green-600">Monto Bruto</div>
                        {selectedTotals.grossAmount !== commissionData.summary.gross_amount && (
                          <div className="text-xs text-muted-foreground mt-1">
                            de {formatCurrency(commissionData.summary.gross_amount)}
                          </div>
                        )}
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {commissionData.summary.commission_percentage}%
                        </div>
                        <div className="text-sm text-orange-600">Porcentaje</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {formatCurrency(selectedTotals.commissionAmount)}
                        </div>
                        <div className="text-sm text-purple-600">Comisión Total</div>
                        {selectedTotals.commissionAmount !== commissionData.summary.commission_amount && (
                          <div className="text-xs text-muted-foreground mt-1">
                            de {formatCurrency(commissionData.summary.commission_amount)}
                          </div>
                        )}
                      </div>
                    </div>

                    {commissionData.services.length > 0 && (
                      <div className="mt-6">
                        <h4 className="font-medium text-blue-960 mb-2">
                          Servicios Incluidos ({selectedTotals.count} de {commissionData.services.length} seleccionados)
                        </h4>
                        <DataTable
                          columns={columns}
                          data={tableData}
                          searchable={true}
                          searchPlaceholder="Buscar por paciente o servicio..."
                          filterable={false}
                          selectable={false}
                          emptyMessage="No hay servicios en el período seleccionado"
                          className="border rounded-md bg-white"
                        />
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