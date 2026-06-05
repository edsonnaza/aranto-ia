import { useState } from 'react';
import { router } from '@inertiajs/react';
import type { Errors } from '@inertiajs/core';

interface LabSampleData {
  service_request_detail_id?: number;
  patient_id: number;
  lab_sample_type_id: number;
  sample_number: string;
  barcode?: string;
  collected_at: string;
  received_at?: string;
  status?: string;
  remarks?: string;
  [key: string]: string | number | boolean | undefined | null | Date | File | Blob;
}

interface BulkLabSampleData {
  patient_id: number;
  priority: 'routine' | 'urgent' | 'stat';
  notes?: string;
  samples: Array<{
    lab_sample_type_id: number;
    lab_test_profile_id?: number;
    professional_id?: number;
    barcode?: string;
    collected_at: string;
    quantity: number;
    notes?: string;
  }>;
}

export function useLabSamples() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Errors | null>(null);

  const refresh = () => {
    setLoading(true);
    setError(null);
    router.reload({
      only: ['samples'],
      onFinish: () => setLoading(false),
      onError: (err) => setError(err),
    });
  };

  const create = (data: LabSampleData, onSuccess?: () => void) => {
    setLoading(true);
    setError(null);
    router.post('/medical/laboratory/samples', data as any, {
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

  const bulkCreate = (data: BulkLabSampleData, onSuccess?: () => void) => {
    setLoading(true);
    setError(null);
    router.post('/medical/laboratory/samples/bulk', data as any, {
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

  const update = (id: number, data: LabSampleData, onSuccess?: () => void) => {
    setLoading(true);
    setError(null);
    router.put(`/medical/laboratory/samples/${id}`, data as any, {
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
    router.delete(`/medical/laboratory/samples/${id}`, {
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

  const collect = (id: number, onSuccess?: () => void) => {
    setLoading(true);
    setError(null);
    router.post(`/medical/laboratory/samples/${id}/collect`, {}, {
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

  return { loading, error, refresh, create, bulkCreate, update, destroy, collect };
}
