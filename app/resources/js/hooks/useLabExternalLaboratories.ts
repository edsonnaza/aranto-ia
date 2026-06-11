import { useState } from 'react';
import { router } from '@inertiajs/react';
import type { Errors } from '@inertiajs/core';

interface ExternalLaboratoryData {
    name: string;
    contact_name?: string;
    phone?: string;
    whatsapp?: string;
    email?: string;
    address?: string;
    notes?: string;
    status: 'active' | 'inactive';
    [key: string]: string | number | boolean | undefined | null | Date | File | Blob;
}

export function useLabExternalLaboratories() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Errors | null>(null);

    const create = (data: ExternalLaboratoryData, onSuccess?: () => void) => {
        setLoading(true);
        setError(null);

        router.post('/medical/laboratory/external-laboratories', data, {
            onSuccess: () => {
                setLoading(false);
                onSuccess?.();
            },
            onError: (err) => {
                setError(err);
                setLoading(false);
            },
        });
    };

    const update = (id: number, data: ExternalLaboratoryData, onSuccess?: () => void) => {
        setLoading(true);
        setError(null);

        router.put(`/medical/laboratory/external-laboratories/${id}`, data, {
            onSuccess: () => {
                setLoading(false);
                onSuccess?.();
            },
            onError: (err) => {
                setError(err);
                setLoading(false);
            },
        });
    };

    const destroy = (id: number, onSuccess?: () => void) => {
        setLoading(true);
        setError(null);

        router.delete(`/medical/laboratory/external-laboratories/${id}`, {
            onSuccess: () => {
                setLoading(false);
                onSuccess?.();
            },
            onError: (err) => {
                setError(err);
                setLoading(false);
            },
        });
    };

    return { loading, error, create, update, destroy };
}
