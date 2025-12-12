import React, { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarIcon, FileText, TrendingUp, Users, DollarSign, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { useCommissionReports } from '@/hooks/medical'
import type { CommissionReport, CommissionReportSummary } from '@/types'

interface CommissionReportProps {
  className?: string
}

export default function CommissionReport({ className }: CommissionReportProps) {
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [startDateOpen, setStartDateOpen] = useState(false)
  const [endDateOpen, setEndDateOpen] = useState(false)
  const [reportData, setReportData] = useState<CommissionReport | null>(null)
  const [summaryData, setSummaryData] = useState<CommissionReportSummary | null>(null)

  // Simulación temporal de loading y error
  const { loading, error } = useCommissionReports()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
    }).format(amount)
  }

  // Simulación temporal de generación de reporte
  const handleGenerateReport = async () => {
    if (!startDate || !endDate) return
    setReportData({
      professionals: [
        {
          professional_name: 'Dr. Pérez',
          specialty_name: 'Cardiología',
          total_services: 10,
          total_service_amount: 2000000,
          commission_percentage: 10,
          commission_amount: 200000,
          liquidation_status: 'pending',
        }
      ],
      summary: {
        total_liquidations: 1,
        total_commission: 200000,
        paid_commission: 0,
        pending_commission: 200000,
      },
      liquidations: [],
    })
    setSummaryData({
      total_professionals: 1,
      total_services: 10,
      total_amount: 2000000,
      total_commissions: 200000,
    })
  }

  const handleExportReport = () => {
    if (!reportData) return

    // Create CSV content
    const csvContent = generateCSVContent(reportData)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `reporte-comisiones-${startDate}-${endDate}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const generateCSVContent = (report: CommissionReport): string => {
    const headers = [
      'Profesional',
      'Especialidad',
      'Servicios Realizados',
      'Monto Total Servicios',
      'Porcentaje Comisión',
      'Monto Comisión',
      'Estado Liquidación'
    ]

    const rows = report.professionals.map(prof => [
      prof.professional_name,
      prof.specialty_name,
      prof.total_services.toString(),
      prof.total_service_amount.toString(),
      `${prof.commission_percentage}%`,
      prof.commission_amount.toString(),
      prof.liquidation_status
    ])

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Report Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Reporte de Comisiones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha de Inicio</label>
              <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    {startDate ? (
                      format(new Date(startDate), "PPP", { locale: es })
                    ) : (
                      <span>Seleccionar fecha</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate ? new Date(startDate) : undefined}
                    onSelect={(date) => {
                      setStartDate(date instanceof Date ? format(date, 'yyyy-MM-dd') : '')
                      setStartDateOpen(false)
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha de Fin</label>
              <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    {endDate ? (
                      format(new Date(endDate), "PPP", { locale: es })
                    ) : (
                      <span>Seleccionar fecha</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate ? new Date(endDate) : undefined}
                    onSelect={(date) => {
                      setEndDate(date instanceof Date ? format(date, 'yyyy-MM-dd') : '')
                      setEndDateOpen(false)
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleGenerateReport}
                disabled={!startDate || !endDate || loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generando...
                  </>
                ) : (
                  'Generar Reporte'
                )}
              </Button>
              {reportData && (
                <Button
                  variant="outline"
                  onClick={handleExportReport}
                  className="px-3"
                >
                  <FileText className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {summaryData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Profesionales
                  </p>
                  <p className="text-2xl font-bold">{summaryData.total_professionals}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Servicios
                  </p>
                  <p className="text-2xl font-bold">{summaryData.total_services}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Monto Total
                  </p>
                  <p className="text-2xl font-bold">{formatCurrency(summaryData.total_amount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Comisiones
                  </p>
                  <p className="text-2xl font-bold">{formatCurrency(summaryData.total_commissions)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Report */}
      {reportData && (
        <Card>
          <CardHeader>
            <CardTitle>
              Detalle por Profesional
              <Badge variant="secondary" className="ml-2">
                {reportData.professionals.length} profesionales
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Profesional</th>
                    <th className="text-left p-2">Especialidad</th>
                    <th className="text-right p-2">Servicios</th>
                    <th className="text-right p-2">Monto Servicios</th>
                    <th className="text-right p-2">Comisión %</th>
                    <th className="text-right p-2">Monto Comisión</th>
                    <th className="text-center p-2">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.professionals.map((prof, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="p-2 font-medium">{prof.professional_name}</td>
                      <td className="p-2">{prof.specialty_name}</td>
                      <td className="p-2 text-right">{prof.total_services}</td>
                      <td className="p-2 text-right">{formatCurrency(prof.total_service_amount)}</td>
                      <td className="p-2 text-right">{prof.commission_percentage}%</td>
                      <td className="p-2 text-right font-medium">
                        {formatCurrency(prof.commission_amount)}
                      </td>
                      <td className="p-2 text-center">
                        <Badge
                          variant={
                            prof.liquidation_status === 'liquidated' ? 'default' :
                            prof.liquidation_status === 'pending' ? 'secondary' : 'destructive'
                          }
                        >
                          {prof.liquidation_status === 'liquidated' ? 'Liquidado' :
                           prof.liquidation_status === 'pending' ? 'Pendiente' : 'Sin liquidar'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 font-bold">
                    <td className="p-2" colSpan={2}>TOTAL</td>
                    <td className="p-2 text-right">
                      {reportData.professionals.reduce((sum, prof) => sum + prof.total_services, 0)}
                    </td>
                    <td className="p-2 text-right">
                      {formatCurrency(
                        reportData.professionals.reduce((sum, prof) => sum + prof.total_service_amount, 0)
                      )}
                    </td>
                    <td className="p-2 text-right">-</td>
                    <td className="p-2 text-right">
                      {formatCurrency(
                        reportData.professionals.reduce((sum, prof) => sum + prof.commission_amount, 0)
                      )}
                    </td>
                    <td className="p-2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}