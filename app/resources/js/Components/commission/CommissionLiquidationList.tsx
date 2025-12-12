import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Eye, Edit, Trash2, CheckCircle, Clock, AlertCircle, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useCommissionLiquidations } from '@/hooks/medical'
import type { CommissionLiquidation } from '@/types'


interface CommissionLiquidationListProps {
  onViewDetails?: (liquidation: CommissionLiquidation) => void
  onEdit?: (liquidation: CommissionLiquidation) => void
  onDelete?: (liquidation: CommissionLiquidation) => void
  refreshTrigger?: number
  onSelectionChange?: (selected: CommissionLiquidation[]) => void
}

export default CommissionLiquidationList;

function CommissionLiquidationList({
  onViewDetails,
  onEdit,
  onDelete,
  refreshTrigger,
  onSelectionChange,
}: CommissionLiquidationListProps) {
  const [liquidations, setLiquidations] = useState<CommissionLiquidation[]>([])
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  // Usar el hook para obtener liquidaciones reales
  const { deleteLiquidation, loading, error, fetchLiquidations } = useCommissionLiquidations()

  useEffect(() => {
    let isMounted = true
    const fetchData = async () => {
      const data = await fetchLiquidations()
      if (isMounted && Array.isArray(data)) {
        setLiquidations(data)
      }
    }
    fetchData()
    return () => { isMounted = false }
  }, [fetchLiquidations, refreshTrigger])

  // Notificar selección al padre
  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(liquidations.filter(l => selectedIds.includes(l.id)))
    }
  }, [selectedIds, liquidations, onSelectionChange])

  const handleDelete = async (liquidation: CommissionLiquidation) => {
    if (!confirm(`¿Está seguro de eliminar la liquidación de ${liquidation.professional_name}?`)) {
      return
    }

    try {
      await deleteLiquidation(liquidation.id)
      // Recargar liquidaciones usando fetchLiquidations
      const data = await fetchLiquidations()
      if (Array.isArray(data)) {
        setLiquidations(data)
      }
    } catch (err) {
      console.error('Error deleting liquidation:', err)
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

  if (loading && liquidations.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Cargando liquidaciones...
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
            <span>Liquidaciones de Comisiones</span>
            <Badge variant="secondary">
              {liquidations.length} liquidaciones
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {liquidations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay liquidaciones registradas</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <input
                        type="checkbox"
                        checked={selectedIds.length === liquidations.length}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedIds(liquidations.map(l => l.id))
                          } else {
                            setSelectedIds([])
                          }
                        }}
                        aria-label="Seleccionar todos"
                      />
                    </TableHead>
                    <TableHead>Profesional</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead className="text-right">Servicios</TableHead>
                    <TableHead className="text-right">Monto Total</TableHead>
                    <TableHead className="text-right">Comisión</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-center">Fecha Creación</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {liquidations.map((liquidation) => (
                    <TableRow key={liquidation.id} className="hover:bg-muted/50">
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(liquidation.id)}
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedIds(prev => [...prev, liquidation.id])
                            } else {
                              setSelectedIds(prev => prev.filter(id => id !== liquidation.id))
                            }
                          }}
                          aria-label="Seleccionar liquidación"
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{liquidation.professional_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {liquidation.specialty_name}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(liquidation.period_start)} - {formatDate(liquidation.period_end)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {liquidation.total_services}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(liquidation.total_amount ?? 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div>
                          <div className="font-medium">
                            {formatCurrency(liquidation.commission_amount)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ({liquidation.commission_percentage}%)
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(liquidation.status)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="text-sm">
                          {formatDate(liquidation.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {onViewDetails && (
                              <DropdownMenuItem onClick={() => onViewDetails(liquidation)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver Detalles
                              </DropdownMenuItem>
                            )}
                            {onEdit && liquidation.status === 'pending' && (
                              <DropdownMenuItem onClick={() => onEdit(liquidation)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                            )}
                            {onDelete && liquidation.status === 'pending' && (
                              <DropdownMenuItem
                                onClick={() => handleDelete(liquidation)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Footer */}
      {liquidations.length > 0 && (
        <Card className="border-t-4 border-t-blue-500">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {selectedIds.length}
                </div>
                <div className="text-sm text-muted-foreground">Seleccionadas</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {liquidations.filter(l => l.status === 'paid' && selectedIds.includes(l.id)).length}
                </div>
                <div className="text-sm text-muted-foreground">Pagadas (selección)</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(
                    liquidations.filter(l => selectedIds.includes(l.id)).reduce((sum, l) => sum + l.commission_amount, 0)
                  )}
                </div>
                <div className="text-sm text-muted-foreground">Total Comisiones (selección)</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {formatCurrency(
                    liquidations
                      .filter(l => l.status === 'paid' && selectedIds.includes(l.id))
                      .reduce((sum, l) => sum + l.commission_amount, 0)
                  )}
                </div>
                <div className="text-sm text-muted-foreground">Pagado (selección)</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}