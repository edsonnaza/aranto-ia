import { usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

interface FlashMessageProviderProps {
    children: React.ReactNode;
}

export default function FlashMessageProvider({ children }: FlashMessageProviderProps) {
    const { props } = usePage();
    const { message, error } = props as { message?: string; error?: string };
    const lastMessage = useRef<string | undefined>(undefined);
    const lastError = useRef<string | undefined>(undefined);
    const toastTimeouts = useRef<Set<string>>(new Set());

    const showToast = (type: 'success' | 'error', text: string) => {
        // Evitar toasts duplicados usando un timeout
        const toastKey = `${type}-${text}`;
        if (toastTimeouts.current.has(toastKey)) {
            return;
        }

        toastTimeouts.current.add(toastKey);
        
        if (type === 'success') {
            toast.success(text);
        } else {
            toast.error(text);
        }

        // Limpiar el timeout después de 1 segundo
        setTimeout(() => {
            toastTimeouts.current.delete(toastKey);
        }, 1000);
    };

    useEffect(() => {
        console.log('FlashMessageProvider - Props received:', { message, error, lastMessage: lastMessage.current, lastError: lastError.current });
        
        // Solo mostrar toast si el mensaje cambió y no es undefined
        if (message && message !== lastMessage.current) {
            console.log('Showing success toast:', message);
            lastMessage.current = message;
            showToast('success', message);
        }
        
        if (error && error !== lastError.current) {
            console.log('Showing error toast:', error);
            lastError.current = error;
            showToast('error', error);
        }
    }, [message, error]);

    return <>{children}</>;
}