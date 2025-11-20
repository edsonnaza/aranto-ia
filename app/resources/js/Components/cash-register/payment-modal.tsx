import { useState } from 'react';
import { useProcessServicePayment } from '@/hooks/cash-register/useProcessServicePayment';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Banknote, Building2, Smartphone } from 'lucide-react';
import { useCurrencyFormatter } from '@/stores/currency';
import TotalDisplay from '@/components/ui/TotalDisplay';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { toast } from 'sonner';

interface ServiceRequest {
  id: string;
  service_number: string;
  patient_name: string;
  professional_name: string;
  service_name: string;
  total_cost: number;
  reception_type: string;
  status: string;
  created_at: string;
  services?: Array<{
    id: number;
    service_name: string;
    professional_name?: string | null;
    insurance_type?: string | null;
    quantity?: number;
    unit_price?: number;
    total_price?: number;
  }>;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceRequest: ServiceRequest | null;
  onPaymentProcessed: () => void;
}

const paymentMethods = [
  { value: 'CASH', label: 'Efectivo', icon: Banknote },
  { value: 'DEBIT_CARD', label: 'Tarjeta de Débito', icon: CreditCard },
  { value: 'CREDIT_CARD', label: 'Tarjeta de Crédito', icon: CreditCard },
  { value: 'TRANSFER', label: 'Transferencia', icon: Building2 },
  { value: 'DIGITAL', label: 'Pago Digital', icon: Smartphone },
];

export function PaymentModal({ isOpen, onClose, serviceRequest, onPaymentProcessed }: PaymentModalProps) {
  const { format: formatCurrency } = useCurrencyFormatter();
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [amount, setAmount] = useState<number>(serviceRequest?.total_cost || 0);
  const [notes, setNotes] = useState('');
  const { processServicePayment, loading: isProcessing } = useProcessServicePayment();

  const handlePayment = async () => {
    if (!serviceRequest || !paymentMethod) return;
    processServicePayment({
      service_request_id: serviceRequest.id,
      payment_method: paymentMethod,
      amount: amount,
      notes: notes,
    }, {
      onSuccess: () => {
        onPaymentProcessed();
        onClose();
        resetForm();
        toast.success('Cobro procesado exitosamente.');
      },
      onError: () => {
        console.error('Error processing payment');
        toast.error('Error procesando el pago. Si ya se registró algo, se revertirá.');
      }
    })
  };

  const resetForm = () => {
    setPaymentMethod('');
    setAmount(serviceRequest?.total_cost || 0);
    setNotes('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const subtotal = serviceRequest?.services ? serviceRequest.services.reduce((acc, s) => acc + (s.total_price || 0), 0) : (serviceRequest?.total_cost || 0);

  const getReceptionTypeBadge = (type: string) => {
    const variants = {
      'RECEPTION_SCHEDULED': 'default',
      'RECEPTION_WALK_IN': 'secondary',
      'EMERGENCY': 'destructive',
      'INPATIENT_DISCHARGE': 'secondary'
    } as const;

    const labels = {
      'RECEPTION_SCHEDULED': 'Agendado',
      'RECEPTION_WALK_IN': 'Walk-in',
      'EMERGENCY': 'Emergencia',
      'INPATIENT_DISCHARGE': 'Alta Hospitalaria'
    };

    return (
      <Badge variant={variants[type as keyof typeof variants] || 'default'}>
        {labels[type as keyof typeof labels] || type}
      </Badge>
    );
  };

  if (!serviceRequest) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md w-full lg:max-w-6xl">
        <Card>
          <CardHeader>
            <CardTitle>Procesar Pago de Servicio</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Service Details / Top: details left, total right */}
            <div className="grid grid-cols-5 gap-4">
              <div className="col-span-3 space-y-3">
                <div className="flex flex-col space-y-1">
                  <span className="text-sm text-muted-foreground">Número de Servicio</span>
                  <span className="font-medium text-lg">{serviceRequest.service_number}</span>
                </div>

                <div className="flex flex-col space-y-1">
                  <span className="text-sm text-muted-foreground">Paciente</span>
                  <span className="font-medium">{serviceRequest.patient_name}</span>
                </div>

                <div className="flex flex-col space-y-1">
                  <span className="text-sm text-muted-foreground">Profesional</span>
                  <span className="font-medium">{serviceRequest.professional_name}</span>
                </div>

                <div className="flex flex-col space-y-1">
                  <span className="text-sm text-muted-foreground">Servicio</span>
                  <span className="font-medium">{serviceRequest.service_name}</span>
                </div>

                <div>
                  <span className="text-sm text-muted-foreground">Tipo de Recepción</span>
                  <div className="mt-2">{getReceptionTypeBadge(serviceRequest.reception_type)}</div>
                </div>
              </div>

              <div className="col-span-2 space-y-3">
                <TotalDisplay total={subtotal} size="lg" />
                <div className="rounded border p-3 bg-muted/40">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <div>Items</div>
                    <div>{serviceRequest.services?.length ?? 0}</div>
                  </div>

                  <div className="flex justify-between mt-2">
                    <div className="text-sm">Monto a cobrar</div>
                    <div className="text-sm font-medium">{formatCurrency(amount)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Items and summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-3">
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
                          <TableCell className="text-right">{formatCurrency(item.unit_price ?? (item.total_price ? Math.round((item.total_price/(item.quantity||1))*100)/100 : 0))}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.total_price || (item.unit_price || 0) * (item.quantity || 1))}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>


            </div>
            {/* Payment Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="payment-method">Método de Pago</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar método de pago" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        <div className="flex items-center gap-2">
                          <method.icon className="h-4 w-4" />
                          {method.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Monto a Cobrar</Label>
                <CurrencyInput
                  value={amount}
                  onChange={setAmount}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas (opcional)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observaciones adicionales..."
                  rows={3}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
                Cancelar
              </Button>
              <Button 
                onClick={handlePayment} 
                disabled={!paymentMethod || isProcessing}
                className="min-w-[120px]"
              >
                {isProcessing ? 'Procesando...' : 'Procesar Pago'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}