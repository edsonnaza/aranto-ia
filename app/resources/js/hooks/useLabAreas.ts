import { useState } from 'react';
import { router } from '@inertiajs/react';
import type { Errors } from '@inertiajs/core';

interface LabAreaData {
    name: string;
    code: string;
    description?: string;
    status: 'active' | 'inactive';
    display_order?: number;
    [key: string]: string | number | boolean | undefined | null | Date | File | Blob;
}

export function useLabAreas() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Errors | null>(null);

    const create = (data: LabAreaData, onSuccess?: () => void) => {
        setLoading(true);
        setError(null);

        router.post('/medical/laboratory/areas', data, {
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

    const update = (id: number, data: LabAreaData, onSuccess?: () => void) => {
        setLoading(true);
        setError(null);

        router.put(`/medical/laboratory/areas/${id}`, data, {
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

        router.delete(`/medical/laboratory/areas/${id}`, {
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
