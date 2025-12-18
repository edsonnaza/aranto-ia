import React, { useState } from 'react';
import { toast } from 'sonner';
import { router } from '@inertiajs/react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CurrencyInput } from '@/components/ui/currency-input';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExpenseProcessed: () => void;
}

const expenseCategories = [
  { value: 'supplies', label: 'Insumos y Suministros' },
  { value: 'utilities', label: 'Servicios Públicos' },
  { value: 'maintenance', label: 'Mantenimiento' },
  { value: 'salary', label: 'Sueldos y Salarios' },
  { value: 'professional_fee', label: 'Honorarios Profesionales' },
  { value: 'transport', label: 'Transporte' },
  { value: 'other', label: 'Otros' },
];

export function ExpenseModal({ isOpen, onClose, onExpenseProcessed }: ExpenseModalProps) {
  const [category, setCategory] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleExpense = async () => {
    if (!category || amount <= 0) return;

    setIsProcessing(true);

    await router.post('/cash-register/register-expense', {
      category,
      amount,
      description,
      notes
    }, {
      preserveScroll: true,
      preserveState: true,
      onSuccess: () => {
        toast.success('Egreso registrado correctamente');
        onExpenseProcessed();
        resetForm();
        onClose();
      },
      onError: (errors) => {
        console.error('Errores en el egreso:', errors);
        toast.error('Error al registrar el egreso');
      }
    });

    setIsProcessing(false);
  };

  const resetForm = () => {
    setCategory('');
    setAmount(0);
    setDescription('');
    setNotes('');
  };

  const handleClose = () => {
    if (!isProcessing) {
      resetForm();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="lg:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Egreso</DialogTitle>
          <DialogDescription>
            Complete los detalles del egreso que desea registrar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">Categoría</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar categoría" />
              </SelectTrigger>
              <SelectContent>
                {expenseCategories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Monto</Label>
            <CurrencyInput
              value={amount}
              onChange={setAmount}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción del egreso..."
              rows={2}
            />
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

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
            Cancelar
          </Button>
          <Button
            onClick={handleExpense}
            disabled={!category || amount <= 0 || isProcessing}
            className="bg-red-600 hover:bg-red-700"
          >
            {isProcessing ? 'Procesando...' : 'Registrar Egreso'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}