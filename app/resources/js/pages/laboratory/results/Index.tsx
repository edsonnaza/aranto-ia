import { Head, Link, router } from '@inertiajs/react'
import { useMemo, useState } from 'react'
import AppLayout from '@/layouts/app-layout'
import Modal from '@/components/ui/Modal'
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DateInputWithCalendar } from '@/components/ui/date-input-with-calendar'
import { FileUploadField } from '@/components/ui/file-upload-field'
import { Input } from '@/components/ui/input'
import { useDateFormat } from '@/hooks/useDateFormat'
import { useNumberFormatter } from '@/hooks/useNumberFormatter'
import { cn } from '@/lib/utils'
import { Beaker, ChevronDown, ChevronRight, CheckCircle2, FileText, Download, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface Parameter {
  id: number
  name: string
  unit?: string | null
  parameter_type?: 'numeric' | 'text' | 'option' | 'calculated'
}

interface LabReportRef {
  id: number
  report_number?: string
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

interface Sample {
  id: number
  sample_number: string
  barcode?: string | null
  collected_at?: string | null
  sample_type?: {
    name?: string | null
  } | null
  patient?: {
    first_name?: string
    last_name?: string
  }
  report?: LabReportRef | null
}

interface ResultTestRequest {
  id: number
  status: string
  processing_mode?: 'internal' | 'referred'
  include_external_attachments_in_medical_history?: boolean
  external_reference_number?: string | null
  expected_result_at?: string | null
  processing_notes?: string | null
  not_performed_reason?: string | null
  external_report_path?: string | null
  attachments?: ExternalReportAttachment[]
  external_laboratory_id?: number | null
  external_laboratory?: {
    id: number
    name?: string | null
  } | null
  test_profile?: { id: number; name: string }
}

interface Result {
  id: number
  lab_test_request_id?: number
  lab_sample_id?: number
  value?: string
  status?: string
  sample?: Sample
  parameter?: Parameter
  test_request?: ResultTestRequest
}

interface ResultsIndexProps {
  results: { data: Result[] }
  filters: {
    search?: string | null
    status?: string | null
    date_from?: string | null
    date_to?: string | null
  }
  externalLaboratories: Array<{
    id: number
    name: string
    contact_name?: string | null
    phone?: string | null
    whatsapp?: string | null
    email?: string | null
  }>
  canValidate: boolean
  validationAuthorizationMessage?: string | null
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  validated: 'Validado',
}

const STATUS_VARIANTS: Record<string, 'secondary' | 'pending' | 'paid'> = {
  draft: 'secondary',
  validated: 'paid',
}

interface ResultGroup {
  testRequestId: number
  sampleId: number
  sampleNumber: string
  patientName: string
  profileName: string
  sampleTypeName: string
  barcode: string
  collectedAt: string | null
  status: string
  processingMode: 'internal' | 'referred'
  includeExternalAttachmentsInMedicalHistory: boolean
  testRequestStatus: string
  externalLaboratoryId: number | null
  externalLaboratoryName: string | null
  externalReferenceNumber: string
  expectedResultAt: string
  processingNotes: string
  notPerformedReason: string
  externalReportPath: string | null
  attachments: ExternalReportAttachment[]
  hasValues: boolean
  items: Result[]
  report?: LabReportRef | null
}

const getDerivedStatusLabel = (status: string, processingMode: 'internal' | 'referred') => {
  if (processingMode !== 'referred') return null
  if (status === 'external_result_received') return 'Derivado - recibido'
  if (status === 'not_performed') return 'Derivado - no realizado'
  return 'Derivado - enviado'
}

const PROCESSING_MODE_OPTIONS: Array<{ value: 'internal' | 'referred'; label: string }> = [
  { value: 'internal', label: 'Interno' },
  { value: 'referred', label: 'Derivado' },
]

const DERIVED_STATUS_OPTIONS: Array<{ value: string; label: string; fullLabel: string }> = [
  { value: 'referred_sent', label: 'Enviado', fullLabel: 'Enviado a externo' },
  { value: 'external_result_received', label: 'Recibido', fullLabel: 'Resultado externo recibido' },
  { value: 'not_performed', label: 'No realizado', fullLabel: 'No realizado' },
]

const getTempFileKey = (file: File) => `${file.name}-${file.size}-${file.lastModified}`

export default function ResultsIndex({
  results,
  filters,
  externalLaboratories,
  canValidate,
  validationAuthorizationMessage = null,
}: ResultsIndexProps) {
  const { toBackend, toFrontend } = useDateFormat()
  const { parse: parseDecimal, format: formatDecimal } = useNumberFormatter()
  const [openGroups, setOpenGroups] = useState<Set<number>>(new Set())
  const today = new Date().toISOString().slice(0, 10)
  const todayFrontend = toFrontend(today)
  const [search, setSearch] = useState(filters.search || '')
  const [status, setStatus] = useState(filters.status || 'validated')
  const [dateFrom, setDateFrom] = useState(filters.date_from ? toFrontend(filters.date_from) : todayFrontend)
  const [dateTo, setDateTo] = useState(filters.date_to ? toFrontend(filters.date_to) : todayFrontend)
  const [validatingIds, setValidatingIds] = useState<Set<number>>(new Set())
  const [publishingIds, setPublishingIds] = useState<Set<number>>(new Set())
  const [groupToValidate, setGroupToValidate] = useState<ResultGroup | null>(null)
  const [processingGroup, setProcessingGroup] = useState<ResultGroup | null>(null)
  const [processingMode, setProcessingMode] = useState<'internal' | 'referred'>('internal')
  const [processingStatus, setProcessingStatus] = useState('referred_sent')
  const [externalLaboratoryId, setExternalLaboratoryId] = useState<number>(0)
  const [externalReferenceNumber, setExternalReferenceNumber] = useState('')
  const [expectedResultAt, setExpectedResultAt] = useState('')
  const [processingNotes, setProcessingNotes] = useState('')
  const [notPerformedReason, setNotPerformedReason] = useState('')
  const [externalReports, setExternalReports] = useState<File[]>([])
  const [externalReportFileNames, setExternalReportFileNames] = useState<string[]>([])
  const [externalReportTitles, setExternalReportTitles] = useState<string[]>([])
  const [includeInMedicalHistory, setIncludeInMedicalHistory] = useState(false)
  const [processingSaving, setProcessingSaving] = useState(false)
  const [pendingAttachmentRemoval, setPendingAttachmentRemoval] = useState<
    | { type: 'new'; index: number; label: string }
    | { type: 'existing'; attachmentId: number; label: string }
    | null
  >(null)

  const formatNumberDisplay = (value: number | string): string => {
    return formatDecimal(value)
  }

  const formatResultValue = (item: Result): string => {
    const rawValue = item.value ?? ''
    if (!rawValue) return ''
    if (item.parameter?.parameter_type !== 'numeric') return rawValue

    const parsed = parseDecimal(rawValue)
    if (Number.isNaN(parsed)) return rawValue
    return formatNumberDisplay(parsed)
  }

  const formatCollectedAt = (value?: string | null): string => {
    if (!value) return '-'

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '-'

    return date.toLocaleString('es-ES', {
      dateStyle: 'short',
      timeStyle: 'short',
    })
  }

  const groups = useMemo<ResultGroup[]>(() => {
    const map = new Map<number, ResultGroup>()
    for (const result of results.data) {
      const trId = result.lab_test_request_id ?? 0
      if (!map.has(trId)) {
        const patient = result.sample?.patient
        map.set(trId, {
          testRequestId: trId,
          sampleId: result.lab_sample_id ?? result.sample?.id ?? 0,
          sampleNumber: result.sample?.sample_number ?? `#${trId}`,
          patientName: patient ? `${patient.first_name ?? ''} ${patient.last_name ?? ''}`.trim() : 'Paciente N/A',
          profileName: result.test_request?.test_profile?.name ?? 'Estudio N/A',
          sampleTypeName: result.sample?.sample_type?.name ?? 'N/A',
          barcode: result.sample?.barcode ?? '-',
          collectedAt: result.sample?.collected_at ?? null,
          status: result.status ?? 'draft',
          processingMode: result.test_request?.processing_mode === 'referred' ? 'referred' : 'internal',
          includeExternalAttachmentsInMedicalHistory: Boolean(result.test_request?.include_external_attachments_in_medical_history),
          testRequestStatus: result.test_request?.status ?? 'pending',
          externalLaboratoryId: result.test_request?.external_laboratory_id ?? null,
          externalLaboratoryName: result.test_request?.external_laboratory?.name ?? null,
          externalReferenceNumber: result.test_request?.external_reference_number ?? '',
          expectedResultAt: result.test_request?.expected_result_at ? String(result.test_request?.expected_result_at).split('T')[0] : '',
          processingNotes: result.test_request?.processing_notes ?? '',
          notPerformedReason: result.test_request?.not_performed_reason ?? '',
          externalReportPath: result.test_request?.external_report_path ?? null,
          attachments: result.test_request?.attachments ?? [],
          hasValues: false,
          items: [],
          report: result.sample?.report ?? null,
        })
      }
      const group = map.get(trId)!
      group.items.push(result)
      if (result.value?.trim()) group.hasValues = true
    }
    return Array.from(map.values())
  }, [results.data])

  const filtered = useMemo(() => {
    if (!search.trim()) return groups
    const q = search.toLowerCase()
    return groups.filter(
      (g) =>
        g.sampleNumber.toLowerCase().includes(q) ||
        g.patientName.toLowerCase().includes(q) ||
        g.profileName.toLowerCase().includes(q),
    )
  }, [groups, search])

  const toggleGroup = (id: number) => {
    setOpenGroups((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleConfirmValidate = () => {
    if (!groupToValidate) return

    const group = groupToValidate
    setGroupToValidate(null)
    setValidatingIds((prev) => new Set(prev).add(group.testRequestId))
    router.post(
      '/medical/laboratory/validations',
      { lab_sample_id: group.sampleId, lab_test_request_id: group.testRequestId },
      {
        onSuccess: () => toast.success(`Resultados de ${group.sampleNumber} validados`),
        onError: () => toast.error('No se pudo validar. Verificá el estado del estudio.'),
        onFinish: () =>
          setValidatingIds((prev) => {
            const next = new Set(prev)
            next.delete(group.testRequestId)
            return next
          }),
      },
    )
  }

  const handlePublish = (group: ResultGroup) => {
    setPublishingIds((prev) => new Set(prev).add(group.sampleId))
    router.post(
      `/medical/laboratory/samples/${group.sampleId}/report`,
      {},
      {
        onSuccess: () => toast.success(`Estudio ${group.sampleNumber} publicado`),
        onError: () => toast.error('No se pudo publicar el estudio.'),
        onFinish: () =>
          setPublishingIds((prev) => {
            const next = new Set(prev)
            next.delete(group.sampleId)
            return next
          }),
      },
    )
  }

  const openProcessingModal = (group: ResultGroup) => {
    setProcessingGroup(group)
    setProcessingMode(group.processingMode)
    setProcessingStatus(
      group.processingMode === 'referred'
        ? (['external_result_received', 'not_performed'].includes(group.testRequestStatus)
          ? group.testRequestStatus
          : 'referred_sent')
        : 'pending',
    )
    setExternalLaboratoryId(group.externalLaboratoryId || 0)
    setExternalReferenceNumber(group.externalReferenceNumber || '')
    setExpectedResultAt(group.expectedResultAt ? toFrontend(group.expectedResultAt) : '')
    setProcessingNotes(group.processingNotes || '')
    setNotPerformedReason(group.notPerformedReason || '')
    setIncludeInMedicalHistory(group.includeExternalAttachmentsInMedicalHistory)
    setExternalReports([])
    setExternalReportFileNames([])
    setExternalReportTitles([])
  }

  const handleSaveProcessing = () => {
    if (!processingGroup) return

    setProcessingSaving(true)
    router.post(
      `/medical/laboratory/test-requests/${processingGroup.testRequestId}/processing`,
      {
        processing_mode: processingMode,
        status: processingMode === 'referred' ? processingStatus : 'in_process',
        external_laboratory_id: processingMode === 'referred' ? (externalLaboratoryId || undefined) : undefined,
        external_reference_number: processingMode === 'referred' ? (externalReferenceNumber || undefined) : undefined,
        expected_result_at: processingMode === 'referred'
          ? (expectedResultAt ? toBackend(expectedResultAt) : undefined)
          : undefined,
        processing_notes: processingNotes || undefined,
        include_external_attachments_in_medical_history: processingMode === 'referred' ? includeInMedicalHistory : false,
        not_performed_reason: processingMode === 'referred' && processingStatus === 'not_performed'
          ? (notPerformedReason || undefined)
          : undefined,
        external_reports: processingMode === 'referred' ? externalReports : [],
        external_report_titles: processingMode === 'referred' ? externalReportTitles : [],
      },
      {
        forceFormData: true,
        preserveScroll: true,
        onSuccess: () => {
          toast.success('Estado de derivación actualizado')
          setProcessingGroup(null)
        },
        onError: () => toast.error('No se pudo actualizar el estado de derivación.'),
        onFinish: () => setProcessingSaving(false),
      },
    )
  }

  const breadcrumbs = [
    { href: '/medical', title: 'Sistema Médico' },
    { href: '/medical/laboratory', title: 'Laboratorio' },
    { href: '/medical/laboratory/results', title: 'Resultados', current: true },
  ]

  const applyFilters = () => {
    router.get(
      '/medical/laboratory/results',
      {
        search: search || undefined,
        status,
        date_from: dateFrom ? toBackend(dateFrom) : undefined,
        date_to: dateTo ? toBackend(dateTo) : undefined,
      },
      {
        preserveState: true,
        replace: true,
      },
    )
  }

  const clearFilters = () => {
    setSearch('')
    setStatus('validated')
    setDateFrom(todayFrontend)
    setDateTo(todayFrontend)
    router.get(
      '/medical/laboratory/results',
      {
        status: 'validated',
        date_from: today,
        date_to: today,
      },
      {
        preserveState: true,
        replace: true,
      },
    )
  }

  const currentAttachments = processingGroup?.attachments ?? []
  const appendExternalReports = (files: File[]) => {
    if (!files.length) return

    const nextFiles = [...files, ...externalReports]
    const titleMap = new Map(
      externalReports.map((file, index) => [getTempFileKey(file), externalReportTitles[index] ?? '']),
    )
    const nextTitles = nextFiles.map((file) => titleMap.get(getTempFileKey(file)) ?? '')

    setExternalReports(nextFiles)
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

    const labName = processingGroup?.externalLaboratoryName || 'Laboratorio derivado'
    const profileName = processingGroup?.profileName || 'estudio'

    return `Resultado externo - ${labName} - ${profileName}`
  }
  const confirmRemoveAttachment = () => {
    if (!pendingAttachmentRemoval) return

    if (pendingAttachmentRemoval.type === 'new') {
      const removeIndex = pendingAttachmentRemoval.index
      setExternalReports((prev) => prev.filter((_, index) => index !== removeIndex))
      setExternalReportFileNames((prev) => prev.filter((_, index) => index !== removeIndex))
      setExternalReportTitles((prev) => prev.filter((_, index) => index !== removeIndex))
      setPendingAttachmentRemoval(null)
      return
    }

    if (!processingGroup?.testRequestId) return

    router.delete(`/medical/laboratory/test-requests/${processingGroup.testRequestId}/attachments/${pendingAttachmentRemoval.attachmentId}`, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success('Adjunto eliminado correctamente')
        setPendingAttachmentRemoval(null)
      },
    })
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Resultados de Laboratorio" />

      <div className="p-4 md:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Resultados de Laboratorio</h1>
            <p className="text-sm text-gray-500 mt-0.5">Agrupados por solicitud de estudio</p>
          </div>
          <Link href="/medical/laboratory/samples">
            <Button variant="outline" size="sm">
              <Beaker className="h-4 w-4 mr-2" />
              Ver muestras
            </Button>
          </Link>
        </div>

        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-6">
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-700">Buscar</label>
              <Input
                placeholder="Buscar por muestra, paciente o perfil..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Estado</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-9 w-full rounded-md border border-emerald-300 bg-white px-3 text-sm outline-none focus-visible:border-emerald-500 focus-visible:ring-[3px] focus-visible:ring-emerald-500/30"
              >
                <option value="all">Todos</option>
                <option value="draft">Borrador</option>
                <option value="validated">Validado</option>
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:col-span-2 xl:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Desde</label>
                <DateInputWithCalendar
                  value={dateFrom}
                  onChange={setDateFrom}
                  placeholder="dd-mm-yyyy"
                  className="min-w-[180px]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Hasta</label>
                <DateInputWithCalendar
                  value={dateTo}
                  onChange={setDateTo}
                  placeholder="dd-mm-yyyy"
                  className="min-w-[180px]"
                />
              </div>
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            <Button onClick={applyFilters}>Aplicar filtros</Button>
            <Button variant="outline" onClick={clearFilters}>Limpiar</Button>
          </div>
        </div>

        {!canValidate && validationAuthorizationMessage && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {validationAuthorizationMessage}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
            <Beaker className="mx-auto h-8 w-8 text-gray-400 mb-3" />
            <p className="text-sm text-gray-500">
              {search ? 'Sin resultados para esa búsqueda.' : 'No hay resultados cargados aún.'}
            </p>
          </div>
        )}

        <div className="space-y-2">
          {filtered.map((group) => {
            const isOpen = openGroups.has(group.testRequestId)
            const isValidating = validatingIds.has(group.testRequestId)
            const variant = STATUS_VARIANTS[group.status] ?? 'secondary'
            const isClosed = group.status === 'validated'
            const showValidateBtn = canValidate && group.hasValues && !isClosed
            const derivedStatusLabel = getDerivedStatusLabel(group.testRequestStatus, group.processingMode)

            return (
              <div key={group.testRequestId} className="rounded-lg border bg-white shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 hover:bg-slate-50 transition-colors">
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.testRequestId)}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left"
                  >
                    {isOpen
                      ? <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
                      : <ChevronRight className="h-4 w-4 shrink-0 text-slate-500" />
                    }
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-gray-900">{group.sampleNumber}</span>
                        <span className="text-sm text-gray-600 truncate">{group.profileName}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{group.patientName}</p>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-500">
                        <span><span className="font-medium text-gray-700">Tipo:</span> {group.sampleTypeName}</span>
                        <span><span className="font-medium text-gray-700">Barcode:</span> {group.barcode}</span>
                        <span><span className="font-medium text-gray-700">Recolección:</span> {formatCollectedAt(group.collectedAt)}</span>
                        {group.processingMode === 'referred' && (
                          <span className="inline-flex items-center gap-1">
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-700">
                              Derivado
                            </span>
                            {derivedStatusLabel && (
                              <span className="text-red-700 font-medium">{derivedStatusLabel}</span>
                            )}
                            {group.externalLaboratoryName && (
                              <span className="text-red-700">{group.externalLaboratoryName}</span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-gray-400 hidden sm:inline">{group.items.length} params</span>
                    <Badge variant={variant}>
                      {STATUS_LABELS[group.status] ?? group.status}
                    </Badge>
                    {!isClosed ? (
                      <Link
                        href={`/medical/laboratory/results/create?test_request_id=${group.testRequestId}`}
                        className="text-xs font-medium text-sky-600 hover:text-sky-800 hover:underline"
                      >
                        Continuar
                      </Link>
                    ) : (
                      <span className="text-xs font-medium text-slate-400 cursor-not-allowed">
                        Continuar
                      </span>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className={`h-7 px-2 text-xs ${
                        group.processingMode === 'referred'
                          ? 'border-red-300 text-red-700 hover:bg-red-50'
                          : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                      onClick={() => openProcessingModal(group)}
                    >
                      {group.processingMode === 'referred' ? 'Derivación' : 'Procesamiento'}
                    </Button>
                    {showValidateBtn && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                        disabled={isValidating}
                        onClick={() => setGroupToValidate(group)}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        {isValidating ? 'Validando…' : 'Validar'}
                      </Button>
                    )}
                    {isClosed && (
                      group.report ? (
                        <a
                          href={`/medical/laboratory/reports/${group.report.id}/download`}
                          className="inline-flex items-center h-7 px-2 text-xs font-medium text-sky-700 border border-sky-300 rounded-md hover:bg-sky-50"
                        >
                          <Download className="h-3.5 w-3.5 mr-1" />
                          Descargar PDF
                        </a>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs text-indigo-700 border-indigo-300 hover:bg-indigo-50"
                          disabled={publishingIds.has(group.sampleId)}
                          onClick={() => handlePublish(group)}
                        >
                          <FileText className="h-3.5 w-3.5 mr-1" />
                          {publishingIds.has(group.sampleId) ? 'Publicando…' : 'Publicar PDF'}
                        </Button>
                      )
                    )}
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t bg-slate-50 px-4 py-3">
                    <div className="hidden md:grid md:grid-cols-12 gap-2 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1">
                      <div className="md:col-span-5">Parámetro</div>
                      <div className="md:col-span-4">Valor</div>
                      <div className="md:col-span-2">Unidad</div>
                      <div className="md:col-span-1">Estado</div>
                    </div>
                    <div className="space-y-1">
                      {group.items.map((item) => (
                        <div
                          key={item.id}
                          className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center rounded-md border bg-white px-2 py-1.5 text-sm"
                        >
                          <div className="md:col-span-5 font-medium text-gray-800">{item.parameter?.name ?? '-'}</div>
                          <div className="md:col-span-4 text-gray-700">{item.value ? formatResultValue(item) : <span className="text-gray-400 italic">Sin valor</span>}</div>
                          <div className="md:col-span-2 text-gray-500">{item.parameter?.unit ?? '-'}</div>
                          <div className="md:col-span-1">
                            <Badge variant={STATUS_VARIANTS[item.status ?? ''] ?? 'secondary'} className="text-[10px]">
                              {STATUS_LABELS[item.status ?? ''] ?? item.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <AlertDialog open={Boolean(groupToValidate)} onOpenChange={(open) => !open && setGroupToValidate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar validación</AlertDialogTitle>
            <AlertDialogDescription>
              {groupToValidate
                ? `Se validarán y publicarán los resultados de ${groupToValidate.sampleNumber}. Esta acción cerrará la solicitud de estudio.`
                : 'Confirmá si querés validar esta solicitud.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmValidate}>Confirmar validar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Modal
        open={Boolean(processingGroup)}
        onClose={() => !processingSaving && setProcessingGroup(null)}
        contentClassName="w-[96vw] max-w-2xl h-[min(90dvh,860px)] overflow-hidden p-0"
      >
        <div className="flex h-full min-h-0 flex-col bg-white">
          <div className="shrink-0 border-b border-slate-200 bg-white px-6 py-5 sm:px-8">
            <h3 className="pr-8 text-lg font-semibold text-gray-900">Procesamiento del estudio</h3>
            <p className="mt-1 text-sm text-gray-500">
              {processingGroup
                ? `${processingGroup.sampleNumber} · ${processingGroup.profileName}`
                : 'Actualizar procesamiento'}
            </p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4 sm:px-8 sm:py-6">
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Modo</label>
                <div className="grid grid-cols-2 gap-2 rounded-lg border border-emerald-200 bg-emerald-50/40 p-1">
                  {PROCESSING_MODE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setProcessingMode(option.value)}
                      className={cn(
                        'h-9 rounded-md px-3 text-sm font-medium transition-colors cursor-pointer',
                        processingMode === option.value
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-transparent text-emerald-900 hover:bg-emerald-100',
                      )}
                      aria-pressed={processingMode === option.value}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {processingMode === 'referred' && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Estado derivado</label>
                  <div className="grid grid-cols-3 gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50/40 p-1">
                    {DERIVED_STATUS_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setProcessingStatus(option.value)}
                        title={option.fullLabel}
                        className={cn(
                          'h-9 min-w-0 rounded-md px-2 text-sm font-medium leading-none transition-colors cursor-pointer whitespace-nowrap',
                          processingStatus === option.value
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-transparent text-emerald-900 hover:bg-emerald-100',
                        )}
                        aria-pressed={processingStatus === option.value}
                      >
                        <span className="block truncate">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {processingMode === 'referred' && (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">Laboratorio externo</label>
                    <select
                      value={externalLaboratoryId}
                      onChange={(e) => setExternalLaboratoryId(Number(e.target.value) || 0)}
                      className="h-9 w-full rounded-md border border-emerald-300 bg-white px-3 text-sm"
                    >
                      <option value={0}>Seleccionar laboratorio externo</option>
                      {externalLaboratories.map((lab) => (
                        <option key={lab.id} value={lab.id}>{lab.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">Referencia externa</label>
                    <Input
                      value={externalReferenceNumber}
                      onChange={(e) => setExternalReferenceNumber(e.target.value)}
                      className="h-9"
                      placeholder="Nro. o código"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs span-2 font-medium text-gray-700">Fecha estimada</label>
                    <DateInputWithCalendar
                      value={expectedResultAt}
                      onChange={setExpectedResultAt}
                      placeholder="dd-mm-yyyy"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">Documento del laboratorio derivado</label>
                    <FileUploadField
                      id="external_report_modal"
                      accept=".pdf,image/png,image/jpeg,image/webp"
                      multiple
                      onChangeMultiple={appendExternalReports}
                      fileNames={externalReportFileNames}
                      hasExistingFile={Boolean(currentAttachments.length || processingGroup?.externalReportPath)}
                      placeholder="Adjuntar resultados externos"
                      hint="PDF, PNG, JPG o WEBP hasta 10 MB c/u."
                      note="Puede agregar varios archivos en tandas y guardar una sola vez al finalizar."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                    {externalReports.length > 0 && (
                      <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-md border border-slate-200 bg-slate-50 p-2">
                        {externalReports.map((file, index) => (
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
                    {(currentAttachments.length > 0 || processingGroup?.externalReportPath) && (
                      <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-md border border-slate-200 bg-slate-50 p-2">
                        {currentAttachments.map((attachment) => (
                          <div key={attachment.id} className="rounded-md border border-slate-200 bg-white p-2 text-xs">
                            <div className="flex items-start gap-2">
                              <a
                                href={`/medical/laboratory/test-requests/${processingGroup?.testRequestId}/attachments/${attachment.id}`}
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
                        {!currentAttachments.length && processingGroup?.externalReportPath && (
                          <a
                            href={`/medical/laboratory/test-requests/${processingGroup?.testRequestId}/external-report`}
                            target="_blank"
                            rel="noreferrer"
                            className="block rounded-md border border-slate-200 bg-white p-2 text-xs font-medium text-sky-700 hover:border-sky-300 hover:text-sky-800"
                          >
                            {processingGroup.externalReportPath.split('/').pop() || 'Documento anterior'}
                          </a>
                        )}
                      </div>
                    )}
                </div>

                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50/40 px-3 py-3 text-sm text-emerald-950">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                    checked={includeInMedicalHistory}
                    onChange={(e) => setIncludeInMedicalHistory(e.target.checked)}
                  />
                  <span>
                    <span className="block font-medium">Incluir adjuntos externos en la historia clínica del paciente</span>
                    <span className="block text-xs text-emerald-800">
                      Al publicar el estudio, estos documentos también quedarán disponibles en la ficha clínica del paciente.
                    </span>
                  </span>
                </label>

                {processingStatus === 'not_performed' && (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">Motivo de no realizado</label>
                    <textarea
                      rows={3}
                      value={notPerformedReason}
                      onChange={(e) => setNotPerformedReason(e.target.value)}
                      className="w-full rounded-md border border-emerald-300 bg-white px-3 py-2 text-sm"
                      placeholder="Detalle del motivo"
                    />
                  </div>
                )}
              </>
            )}

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Notas</label>
              <textarea
                rows={3}
                value={processingNotes}
                onChange={(e) => setProcessingNotes(e.target.value)}
                className="w-full rounded-md border border-emerald-300 bg-white px-3 py-2 text-sm"
                placeholder="Observaciones del procesamiento"
              />
            </div>
          </div>
          </div>

          <div className="shrink-0 border-t border-slate-200 bg-white px-6 py-4 sm:px-8">
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setProcessingGroup(null)}
              disabled={processingSaving}
            >
              Cancelar
            </Button>
            <Button type="button" onClick={handleSaveProcessing} disabled={processingSaving}>
              {processingSaving ? 'Guardando...' : 'Guardar procesamiento'}
            </Button>
          </div>
        </div>
        </div>
      </Modal>

      <AlertDialog
        open={Boolean(pendingAttachmentRemoval)}
        onOpenChange={(open) => !open && setPendingAttachmentRemoval(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar adjunto</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAttachmentRemoval
                ? `Se eliminará "${pendingAttachmentRemoval.label}". Esta acción no se puede deshacer.`
                : 'Esta acción no se puede deshacer.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveAttachment}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  )
}
