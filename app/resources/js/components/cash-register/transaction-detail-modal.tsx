import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, formatDate } from '@/lib/utils';
import { 
  Calendar, 
  Clock,  
  FileText, 
  DollarSign, 
  CreditCard,
  ArrowDownCircle,
  ArrowUpCircle,
  Tag,
  Hash
} from 'lucide-react';
import type { Transaction } from '@/types/cash-register';

interface TransactionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

export function TransactionDetailModal({ 
  isOpen, 
  onClose, 
  transaction 
}: TransactionDetailModalProps) {
  if (!transaction) return null;

  const isIncome = transaction.type === 'INCOME';
  const isRefund = transaction.category === 'SERVICE_REFUND';

  const getTypeLabel = () => {
    if (isIncome) return 'Ingreso';
    if (isRefund) return 'Devolución';
    return 'Egreso';
  };

  const getTypeIcon = () => {
    if (isIncome) return <ArrowDownCircle className="h-5 w-5" />;
    if (isRefund) return <ArrowUpCircle className="h-5 w-5" />;
    return <ArrowUpCircle className="h-5 w-5" />;
  };

  const getTypeColor = () => {
    if (isIncome) return 'bg-green-100 text-green-800 border-green-200';
    if (isRefund) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getCategoryLabel = () => {
    const categories: Record<string, string> = {
      SERVICE_PAYMENT: 'Pago de Servicio',
      SERVICE_REFUND: 'Devolución de Servicio',
      COMMISSION_LIQUIDATION: 'Liquidación de Comisión',
      CASH_ADJUSTMENT: 'Ajuste de Caja',
      GENERAL_EXPENSE: 'Gasto General',
      OPENING_BALANCE: 'Apertura de Caja',
    };
    return categories[transaction.category ?? ''] || transaction.category || 'Transacción';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getTypeIcon()}
            Detalle de Transacción
          </DialogTitle>
          <DialogDescription>
            Información completa de la transacción seleccionada
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tipo y Monto Principal */}
          <Card className={`border-2 ${getTypeColor()}`}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium mb-1">Tipo de Transacción</p>
                  <Badge variant="outline" className={`text-base ${getTypeColor()}`}>
                    {getTypeLabel()}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium mb-1">Monto</p>
                  <p className={`text-3xl font-bold ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                    {isIncome ? '+' : '-'}{formatCurrency(Number(transaction.amount))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información General */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Hash className="h-4 w-4" />
                <span>ID de Transacción</span>
              </div>
              <p className="font-mono text-sm font-medium">#{transaction.id}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Tag className="h-4 w-4" />
                <span>Categoría</span>
              </div>
              <p className="font-medium text-sm">{getCategoryLabel()}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Fecha</span>
              </div>
              <p className="font-medium text-sm">{formatDate(transaction.created_at)}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Hora</span>
              </div>
              <p className="font-medium text-sm">
                {new Date(transaction.created_at).toLocaleTimeString('es-ES')}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CreditCard className="h-4 w-4" />
                <span>Método de Pago</span>
              </div>
              <p className="font-medium text-sm">
                {!transaction.payment_method || transaction.payment_method === 'CASH' ? 'Efectivo' : 
                 transaction.payment_method === 'CREDIT_CARD' || transaction.payment_method === 'DEBIT_CARD' ? 'Tarjeta' :
                 transaction.payment_method === 'TRANSFER' ? 'Transferencia' :
                 transaction.payment_method}
              </p>
            </div>
          </div>

          <Separator />

          {/* Descripción */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>Descripción</span>
            </div>
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm">
                  {transaction.description || (() => {
                    const descriptions: Record<string, string> = {
                      SERVICE_PAYMENT: 'Pago recibido por servicio médico prestado',
                      SERVICE_REFUND: 'Devolución de pago por cancelación de servicio',
                      COMMISSION_LIQUIDATION: 'Pago de comisión a profesional de la salud',
                      CASH_ADJUSTMENT: 'Ajuste realizado en el balance de caja',
                      GENERAL_EXPENSE: 'Egreso por gasto general de operación',
                      OPENING_BALANCE: 'Monto inicial registrado al abrir la caja',
                    };
                    return descriptions[transaction.category ?? ''] || 'Transacción registrada en caja';
                  })()}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* IDs Relacionados */}
          {(transaction.service_request_id || transaction.commission_liquidation_id) && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Información Relacionada</h4>
                <div className="grid grid-cols-2 gap-4">
                  {transaction.service_request_id && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">ID de Solicitud de Servicio</p>
                      <p className="font-mono text-sm">#{transaction.service_request_id}</p>
                    </div>
                  )}
                  {transaction.commission_liquidation_id && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">ID de Liquidación de Comisión</p>
                      <p className="font-mono text-sm">#{transaction.commission_liquidation_id}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Balance Information */}
          {transaction.balance_after != null && !isNaN(Number(transaction.balance_after)) && (
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Saldo después de transacción:</span>
                  </div>
                  <span className="font-bold">{formatCurrency(Number(transaction.balance_after))}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
