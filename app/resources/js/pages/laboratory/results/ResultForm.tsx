import { Head, router, useForm } from '@inertiajs/react'
import { useMemo, useEffect, useState } from 'react'
import { ChevronDown, Trash2, X } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { DateInputWithCalendar } from '@/components/ui/date-input-with-calendar'
import { FileUploadField } from '@/components/ui/file-upload-field'
import { useDateFormat } from '@/hooks/useDateFormat'
import { useNumberFormatter } from '@/hooks/useNumberFormatter'
import { cn } from '@/lib/utils'
import { useLabResults } from '../../../hooks/useLabResults'
import { toast } from 'sonner'

interface ReferenceRange {
  id: number
  gender?: string | null
  age_min?: number | null
  age_max?: number | null
  min_value?: string | number | null
  max_value?: string | number | null
  reference_text?: string | null
}

interface EquipmentParameterRange {
  id: number
  lab_equipment_id: number
}

interface Parameter {
  id: number
  name: string
  unit?: string | null
  parameter_type: 'numeric' | 'text' | 'option' | 'calculated'
  is_required?: boolean
  include_in_sum_100?: boolean
  reference_ranges?: ReferenceRange[]
  equipment_parameter_ranges?: EquipmentParameterRange[]
}

interface ProfileEquipment {
  id: number
  lab_equipment_id: number
  is_default?: boolean
  equipment?: {
    id: number
    name: string
  }
}

interface ExternalReportAttachment {
  id: number
  display_name?: string | null
  original_name?: string | null
  file_path?: string | null
  mime_type?: string | null
  file_size?: number | null
  created_at?: string | null
}

interface TestRequest {
  id: number
  status: string
  processing_mode?: 'internal' | 'referred'
  include_external_attachments_in_medical_history?: boolean
  external_laboratory_id?: number | null
  external_reference_number?: string | null
  expected_result_at?: string | null
  processing_notes?: string | null
  not_performed_reason?: string | null
  external_report_path?: string | null
  attachments?: ExternalReportAttachment[]
  lab_sample_id: number
  sample?: {
    sample_number?: string
    patient?: {
      first_name?: string
      last_name?: string
      gender?: string | null
      birth_date?: string | null
    }
  }
  test_profile?: {
    id: number
    name: string
    validation_type?: 'none' | 'sum_100'
    validation_target?: number
    validation_tolerance?: number
    parameters?: Parameter[]
    profile_equipments?: ProfileEquipment[]
  }
  external_laboratory?: {
    id: number
    name: string
    contact_name?: string | null
    phone?: string | null
    whatsapp?: string | null
    email?: string | null
  } | null
}

interface Equipment {
  id: number
  name: string
}

interface ExternalLaboratory {
  id: number
  name: string
  contact_name?: string | null
  phone?: string | null
  whatsapp?: string | null
  email?: string | null
}

interface Result {
  id?: number
  lab_sample_id?: number
  lab_test_request_id?: number
  lab_test_parameter_id?: number
  equipment_id?: number
  value?: string
  status?: string
}

interface ExistingResultEntry {
  value: string
  equipment_id?: number | null
}

interface ResultFormProps {
  result?: Result | null
  testRequests?: TestRequest[]
  equipments?: Equipment[]
  externalLaboratories?: ExternalLaboratory[]
  initialTestRequestId?: number | null
  existingResults?: Record<string, ExistingResultEntry>
  onSuccess?: () => void
}

type PendingAttachmentRemoval =
  | { type: 'new'; index: number; label: string }
  | { type: 'existing'; attachmentId: number; label: string }
  | null

const PROCESSING_MODE_OPTIONS: Array<{ value: 'internal' | 'referred'; label: string }> = [
  { value: 'internal', label: 'Interno' },
  { value: 'referred', label: 'Derivado' },
]

const DERIVED_STATUS_OPTIONS: Array<{
  value: 'referred_sent' | 'external_result_received' | 'not_performed'
  label: string
  fullLabel: string
}> = [
  { value: 'referred_sent', label: 'Enviado', fullLabel: 'Enviado a externo' },
  { value: 'external_result_received', label: 'Recibido', fullLabel: 'Resultado externo recibido' },
  { value: 'not_performed', label: 'No realizado', fullLabel: 'No realizado' },
]

const getTempFileKey = (file: File) => `${file.name}-${file.size}-${file.lastModified}`

export default function ResultForm({
  result = null,
  testRequests = [],
  equipments = [],
  externalLaboratories = [],
  initialTestRequestId = null,
  existingResults = {},
  onSuccess,
}: ResultFormProps) {
  const { toBackend, toFrontend } = useDateFormat()
  const { createBatch, update, loading, error } = useLabResults()
  const { parse: parseDecimal, format: formatDecimal, config: numberConfig } = useNumberFormatter()
  const isEditMode = Boolean(result?.id)
  const isPreselectedRequest = Boolean(initialTestRequestId)
  const [excludedParams, setExcludedParams] = useState<Set<number>>(new Set())
  const [externalReportFileNames, setExternalReportFileNames] = useState<string[]>([])
  const [externalReportTitles, setExternalReportTitles] = useState<string[]>([])
  const [pendingAttachmentRemoval, setPendingAttachmentRemoval] = useState<PendingAttachmentRemoval>(null)
  const [showDerivedHelp, setShowDerivedHelp] = useState(false)

  const formatNumberDisplay = (value: number | string): string => {
    return formatDecimal(value)
  }

  const sanitizeNumericInput = (rawValue: string): string => {
    let value = rawValue.replace(/\./g, numberConfig.thousandsSeparator)
    value = value.replace(/[^0-9,\.\-]/g, '')

    // Keep only one decimal separator (comma) and remove dot if user pasted decimal dot.
    value = value.replace(/\./g, ',')
    const firstComma = value.indexOf(',')
    if (firstComma !== -1) {
      value = value.slice(0, firstComma + 1) + value.slice(firstComma + 1).replace(/,/g, '')
    }

    return value
  }

  const normalizeNumericInput = (rawValue: string): string => {
    const trimmed = rawValue.trim()
    if (!trimmed) return ''
    const parsed = parseDecimal(trimmed)
    if (Number.isNaN(parsed)) return rawValue
    return formatNumberDisplay(parsed)
  }

  const normalizeNumericForSubmit = (rawValue: string): string => {
    const trimmed = rawValue.trim()
    if (!trimmed) return ''
    const parsed = parseDecimal(trimmed)
    if (Number.isNaN(parsed)) return ''
    return String(parsed)
  }

  const toggleExclude = (parameterId: number) => {
    setExcludedParams((prev) => {
      const next = new Set(prev)
      if (next.has(parameterId)) next.delete(parameterId)
      else next.add(parameterId)
      return next
    })
  }

  const { data, setData, processing, errors } = useForm({
    lab_sample_id: result?.lab_sample_id || 0,
    lab_test_request_id: result?.lab_test_request_id || 0,
    lab_test_parameter_id: result?.lab_test_parameter_id || 0,
    equipment_id: result?.equipment_id || 0,
    value: result?.value || '',
    status: result?.status || 'draft',
    processing_mode: 'internal' as 'internal' | 'referred',
    referred_status: 'referred_sent' as 'referred_sent' | 'external_result_received' | 'not_performed',
    external_laboratory_id: 0,
    external_reference_number: '',
    expected_result_at: '',
    processing_notes: '',
    not_performed_reason: '',
    include_external_attachments_in_medical_history: false,
    external_reports: [] as File[],
    external_report_titles: [] as string[],
    values_by_parameter: {} as Record<string, string>,
  })

  useEffect(() => {
    if (initialTestRequestId && !isEditMode) {
      const request = testRequests.find((item) => item.id === initialTestRequestId)
      if (request) {
        const defaultEquipment = request.test_profile?.profile_equipments?.find((item) => item.is_default)
        const preloadedValues: Record<string, string> = {}
        let resolvedEquipmentId = defaultEquipment?.lab_equipment_id || 0

        if (existingResults && Object.keys(existingResults).length > 0) {
          for (const [paramId, entry] of Object.entries(existingResults)) {
            preloadedValues[paramId] = entry.value
            if (entry.equipment_id && !resolvedEquipmentId) {
              resolvedEquipmentId = entry.equipment_id
            }
          }
        }

        setData('lab_test_request_id', initialTestRequestId)
        setData('lab_sample_id', request.lab_sample_id || 0)
        setData('equipment_id', resolvedEquipmentId)
        setData('processing_mode', request.processing_mode || 'internal')
        setData('external_laboratory_id', request.external_laboratory_id || 0)
        setData('external_reference_number', request.external_reference_number || '')
        setData('expected_result_at', request.expected_result_at ? toFrontend(String(request.expected_result_at).split('T')[0]) : '')
        setData('processing_notes', request.processing_notes || '')
        setData('not_performed_reason', request.not_performed_reason || '')
        setData(
          'include_external_attachments_in_medical_history',
          Boolean(request.include_external_attachments_in_medical_history),
        )
        setData('external_reports', [])
        setData('external_report_titles', [])
        setExternalReportFileNames([])
        setExternalReportTitles([])
        setData(
          'referred_status',
          request.status === 'not_performed'
            ? 'not_performed'
            : request.status === 'external_result_received'
              ? 'external_result_received'
              : 'referred_sent',
        )
        setData('values_by_parameter', preloadedValues)
      }
    }
  }, [initialTestRequestId, isEditMode, testRequests, existingResults, setData])

  const selectedRequest = useMemo(
    () => testRequests.find((request) => request.id === Number(data.lab_test_request_id)),
    [testRequests, data.lab_test_request_id],
  )

  const availableEquipments = useMemo(() => {
    if (!selectedRequest?.test_profile?.profile_equipments?.length) {
      return equipments
    }

    const ids = selectedRequest.test_profile.profile_equipments.map((item) => item.lab_equipment_id)
    return equipments.filter((item) => ids.includes(item.id))
  }, [selectedRequest, equipments])

  const hasProfileLinkedEquipments = Boolean(
    selectedRequest?.test_profile?.profile_equipments?.length,
  )

  const parameters = useMemo(() => selectedRequest?.test_profile?.parameters || [], [selectedRequest])
  const selectedExternalLaboratory = useMemo(
    () => externalLaboratories.find((lab) => lab.id === Number(data.external_laboratory_id)),
    [externalLaboratories, data.external_laboratory_id],
  )
  const existingExternalAttachments = selectedRequest?.attachments ?? []
  const appendExternalReports = (files: File[]) => {
    if (!files.length) return

    const nextFiles = [...files, ...data.external_reports]
    const titleMap = new Map(
      data.external_reports.map((file, index) => [getTempFileKey(file), externalReportTitles[index] ?? '']),
    )
    const nextTitles = nextFiles.map((file) => titleMap.get(getTempFileKey(file)) ?? '')

    setData('external_reports', nextFiles)
    setData('external_report_titles', nextTitles)
    setExternalReportFileNames(nextFiles.map((file) => file.name))
    setExternalReportTitles(nextTitles)
  }
  const formatAttachmentDateTime = (value?: string | null) => {
    if (!value) return 'Fecha no disponible'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'Fecha no disponible'
    return date.toLocaleString('es-PY', {
      dateStyle: 'short',
      timeStyle: 'short',
    })
  }
  const formatAttachmentSize = (size?: number | null) => {
    if (!size || size <= 0) return null
    if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`
    return `${Math.max(1, Math.round(size / 1024))} KB`
  }
  const getAttachmentDisplayTitle = (attachment: ExternalReportAttachment) => {
    if (attachment.display_name?.trim()) {
      return attachment.display_name.trim()
    }

    const labName = selectedExternalLaboratory?.name || 'Laboratorio derivado'
    const profileName = selectedRequest?.test_profile?.name || 'estudio'

    return `Resultado externo - ${labName} - ${profileName}`
  }
  const confirmRemoveAttachment = () => {
    if (!pendingAttachmentRemoval) return

    if (pendingAttachmentRemoval.type === 'new') {
      const removeIndex = pendingAttachmentRemoval.index
      const nextFiles = data.external_reports.filter((_, index) => index !== removeIndex)
      const nextFileNames = externalReportFileNames.filter((_, index) => index !== removeIndex)
      const nextTitles = externalReportTitles.filter((_, index) => index !== removeIndex)
      setData('external_reports', nextFiles)
      setData('external_report_titles', nextTitles)
      setExternalReportFileNames(nextFileNames)
      setExternalReportTitles(nextTitles)
      setPendingAttachmentRemoval(null)
      return
    }

    if (!selectedRequest?.id) return

    router.delete(
      `/medical/laboratory/test-requests/${selectedRequest.id}/attachments/${pendingAttachmentRemoval.attachmentId}`,
      {
        preserveScroll: true,
        onSuccess: () => {
          toast.success('Adjunto eliminado correctamente')
          setPendingAttachmentRemoval(null)
        },
      },
    )
  }

  const patientContext = useMemo(() => {
    const patient = selectedRequest?.sample?.patient
    if (!patient) {
      return { gender: 'all' as const, age: null as number | null }
    }

    const genderMap: Record<string, 'male' | 'female' | 'all'> = {
      M: 'male',
      F: 'female',
      male: 'male',
      female: 'female',
    }

    const resolvedGender = genderMap[String(patient.gender ?? '').trim()] || 'all'
    let age: number | null = null

    if (patient.birth_date) {
      const birthDate = new Date(patient.birth_date)
      if (!Number.isNaN(birthDate.getTime())) {
        const now = new Date()
        age = now.getFullYear() - birthDate.getFullYear()
        const monthDiff = now.getMonth() - birthDate.getMonth()
        if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
          age -= 1
        }
      }
    }

    return { gender: resolvedGender, age }
  }, [selectedRequest])

  const visibleParameters = useMemo(() => {
    const selectedEquipmentId = Number(data.equipment_id) || null

    if (!selectedEquipmentId) {
      return parameters
    }

    return parameters.filter((parameter) => {
      const mapping = parameter.equipment_parameter_ranges || []
      if (!mapping.length) {
        return true
      }
      return mapping.some((item) => item.lab_equipment_id === selectedEquipmentId)
    })
  }, [parameters, data.equipment_id])

  const sum100Parameters = useMemo(
    () => visibleParameters.filter((parameter) => parameter.include_in_sum_100),
    [visibleParameters],
  )

  const runningSum100Total = useMemo(() => {
    return sum100Parameters.reduce((total, parameter) => {
      const rawValue = data.values_by_parameter[String(parameter.id)]
      if (rawValue == null || rawValue === '') {
        return total
      }

      const parsed = parseDecimal(String(rawValue))
      if (Number.isNaN(parsed)) {
        return total
      }

      return total + parsed
    }, 0)
  }, [sum100Parameters, data.values_by_parameter, parseDecimal])

  const handleChangeValue = (parameter: Parameter, value: string) => {
    const normalizedValue = parameter.parameter_type === 'numeric'
      ? sanitizeNumericInput(value)
      : value

    setData('values_by_parameter', {
      ...data.values_by_parameter,
      [String(parameter.id)]: normalizedValue,
    })
  }

  const handleBlurValue = (parameter: Parameter) => {
    if (parameter.parameter_type !== 'numeric') return
    const currentValue = data.values_by_parameter[String(parameter.id)] || ''
    const normalized = normalizeNumericInput(currentValue)

    setData('values_by_parameter', {
      ...data.values_by_parameter,
      [String(parameter.id)]: normalized,
    })
  }

  const batchValidationMessage =
    typeof error === 'string'
      ? error
      : ((error as Record<string, string | undefined> | null)?.results ?? null)

  const resolveReference = (parameter: Parameter): ReferenceRange | null => {
    const ranges = parameter.reference_ranges || []
    if (!ranges.length) {
      return null
    }

    const compatibleRanges = ranges
      .filter((range) => !range.gender || range.gender === 'all' || range.gender === patientContext.gender)
      .filter((range) => {
        if (patientContext.age == null) {
          return true
        }

        const ageMin = range.age_min
        const ageMax = range.age_max
        return (ageMin == null || patientContext.age >= ageMin) && (ageMax == null || patientContext.age <= ageMax)
      })

    const sortedRanges = [...(compatibleRanges.length ? compatibleRanges : ranges)].sort((a, b) => {
      const aPriority = a.gender === patientContext.gender ? 1 : 0
      const bPriority = b.gender === patientContext.gender ? 1 : 0
      return bPriority - aPriority
    })

    return sortedRanges[0] || null
  }

  const isOutOfRange = (parameter: Parameter, rawValue: string): boolean => {
    if (parameter.parameter_type !== 'numeric' && parameter.parameter_type !== 'calculated') {
      return false
    }

    const parsedValue = parseDecimal(rawValue)
    if (Number.isNaN(parsedValue)) {
      return false
    }

    const reference = resolveReference(parameter)
    if (!reference) {
      return false
    }

    const minValue = reference.min_value != null ? parseDecimal(String(reference.min_value)) : Number.NaN
    const maxValue = reference.max_value != null ? parseDecimal(String(reference.max_value)) : Number.NaN

    if (!Number.isNaN(minValue) && parsedValue < minValue) {
      return true
    }

    if (!Number.isNaN(maxValue) && parsedValue > maxValue) {
      return true
    }

    return false
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (isEditMode && result?.id) {
      update(result.id, {
        lab_sample_id: Number(data.lab_sample_id),
        lab_test_request_id: Number(data.lab_test_request_id),
        lab_test_parameter_id: Number(data.lab_test_parameter_id),
        equipment_id: Number(data.equipment_id) || undefined,
        value: data.value,
        status: 'draft',
      }, onSuccess)
      return
    }

    const resultRows = visibleParameters
      .filter((parameter) => !excludedParams.has(parameter.id))
      .map((parameter) => ({
        rawValue: data.values_by_parameter[String(parameter.id)] || '',
        lab_test_parameter_id: parameter.id,
        value: parameter.parameter_type === 'numeric'
          ? normalizeNumericForSubmit(data.values_by_parameter[String(parameter.id)] || '')
          : (data.values_by_parameter[String(parameter.id)] || ''),
        is_out_of_range: isOutOfRange(
          parameter,
          data.values_by_parameter[String(parameter.id)] || '',
        ),
      }))
      .filter((row) => row.value.trim().length > 0)

    createBatch({
      lab_test_request_id: Number(data.lab_test_request_id),
      equipment_id: Number(data.equipment_id) || undefined,
      processing_mode: data.processing_mode,
      referred_status: data.processing_mode === 'referred' ? data.referred_status : undefined,
      external_laboratory_id: data.processing_mode === 'referred'
        ? (Number(data.external_laboratory_id) || undefined)
        : undefined,
      external_reference_number: data.processing_mode === 'referred'
        ? (data.external_reference_number || undefined)
        : undefined,
      expected_result_at: data.processing_mode === 'referred'
        ? (data.expected_result_at ? toBackend(data.expected_result_at) : undefined)
        : undefined,
      processing_notes: data.processing_notes || undefined,
      include_external_attachments_in_medical_history:
        data.processing_mode === 'referred' ? data.include_external_attachments_in_medical_history : false,
      not_performed_reason: data.processing_mode === 'referred' && data.referred_status === 'not_performed'
        ? (data.not_performed_reason || undefined)
        : undefined,
      external_reports: data.processing_mode === 'referred' ? data.external_reports : [],
      external_report_titles: data.processing_mode === 'referred' ? data.external_report_titles : [],
      status: 'draft',
      results: resultRows,
    }, onSuccess)
  }

  const renderReference = (parameter: Parameter) => {
    const reference = resolveReference(parameter)
    if (!reference) {
      return 'Sin rango configurado'
    }

    if (reference.reference_text) {
      return reference.reference_text
    }

    if (reference.min_value != null || reference.max_value != null) {
      const minValue = reference.min_value != null ? formatNumberDisplay(String(reference.min_value)) : ''
      const maxValue = reference.max_value != null ? formatNumberDisplay(String(reference.max_value)) : ''
      return `${minValue} - ${maxValue}`.trim()
    }

    return 'Sin rango configurado'
  }

  if (isEditMode) {
    return (
      <>
        <Head title="Editar resultado de laboratorio" />
        <form onSubmit={handleSubmit} className="bg-white dark:bg-[#0f1a1e] rounded-2xl shadow p-6 max-w-md mx-auto space-y-4">
          <h2 className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mb-2">Editar resultado</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Valor</label>
            <input
              type="text"
              className="mt-1 block w-full rounded-xl border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-emerald-500 focus:border-emerald-500"
              value={data.value}
              onChange={(e) => setData('value', e.target.value)}
              required
            />
            {errors.value && <div className="text-red-500 text-xs mt-1">{errors.value}</div>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Estado</label>
            <select
              className="mt-1 block w-full rounded-xl border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-emerald-500 focus:border-emerald-500"
              value={data.status}
              onChange={(e) => setData('status', e.target.value)}
              required
            >
              <option value="draft">Borrador</option>
              <option value="validated">Validado</option>
            </select>
          </div>
          {batchValidationMessage && <div className="text-red-600 text-xs mt-2">{batchValidationMessage}</div>}
          <button
            type="submit"
            disabled={loading || processing}
            className="w-full py-2 px-4 rounded-xl bg-emerald-600 dark:bg-emerald-700 text-white font-semibold hover:bg-emerald-700 dark:hover:bg-emerald-800 transition"
          >
            {loading || processing ? 'Guardando...' : 'Actualizar'}
          </button>
        </form>
      </>
    )
  }

  return (
    <>
      <Head title="Carga dinámica de resultados" />
      <form onSubmit={handleSubmit} className="bg-white dark:bg-[#0f1a1e] rounded-2xl shadow p-4 md:p-5 max-w-4xl mx-auto space-y-3">
        <h2 className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mb-2">Carga dinámica de resultados</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-200">Solicitud de estudio</label>
            <select
              className="mt-1 block h-9 w-full rounded-lg border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm"
              value={data.lab_test_request_id}
              disabled={isPreselectedRequest}
              onChange={(e) => {
                const requestId = Number(e.target.value) || 0
                const request = testRequests.find((item) => item.id === requestId)
                const defaultEquipment = request?.test_profile?.profile_equipments?.find((item) => item.is_default)
                setData('lab_test_request_id', requestId)
                setData('lab_sample_id', request?.lab_sample_id || 0)
                setData('equipment_id', defaultEquipment?.lab_equipment_id || 0)
                setData('processing_mode', request?.processing_mode || 'internal')
                setData('external_laboratory_id', request?.external_laboratory_id || 0)
                setData('external_reference_number', request?.external_reference_number || '')
                setData('expected_result_at', request?.expected_result_at ? toFrontend(String(request.expected_result_at).split('T')[0]) : '')
                setData('processing_notes', request?.processing_notes || '')
                setData('not_performed_reason', request?.not_performed_reason || '')
                setData('external_reports', [])
                setData('external_report_titles', [])
                setExternalReportFileNames([])
                setExternalReportTitles([])
                setData(
                  'referred_status',
                  request?.status === 'not_performed'
                    ? 'not_performed'
                    : request?.status === 'external_result_received'
                      ? 'external_result_received'
                      : 'referred_sent',
                )
                setData('values_by_parameter', {})
              }}
              required
            >
              <option value={0}>Seleccionar solicitud</option>
              {testRequests.map((request) => (
                <option key={request.id} value={request.id}>
                  {request.sample?.sample_number || `Solicitud #${request.id}`} - {request.test_profile?.name || 'Perfil'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-200">Equipo</label>
            <select
              className="mt-1 block h-9 w-full rounded-lg border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm"
              value={data.equipment_id}
              onChange={(e) => setData('equipment_id', Number(e.target.value) || 0)}
            >
              <option value={0}>Sin equipo</option>
              {availableEquipments.map((equipment) => (
                <option key={equipment.id} value={equipment.id}>{equipment.name}</option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-gray-500">
              {hasProfileLinkedEquipments
                ? 'Solo aparecen los equipos vinculados al perfil del estudio.'
                : 'Este perfil no tiene equipos vinculados; se muestran todos los equipos activos.'}
            </p>
          </div>
        </div>

        {selectedRequest && (
          <div className="rounded-lg border border-gray-200 p-3 bg-white space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-200">Modo de procesamiento</label>
                <div className="mt-1 grid grid-cols-2 gap-2 rounded-lg border border-emerald-200 bg-emerald-50/40 p-1">
                  {PROCESSING_MODE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setData('processing_mode', option.value)}
                      className={cn(
                        'h-9 rounded-md px-3 text-sm font-medium transition-colors cursor-pointer',
                        data.processing_mode === option.value
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-transparent text-emerald-900 hover:bg-emerald-100',
                      )}
                      aria-pressed={data.processing_mode === option.value}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {data.processing_mode === 'referred' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-200">Estado del derivado</label>
                  <div className="mt-1 grid grid-cols-3 gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50/40 p-1">
                    {DERIVED_STATUS_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setData('referred_status', option.value)}
                        title={option.fullLabel}
                        className={cn(
                          'h-9 min-w-0 rounded-md px-2 text-sm font-medium leading-none transition-colors cursor-pointer whitespace-nowrap',
                          data.referred_status === option.value
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-transparent text-emerald-900 hover:bg-emerald-100',
                        )}
                        aria-pressed={data.referred_status === option.value}
                      >
                        <span className="block truncate">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {data.processing_mode === 'referred' && (
              <>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-200">Laboratorio externo</label>
                    <select
                      className="mt-1 block h-9 w-full rounded-lg border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm"
                      value={data.external_laboratory_id}
                      onChange={(e) => setData('external_laboratory_id', Number(e.target.value) || 0)}
                    >
                      <option value={0}>Seleccionar laboratorio externo</option>
                      {externalLaboratories.map((lab) => (
                        <option key={lab.id} value={lab.id}>{lab.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-200">Referencia externa</label>
                    <input
                      type="text"
                      className="mt-1 block h-9 w-full rounded-lg border-gray-300 dark:border-gray-700 bg-gray-50 px-3 text-sm dark:bg-gray-900"
                      value={data.external_reference_number}
                      onChange={(e) => setData('external_reference_number', e.target.value)}
                      placeholder="Nro. o código del externo"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-200">Fecha estimada de resultado</label>
                    <DateInputWithCalendar
                      value={data.expected_result_at}
                      onChange={(value) => setData('expected_result_at', value)}
                      placeholder="dd-mm-yyyy"
                      className="mt-1"
                    />
                  </div>

                  {selectedExternalLaboratory && (
                    <div className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900">
                      <p className="font-medium">{selectedExternalLaboratory.name}</p>
                      <p>{selectedExternalLaboratory.phone || selectedExternalLaboratory.whatsapp || 'Sin teléfono cargado'}</p>
                      <p>{selectedExternalLaboratory.email || 'Sin email cargado'}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-200">Documento del laboratorio derivado</label>
                  <div className="mt-1 space-y-2">
                    <FileUploadField
                      id="external_report"
                      accept=".pdf,image/png,image/jpeg,image/webp"
                      multiple
                      onChangeMultiple={appendExternalReports}
                      fileNames={externalReportFileNames}
                      hasExistingFile={Boolean(existingExternalAttachments.length || selectedRequest?.external_report_path)}
                      error={typeof errors.external_reports === 'string' ? errors.external_reports : undefined}
                      placeholder="Adjuntar resultados externos"
                      hint="PDF, PNG, JPG o WEBP hasta 10 MB c/u."
                      note="Puede agregar varios archivos en tandas y guardar una sola vez al finalizar."
                    />
                    {data.external_reports.length > 0 && (
                      <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-md border border-slate-200 bg-slate-50 p-2">
                        {data.external_reports.map((file, index) => (
                          <div key={`${file.name}-${file.size}-${index}`} className="rounded-md border border-slate-200 bg-white p-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                name={`external_report_title_${index}`}
                                autoComplete="off"
                                spellCheck={false}
                                value={externalReportTitles[index] ?? ''}
                                onChange={(e) => {
                                  const nextTitles = [...externalReportTitles]
                                  nextTitles[index] = e.target.value
                                  setExternalReportTitles(nextTitles)
                                  setData('external_report_titles', nextTitles)
                                }}
                                className="block h-8 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
                                placeholder="Ej: Resultado externo - BioLab - Hemograma"
                              />
                              <button
                                type="button"
                                onClick={() => setPendingAttachmentRemoval({
                                  type: 'new',
                                  index,
                                  label: externalReportTitles[index] || file.name,
                                })}
                                className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                                aria-label="Eliminar archivo seleccionado"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                            <div className="mt-1 truncate text-[11px] text-slate-500">
                              <span className="font-medium text-slate-600">{file.name}</span>
                              <span className="mx-1">·</span>
                              <span>{file.type || 'Archivo'}</span>
                              <span className="mx-1">·</span>
                              <span>{formatAttachmentSize(file.size) || 'Tamano no disponible'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {(existingExternalAttachments.length > 0 || selectedRequest?.external_report_path) && (
                      <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-md border border-slate-200 bg-slate-50 p-2">
                        {existingExternalAttachments.map((attachment) => (
                          <div key={attachment.id} className="rounded-md border border-slate-200 bg-white p-2 text-xs">
                            <div className="flex items-start gap-2">
                              <a
                                href={`/medical/laboratory/test-requests/${selectedRequest?.id}/attachments/${attachment.id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="min-w-0 flex-1 hover:text-sky-800"
                              >
                                <div className="truncate font-medium text-sky-700">
                                  {getAttachmentDisplayTitle(attachment)}
                                </div>
                                <div className="mt-1 truncate text-[11px] text-slate-500">
                                  {[attachment.original_name || 'Archivo adjunto', attachment.mime_type, formatAttachmentSize(attachment.file_size), formatAttachmentDateTime(attachment.created_at)]
                                    .filter(Boolean)
                                    .join(' · ')}
                                </div>
                              </a>
                              <button
                                type="button"
                                onClick={() => setPendingAttachmentRemoval({
                                  type: 'existing',
                                  attachmentId: attachment.id,
                                  label: getAttachmentDisplayTitle(attachment),
                                })}
                                className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                                aria-label="Eliminar adjunto"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                        {!existingExternalAttachments.length && selectedRequest?.external_report_path && selectedRequest?.id && (
                          <a
                            href={`/medical/laboratory/test-requests/${selectedRequest.id}/external-report`}
                            target="_blank"
                            rel="noreferrer"
                            className="block rounded-md border border-slate-200 bg-white p-2 text-xs font-medium text-sky-700 hover:border-sky-300 hover:text-sky-800"
                          >
                            {selectedRequest.external_report_path.split('/').pop() || 'Documento anterior'}
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50/40 px-3 py-3 text-sm text-emerald-950 md:col-span-2">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                    checked={data.include_external_attachments_in_medical_history}
                    onChange={(e) => setData('include_external_attachments_in_medical_history', e.target.checked)}
                  />
                  <span>
                    <span className="block font-medium">Incluir adjuntos externos en la historia clínica del paciente</span>
                    <span className="block text-xs text-emerald-800">
                      Al publicar el estudio, estos documentos también podrán descargarse desde la ficha clínica del paciente.
                    </span>
                  </span>
                </label>

                {data.referred_status === 'not_performed' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-200">Motivo de no realizado</label>
                    <textarea
                      className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-700 bg-gray-50 px-3 py-2 text-sm dark:bg-gray-900"
                      rows={3}
                      value={data.not_performed_reason}
                      onChange={(e) => setData('not_performed_reason', e.target.value)}
                      placeholder="Detalle del motivo"
                    />
                  </div>
                )}
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-200">Notas de procesamiento</label>
              <textarea
                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-700 bg-gray-50 px-3 py-2 text-sm dark:bg-gray-900"
                rows={3}
                value={data.processing_notes}
                onChange={(e) => setData('processing_notes', e.target.value)}
                placeholder="Observaciones internas o del derivado"
              />
            </div>
          </div>
        )}

        {selectedRequest && (
          <div className="rounded-lg border border-gray-200 p-3 bg-gray-50 space-y-0.5">
            <p className="text-sm text-gray-700">
              Paciente: <span className="font-medium">{selectedRequest.sample?.patient ? `${selectedRequest.sample.patient.first_name || ''} ${selectedRequest.sample.patient.last_name || ''}`.trim() : 'N/A'}</span>
            </p>
            <p className="text-sm text-gray-700">
              Sexo aplicado a referencia: <span className="font-medium">{patientContext.gender === 'male' ? 'Masculino' : patientContext.gender === 'female' ? 'Femenino' : 'General'}</span>
              {patientContext.age != null ? <> · Edad: <span className="font-medium">{patientContext.age} años</span></> : null}
            </p>
            <p className="text-sm text-gray-700">
              Estudio: <span className="font-medium">{selectedRequest.test_profile?.name || 'N/A'}</span>
            </p>
            <p className="text-xs text-gray-500">Estado de carga: Borrador</p>
            {selectedRequest.test_profile?.validation_type === 'sum_100' && (
              <p className="text-sm text-amber-700">
                Regla de validación activa: suma porcentual = {selectedRequest.test_profile.validation_target ?? 100}%
                {' '}(±{selectedRequest.test_profile.validation_tolerance ?? 0}).
              </p>
            )}
            {data.processing_mode === 'referred' && (
              <p className="text-sm text-sky-700">
                Estudio derivado: puede quedar enviado, recibido desde externo o marcado como no realizado.
              </p>
            )}
          </div>
        )}

        {visibleParameters.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700">Parámetros del estudio</h3>
            {selectedRequest?.test_profile?.validation_type === 'sum_100' && (
              <div className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Suma actual de parámetros porcentuales: {runningSum100Total.toFixed(2)}%
              </div>
            )}
            <div className="max-h-[390px] overflow-y-auto pr-1">
              <div className="hidden md:grid md:grid-cols-12 gap-2 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                <div className="md:col-span-3">Parámetro</div>
                <div className="md:col-span-3">Valor</div>
                <div className="md:col-span-2">Unidad</div>
                <div className="md:col-span-3">Referencia</div>
                <div className="md:col-span-1"></div>
              </div>
              <div className="space-y-1.5">
              {visibleParameters.map((parameter) => {
                const isExcluded = excludedParams.has(parameter.id)
                return (
                <div
                  key={parameter.id}
                  className={`grid grid-cols-1 md:grid-cols-12 gap-2 items-center border rounded-md px-2 py-1.5 transition-opacity ${
                    isExcluded ? 'opacity-40 bg-slate-50' : ''
                  }`}
                >
                  <div className="md:col-span-3 min-w-0">
                    <p className="text-sm font-medium text-gray-900 leading-tight truncate">{parameter.name}</p>
                    <p className="text-[11px] text-gray-500 leading-tight">{parameter.parameter_type}</p>
                    {(() => {
                      const currentValue = data.values_by_parameter[String(parameter.id)] || ''
                      return currentValue && isOutOfRange(parameter, currentValue) ? (
                        <p className="text-[11px] font-medium text-red-600 leading-tight">Fuera de rango</p>
                      ) : null
                    })()}
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-[11px] text-gray-600 mb-1 md:sr-only">Valor</label>
                    <input
                      type="text"
                      inputMode={parameter.parameter_type === 'numeric' ? 'decimal' : 'text'}
                      value={data.values_by_parameter[String(parameter.id)] || ''}
                      onChange={(e) => handleChangeValue(parameter, e.target.value)}
                      onBlur={() => handleBlurValue(parameter)}
                      disabled={isExcluded}
                      className="h-8 w-full rounded-md border border-gray-300 px-2 py-1 text-sm disabled:cursor-not-allowed"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[11px] text-gray-600 mb-1 md:sr-only">Unidad</label>
                    <div className="text-sm text-gray-800 px-2 py-1 rounded-md border bg-white min-h-[32px] leading-tight">
                      {parameter.unit || '-'}
                    </div>
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-[11px] text-gray-600 mb-1 md:sr-only">Referencia</label>
                    <div className="text-sm text-gray-800 px-2 py-1 rounded-md border bg-white min-h-[32px] leading-tight">
                      {renderReference(parameter)}
                    </div>
                  </div>
                  <div className="md:col-span-1 flex justify-center">
                    <button
                      type="button"
                      title={isExcluded ? 'Incluir parámetro' : 'Excluir del informe'}
                      onClick={() => toggleExclude(parameter.id)}
                      className={`h-6 w-6 rounded-full flex items-center justify-center transition-colors ${
                        isExcluded
                          ? 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                          : 'text-slate-400 hover:bg-red-100 hover:text-red-600'
                      }`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                )
              })}
              </div>
            </div>
          </div>
        )}

        {visibleParameters.length === 0 && selectedRequest && (
          <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
            No hay parámetros configurados para este estudio/equipo.
          </div>
        )}

        {data.processing_mode === 'referred' && (
          <div className="rounded-md border border-sky-200 bg-sky-50">
            <button
              type="button"
              onClick={() => setShowDerivedHelp((prev) => !prev)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
            >
              <div>
                <p className="text-sm font-semibold text-sky-900">Estudio derivado</p>
                <p className="text-xs text-sky-800">
                  Puede guardar solo el derivado o continuar con la carga manual de parámetros.
                </p>
              </div>
              <ChevronDown className={`h-4 w-4 text-sky-700 transition-transform ${showDerivedHelp ? 'rotate-180' : ''}`} />
            </button>

            {showDerivedHelp && (
              <div className="space-y-2 border-t border-sky-200 px-4 py-3 text-sm text-sky-900">
                <p>
                  Este estudio quedará registrado como <span className="font-semibold">derivado</span>, con trazabilidad del laboratorio externo y sus documentos adjuntos.
                </p>
                <p>
                  Si su laboratorio también necesita <span className="font-semibold">transcribir los valores</span>, puede completar los parámetros de este perfil en esta misma pantalla.
                </p>
                <p className="text-xs text-sky-800">
                  Si no desea transcribirlos ahora, puede guardar el derivado igualmente y continuar más adelante.
                </p>
              </div>
            )}
          </div>
        )}

        {batchValidationMessage && <div className="text-red-600 text-xs">{batchValidationMessage}</div>}

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={loading || processing || !selectedRequest}
            className="h-9 px-4 rounded-lg bg-emerald-600 dark:bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-700 dark:hover:bg-emerald-800 transition disabled:opacity-50 cursor-pointer"
          >
            {loading || processing ? 'Guardando...' : 'Guardar resultados'}
          </button>
        </div>
      </form>

      <AlertDialog open={Boolean(pendingAttachmentRemoval)} onOpenChange={(open) => !open && setPendingAttachmentRemoval(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar adjunto</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAttachmentRemoval
                ? `Se eliminará "${pendingAttachmentRemoval.label}". Esta acción no se puede deshacer.`
                : 'Confirmá la eliminación del adjunto.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoveAttachment}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
