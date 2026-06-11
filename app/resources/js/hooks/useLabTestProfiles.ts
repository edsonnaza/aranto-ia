import type { Errors } from '@inertiajs/core';
import { router } from '@inertiajs/react';
import { useState } from 'react';

interface LabTestParameterData {
    name: string;
    code: string;
    parameter_type: 'numeric' | 'text' | 'option' | 'calculated';
    unit?: string;
    is_required?: boolean;
    include_in_sum_100?: boolean;
    formula?: string;
    reference_ranges?: Array<{
        gender?: 'male' | 'female' | 'all';
        age_min?: number | string | null;
        age_max?: number | string | null;
        min_value?: number | string | null;
        max_value?: number | string | null;
        reference_text?: string | null;
    }>;
}

interface LabTestProfileData {
    medical_service_id: number;
    lab_area_id?: number | null;
    name: string;
    code: string;
    description?: string;
    status: 'active' | 'inactive';
    validation_type: 'none' | 'sum_100';
    validation_target?: number;
    validation_tolerance?: number;
    equipment_ids?: number[];
    default_equipment_id?: number | null;
    parameters: LabTestParameterData[];
    [key: string]:
        | string
        | number
        | boolean
        | undefined
        | null
        | Date
        | File
        | Blob
        | number[]
        | LabTestParameterData[];
}

interface SearchFilters {
    search?: string;
    status?: string;
    area_id?: string;
}

export function useLabTestProfiles() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Errors | null>(null);

    const search = (filters: SearchFilters) => {
        setLoading(true);
        setError(null);
        router.get('/medical/laboratory/test-profiles', filters, {
            preserveState: true,
            onFinish: () => setLoading(false),
            onError: (err) => setError(err),
        });
    };

    const create = (data: LabTestProfileData, onSuccess?: () => void) => {
        setLoading(true);
        setError(null);
        router.post('/medical/laboratory/test-profiles', data, {
            onSuccess: () => {
                setLoading(false);
                if (onSuccess) onSuccess();
            },
            onError: (err) => {
                setError(err);
                setLoading(false);
            },
        });
    };

    const update = (
        id: number,
        data: LabTestProfileData,
        onSuccess?: () => void,
    ) => {
        setLoading(true);
        setError(null);
        router.put(`/medical/laboratory/test-profiles/${id}`, data, {
            onSuccess: () => {
                setLoading(false);
                if (onSuccess) onSuccess();
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
        router.delete(`/medical/laboratory/test-profiles/${id}`, {
            onSuccess: () => {
                setLoading(false);
                if (onSuccess) onSuccess();
            },
            onError: (err) => {
                setError(err);
                setLoading(false);
            },
        });
    };

    return { loading, error, search, create, update, destroy };
}
