import React, { useState } from 'react';
import { z } from 'zod';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle, Calculator } from 'lucide-react';
import { formatCurrency } from '@/services/currency';

// Schema de validación
const closeCashSchema = z.object({
    physical_amount: z.number()
        .min(0, 'El monto físico debe ser mayor o igual a 0'),
    notes: z.string().optional(),
});

type CloseCashFormData = z.infer<typeof closeCashSchema>;

interface CloseCashModalProps {
    isOpen: boolean;
    onClose: () => void;
    balance?: {
        opening: number;
        income: number;
        current: number;
    };
    transactions?: Array<{
        id: number;
        type: 'INCOME' | 'EXPENSE' | 'PAYMENT';
        amount: number;
        description: string;
        created_at: string;
    }>;
}

export default function CloseCashModal({ 
    isOpen, 
    onClose, 
    balance = { opening: 0, income: 0, current: 0 },
    transactions = []
}: CloseCashModalProps) {
    console.log('CloseCashModal rendered, isOpen:', isOpen);
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        control,
        setValue,
        formState: { errors },
    } = useForm<CloseCashFormData>({
        resolver: zodResolver(closeCashSchema),
        defaultValues: {
            physical_amount: 0,
            notes: '',
        },
    });

    // Usar useWatch en lugar de watch() para mejor compatibilidad con React Compiler
    const physicalAmount = useWatch({
        control,
        name: 'physical_amount',
    });

    // El balance ya viene calculado correctamente del backend
    // Las devoluciones compensan ingresos, no son egresos
    const calculatedBalance = Number(balance?.current || 0);

    // Calcular diferencia directamente (sin estado para evitar renders innecesarios)
    const difference = physicalAmount && !isNaN(Number(physicalAmount)) 
        ? Number(physicalAmount) - calculatedBalance 
        : 0;

    const isDifferenceSignificant = Math.abs(difference) > 100; // Diferencia mayor a $100

    const onSubmit = async (data: CloseCashFormData) => {
        console.log('🔧 DEBUG: Starting close cash submission');
        console.log('🔧 DEBUG: Form data:', data);
        console.log('🔧 DEBUG: Calculated balance:', calculatedBalance);
        console.log('🔧 DEBUG: Difference:', difference);
        
        // Validaciones adicionales con toast
        if (isDifferenceSignificant && (!data.notes || data.notes.trim().length < 10)) {
            toast.error('Diferencia significativa detectada. Se requiere justificación detallada en las notas (mínimo 10 caracteres).');
            return;
        }
        
        setIsLoading(true);
        setError(null);

        try {
            const submitData = {
                physical_amount: data.physical_amount,
                calculated_balance: calculatedBalance,
                difference: difference,
                notes: data.notes,
            };

            console.log('🔧 DEBUG: Submit data:', submitData);

            router.post('/cash-register/close', submitData, {
                onSuccess: () => {
                    console.log('🔧 DEBUG: Success callback triggered');
                    const formattedPhysical = formatCurrency(data.physical_amount);
                    if (Math.abs(difference) === 0) {
                        toast.success(`Caja cerrada exitosamente. Balance exacto: ${formattedPhysical}`);
                    } else if (difference > 0) {
                        toast.success(`Caja cerrada exitosamente. Sobrante de ${formatCurrency(Math.abs(difference))} registrado.`);
                    } else {
                        toast.warning(`Caja cerrada con faltante de ${formatCurrency(Math.abs(difference))}. Revisar operaciones.`);
                    }
                    reset();
                    onClose();
                },
                onError: (errors) => {
                    console.error('🔧 DEBUG: Error callback triggered:', errors);
                    const errorMessage = errors.message || 'Error al cerrar la caja';
                    setError(errorMessage);
                    toast.error(errorMessage);
                },
                onFinish: () => {
                    console.log('🔧 DEBUG: Finish callback triggered');
                    setIsLoading(false);
                },
            });
        } catch (err) {
            console.error('🔧 DEBUG: Unexpected error:', err);
            const errorMessage = 'Error inesperado al cerrar la caja';
            setError(errorMessage);
            toast.error(errorMessage);
            setIsLoading(false);
        }
    };    const handleClose = () => {
        if (!isLoading) {
            reset();
            setError(null);
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-600px">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Calculator className="h-5 w-5" />
                        Cerrar Caja Registradora
                    </DialogTitle>
                    <DialogDescription>
                        Revisa el resumen del día y confirma el monto físico para cerrar la sesión
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Resumen del Día */}
                    <Card>
                        <CardContent className="pt-6">
                            <h3 className="font-semibold text-lg mb-4">Resumen del Día</h3>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <Label className="text-muted-foreground">Balance Inicial</Label>
                                    <p className="text-lg font-semibold">{formatCurrency(Number(balance?.opening || 0))}</p>
                                </div>
                                
                                <div>
                                    <Label className="text-muted-foreground">Total Transacciones</Label>
                                    <p className="text-sm text-muted-foreground">{transactions.length} movimientos</p>
                                </div>
                                
                                <div>
                                    <Label className="text-muted-foreground">Ingresos</Label>
                                    <p className="text-lg font-semibold text-green-600">+{formatCurrency(Number(balance?.income || 0))}</p>
                                </div>
                                
                                <div>
                                    <Label className="text-muted-foreground">Egresos</Label>
                                    <p className="text-lg font-semibold text-red-600">-{formatCurrency(Number(balance?.expense || 0))}</p>
                                </div>
                            </div>

                            <Separator className="my-4" />
                            
                            <div className="flex justify-between items-center">
                                <Label className="text-muted-foreground">Balance Calculado</Label>
                                <p className="text-xl font-bold">{formatCurrency(calculatedBalance)}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Conteo Físico */}
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="physical_amount" className="text-base font-semibold">
                                Conteo Físico *
                            </Label>
                            <p className="text-sm text-muted-foreground mb-2">
                                Ingresa el monto total de dinero físico contado en la caja
                            </p>
                            <CurrencyInput
                                id="physical_amount"
                                placeholder="0"
                                className="text-lg"
                                value={physicalAmount}
                                onChange={(value) => setValue('physical_amount', value)}
                                showPrefix={true}
                                minValue={0}
                                error={errors.physical_amount?.message}
                            />
                        </div>

                        {/* Mostrar diferencia */}
                        {physicalAmount && !isNaN(Number(physicalAmount)) && (
                            <Card className={`border ${
                                Math.abs(difference) < 100 
                                    ? 'border-green-200 bg-green-50' 
                                    : 'border-yellow-200 bg-yellow-50'
                            }`}>
                                <CardContent className="pt-4">
                                    <div className="flex justify-between items-center">
                                        <Label>Diferencia</Label>
                                        <p className={`text-lg font-bold ${
                                            difference === 0 
                                                ? 'text-green-600'
                                                : difference > 0 
                                                    ? 'text-blue-600' 
                                                    : 'text-red-600'
                                        }`}>
                                            {difference >= 0 ? '+' : ''}{formatCurrency(Math.abs(difference))}
                                        </p>
                                    </div>
                                    {difference !== 0 && (
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {difference > 0 
                                                ? 'Sobrante en caja' 
                                                : 'Faltante en caja'
                                            }
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Alerta para diferencias significativas */}
                        {isDifferenceSignificant && (
                            <Alert className="border-yellow-200 bg-yellow-50">
                                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                <AlertDescription className="text-yellow-800">
                                    <strong>Atención:</strong> Hay una diferencia significativa de {formatCurrency(Math.abs(difference))}. 
                                    Por favor, verifica el conteo o agrega una justificación en las notas.
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Notas */}
                        <div>
                            <Label htmlFor="notes">
                                Notas {isDifferenceSignificant && '(requeridas para diferencias significativas)'}
                            </Label>
                            <Textarea
                                id="notes"
                                placeholder="Observaciones sobre el cierre de caja, justificación de diferencias, etc."
                                className="mt-1"
                                {...register('notes')}
                            />
                        </div>
                    </div>

                    {error && (
                        <Alert className="border-red-200 bg-red-50">
                            <AlertDescription className="text-red-800">
                                {error}
                            </AlertDescription>
                        </Alert>
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={isLoading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading || !physicalAmount}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Cerrando...
                                </>
                            ) : (
                                'Cerrar Caja'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}