import { useState } from 'react';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { formatCurrency } from '@/services/currency';
import { type MovementCategory } from '@/config/treasury-actions';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'INCOME' | 'EXPENSE';
  category?: MovementCategory;
  services?: Array<{ id: number; name: string; price: number; category: string }>;
}

export default function TransactionModal({ 
  isOpen, 
  onClose, 
  type,
  services = []
}: TransactionModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    amount: 0,
    description: '',
    service_id: '',
    patient_name: '',
  });

  const selectedService = services.find(s => s.id.toString() === formData.service_id);

  // Auto-fill amount when service is selected
  const handleServiceChange = (serviceId: string) => {
    const service = services.find(s => s.id.toString() === serviceId);
    if (service) {
      setFormData(prev => ({
        ...prev,
        service_id: serviceId,
        amount: service.price,
        description: `Servicio: ${service.name}`,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        service_id: serviceId,
      }));
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAmountChange = (value: number) => {
    setFormData(prev => ({
      ...prev,
      amount: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Basic validation
    if (!formData.amount || formData.amount <= 0) {
      setError('El monto debe ser mayor a 0');
      toast.error('El monto debe ser mayor a 0');
      setIsLoading(false);
      return;
    }

    if (!formData.description || formData.description.length < 3) {
      setError('La descripción debe tener al menos 3 caracteres');
      toast.error('La descripción debe tener al menos 3 caracteres');
      setIsLoading(false);
      return;
    }

    try {
      const submitData = {
        type,
        amount: formData.amount,
        description: formData.description,
        ...(formData.service_id && { service_id: parseInt(formData.service_id) }),
        ...(formData.patient_name && { patient_name: formData.patient_name }),
      };

      const endpoint = type === 'INCOME' ? '/cash-register/income' : '/cash-register/expense';
      
      router.post(endpoint, submitData, {
        onSuccess: () => {
          const formattedAmount = formatCurrency(formData.amount);
          const transactionType = type === 'INCOME' ? 'Ingreso' : 'Egreso';
          toast.success(`${transactionType} registrado exitosamente: ${formattedAmount}`);
          setFormData({
            amount: 0,
            description: '',
            service_id: '',
            patient_name: '',
          });
          onClose();
        },
        onError: (errors) => {
          console.error('Transaction error:', errors);
          const errorMessage = errors.message || 'Error al registrar la transacción';
          setError(errorMessage);
          toast.error(errorMessage);
        },
        onFinish: () => {
          setIsLoading(false);
        },
      });
    } catch (err) {
      console.error('Transaction submission error:', err);
      const errorMessage = 'Error al procesar la transacción';
      setError(errorMessage);
      toast.error(errorMessage);
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        amount: 0,
        description: '',
        service_id: '',
        patient_name: '',
      });
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {type === 'INCOME' ? 'Registrar Ingreso' : 'Registrar Egreso'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {/* Service Selection (for INCOME only) */}
          {type === 'INCOME' && services.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Servicio Médico (Opcional)
              </label>
              <Select onValueChange={handleServiceChange} value={formData.service_id}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar servicio..." />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id.toString()}>
                      {service.name} - ${service.price.toFixed(2)} ({service.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Patient Name (for INCOME only) */}
          {type === 'INCOME' && (
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Nombre del Paciente (Opcional)
              </label>
              <Input
                value={formData.patient_name}
                onChange={(e) => handleInputChange('patient_name', e.target.value)}
                placeholder="Ingrese el nombre del paciente..."
                disabled={isLoading}
              />
            </div>
          )}

          {/* Amount */}
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Monto *
            </label>
            <CurrencyInput
              placeholder="0"
              value={formData.amount}
              onChange={handleAmountChange}
              disabled={isLoading}
              showPrefix={true}
              minValue={0}
            />
            {selectedService && (
              <p className="text-sm text-muted-foreground">
                Precio del servicio: {formatCurrency(selectedService.price)}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Descripción *
            </label>
            <Textarea
              placeholder={
                type === 'INCOME' 
                  ? 'Describe el motivo del ingreso...' 
                  : 'Describe el motivo del egreso...'
              }
              rows={3}
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('description', e.target.value)}
              disabled={isLoading}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Spinner className="mr-2 h-4 w-4" />}
              {type === 'INCOME' ? 'Registrar Ingreso' : 'Registrar Egreso'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}