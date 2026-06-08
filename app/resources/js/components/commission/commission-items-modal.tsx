import React, { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card } from '@/components/ui/card'
import { Calendar, DollarSign, CheckCircle, Percent, FileText } from 'lucide-react'
import { CommissionItemsTable, CommissionItem } from './commission-items-table'
import { getStatusColor } from '@/lib/constants/status-colors'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface LiquidationData {
  id: number
  professional_name: string
  professional_specialty: string
  period_start: string
  period_end: string
  status: string
  total_services: number
  gross_amount: number
  commission_percentage: number
  commission_amount: number
  generated_at: string
  approved_at: string
}

interface CommissionItemsModalProps {
  isOpen: boolean
  onClose: () => void
  liquidationId: number
}

export function CommissionItemsModal({
  isOpen,
  onClose,
  liquidationId,
}: CommissionItemsModalProps) {
  const [items, setItems] = useState<CommissionItem[]>([])
  const [liquidation, setLiquidation] = useState<LiquidationData | null>(null)
  const [loading, setLoading] = useState(false)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: es })
  }

  const loadItems = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/medical/commissions/${liquidationId}/details`)
      if (response.ok) {
        const data = await response.json()
        setItems(data.details || [])
        setLiquidation(data.liquidation || null)
      }
    } catch (error) {
      console.error('Error loading commission items:', error)
      setItems([])
      setLiquidation(null)
    } finally {
      setLoading(false)
    }
  }, [liquidationId])

  useEffect(() => {
    if (isOpen && liquidationId) {
      loadItems()
    }
  }, [isOpen, liquidationId, loadItems])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] lg:max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header Section */}
        <DialogHeader className="space-y-4 pb-4 border-b">
          <div className="flex-1">
            <DialogTitle className="text-xl mb-1">
              Liquidación #{liquidation?.id}
            </DialogTitle>
            {liquidation && (
              <div className="space-y-1">
                <div className="text-base font-semibold text-foreground">
                  {liquidation.professional_name}
                </div>
                <div className="text-sm text-muted-foreground">
                  {liquidation.professional_specialty}
                </div>
              </div>
            )}
          </div>

          {/* Details Grid - First Row */}
          {liquidation && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4">
                {/* Period */}
                <Card className="p-3 border-l-2 border-l-blue-500">
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-blue-600 mt-1 shrink-0" />
                    <div className="flex-1">
                      <div className="text-xs text-muted-foreground font-medium">Período</div>
                      <div className="text-sm font-semibold">
                        {formatDate(liquidation.period_start)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        a {formatDate(liquidation.period_end)}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Generated Date */}
                <Card className="p-3 border-l-2 border-l-gray-400">
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-gray-600 mt-1 shrink-0" />
                    <div className="flex-1">
                      <div className="text-xs text-muted-foreground font-medium">Generada</div>
                      <div className="text-xs font-semibold text-gray-600">
                        {formatDate(liquidation.generated_at)}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Total Services */}
                <Card className="p-3 border-l-2 border-l-green-500">
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-green-600 mt-1 shrink-0" />
                    <div className="flex-1">
                      <div className="text-xs text-muted-foreground font-medium">Servicios</div>
                      <div className="text-lg font-bold text-green-600">
                        {liquidation.total_services}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Status */}
                <Card
                  className={`p-3 border-l-2 ${
                    getStatusColor(liquidation.status.toUpperCase())?.className?.includes('green')
                      ? 'border-l-green-500'
                      : getStatusColor(liquidation.status.toUpperCase())?.className?.includes('yellow')
                        ? 'border-l-yellow-500'
                        : getStatusColor(liquidation.status.toUpperCase())?.className?.includes('red')
                          ? 'border-l-red-500'
                          : 'border-l-blue-500'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <CheckCircle
                      className={`h-4 w-4 mt-1 shrink-0 ${
                        getStatusColor(liquidation.status.toUpperCase())?.className?.includes('green')
                          ? 'text-green-600'
                          : getStatusColor(liquidation.status.toUpperCase())?.className?.includes('yellow')
                            ? 'text-yellow-600'
                            : getStatusColor(liquidation.status.toUpperCase())?.className?.includes('red')
                              ? 'text-red-600'
                              : 'text-blue-600'
                      }`}
                    />
                    <div className="flex-1">
                      <div className="text-xs text-muted-foreground font-medium">Estado</div>
                      <div className="text-sm font-semibold">
                        {getStatusColor(liquidation.status.toUpperCase())?.label || liquidation.status}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Details Grid - Second Row (Porcentaje, Monto Bruto, Monto Comisión) */}
              <div className="grid grid-cols-3 gap-3 pt-3">
                {/* Commission Percentage */}
                <Card className="p-3 border-l-2 border-l-orange-500">
                  <div className="flex items-start gap-2">
                    <Percent className="h-4 w-4 text-orange-600 mt-1 shrink-0" />
                    <div className="flex-1">
                      <div className="text-xs text-muted-foreground font-medium">% Comisión</div>
                      <div className="text-lg font-bold text-orange-600">
                        {liquidation.commission_percentage}%
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Gross Amount */}
                <Card className="p-3 border-l-2 border-l-purple-500">
                  <div className="flex items-start gap-2">
                    <DollarSign className="h-4 w-4 text-purple-600 mt-1 shrink-0" />
                    <div className="flex-1">
                      <div className="text-xs text-muted-foreground font-medium">Monto Bruto</div>
                      <div className="text-sm font-semibold text-purple-600">
                        {formatCurrency(liquidation.gross_amount)}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Commission Amount */}
                <Card className="p-3 border-l-2 border-l-red-500">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-red-600 mt-1 shrink-0" />
                    <div className="flex-1">
                      <div className="text-xs text-muted-foreground font-medium">Monto Comisión</div>
                      <div className="text-lg font-bold text-red-600">
                        {formatCurrency(liquidation.commission_amount)}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </>
          )}
        </DialogHeader>

        {/* Items Table */}
        <div className="mt-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Cargando items...
            </div>
          ) : (
            <CommissionItemsTable
              items={items}
              title="Servicios Incluidos"
              showTitle={true}
              searchPlaceholder="Buscar por paciente o servicio..."
              emptyMessage="No hay servicios en esta liquidación"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
