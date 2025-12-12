import React, { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ArrowLeft, CheckCircle, Clock, AlertCircle, FileText, DollarSign, Calendar, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useCommissionLiquidations } from '@/hooks/medical'
import type { CommissionLiquidation, CommissionLiquidationDetail as ServiceDetail } from '@/types'

interface CommissionLiquidationDetailProps {
  liquidationId: number
  onBack?: () => void
}

export default function CommissionLiquidationDetail({
  liquidationId,
  onBack,
}: CommissionLiquidationDetailProps) {
  // detail is a response object with the liquidation and its service details
  const [detail, setDetail] = useState<{ liquidation: CommissionLiquidation; services: ServiceDetail[] } | null>(null)

  const { getLiquidationDetail, approveLiquidation, payLiquidation, loading, error } = useCommissionLiquidations()

  const loadDetail = useCallback(async () => {
    try {
      const data = await getLiquidationDetail(liquidationId)
      setDetail(data)
    } catch (err) {
      console.error('Error loading liquidation detail:', err)
    }
  }, [liquidationId, getLiquidationDetail])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDetail()
  }, [loadDetail])

  const handleApprove = async () => {
    if (!detail) return

    try {
      await approveLiquidation(detail.liquidation.id)
      await loadDetail()
    } catch (err) {
      console.error('Error approving liquidation:', err)
    }
  }

  const handleMarkAsPaid = async () => {
    if (!detail) return

    try {
      // Mock temporal para los datos de pago
      await payLiquidation(detail.liquidation.id, {
        cash_register_session_id: 1,
        amount: detail.liquidation.commission_amount ?? 0,
        concept: 'Pago de comisión'
      })
      await loadDetail()
    } catch (err) {
      console.error('Error marking as paid:', err)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: es })
  }

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: es })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pendiente
          </Badge>
        )
      case 'approved':
        return (
          <Badge variant="default" className="flex items-center gap-1 bg-blue-100 text-blue-800">
            <CheckCircle className="h-3 w-3" />
            Aprobada
          </Badge>
        )
      case 'paid':
        return (
          <Badge variant="default" className="flex items-center gap-1 bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3" />
            Pagada
          </Badge>
        )
      case 'cancelled':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Cancelada
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading && !detail) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Cargando detalles de la liquidación...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!detail) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No se encontraron detalles de la liquidación</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // detail is guaranteed to be present here thanks to the early return above
  const { liquidation, services } = detail!

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        {onBack && (
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        )}
        <div>
          <h1 className="text-2xl font-bold">Liquidación #{liquidation.id}</h1>
          <p className="text-muted-foreground">
            {liquidation.professional_name} - {liquidation.specialty_name}
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Liquidation Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Resumen de Liquidación
            </span>
            {getStatusBadge(liquidation.status)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                <span className="text-sm">Profesional</span>
              </div>
              <div className="font-medium">{liquidation.professional_name}</div>
              <div className="text-sm text-muted-foreground">{liquidation.specialty_name}</div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">Período</span>
              </div>
              <div className="font-medium">
                {formatDate(liquidation.period_start)} - {formatDate(liquidation.period_end)}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span className="text-sm">Servicios</span>
              </div>
                <div className="font-medium">{liquidation.total_services}</div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm">Monto Comisión</span>
              </div>
              <div className="font-medium text-lg">{formatCurrency(liquidation.commission_amount ?? 0)}</div>
              <div className="text-sm text-muted-foreground">
                ({liquidation.commission_percentage}% de {formatCurrency(liquidation.total_amount ?? 0)})
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Creado: {formatDateTime(liquidation.created_at)}
              {liquidation.approved_at && (
                <> • Aprobado: {formatDateTime(liquidation.approved_at)}</>
              )}
              {liquidation.paid_at && (
                <> • Pagado: {formatDateTime(liquidation.paid_at)}</>
              )}
            </div>

            <div className="flex gap-2">
              {liquidation.status === 'pending' && (
                <Button onClick={handleApprove} disabled={loading}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Aprobar
                </Button>
              )}
              {liquidation.status === 'approved' && (
                <Button onClick={handleMarkAsPaid} disabled={loading}>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Marcar como Pagada
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services Detail */}
      <Card>
        <CardHeader>
          <CardTitle>
            Servicios Incluidos ({services.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Servicio</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Servicio</TableHead>
                  <TableHead className="text-right">Monto Servicio</TableHead>
                  <TableHead className="text-right">Comisión</TableHead>
                  <TableHead className="text-center">Fecha Servicio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service: ServiceDetail) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-mono text-sm">
                      #{service.service_request_id}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{service.patient_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {service.patient_document}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{service.service_name}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(service.service_amount)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(service.commission_amount)}
                    </TableCell>
                    <TableCell className="text-center">
                      {formatDate(service.service_date)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableRow className="border-t-2 font-bold">
                <TableCell colSpan={3} className="text-right">TOTAL</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(services.reduce((sum: number, s: ServiceDetail) => sum + s.service_amount, 0))}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(services.reduce((sum: number, s: ServiceDetail) => sum + s.commission_amount, 0))}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}