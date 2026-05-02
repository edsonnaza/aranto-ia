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
import { CreditCard, Banknote, Building2, Smartphone, Plus, Trash2 } from 'lucide-react';
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
  paid_amount?: number; // Monto ya pagado
  remaining_amount?: number; // Monto pendiente
  payment_status?: 'pending' | 'partial' | 'paid'; // Estado de pago
  services?: Array<{
    id: string;
    service_name: string;
    professional_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    paid_amount?: number; // Monto pagado de este servicio específico
    payment_status?: 'pending' | 'partial' | 'paid'; // Estado de este servicio
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

    interface PaymentSplit {
      id: number;
      payment_method: string;
      amount: number;
      pos_number: string;
    }
    const [splits, setSplits] = useState<PaymentSplit[]>([{ id: 1, payment_method: '', amount: 0, pos_number: '' }]);
    const [notes, setNotes] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentCompleted, setPaymentCompleted] = useState(false);

  // Calcular montos para pagos parciales
  const totalAmount = serviceRequest?.total_cost || 0;
  const paidAmount = serviceRequest?.paid_amount || 0;
  const remainingAmount = serviceRequest?.remaining_amount ?? (totalAmount - paidAmount);
  const isPartialPayment = paidAmount > 0;
  const paymentStatus = serviceRequest?.payment_status || 'pending';

  const totalSplits = splits.reduce((sum, s) => sum + (s.amount || 0), 0);
  const leftover = remainingAmount - totalSplits;

  const addSplit = () => {
    setSplits(prev => [...prev, { id: Date.now(), payment_method: '', amount: 0, pos_number: '' }]);
  };

  const removeSplit = (id: number) => {
    setSplits(prev => prev.filter(s => s.id !== id));
  };

  const updateSplit = (id: number, field: keyof PaymentSplit, value: string | number) => {
    setSplits(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handlePayment = async () => {
    if (!serviceRequest) return;
    if (splits.some(s => !s.payment_method || s.amount <= 0)) {
      toast.error('Completa todos los métodos y montos de pago.');
      return;
    }
    if (totalSplits <= 0) {
      toast.error('El monto total debe ser mayor a cero.');
      return;
    }
    if (totalSplits > remainingAmount + 0.01) {
      toast.error('El total de los pagos supera el monto pendiente.');
      return;
    }

    setIsProcessing(true);

    const paymentsPayload = splits.map(s => ({
      payment_method: s.payment_method,
      amount: s.amount,
      pos_number: s.pos_number || null,
    }));

    await router.post('/cash-register/process-service-payment', {
      service_request_id: serviceRequest.id,
      payments: paymentsPayload,
      notes: notes,
    }, {
      preserveScroll: true,
      preserveState: true,
      onSuccess: () => {
        const methodLabel = splits.length === 1
          ? (paymentMethods.find(m => m.value === splits[0].payment_method)?.label ?? splits[0].payment_method)
          : 'Pago Mixto';
        setReceiptData({
          companyName,
          serviceNumber: serviceRequest.service_number,
          patientName: serviceRequest.patient_name,
          professionalName: serviceRequest.professional_name,
          serviceName: serviceRequest.service_name,
          amount: totalSplits,
          paymentMethod: methodLabel,
          posNumber: splits.length === 1 ? (splits[0].pos_number || undefined) : undefined,
          date: new Date().toLocaleString('es-PY'),
          notes,
        });
        setShowReceipt(true);
        onPaymentProcessed();
        toast.success('Pago procesado correctamente');
        if (typeof window !== 'undefined' && window.location) {
          setTimeout(() => { window.location.reload(); }, 500);
        }
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
        setIsProcessing(false);
      }
    });
  };

  const resetForm = () => {
    setSplits([{ id: Date.now(), payment_method: '', amount: 0, pos_number: '' }]);
    setNotes('');
    setPaymentCompleted(false);
    setIsProcessing(false);
  };

  const handleClose = () => {
    resetForm();
    setPaymentCompleted(false);
    onClose();
  };

  const RECEPTION_TYPE_LABELS: Record<string, string> = {
    // valores del backend
    'RECEPTION_SCHEDULED':  'Consulta agendada',
    'RECEPTION_WALK_IN':    'Sin cita / Orden de llegada',
    'INPATIENT_DISCHARGE':  'Alta de internación',
    'EMERGENCY':            'Emergencia',
    // valores legacy / alternativos
    'walk_in':              'Sin cita / Orden de llegada',
    'scheduled':            'Consulta agendada',
    'ambulatory':           'Ambulatorio',
    'emergency':            'Emergencia',
    'hospitalization':      'Internación',
    'inpatient':            'Internación',
  }

  const RECEPTION_TYPE_VARIANTS: Record<string, 'default' | 'destructive' | 'secondary' | 'outline'> = {
    'EMERGENCY': 'destructive',
    'emergency': 'destructive',
    'INPATIENT_DISCHARGE': 'secondary',
    'hospitalization': 'secondary',
    'inpatient': 'secondary',
  }

  const getReceptionTypeBadge = (type: string) => (
    <Badge variant={RECEPTION_TYPE_VARIANTS[type] ?? 'default'}>
      {RECEPTION_TYPE_LABELS[type] ?? type}
    </Badge>
  );

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
        <DialogContent className="flex flex-col lg:max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader className="shrink-0">
            <DialogTitle>Procesar Pago de Servicio</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-1 space-y-6">
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
              
              {/* Información de pagos parciales */}
              <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Monto Total:</span>
                  <span className="font-medium">{formatCurrency(totalAmount)}</span>
                </div>
                
                {isPartialPayment && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Ya Pagado:</span>
                      <span className="font-medium text-green-600">{formatCurrency(paidAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Pendiente:</span>
                      <span className="font-medium text-orange-600">{formatCurrency(remainingAmount)}</span>
                    </div>
                  </>
                )}
                
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm font-medium">Estado de Pago:</span>
                  <Badge variant={
                    paymentStatus === 'paid' ? 'default' :
                    paymentStatus === 'partial' ? 'secondary' : 'destructive'
                  }>
                    {paymentStatus === 'paid' ? 'Pagado' :
                     paymentStatus === 'partial' ? 'Pago Parcial' : 'Pendiente'}
                  </Badge>
                </div>
              </div>
            </div>            {/* Servicios solicitados */}
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
                        <th className="px-2 py-1 text-center">Estado</th>
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
                          <td className="px-2 py-1 text-center">
                            <Badge variant={
                              item.payment_status === 'paid' ? 'default' :
                              item.payment_status === 'partial' ? 'secondary' : 'outline'
                            } className="text-xs">
                              {item.payment_status === 'paid' ? 'Pagado' :
                               item.payment_status === 'partial' ? 'Parcial' : 'Pendiente'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Payment Form - Pago Mixto */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Métodos de Pago</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSplit}
                  className="gap-1 text-xs"
                >
                  <Plus className="h-3 w-3" /> Agregar método
                </Button>
              </div>

              {splits.map((split, idx) => (
                <div key={split.id} className="flex gap-2 items-start rounded-lg border p-3 bg-gray-50">
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Select
                          value={split.payment_method}
                          onValueChange={(val) => updateSplit(split.id, 'payment_method', val)}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Método" />
                          </SelectTrigger>
                          <SelectContent>
                            {paymentMethods.map((m) => (
                              <SelectItem key={m.value} value={m.value}>
                                <div className="flex items-center gap-2">
                                  <m.icon className="h-3 w-3" />
                                  {m.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1">
                        <CurrencyInput
                          value={split.amount}
                          onChange={(val) => updateSplit(split.id, 'amount', val)}
                          placeholder="Monto"
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                    {split.payment_method && split.payment_method !== 'cash' && (
                      <input
                        type="text"
                        className="w-full border rounded px-2 py-1 text-sm"
                        value={split.pos_number}
                        onChange={(e) => updateSplit(split.id, 'pos_number', e.target.value)}
                        placeholder="N° Comprobante POS (opcional)"
                      />
                    )}
                  </div>
                  {splits.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => removeSplit(split.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  {idx === 0 && splits.length === 1 && <div className="w-8" />}
                </div>
              ))}

              {/* Totales */}
              <div className="rounded-lg border p-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total a pagar ahora:</span>
                  <span className={`font-semibold ${totalSplits > remainingAmount ? 'text-red-600' : 'text-foreground'}`}>
                    {formatCurrency(totalSplits)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monto pendiente:</span>
                  <span className="font-medium text-orange-600">{formatCurrency(remainingAmount)}</span>
                </div>
                {leftover > 0.01 && (
                  <div className="flex justify-between text-blue-600 border-t pt-1">
                    <span>Quedará pendiente:</span>
                    <span className="font-medium">{formatCurrency(leftover)}</span>
                  </div>
                )}
                {leftover < -0.01 && (
                  <div className="flex justify-between text-red-600 border-t pt-1">
                    <span>Excede por:</span>
                    <span className="font-medium">{formatCurrency(Math.abs(leftover))}</span>
                  </div>
                )}
                {Math.abs(leftover) <= 0.01 && totalSplits > 0 && (
                  <div className="flex justify-between text-green-600 border-t pt-1">
                    <span>Pago completo</span>
                    <span className="font-medium">✓</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas (opcional)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observaciones adicionales..."
                  rows={2}
                />
              </div>
            </div>

            </div>

            {/* Footer fijo — siempre visible */}
            <div className="shrink-0 flex justify-end gap-2 border-t pt-4">
              <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
                Cancelar
              </Button>
              <Button
                onClick={handlePayment}
                disabled={
                  isProcessing ||
                  paymentCompleted ||
                  totalSplits <= 0 ||
                  totalSplits > remainingAmount + 0.01 ||
                  splits.some(s => !s.payment_method || s.amount <= 0)
                }
                className="min-w-120px"
              >
                {isProcessing ? 'Procesando...' : paymentCompleted ? 'Pago realizado' :
                  Math.abs(leftover) <= 0.01 ? 'Pagar' : 'Pago Parcial'}
              </Button>
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