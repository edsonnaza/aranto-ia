import { useState } from 'react';
import { router } from '@inertiajs/react';
import type { Errors } from '@inertiajs/core';

interface LabEquipmentData {
    name: string;
    code?: string;
    manufacturer?: string;
    model?: string;
    serial_number?: string;
    department?: string;
    lab_area_id?: number | null;
    status: 'active' | 'maintenance' | 'inactive';
    notes?: string;
    [key: string]: string | number | boolean | undefined | null | Date | File | Blob;
}

export function useLabEquipments() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Errors | null>(null);

    const create = (data: LabEquipmentData, onSuccess?: () => void) => {
        setLoading(true);
        setError(null);

        router.post('/medical/laboratory/equipments', data, {
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

    const update = (id: number, data: LabEquipmentData, onSuccess?: () => void) => {
        setLoading(true);
        setError(null);

        router.put(`/medical/laboratory/equipments/${id}`, data, {
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

        router.delete(`/medical/laboratory/equipments/${id}`, {
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
