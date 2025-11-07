import { useState } from 'react';
import { router } from '@inertiajs/react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

interface OpenCashModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function OpenCashModal({ isOpen, onClose }: OpenCashModalProps) {
    const [initialAmount, setInitialAmount] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    console.log('OpenCashModal rendered, isOpen:', isOpen);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrors({});

        // Validación básica
        if (!initialAmount || parseFloat(initialAmount) < 0) {
            setErrors({ initial_amount: 'El monto inicial debe ser mayor o igual a 0' });
            setIsLoading(false);
            return;
        }

        // Enviar datos al backend
        router.post('/cash-register/open', 
            {
                initial_amount: parseFloat(initialAmount),
            },
            {
                onSuccess: () => {
                    setInitialAmount('');
                    setIsLoading(false);
                    onClose();
                    // Recargar la página para mostrar el nuevo estado
                    router.reload();
                },
                onError: (errors) => {
                    setErrors(errors);
                    setIsLoading(false);
                },
                onFinish: () => {
                    setIsLoading(false);
                }
            }
        );
    };

    const handleClose = () => {
        if (!isLoading) {
            setInitialAmount('');
            setErrors({});
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <svg 
                            className="h-5 w-5 text-green-600" 
                            xmlns="http://www.w3.org/2000/svg" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth="2"
                        >
                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                        Abrir Caja Registradora
                    </DialogTitle>
                    <DialogDescription>
                        Ingresa el monto inicial con el que comenzará la sesión de caja. 
                        Este monto debe coincidir con el efectivo físico disponible.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="initial_amount">
                                Monto Inicial *
                            </Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                    $
                                </span>
                                <Input
                                    id="initial_amount"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    value={initialAmount}
                                    onChange={(e) => setInitialAmount(e.target.value)}
                                    className="pl-8"
                                    disabled={isLoading}
                                    required
                                />
                            </div>
                            {errors.initial_amount && (
                                <p className="text-sm text-red-600">
                                    {errors.initial_amount}
                                </p>
                            )}
                        </div>

                        <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950">
                            <div className="flex">
                                <svg 
                                    className="h-5 w-5 text-blue-600 dark:text-blue-400" 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    viewBox="0 0 24 24" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth="2"
                                >
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="m9 12 2 2 4-4" />
                                </svg>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                        Información importante
                                    </h3>
                                    <div className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                                        <ul className="list-disc space-y-1 pl-4">
                                            <li>Verifica que el monto coincida con el efectivo físico</li>
                                            <li>Una vez abierta, podrás registrar transacciones</li>
                                            <li>Solo puedes tener una sesión activa a la vez</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
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
                        <Button 
                            type="submit" 
                            disabled={isLoading || !initialAmount}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {isLoading && <Spinner className="mr-2 h-4 w-4" />}
                            {isLoading ? 'Abriendo...' : 'Abrir Caja'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}