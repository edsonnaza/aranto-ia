import { useState } from 'react';
import { router } from '@inertiajs/react';
import type { Errors } from '@inertiajs/core';

interface LabValidationData {
  lab_sample_id: number;
  lab_test_request_id: number;
  comments?: string;
  [key: string]: string | number | boolean | undefined | null | Date | File | Blob;
}

export function useLabValidations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Errors | null>(null);

  const refresh = () => {
    setLoading(true);
    setError(null);
    router.reload({
      only: ['validations'],
      onFinish: () => setLoading(false),
      onError: (err) => setError(err),
    });
  };

  const create = (data: LabValidationData, onSuccess?: () => void) => {
    setLoading(true);
    setError(null);
    router.post('/medical/laboratory/validations', data, {
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

  const update = (id: number, data: LabValidationData, onSuccess?: () => void) => {
    setLoading(true);
    setError(null);
    router.put(`/medical/laboratory/validations/${id}`, data, {
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
    router.delete(`/medical/laboratory/validations/${id}`, {
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
