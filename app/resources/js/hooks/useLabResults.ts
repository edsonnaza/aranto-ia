import { useState } from 'react'
import { router } from '@inertiajs/react'
import type { Errors } from '@inertiajs/core'

interface LabResultData {
  lab_sample_id: number
  lab_test_request_id: number
  lab_test_parameter_id: number
  equipment_id?: number
  value: string
  calculated_percentage?: number
  is_out_of_range?: boolean
  status: string
  [key: string]: string | number | boolean | undefined | null | Date | File | Blob
}

interface LabResultBatchData {
  lab_test_request_id: number
  equipment_id?: number
  processing_mode?: 'internal' | 'referred'
  referred_status?: 'referred_sent' | 'external_result_received' | 'not_performed'
  external_laboratory_id?: number
  external_reference_number?: string
  expected_result_at?: string
  processing_notes?: string
  not_performed_reason?: string
  include_external_attachments_in_medical_history?: boolean
  external_reports?: File[]
  external_report_titles?: string[]
  status: string
  results: Array<{
    lab_test_parameter_id: number
    value: string
    is_out_of_range?: boolean
  }>
}

export function useLabResults() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Errors | null>(null)

  const refresh = () => {
    setLoading(true)
    setError(null)
    router.reload({
      only: ['results'],
      onFinish: () => setLoading(false),
      onError: (err) => setError(err),
    })
  }

  const create = (data: LabResultData, onSuccess?: () => void) => {
    setLoading(true)
    setError(null)
    router.post('/medical/laboratory/results', data, {
      onSuccess: () => {
        setLoading(false)
        if (onSuccess) onSuccess()
      },
      onError: (err) => {
        setError(err)
        setLoading(false)
      },
    })
  }

  const createBatch = (data: LabResultBatchData, onSuccess?: () => void) => {
    setLoading(true)
    setError(null)
    router.post('/medical/laboratory/results/batch', data, {
      forceFormData: true,
      onSuccess: () => {
        setLoading(false)
        if (onSuccess) onSuccess()
      },
      onError: (err) => {
        setError(err)
        setLoading(false)
      },
    })
  }

  const update = (id: number, data: LabResultData, onSuccess?: () => void) => {
    setLoading(true)
    setError(null)
    router.put(`/medical/laboratory/results/${id}`, data, {
      onSuccess: () => {
        setLoading(false)
        if (onSuccess) onSuccess()
      },
      onError: (err) => {
        setError(err)
        setLoading(false)
      },
    })
  }

  const destroy = (id: number, onSuccess?: () => void) => {
    setLoading(true)
    setError(null)
    router.delete(`/medical/laboratory/results/${id}`, {
      onSuccess: () => {
        setLoading(false)
        if (onSuccess) onSuccess()
      },
      onError: (err) => {
        setError(err)
        setLoading(false)
      },
    })
  }

  return { loading, error, refresh, create, createBatch, update, destroy }
}
