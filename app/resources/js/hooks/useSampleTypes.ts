import { useState } from 'react';
import { router } from '@inertiajs/react';
import type { Errors } from '@inertiajs/core';

interface SampleTypeData {
  name: string;
  code: string;
  description?: string;
  container_type: string;
  preservation_requirements?: string;
  stability_hours?: number;
  status: 'active' | 'inactive';
  [key: string]: string | number | boolean | undefined | null | Date | File | Blob;
}

export function useSampleTypes() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Errors | null>(null);

  const refresh = () => {
    setLoading(true);
    setError(null);
    router.reload({
      only: ['sampleTypes'],
      onFinish: () => setLoading(false),
      onError: (err) => setError(err),
    });
  };

  const create = (data: SampleTypeData, onSuccess?: () => void) => {
    setLoading(true);
    setError(null);
    router.post('/medical/laboratory/sample-types', data, {
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

  const update = (id: number, data: SampleTypeData, onSuccess?: () => void) => {
    setLoading(true);
    setError(null);
    router.put(`/medical/laboratory/sample-types/${id}`, data, {
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
    router.delete(`/medical/laboratory/sample-types/${id}`, {
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

  return { loading, error, refresh, create, update, destroy };
}
