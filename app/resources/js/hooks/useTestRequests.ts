import { useState } from 'react';
import { router } from '@inertiajs/react';
import type { Errors } from '@inertiajs/core';

interface TestRequestData {
  lab_sample_id: number;
  lab_test_profile_id: number;
  priority: 'routine' | 'urgent' | 'stat';
  notes?: string;
  [key: string]: string | number | boolean | undefined | null | Date | File | Blob | number[];
}

export function useTestRequests() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Errors | null>(null);

  const refresh = () => {
    setLoading(true);
    setError(null);
    router.reload({
      only: ['testRequests'],
      onFinish: () => setLoading(false),
      onError: (err) => setError(err),
    });
  };

  const create = (data: TestRequestData, onSuccess?: () => void) => {
    setLoading(true);
    setError(null);
    router.post('/medical/laboratory/test-requests', data, {
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

  const assign = (id: number, assignedTo: number, onSuccess?: () => void) => {
    setLoading(true);
    setError(null);
    router.post(`/medical/laboratory/test-requests/${id}/assign`, { assigned_to: assignedTo }, {
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

  const start = (id: number, onSuccess?: () => void) => {
    setLoading(true);
    setError(null);
    router.post(`/medical/laboratory/test-requests/${id}/start`, {}, {
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

  const complete = (id: number, onSuccess?: () => void) => {
    setLoading(true);
    setError(null);
    router.post(`/medical/laboratory/test-requests/${id}/complete`, {}, {
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

  const cancel = (id: number, notes: string, onSuccess?: () => void) => {
    setLoading(true);
    setError(null);
    router.post(`/medical/laboratory/test-requests/${id}/cancel`, { notes }, {
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
    router.delete(`/medical/laboratory/test-requests/${id}`, {
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

  return { loading, error, refresh, create, assign, start, complete, cancel, destroy };
}
