import { Head, useForm } from '@inertiajs/react'
import { useMemo, useEffect } from 'react'
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

interface ResultFormProps {
  result?: Result | null
  testRequests?: TestRequest[]
  equipments?: Equipment[]
  initialTestRequestId?: number | null
  onSuccess?: () => void
}

export default function ResultForm({
  result = null,
  testRequests = [],
  equipments = [],
  initialTestRequestId = null,
  onSuccess,
}: ResultFormProps) {
  const { createBatch, update, loading, error } = useLabResults()
  const isEditMode = Boolean(result?.id)

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
        setData('lab_test_request_id', initialTestRequestId)
        setData('lab_sample_id', request.lab_sample_id || 0)
        setData('equipment_id', defaultEquipment?.lab_equipment_id || 0)
      }
    }
  }, [initialTestRequestId, isEditMode, testRequests, setData])

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

  const parameters = useMemo(() => selectedRequest?.test_profile?.parameters || [], [selectedRequest])

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
      if (rawValue == null || rawValue === '' || Number.isNaN(Number(rawValue))) {
        return total
      }

      return total + Number(rawValue)
    }, 0)
  }, [sum100Parameters, data.values_by_parameter])

  const handleChangeValue = (parameterId: number, value: string) => {
    setData('values_by_parameter', {
      ...data.values_by_parameter,
      [String(parameterId)]: value,
    })
  }

  const batchValidationMessage =
    typeof error === 'string'
      ? error
      : ((error as Record<string, string | undefined> | null)?.results ?? null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (isEditMode && result?.id) {
      update(result.id, {
        lab_sample_id: Number(data.lab_sample_id),
        lab_test_request_id: Number(data.lab_test_request_id),
        lab_test_parameter_id: Number(data.lab_test_parameter_id),
        equipment_id: Number(data.equipment_id) || undefined,
        value: data.value,
        status: data.status,
      }, onSuccess)
      return
    }

    const resultRows = visibleParameters
      .map((parameter) => ({
        lab_test_parameter_id: parameter.id,
        value: data.values_by_parameter[String(parameter.id)] || '',
      }))
      .filter((row) => row.value.trim().length > 0)

    if (resultRows.length === 0) {
      return
    }

    createBatch({
      lab_test_request_id: Number(data.lab_test_request_id),
      equipment_id: Number(data.equipment_id) || undefined,
      status: data.status,
      results: resultRows,
    }, onSuccess)
  }

  const renderReference = (parameter: Parameter) => {
    const reference = parameter.reference_ranges?.[0]
    if (!reference) {
      return 'Sin rango configurado'
    }

    if (reference.reference_text) {
      return reference.reference_text
    }

    if (reference.min_value != null || reference.max_value != null) {
      return `${reference.min_value ?? ''} - ${reference.max_value ?? ''}`.trim()
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
      <form onSubmit={handleSubmit} className="bg-white dark:bg-[#0f1a1e] rounded-2xl shadow p-6 max-w-4xl mx-auto space-y-4">
        <h2 className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mb-2">Carga dinámica de resultados</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Solicitud de estudio</label>
            <select
              className="mt-1 block w-full rounded-xl border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
              value={data.lab_test_request_id}
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Equipo</label>
            <select
              className="mt-1 block w-full rounded-xl border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
              value={data.equipment_id}
              onChange={(e) => setData('equipment_id', Number(e.target.value) || 0)}
            >
              <option value={0}>Sin equipo</option>
              {availableEquipments.map((equipment) => (
                <option key={equipment.id} value={equipment.id}>{equipment.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Estado</label>
            <select
              className="mt-1 block w-full rounded-xl border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
              value={data.status}
              onChange={(e) => setData('status', e.target.value)}
            >
              <option value="draft">Borrador</option>
              <option value="validated">Validado</option>
            </select>
          </div>
        </div>

        {selectedRequest && (
          <div className="rounded-xl border border-gray-200 p-4 bg-gray-50 space-y-1">
            <p className="text-sm text-gray-700">
              Paciente: <span className="font-medium">{selectedRequest.sample?.patient ? `${selectedRequest.sample.patient.first_name || ''} ${selectedRequest.sample.patient.last_name || ''}`.trim() : 'N/A'}</span>
            </p>
            <p className="text-sm text-gray-700">
              Estudio: <span className="font-medium">{selectedRequest.test_profile?.name || 'N/A'}</span>
            </p>
            {selectedRequest.test_profile?.validation_type === 'sum_100' && (
              <p className="text-sm text-amber-700">
                Regla de validación activa: suma porcentual = {selectedRequest.test_profile.validation_target ?? 100}%
                {' '}(±{selectedRequest.test_profile.validation_tolerance ?? 0}).
              </p>
            )}
          </div>
        )}

        {visibleParameters.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Parámetros del estudio</h3>
            {selectedRequest?.test_profile?.validation_type === 'sum_100' && (
              <div className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Suma actual de parámetros porcentuales: {runningSum100Total.toFixed(2)}%
              </div>
            )}
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {visibleParameters.map((parameter) => (
                <div key={parameter.id} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end border rounded-lg p-3">
                  <div className="md:col-span-1">
                    <p className="text-sm font-medium text-gray-900">{parameter.name}</p>
                    <p className="text-xs text-gray-500">Tipo: {parameter.parameter_type}</p>
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-xs text-gray-600 mb-1">Valor</label>
                    <input
                      type={parameter.parameter_type === 'numeric' ? 'number' : 'text'}
                      step={parameter.parameter_type === 'numeric' ? '0.01' : undefined}
                      value={data.values_by_parameter[String(parameter.id)] || ''}
                      onChange={(e) => handleChangeValue(parameter.id, e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-2 py-1.5"
                      required={Boolean(parameter.is_required)}
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-xs text-gray-600 mb-1">Unidad</label>
                    <div className="text-sm text-gray-800 px-2 py-1.5 rounded-md border bg-white min-h-[34px]">
                      {parameter.unit || '-'}
                    </div>
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-xs text-gray-600 mb-1">Referencia</label>
                    <div className="text-sm text-gray-800 px-2 py-1.5 rounded-md border bg-white min-h-[34px]">
                      {renderReference(parameter)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {visibleParameters.length === 0 && selectedRequest && (
          <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
            No hay parámetros configurados para este estudio/equipo.
          </div>
        )}

        {batchValidationMessage && <div className="text-red-600 text-xs">{batchValidationMessage}</div>}

        <button
          type="submit"
          disabled={loading || processing || !selectedRequest}
          className="w-full py-2 px-4 rounded-xl bg-emerald-600 dark:bg-emerald-700 text-white font-semibold hover:bg-emerald-700 dark:hover:bg-emerald-800 transition disabled:opacity-50"
        >
          {loading || processing ? 'Guardando...' : 'Guardar resultados'}
        </button>
      </form>
    </>
  )
}
