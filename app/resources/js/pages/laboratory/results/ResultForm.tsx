import { Head, useForm } from '@inertiajs/react'
import { useMemo, useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { useNumberFormatter } from '@/hooks/useNumberFormatter'
import { useLabResults } from '../../../hooks/useLabResults'

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

interface TestRequest {
  id: number
  status: string
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
}

interface Equipment {
  id: number
  name: string
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
  initialTestRequestId?: number | null
  existingResults?: Record<string, ExistingResultEntry>
  onSuccess?: () => void
}

export default function ResultForm({
  result = null,
  testRequests = [],
  equipments = [],
  initialTestRequestId = null,
  existingResults = {},
  onSuccess,
}: ResultFormProps) {
  const { createBatch, update, loading, error } = useLabResults()
  const { parse: parseDecimal, format: formatDecimal, config: numberConfig } = useNumberFormatter()
  const isEditMode = Boolean(result?.id)
  const isPreselectedRequest = Boolean(initialTestRequestId)
  const [excludedParams, setExcludedParams] = useState<Set<number>>(new Set())

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

    if (resultRows.length === 0) {
      return
    }

    createBatch({
      lab_test_request_id: Number(data.lab_test_request_id),
      equipment_id: Number(data.equipment_id) || undefined,
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
                      required={Boolean(parameter.is_required) && !isExcluded}
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

        {batchValidationMessage && <div className="text-red-600 text-xs">{batchValidationMessage}</div>}

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={loading || processing || !selectedRequest}
            className="h-9 px-4 rounded-lg bg-emerald-600 dark:bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-700 dark:hover:bg-emerald-800 transition disabled:opacity-50"
          >
            {loading || processing ? 'Guardando...' : 'Guardar resultados'}
          </button>
        </div>
      </form>
    </>
  )
}
