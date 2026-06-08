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
import { Loader2, AlertTriangle, Calculator, Banknote, CreditCard, Building2, Smartphone, CheckSquare } from 'lucide-react';
import { formatCurrency } from '@/services/currency';

// Schema de validación
const closeCashSchema = z.object({
    physical_amount: z.number()
        .min(0, 'El monto físico debe ser mayor o igual a 0'),
    notes: z.string().optional(),
});

type CloseCashFormData = z.infer<typeof closeCashSchema>;

// Definición de métodos de pago disponibles
const PAYMENT_METHOD_CONFIG: Record<string, { label: string; icon: React.ElementType; cashOnly: boolean }> = {
    cash:     { label: 'Efectivo',            icon: Banknote,    cashOnly: true  },
    debit:    { label: 'Tarjeta de Débito',   icon: CreditCard,  cashOnly: false },
    credit:   { label: 'Tarjeta de Crédito',  icon: CreditCard,  cashOnly: false },
    transfer: { label: 'Transferencia',        icon: Building2,   cashOnly: false },
    digital:  { label: 'Pago Digital / QR',   icon: Smartphone,  cashOnly: false },
}

interface CloseCashModalProps {
    isOpen: boolean;
    onClose: () => void;
    balance?: {
        opening: number;
        income: number;
        current: number;
        expense: number;
    };
    transactions?: Array<{
        id: number;
        type: 'INCOME' | 'EXPENSE' | 'PAYMENT';
        amount: number;
        description?: string;
        category?: string;
        payment_method?: string;
        created_at: string;
    }>;
}

export default function CloseCashModal({ 
    isOpen, 
    onClose, 
    balance = { opening: 0, income: 0, current: 0, expense: 0 },
    transactions = []
}: CloseCashModalProps) {
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

    const physicalAmount = useWatch({ control, name: 'physical_amount' });

    const calculatedBalance = Number(balance?.current || 0);

    // Calcular desglose de INGRESOS por método de pago
    const incomeByMethod: Record<string, number> = {}
    for (const tx of transactions) {
        if (tx.type !== 'INCOME') continue
        const method = (tx.payment_method ?? 'cash').toLowerCase()
        incomeByMethod[method] = (incomeByMethod[method] ?? 0) + Number(tx.amount)
    }

    // Ingresos en efectivo esperados en caja = apertura + cash income - cash expenses
    const cashIncomeTotal = incomeByMethod['cash'] ?? 0
    const expectedCash = Number(balance?.opening ?? 0) + cashIncomeTotal

    // La diferencia para el cajero es solo sobre el efectivo físico
    const cashDifference = physicalAmount && !isNaN(Number(physicalAmount))
        ? Number(physicalAmount) - expectedCash
        : 0

    const isDifferenceSignificant = Math.abs(cashDifference) > 100

    // Métodos con movimiento + los que no tuvieron pero están configurados (solo si tienen monto)
    const methodsWithMovement = Object.entries(incomeByMethod)

    const onSubmit = async (data: CloseCashFormData) => {
        if (isDifferenceSignificant && (!data.notes || data.notes.trim().length < 10)) {
            toast.error('Diferencia significativa en efectivo. Se requiere justificación en las notas (mínimo 10 caracteres).');
            return;
        }
        
        setIsLoading(true);
        setError(null);

        router.post('/cash-register/close', {
            physical_amount: data.physical_amount,
            calculated_balance: calculatedBalance,
            difference: cashDifference,
            notes: data.notes,
        }, {
            onSuccess: () => {
                if (Math.abs(cashDifference) === 0) {
                    toast.success(`Caja cerrada exitosamente. Balance exacto: ${formatCurrency(data.physical_amount)}`);
                } else if (cashDifference > 0) {
                    toast.success(`Caja cerrada exitosamente. Sobrante de ${formatCurrency(Math.abs(cashDifference))} en efectivo.`);
                } else {
                    toast.warning(`Caja cerrada con faltante de ${formatCurrency(Math.abs(cashDifference))} en efectivo.`);
                }
                reset();
                onClose();
            },
            onError: (errors) => {
                const errorMessage = errors.message || 'Error al cerrar la caja';
                setError(errorMessage);
                toast.error(errorMessage);
            },
            onFinish: () => { setIsLoading(false); },
        });
    };

    const handleClose = () => {
        if (!isLoading) { reset(); setError(null); onClose(); }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="flex flex-col sm:max-w-lg max-h-[80vh] overflow-hidden lg:max-w-2xl">
                <DialogHeader className="shrink-0">
                    <DialogTitle className="flex items-center gap-2">
                        <Calculator className="h-5 w-5" />
                        Cerrar Caja Registradora
                    </DialogTitle>
                    <DialogDescription>
                        Revisa el resumen del día y confirma el conteo físico de efectivo
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex-1 overflow-y-auto pr-1 space-y-4">

                        {/* Resumen del Día */}
                        <Card>
                            <CardContent className="pt-0 pb-0">
                                <h3 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wide">Resumen del Día</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm mb-0">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Balance Inicial</p>
                                        <p className="text-lg font-semibold">{formatCurrency(Number(balance?.opening || 0))}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Ingresos totales</p>
                                        <p className="text-lg font-semibold text-green-600">+{formatCurrency(Number(balance?.income || 0))}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Egresos</p>
                                        <p className="text-lg font-semibold text-red-600">-{formatCurrency(Number(balance?.expense || 0))}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Balance Calculado</p>
                                        <p className="text-lg font-bold">{formatCurrency(calculatedBalance)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Desglose por medio de pago */}
                        <Card>
                            <CardContent className="pt-4 pb-3">
                                <h3 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wide">Ingresos por Medio de Pago</h3>
                                <div className="space-y-2">
                                    {methodsWithMovement.length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-2">Sin ingresos registrados</p>
                                    ) : (
                                        methodsWithMovement.map(([method, amount]) => {
                                            const cfg = PAYMENT_METHOD_CONFIG[method] ?? { label: method, icon: CheckSquare, cashOnly: false }
                                            const Icon = cfg.icon
                                            return (
                                                <div key={method} className="flex items-center justify-between text-sm">
                                                    <div className="flex items-center gap-2 text-gray-700">
                                                        <Icon className="h-4 w-4 text-slate-400" />
                                                        <span>{cfg.label}</span>
                                                        {cfg.cashOnly && (
                                                            <span className="text-[10px] bg-amber-100 text-amber-700 rounded px-1 py-0.5 font-medium">requiere conteo</span>
                                                        )}
                                                    </div>
                                                    <span className="font-semibold text-green-700">+{formatCurrency(amount)}</span>
                                                </div>
                                            )
                                        })
                                    )}
                                </div>

                                {methodsWithMovement.length > 1 && (
                                    <>
                                        <Separator className="my-2" />
                                        <div className="flex justify-between text-sm font-semibold">
                                            <span>Total ingresos</span>
                                            <span className="text-green-700">+{formatCurrency(Number(balance?.income || 0))}</span>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* Conteo Físico de Efectivo */}
                        <div className="space-y-3">
                            <div>
                                <Label htmlFor="physical_amount" className="text-base font-semibold flex items-center gap-1.5">
                                    <Banknote className="h-4 w-4" />
                                    Conteo Físico de Efectivo *
                                </Label>
                                <p className="text-xs text-muted-foreground mt-0.5 mb-2">
                                    Cuenta el dinero físico en el cajón. Efectivo esperado: <strong>{formatCurrency(expectedCash)}</strong>
                                    {cashIncomeTotal > 0 && ` (apertura ${formatCurrency(Number(balance?.opening ?? 0))} + cobros en efectivo ${formatCurrency(cashIncomeTotal)})`}
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

                            {/* Diferencia de efectivo */}
                            {physicalAmount > 0 && (
                                <Card className={`border ${
                                    Math.abs(cashDifference) < 100
                                        ? 'border-green-200 bg-green-50'
                                        : cashDifference > 0
                                            ? 'border-blue-200 bg-blue-50'
                                            : 'border-yellow-200 bg-yellow-50'
                                }`}>
                                    <CardContent className="pt-3 pb-3">
                                        <div className="flex justify-between items-center">
                                            <Label className="text-sm">Diferencia en efectivo</Label>
                                            <p className={`text-lg font-bold ${
                                                cashDifference === 0 ? 'text-green-600'
                                                : cashDifference > 0 ? 'text-blue-600'
                                                : 'text-red-600'
                                            }`}>
                                                {cashDifference >= 0 ? '+' : ''}{formatCurrency(cashDifference)}
                                            </p>
                                        </div>
                                        {cashDifference !== 0 && (
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {cashDifference > 0 ? 'Sobrante en caja' : 'Faltante en caja'}
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            {isDifferenceSignificant && (
                                <Alert className="border-yellow-200 bg-yellow-50">
                                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                    <AlertDescription className="text-yellow-800 text-xs">
                                        <strong>Atención:</strong> Diferencia de {formatCurrency(Math.abs(cashDifference))} en efectivo.
                                        Agrega una justificación en las notas.
                                    </AlertDescription>
                                </Alert>
                            )}

                            {/* Notas */}
                            <div>
                                <Label htmlFor="notes" className="text-sm">
                                    Notas {isDifferenceSignificant && <span className="text-red-500">*</span>}
                                </Label>
                                <Textarea
                                    id="notes"
                                    placeholder="Observaciones sobre el cierre de caja, justificación de diferencias, etc."
                                    className="mt-1 text-sm"
                                    rows={2}
                                    {...register('notes')}
                                />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <Alert className="border-red-200 bg-red-50 mt-3 shrink-0">
                            <AlertDescription className="text-red-800 text-sm">{error}</AlertDescription>
                        </Alert>
                    )}

                    <DialogFooter className="shrink-0 border-t pt-4 mt-4">
                        <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isLoading || !physicalAmount} className="bg-red-600 hover:bg-red-700">
                            {isLoading ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Cerrando...</>
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
