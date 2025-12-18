import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CheckCircle, Eye, Clock, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { useCommissionLiquidations } from '@/hooks/medical'
import type { CommissionPendingApproval } from '@/types'

interface CommissionPendingApprovalsProps {
  initialApprovals?: CommissionPendingApproval[]
  onViewDetail?: (liquidationId: number) => void
  refreshTrigger?: number
}

export default function CommissionPendingApprovals({
  initialApprovals = [],
  onViewDetail,
  refreshTrigger,
}: CommissionPendingApprovalsProps) {
  const [pendingApprovals, setPendingApprovals] = useState<CommissionPendingApproval[]>(initialApprovals)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [selectedLiquidation, setSelectedLiquidation] = useState<CommissionPendingApproval | null>(null)

  // Usamos el hook para aprobar liquidaciones
  const { approveLiquidation, loading, error } = useCommissionLiquidations()

  // Actualizar cuando cambien las props
  useEffect(() => {
    setPendingApprovals(initialApprovals)
  }, [initialApprovals])

  const handleApproveClick = (approval: CommissionPendingApproval) => {
    console.log('handleApproveClick called with:', approval)
    setSelectedLiquidation(approval)
    setConfirmDialogOpen(true)
  }

  const handleConfirmApprove = () => {
    if (!selectedLiquidation) {
      console.error('No selectedLiquidation')
      return
    }

    console.log('Calling approveLiquidation with ID:', selectedLiquidation.id)
    approveLiquidation(selectedLiquidation.id, {
      onSuccess: () => {
        console.log('Approval successful')
        setSelectedLiquidation(null)
        // Inertia actualizará automáticamente las props
      },
      onError: () => {
        console.log('Approval failed')
        // El error ya se maneja en el hook con toast
        setSelectedLiquidation(null)
      }
    })
  }

  // El método rejectLiquidation no existe, así que lo eliminamos

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: es })
  }

  const getDaysPending = (createdAt: string) => {
    const created = new Date(createdAt)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - created.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getUrgencyBadge = (daysPending: number) => {
    if (daysPending >= 7) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Urgente ({daysPending} días)
        </Badge>
      )
    } else if (daysPending >= 3) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1 bg-orange-100 text-orange-800">
          <Clock className="h-3 w-3" />
          Pendiente ({daysPending} días)
        </Badge>
      )
    } else {
      return (
        <Badge variant="outline" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Reciente ({daysPending} días)
        </Badge>
      )
    }
  }

  if (loading && pendingApprovals.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Cargando aprobaciones pendientes...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Liquidaciones Pendientes de Aprobación
            </span>
            <Badge variant="secondary">
              {pendingApprovals.length} pendientes
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {pendingApprovals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay liquidaciones pendientes de aprobación</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Profesional</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead className="text-right">Servicios</TableHead>
                    <TableHead className="text-right">Monto Total</TableHead>
                    <TableHead className="text-right">Comisión</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-center">Fecha / Urgencia</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingApprovals.map((approval) => {
                    const daysPending = getDaysPending(approval.created_at)
                    return (
                      <TableRow key={approval.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div>
                            <div className="font-medium">{approval.professional_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {approval.specialty_name}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatDate(approval.period_start)} - {formatDate(approval.period_end)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {approval.total_services}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(approval.total_amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div>
                            <div className="font-medium">
                              {formatCurrency(approval.commission_amount)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              ({approval.commission_percentage}%)
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-300">
                            <Clock className="h-3 w-3 mr-1" />
                            Borrador
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            <div className="text-sm">
                              {formatDate(approval.created_at)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              hace {daysPending} día{daysPending !== 1 ? 's' : ''}
                            </div>
                            {getUrgencyBadge(daysPending)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            {onViewDetail && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onViewDetail(approval.id)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              onClick={() => handleApproveClick(approval)}
                              disabled={loading}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Footer */}
      {pendingApprovals.length > 0 && (
        <Card className="border-t-4 border-t-orange-500">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {pendingApprovals.length}
                </div>
                <div className="text-sm text-muted-foreground">Pendientes</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {pendingApprovals.filter(p => getDaysPending(p.created_at) >= 7).length}
                </div>
                <div className="text-sm text-muted-foreground">Urgentes (≥7 días)</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(
                    pendingApprovals.reduce((sum, p) => sum + p.commission_amount, 0)
                  )}
                </div>
                <div className="text-sm text-muted-foreground">Total Comisiones</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(
                    pendingApprovals.reduce((sum, p) => sum + getDaysPending(p.created_at), 0) /
                    pendingApprovals.length
                  )}
                </div>
                <div className="text-sm text-muted-foreground">Días Promedio</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        title="Aprobar Liquidación"
        description={
          selectedLiquidation
            ? `¿Está seguro de aprobar la liquidación de ${selectedLiquidation.professional_name} por un monto de ${formatCurrency(selectedLiquidation.commission_amount)}?`
            : ''
        }
        confirmText="Aprobar"
        cancelText="Cancelar"
        onConfirm={handleConfirmApprove}
      />
    </div>
  )
}