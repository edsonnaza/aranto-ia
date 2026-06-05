import { useState } from 'react';
import { router } from '@inertiajs/react';
import type { Errors } from '@inertiajs/core';

interface WorksheetData {
  worksheet_number: string;
  worksheet_date: string;
  lab_equipment_id?: number;
  technician_id?: number;
  notes?: string;
  test_request_ids: number[];
  [key: string]: string | number | boolean | undefined | null | Date | File | Blob | number[];
}

export function useWorksheets() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Errors | null>(null);

  const refresh = () => {
    setLoading(true);
    setError(null);
    router.reload({
      only: ['worksheets'],
      onFinish: () => setLoading(false),
      onError: (err) => setError(err),
    });
  };

  const create = (data: WorksheetData, onSuccess?: () => void) => {
    setLoading(true);
    setError(null);
    router.post('/medical/laboratory/worksheets', data, {
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

  const update = (id: number, data: WorksheetData, onSuccess?: () => void) => {
    setLoading(true);
    setError(null);
    router.put(`/medical/laboratory/worksheets/${id}`, data, {
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
    router.post(`/medical/laboratory/worksheets/${id}/start`, {}, {
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
    router.post(`/medical/laboratory/worksheets/${id}/complete`, {}, {
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
    router.post(`/medical/laboratory/worksheets/${id}/cancel`, { notes }, {
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
    router.delete(`/medical/laboratory/worksheets/${id}`, {
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

  return { loading, error, refresh, create, update, start, complete, cancel, destroy };
}
