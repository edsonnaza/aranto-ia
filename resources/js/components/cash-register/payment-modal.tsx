import { useState } from 'react';
import { useRouter } from '@/hooks/use-router';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CurrencyInput } from '@/components/ui/currency';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Banknote, Building2, Smartphone } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

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
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceRequest: ServiceRequest | null;
  onPaymentProcessed: () => void;
}

const paymentMethods = [
  { value: 'cash', label: 'Efectivo', icon: Banknote },
  { value: 'debit', label: 'Tarjeta de Débito', icon: CreditCard },
  { value: 'credit', label: 'Tarjeta de Crédito', icon: CreditCard },
  { value: 'transfer', label: 'Transferencia', icon: Building2 },
  { value: 'digital', label: 'Pago Digital', icon: Smartphone },
];

export function PaymentModal({ isOpen, onClose, serviceRequest, onPaymentProcessed }: PaymentModalProps) {
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [amount, setAmount] = useState<number>(serviceRequest?.total_cost || 0);
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    if (!serviceRequest || !paymentMethod) return;

    setIsProcessing(true);
    
    try {
      await router.post('cashregister.services.process-payment', {
        service_request_id: serviceRequest.id,
        payment_method: paymentMethod,
        amount: amount,
        notes: notes
      });

      onPaymentProcessed();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error processing payment:', error);
    } finally {
      setIsProcessing(false);
    }
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

  const getReceptionTypeBadge = (type: string) => {
    const variants = {
      'ambulatory': 'default',
      'emergency': 'destructive',
      'hospitalization': 'secondary'
    } as const;

    const labels = {
      'ambulatory': 'Ambulatorio',
      'emergency': 'Emergencia',
      'hospitalization': 'Internación'
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Procesar Pago de Servicio</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Service Details */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Número de Servicio:</span>
              <span className="font-medium">{serviceRequest.service_number}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Paciente:</span>
              <span className="font-medium">{serviceRequest.patient_name}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Profesional:</span>
              <span className="font-medium">{serviceRequest.professional_name}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Servicio:</span>
              <span className="font-medium">{serviceRequest.service_name}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Tipo de Recepción:</span>
              {getReceptionTypeBadge(serviceRequest.reception_type)}
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Monto Total:</span>
              <span className="text-lg font-semibold text-green-600">
                {formatCurrency(serviceRequest.total_cost)}
              </span>
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
                onValueChange={setAmount}
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
          <div className="flex justify-end gap-2">
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
        </div>
      </DialogContent>
    </Dialog>
  );
}