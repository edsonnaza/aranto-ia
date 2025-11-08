import { usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

interface FlashMessageProviderProps {
    children: React.ReactNode;
}

export default function FlashMessageProvider({ children }: FlashMessageProviderProps) {
    const { props } = usePage();
    const { message, error, flash } = props as { 
        message?: string; 
        error?: string;
        flash?: { success?: string; error?: string };
    };
    const lastMessage = useRef<string | undefined>(undefined);
    const lastError = useRef<string | undefined>(undefined);
    const lastFlashSuccess = useRef<string | undefined>(undefined);
    const lastFlashError = useRef<string | undefined>(undefined);
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
        console.log('FlashMessageProvider - Props received:', { 
            message, 
            error, 
            flash,
            lastMessage: lastMessage.current, 
            lastError: lastError.current 
        });
        
        // Manejar formato antiguo (message/error)
        if (message && message !== lastMessage.current) {
            console.log('Showing success toast (old format):', message);
            lastMessage.current = message;
            showToast('success', message);
        }
        
        if (error && error !== lastError.current) {
            console.log('Showing error toast (old format):', error);
            lastError.current = error;
            showToast('error', error);
        }

        // Manejar formato nuevo (flash.success/flash.error)
        if (flash?.success && flash.success !== lastFlashSuccess.current) {
            console.log('Showing success toast (new format):', flash.success);
            lastFlashSuccess.current = flash.success;
            showToast('success', flash.success);
        }
        
        if (flash?.error && flash.error !== lastFlashError.current) {
            console.log('Showing error toast (new format):', flash.error);
            lastFlashError.current = flash.error;
            showToast('error', flash.error);
        }
    }, [message, error, flash]);

    return <>{children}</>;
}