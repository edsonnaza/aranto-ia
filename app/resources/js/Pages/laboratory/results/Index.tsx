import { Head, Link, router } from '@inertiajs/react'
import { useMemo, useState } from 'react'
import AppLayout from '@/layouts/app-layout'
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
import { Input } from '@/components/ui/input'
import { useNumberFormatter } from '@/hooks/useNumberFormatter'
import { Beaker, ChevronDown, ChevronRight, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

interface Parameter {
  id: number
  name: string
  unit?: string | null
  parameter_type?: 'numeric' | 'text' | 'option' | 'calculated'
}

interface Sample {
  id: number
  sample_number: string
  patient?: {
    first_name?: string
    last_name?: string
  }
}

interface ResultTestRequest {
  id: number
  status: string
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
  canValidate: boolean
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  validated: 'Validado',
  completed: 'Completado',
  pending_validation: 'Pend. validación',
}

const STATUS_VARIANTS: Record<string, 'secondary' | 'pending' | 'paid'> = {
  draft: 'secondary',
  pending_validation: 'pending',
  validated: 'paid',
  completed: 'paid',
}

interface ResultGroup {
  testRequestId: number
  sampleId: number
  sampleNumber: string
  patientName: string
  profileName: string
  status: string
  hasValues: boolean
  items: Result[]
}

export default function ResultsIndex({ results, canValidate }: ResultsIndexProps) {
  const { parse: parseDecimal, format: formatDecimal } = useNumberFormatter()
  const [openGroups, setOpenGroups] = useState<Set<number>>(new Set())
  const [search, setSearch] = useState('')
  const [validatingIds, setValidatingIds] = useState<Set<number>>(new Set())
  const [groupToValidate, setGroupToValidate] = useState<ResultGroup | null>(null)

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
          status: result.status ?? 'draft',
          hasValues: false,
          items: [],
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

  const breadcrumbs = [
    { href: '/medical', title: 'Sistema Médico' },
    { href: '/medical/laboratory', title: 'Laboratorio' },
    { href: '/medical/laboratory/results', title: 'Resultados', current: true },
  ]

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

        <Input
          placeholder="Buscar por muestra, paciente o perfil..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm h-9"
        />

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
            const isClosed = group.status === 'validated' || group.status === 'completed'
            const showValidateBtn = canValidate && group.hasValues && !isClosed

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
    </AppLayout>
  )
}
