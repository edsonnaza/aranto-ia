import { Head, Link, useForm } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'
import { Button } from '@/components/ui/button'
import { AlertTriangle, FlaskConical, PlayCircle } from 'lucide-react'

interface Props {
  sample: {
    id: number
    sample_number: string
    status: string
    patient_name?: string | null
    sample_type?: string | null
    requested_study?: string | null
  }
  testRequest: {
    id: number
    status: string
    profile_name?: string | null
  } | null
  latestTestRequest: {
    id: number
    status: string
    profile_name?: string | null
  } | null
  suggestedProfile: {
    id: number
    name: string
    code: string
  } | null
  canStart: boolean
  blockingReason?: string | null
}

const formatStatus = (status: string) => {
  if (status === 'received') return 'Recibida'
  if (status === 'in_analysis') return 'En análisis'
  if (status === 'pending_validation') return 'Pendiente validación'
  if (status === 'validated') return 'Validada'
  return status
}

export default function StartAnalysis({ sample, testRequest, latestTestRequest, suggestedProfile, canStart, blockingReason }: Props) {
  const { post, processing } = useForm({})
  const isEditMode = sample.status === 'in_analysis' || sample.status === 'pending_validation'
  const pageTitle = isEditMode ? 'Continuar Análisis' : 'Iniciar Análisis'

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    post(`/medical/laboratory/samples/${sample.id}/start-analysis`)
  }

  const breadcrumbs = [
    { href: '/medical', title: 'Sistema Médico' },
    { href: '/medical/laboratory', title: 'Laboratorio' },
    { href: '/medical/laboratory/samples', title: 'Muestras' },
    { href: `/medical/laboratory/samples/${sample.id}/start-analysis`, title: isEditMode ? 'Continuar Análisis' : 'Iniciar Análisis', current: true },
  ]

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`${pageTitle} ${sample.sample_number}`} />

      <div className="p-4 md:p-6 space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{pageTitle}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {isEditMode
              ? 'Puede continuar la carga de resultados hasta la validación final de bioquímica.'
              : 'Confirme los datos antes de iniciar el procesamiento de la muestra.'}
          </p>
        </div>

        <div className="rounded-xl border bg-white shadow-sm p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Resumen de la muestra</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-500">N° Muestra:</span> <span className="font-medium">{sample.sample_number}</span></div>
            <div><span className="text-gray-500">Estado actual:</span> <span className="font-medium">{formatStatus(sample.status)}</span></div>
            <div><span className="text-gray-500">Paciente:</span> <span className="font-medium">{sample.patient_name || 'N/A'}</span></div>
            <div><span className="text-gray-500">Tipo de muestra:</span> <span className="font-medium">{sample.sample_type || 'N/A'}</span></div>
            <div className="md:col-span-2"><span className="text-gray-500">Estudio solicitado:</span> <span className="font-medium">{sample.requested_study || 'N/A'}</span></div>
          </div>
        </div>

        <div className="rounded-xl border bg-white shadow-sm p-6 space-y-3">
          <h2 className="text-base font-semibold text-gray-900">Solicitud y perfil</h2>
          {testRequest ? (
            <div className="text-sm space-y-2">
              <p><span className="text-gray-500">Solicitud activa:</span> <span className="font-medium">#{testRequest.id}</span></p>
              <p><span className="text-gray-500">Estado solicitud:</span> <span className="font-medium">{testRequest.status}</span></p>
              <p><span className="text-gray-500">Perfil:</span> <span className="font-medium">{testRequest.profile_name || 'Sin perfil'}</span></p>
            </div>
          ) : (
            <div className="text-sm space-y-2">
              <p className="text-gray-600">No existe solicitud activa. Se creará una nueva al confirmar.</p>
              <p>
                <span className="text-gray-500">Perfil sugerido:</span>{' '}
                <span className="font-medium">{suggestedProfile ? `${suggestedProfile.name} (${suggestedProfile.code})` : 'No disponible'}</span>
              </p>
            </div>
          )}

          {latestTestRequest && latestTestRequest.status === 'validated' && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              Esta muestra ya cuenta con validación final de bioquímica (solicitud #{latestTestRequest.id}).
            </div>
          )}
        </div>

        {!canStart && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">No se puede iniciar el análisis</p>
              <p className="text-sm text-red-700">{blockingReason}</p>
            </div>
          </div>
        )}

        <form onSubmit={submit} className="flex gap-2">
          <Link href="/medical/laboratory/samples">
            <Button type="button" variant="outline">Cancelar</Button>
          </Link>

          <Button type="submit" disabled={!canStart || processing}>
            <PlayCircle className="h-4 w-4 mr-2" />
            {processing ? (isEditMode ? 'Abriendo...' : 'Iniciando...') : (isEditMode ? 'Continuar análisis' : 'Confirmar e iniciar')}
          </Button>

          <Link href={`/medical/laboratory/results?sample_id=${sample.id}`}>
            <Button type="button" variant="secondary">
              <FlaskConical className="h-4 w-4 mr-2" />
              Ver Resultados
            </Button>
          </Link>
        </form>
      </div>
    </AppLayout>
  )
}
