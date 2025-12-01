import { Dialog, DialogContent } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CurrencyInput } from '@/components/ui/currency-input'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { useState } from 'react'
import { useRefundServicePayment } from '@/hooks/cash-register/useRefundServicePayment'
import TotalDisplay from '@/components/ui/TotalDisplay'
import { useCurrencyFormatter } from '@/stores/currency'

interface ServiceItem {
  id: number
  service_name: string
  professional_name?: string | null
  insurance_type?: string | null
  quantity?: number
  unit_price?: number
  total_price?: number
}

interface TransactionItem {
  id: number
  service_request_id?: number
  type: string
}

interface ServiceRequest {
  id: number
  request_number: string
  patient_name: string
  patient_document?: string
  request_date?: string
  request_time?: string
  status?: string
  payment_status?: string
  payment_transaction_id?: number | null
  total_amount?: number
  services?: ServiceItem[]
  transactions?: TransactionItem[]
}


interface Props {
  isOpen: boolean
  onClose: () => void
  serviceRequest: ServiceRequest | null
  onRefunded?: (payload?: unknown) => void
}

export default function ServiceRequestDetailsModal({ isOpen, onClose, serviceRequest, onRefunded }: Props) {
  const { format: formatCurrency } = useCurrencyFormatter()
  const [reason, setReason] = useState('')
  const [amount, setAmount] = useState<number>(() => serviceRequest?.total_amount ?? 0)
  const [transactionIdInput, setTransactionIdInput] = useState<string>('')

  // Buscar transactionId automáticamente
  let autoTransactionId = serviceRequest?.payment_transaction_id ?? null
  if (!autoTransactionId && Array.isArray(serviceRequest?.transactions)) {
    const tx = serviceRequest.transactions.find(
      t => t.service_request_id === serviceRequest.id && t.type === 'INCOME'
    )
    if (tx) autoTransactionId = tx.id
  }
  const { refundServicePayment, loading } = useRefundServicePayment()



  if (!serviceRequest) return null

  const performRefund = async () => {
    if (!serviceRequest) return
    if (amount <= 0 || amount > (serviceRequest.total_amount || 0)) {
      toast.error('El monto es inválido.')
      return
    }
    // Buscar transacción asociada automáticamente
    let transactionId = serviceRequest.payment_transaction_id
    // Si no existe, buscar en serviceRequest.transactions (si existe)
    if (!transactionId && Array.isArray(serviceRequest.transactions)) {
      const tx = serviceRequest.transactions.find(
        t => t.service_request_id === serviceRequest.id && t.type === 'INCOME'
      )
      if (tx) transactionId = tx.id
    }
    // Si aún no existe, usar el input manual
    if (!transactionId && transactionIdInput) {
      transactionId = Number(transactionIdInput)
    }
    // Si no se encuentra, mostrar error
    if (!transactionId) {
      toast.error('No hay id de transacción asociado. Ejecuta el backfill o ingresa el id manualmente.')
      return
    }
    // Construir payload
    const payload = {
      service_request_id: serviceRequest.id,
      amount,
      reason,
      transaction_id: transactionId
    }
    await refundServicePayment(payload, {
      onSuccess: (data) => {
        toast.success('Devolución procesada correctamente.')
        onClose()
        onRefunded?.(data)
      },
      onError: (err) => {
        toast.error(String(err || 'Error al procesar la devolución'))
      }
    })
  }

  const subtotal = serviceRequest.services ? serviceRequest.services.reduce((acc, s) => acc + (s.total_price || 0), 0) : (serviceRequest.total_amount || 0)

  const maxAmount = serviceRequest.total_amount || 0
  const isAmountValid = amount > 0 && amount <= maxAmount

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md w-full lg:max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>
              Detalle de Servicio #{serviceRequest.request_number} <span className="text-xs text-muted-foreground">(ID: {serviceRequest.id})</span>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Paciente</div>
                <div className="font-medium">{serviceRequest.patient_name}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Fecha</div>
                <div className="font-medium">{serviceRequest.request_date ?? serviceRequest.request_time}</div>
              </div>
              <div className="text-right">
                <TotalDisplay total={subtotal} size="md" />
              </div>
            </div>

            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Servicio</TableHead>
                    <TableHead>Profesional</TableHead>
                    <TableHead className="hidden md:table-cell">Seguro</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {serviceRequest.services?.map(item => (
                    <TableRow key={item.id}>
                      <TableCell>{item.service_name}</TableCell>
                      <TableCell>{item.professional_name || 'No asignado'}</TableCell>
                      <TableCell className="hidden md:table-cell">{item.insurance_type || 'Sin seguro'}</TableCell>
                      <TableCell className="text-right">{item.quantity ?? 1}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.unit_price || 0)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.total_price || (item.unit_price || 0) * (item.quantity || 1))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Monto a devolver</Label>
                <CurrencyInput value={amount} onChange={setAmount} />
                {!isAmountValid && (
                  <div className="text-xs text-red-600 mt-1">El monto debe ser &gt; 0 y no mayor que {formatCurrency(maxAmount)}.</div>
                )}
                {isAmountValid && amount < maxAmount && (
                  <div className="text-xs text-muted-foreground mt-1">Devolución parcial — la solicitud no se marcará como totalmente pagada.</div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Motivo de la devolución (opcional)</Label>
                <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motivo de la devolución..." rows={3} />
              </div>
            </div>

            {!autoTransactionId && (
              <div className="mt-2 rounded-md bg-yellow-50 p-3 border">
                <div className="text-sm font-medium">Transacción no asociada</div>
                <div className="text-xs text-muted-foreground">No se encontró automáticamente el id de transacción. Ingresa el id manualmente.</div>
                <div className="mt-2">
                  <Label>Transaction ID (manual)</Label>
                  <input type="number" className="mt-1 block w-full rounded-md border px-2 py-1" value={transactionIdInput} onChange={(e) => setTransactionIdInput(e.target.value)} placeholder="Ej: 123" />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={onClose} disabled={loading}>Cerrar</Button>
              {serviceRequest.payment_status === 'paid' && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button className="bg-red-600 hover:bg-red-700" disabled={loading}>
                      {loading ? 'Procesando...' : 'Cancelar y Devolver'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar devolución</AlertDialogTitle>
                      <AlertDialogDescription>
                        ¿Desea devolver y cancelar la solicitud <strong>#{serviceRequest.request_number}</strong>? Esta acción marcará la solicitud como cancelada y registrará la transacción de devolución.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={performRefund} className="bg-red-600 hover:bg-red-700">
                        Confirmar devolución
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}
