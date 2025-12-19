import React, { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Search, Eye } from 'lucide-react'
import type { CommissionLiquidation, Transaction } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'

interface PaidLiquidationsProps {
  initialLiquidations?: CommissionLiquidation[]
}

export function CommissionPaidLiquidations({ initialLiquidations = [] }: PaidLiquidationsProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLiquidation, setSelectedLiquidation] = useState<CommissionLiquidation | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [transactionsLoading, setTransactionsLoading] = useState(false)

  // Filtrar liquidaciones pagadas
  const paidLiquidations = initialLiquidations.filter(l => l.status === 'paid')

  // Buscar en liquidaciones
  const filteredLiquidations = paidLiquidations.filter(l => {
    const professional = l.professional
    const professionalName = professional 
      ? `${professional.first_name} ${professional.last_name}` 
      : ''
    const searchLower = searchTerm.toLowerCase()
    
    return (
      l.id.toString().includes(searchLower) ||
      professionalName.toLowerCase().includes(searchLower) ||
      l.period_start?.includes(searchTerm) ||
      l.period_end?.includes(searchTerm)
    )
  })

  // Cargar transacciones cuando se selecciona una liquidación
  useEffect(() => {
    if (selectedLiquidation) {
      loadTransactions(selectedLiquidation.id)
    }
  }, [selectedLiquidation])

  const loadTransactions = async (liquidationId: number) => {
    setTransactionsLoading(true)
    try {
      const response = await fetch(`/medical/commissions/${liquidationId}/transactions`)
      if (response.ok) {
        const data = await response.json()
        setTransactions(data.transactions || [])
      }
    } catch (error) {
      console.error('Error loading transactions:', error)
      setTransactions([])
    } finally {
      setTransactionsLoading(false)
    }
  }

  const getPaymentMethodBadge = (method: string) => {
    const variants: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
      'CASH': { label: 'Efectivo', variant: 'default' },
      'CREDIT_CARD': { label: 'Tarjeta Crédito', variant: 'secondary' },
      'DEBIT_CARD': { label: 'Tarjeta Débito', variant: 'secondary' },
      'TRANSFER': { label: 'Transferencia', variant: 'outline' },
      'CHECK': { label: 'Cheque', variant: 'outline' },
      'DIGITAL': { label: 'Digital', variant: 'outline' },
      'OTHER': { label: 'Otro', variant: 'outline' },
    }

    const config = variants[method] || { label: method, variant: 'outline' as const }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getCategoryLabel = (category: string): string => {
    const labels: Record<string, string> = {
      'SERVICE_PAYMENT': 'Pago de Servicio',
      'SERVICE_REFUND': 'Devolución de Servicio',
      'COMMISSION_LIQUIDATION': 'Liquidación de Comisión',
      'CASH_ADJUSTMENT': 'Ajuste de Caja',
      'GENERAL_EXPENSE': 'Gasto General',
      'OPENING_BALANCE': 'Apertura de Caja',
    }
    return labels[category] || category
  }

  return (
    <>
      <Tabs defaultValue="list" className="space-y-6">
        <TabsList>
          <TabsTrigger value="list">
            Liquidaciones Pagadas ({paidLiquidations.length})
          </TabsTrigger>
          {selectedLiquidation && (
            <TabsTrigger value="transactions">
              Transacciones ({transactions.length})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>Liquidaciones Pagadas</CardTitle>
              <CardDescription>
                Todas las liquidaciones de comisiones que han sido pagadas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Buscador */}
              <div className="flex gap-2">
                <Search className="h-5 w-5 text-muted-foreground mt-2.5" />
                <Input
                  placeholder="Buscar por ID, profesional, período..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
              </div>

              {/* Tabla */}
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Profesional</TableHead>
                      <TableHead>Período</TableHead>
                      <TableHead>Servicios</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead>Fecha Pago</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLiquidations.length > 0 ? (
                      filteredLiquidations.map((liquidation) => {
                        const professional = liquidation.professional
                        const professionalName = professional 
                          ? `${professional.first_name} ${professional.last_name}`
                          : 'Sin asignar'
                        
                        return (
                          <TableRow 
                            key={liquidation.id}
                            className="cursor-pointer hover:bg-muted/50"
                          >
                            <TableCell className="font-mono text-sm">#{liquidation.id}</TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">{professionalName}</span>
                                {professional?.specialties?.[0] && (
                                  <span className="text-xs text-muted-foreground">
                                    {professional.specialties[0].name}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">
                              {formatDate(liquidation.period_start)} - {formatDate(liquidation.period_end)}
                            </TableCell>
                            <TableCell className="text-sm">
                              {liquidation.total_services || 0}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatCurrency(liquidation.total_amount || 0)}
                            </TableCell>
                            <TableCell className="text-sm">
                              {liquidation.paid_at ? formatDate(liquidation.paid_at) : '-'}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedLiquidation(liquidation)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          {paidLiquidations.length === 0
                            ? 'No hay liquidaciones pagadas'
                            : 'No se encontraron resultados'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {selectedLiquidation && (
          <TabsContent value="transactions">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle>
                    Transacciones de Liquidación #{selectedLiquidation.id}
                  </CardTitle>
                  <CardDescription>
                    Profesional: {selectedLiquidation.professional?.first_name} {selectedLiquidation.professional?.last_name}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedLiquidation(null)}
                >
                  Cerrar
                </Button>
              </CardHeader>
              <CardContent>
                {transactionsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Cargando transacciones...
                  </div>
                ) : transactions.length > 0 ? (
                  <div className="space-y-3">
                    {transactions.map((transaction) => (
                      <Card key={transaction.id} className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Información General */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">ID Transacción</span>
                              <span className="font-mono text-sm font-medium">#{transaction.id}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">Categoría</span>
                              <Badge variant="outline">{getCategoryLabel(transaction.category || '')}</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">Tipo</span>
                              <Badge variant="secondary">
                                {transaction.type === 'INCOME' ? 'Ingreso' : transaction.type === 'EXPENSE' ? 'Egreso' : 'Pago'}
                              </Badge>
                            </div>
                            <Separator className="my-2" />
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">Monto</span>
                              <span className="font-semibold text-lg">
                                {formatCurrency(transaction.amount)}
                              </span>
                            </div>
                          </div>

                          {/* Detalles de Pago */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">Método de Pago</span>
                              {getPaymentMethodBadge(transaction.payment_method)}
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">Fecha</span>
                              <span className="text-sm">{formatDate(transaction.created_at)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">Hora</span>
                              <span className="text-sm font-mono">
                                {new Date(transaction.created_at).toLocaleTimeString('es-ES')}
                              </span>
                            </div>
                            {transaction.balance_after != null && !isNaN(Number(transaction.balance_after)) && (
                              <>
                                <Separator className="my-2" />
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">Saldo después</span>
                                  <span className="font-semibold text-sm">
                                    {formatCurrency(Number(transaction.balance_after))}
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Descripción */}
                        {transaction.description && (
                          <>
                            <Separator className="my-3" />
                            <div className="space-y-2">
                              <span className="text-xs text-muted-foreground">Descripción</span>
                              <p className="text-sm text-foreground">{transaction.description}</p>
                            </div>
                          </>
                        )}

                        {/* IDs Relacionados */}
                        {(transaction.service_request_id || transaction.commission_liquidation_id) && (
                          <>
                            <Separator className="my-3" />
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              {transaction.service_request_id && (
                                <div>
                                  <span className="text-xs text-muted-foreground">ID Solicitud Servicio</span>
                                  <p className="font-mono text-sm font-medium">#{transaction.service_request_id}</p>
                                </div>
                              )}
                              {transaction.commission_liquidation_id && (
                                <div>
                                  <span className="text-xs text-muted-foreground">ID Liquidación</span>
                                  <p className="font-mono text-sm font-medium">#{transaction.commission_liquidation_id}</p>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay transacciones registradas para esta liquidación
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </>
  )
}
