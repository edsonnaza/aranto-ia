import React, { useState } from 'react';
import { toast } from 'sonner';
import { router } from '@inertiajs/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Banknote, Building2, Smartphone } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { ReceiptPrint } from '@/components/ui/ReceiptPrint';

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
    id: string;
    service_name: string;
    professional_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceRequest: ServiceRequest | null;
  onPaymentProcessed: () => void;
  companyName: string;
  paymentStatusOptions?: Array<{ id: number; name: string }>;
}

const paymentMethods = [
  { value: 'cash', label: 'Efectivo', icon: Banknote },
  { value: 'debit', label: 'Tarjeta de Débito', icon: CreditCard },
  { value: 'credit', label: 'Tarjeta de Crédito', icon: CreditCard },
  { value: 'transfer', label: 'Transferencia', icon: Building2 },
  { value: 'digital', label: 'Pago Digital', icon: Smartphone },
];

export function PaymentModal({ isOpen, onClose, serviceRequest, onPaymentProcessed, companyName }: PaymentModalProps) {
    const [showReceipt, setShowReceipt] = useState(false);
    interface ReceiptData {
      companyName?: string;
      serviceNumber: string;
      patientName: string;
      professionalName: string;
      serviceName: string;
      amount: number;
      paymentMethod: string;
      posNumber?: string;
      cardType?: string;
      date: string;
      notes: string;
    }
    const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
    const receiptRef = React.useRef<HTMLDivElement>(null);
  // Usar router directamente de Inertia
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [amount, setAmount] = useState<number>(serviceRequest?.total_cost || 0);
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [posNumber, setPosNumber] = useState('');
   

  const handlePayment = async () => {
    if (!serviceRequest || !paymentMethod) return;

    setIsProcessing(true);
    
      await router.post('/cash-register/process-service-payment', {
        service_request_id: serviceRequest.id,
        payment_method: paymentMethod,
        amount: amount,
        notes: notes
      }, {
        preserveScroll: true,
        preserveState: true,
        onSuccess: () => {
          // Solo ejecutar si no hay errores
          setReceiptData({
            companyName,
            serviceNumber: serviceRequest.service_number,
            patientName: serviceRequest.patient_name,
            professionalName: serviceRequest.professional_name,
            serviceName: serviceRequest.service_name,
            amount,
            paymentMethod,
            posNumber: posNumber || undefined,
            date: new Date().toLocaleString('es-PY'),
            notes,
          });
          setShowReceipt(true);
          onPaymentProcessed();
          toast.success('Pago procesado correctamente');
          // Disparar impresión automática tras pago
          setTimeout(() => {
            if (receiptRef.current) {
              const printContents = receiptRef.current.innerHTML;
              const printWindow = window.open('', '', 'width=400,height=600');
              printWindow?.document.write('<html><head><title>Comprobante de Pago</title></head><body>' + printContents + '</body></html>');
              printWindow?.document.close();
              printWindow?.focus();
              printWindow?.print();
            }
          }, 300);
          setPaymentCompleted(true);
        },
        onError: (errors) => {
          console.error('Errores en el pago:', errors);
          // Aquí puedes mostrar errores al usuario si es necesario
        }
      });
  };

  const resetForm = () => {
    setPaymentMethod('');
    setAmount(serviceRequest?.total_cost || 0);
    setNotes('');
    setPaymentCompleted(false);
  };

  const handleClose = () => {
    resetForm();
    setPaymentCompleted(false);
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
    <>
      <Dialog 
        open={isOpen} 
        onOpenChange={(open) => {
          // Solo permitir cerrar si no hay recibo pendiente
          if (!showReceipt && !open) {
            handleClose();
            setPaymentCompleted(false);
          }
        }}
      >
        <DialogContent className="lg:max-w-2xl">
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
                <span className="text-sm text-muted-foreground">Tipo de Recepción:</span>
                {getReceptionTypeBadge(serviceRequest.reception_type)}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Monto Total:</span>
                <span className="text-xl font-semibold border- text-green-600 bg-amber-100 rounded-md px-4">
                  {formatCurrency(serviceRequest.total_cost)}
                </span>
              </div>
            </div>

            {/* Servicios solicitados */}
            {serviceRequest.services && serviceRequest.services.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Servicios Solicitados</h4>
                <div className="overflow-x-auto rounded border">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-2 py-1 text-left">Servicio</th>
                        <th className="px-2 py-1 text-left">Profesional</th>
                        <th className="px-2 py-1 text-right">Cantidad</th>
                        <th className="px-2 py-1 text-right">Precio Unit.</th>
                        <th className="px-2 py-1 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {serviceRequest.services.map((item, idx) => (
                        <tr key={item.id || idx} className="border-b">
                          <td className="px-2 py-1">{item.service_name}</td>
                          <td className="px-2 py-1">{item.professional_name || 'No asignado'}</td>
                          <td className="px-2 py-1 text-right">{item.quantity}</td>
                          <td className="px-2 py-1 text-right">{formatCurrency(item.unit_price)}</td>
                          <td className="px-2 py-1 text-right font-semibold">{formatCurrency(item.total_price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

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
              {/* Si método no es efectivo, mostrar campo POS */}
              {paymentMethod && paymentMethod !== 'cash' && (
                <div className="space-y-2">
                  <Label htmlFor="pos-number">N° Comprobante POS</Label>
                  <input
                    type="text"
                    id="pos-number"
                    className="w-full border rounded px-2 py-1"
                    value={posNumber}
                    onChange={e => setPosNumber(e.target.value)}
                    placeholder="Ej: 123456"
                  />
                </div>
              )}
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
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
                Cancelar
              </Button>
              <Button 
                onClick={handlePayment}
                disabled={!paymentMethod || isProcessing || paymentCompleted}
                className="min-w-[120px]"
              >
                {isProcessing ? 'Procesando...' : paymentCompleted ? 'Pago realizado' : 'Procesar Pago'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Modal de ticket de impresión */}
      {showReceipt && receiptData && (
        <Dialog open={showReceipt} onOpenChange={(open) => {
          // Solo cerrar el recibo si el usuario lo decide
          if (!open) {
            setShowReceipt(false);
            onClose();
            resetForm();
            setPaymentCompleted(false);
          }
        }}>
          <DialogContent className="max-w-sm">
            <div ref={receiptRef}>
              <ReceiptPrint {...receiptData} />
            </div>
            <div className="flex justify-end mt-4 gap-2">
              <Button onClick={() => {
                if (receiptRef.current) {
                  const printContents = receiptRef.current.innerHTML;
                  const printWindow = window.open('', '', 'width=400,height=600');
                  printWindow?.document.write('<html><head><title>Comprobante de Pago</title></head><body>' + printContents + '</body></html>');
                  printWindow?.document.close();
                  printWindow?.focus();
                  printWindow?.print();
                }
              }}>Re-imprimir</Button>
              <Button variant="outline" onClick={() => { setShowReceipt(false); onClose(); resetForm(); setPaymentCompleted(false); }}>Cerrar</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}