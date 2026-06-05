import { Head, Link } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart3, Beaker, CheckCircle2, Clock, FlaskConical, PieChart } from 'lucide-react'

interface StatData {
  total_samples: number
  in_analysis_samples: number
  pending_validation_samples: number
  validated_today: number
  total_results: number
  total_validations: number
}

interface StatusDistributionRow {
  status: string
  label: string
  total: number
}

interface TopServiceRow {
  service_name: string
  total: number
}

interface DailyTrendRow {
  date: string
  label: string
  total: number
}

interface LatestRequestRow {
  id: number
  sample_number: string
  status: string
  created_at: string | null
  patient_name: string | null
  service_name: string | null
}

interface LabDashboardProps {
  stats: StatData
  statusDistribution: StatusDistributionRow[]
  topServices: TopServiceRow[]
  dailyTrend: DailyTrendRow[]
  latestRequests: LatestRequestRow[]
}

const getStatusLabel = (status: string) => {
  if (status === 'pending') return 'Pendiente'
  if (status === 'pending_collection') return 'Pendiente toma'
  if (status === 'collected') return 'Tomada'
  if (status === 'received') return 'Recibida'
  if (status === 'processing') return 'Procesando'
  if (status === 'in_analysis') return 'En análisis'
  if (status === 'pending_validation') return 'Pendiente validación'
  if (status === 'validated') return 'Validada'
  if (status === 'reported') return 'Informada'
  if (status === 'completed') return 'Completada'
  if (status === 'rejected') return 'Rechazada'
  if (status === 'cancelled') return 'Cancelada'
  return status
}

const PIE_COLORS = ['#0ea5e9', '#14b8a6', '#22c55e', '#eab308', '#f97316', '#8b5cf6', '#ef4444', '#06b6d4']

const formatDateTime = (value: string | null) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })
}

export default function LabDashboard({ stats, statusDistribution, topServices, dailyTrend, latestRequests }: LabDashboardProps) {
  const breadcrumbs = [
    { href: '/medical', title: 'Sistema Médico' },
    { href: '/medical/laboratory', title: 'Laboratorio', current: true },
  ]

  const maxTrend = Math.max(...dailyTrend.map((row) => row.total), 1)
  const maxTopService = Math.max(...topServices.map((row) => row.total), 1)
  const totalStatus = statusDistribution.reduce((acc, row) => acc + row.total, 0)

  let cumulative = 0
  const pieSlices = statusDistribution.map((row, index) => {
    const percentage = totalStatus > 0 ? (row.total / totalStatus) * 100 : 0
    const from = cumulative
    const to = cumulative + percentage
    cumulative = to
    const color = PIE_COLORS[index % PIE_COLORS.length]
    return `${color} ${from}% ${to}%`
  })

  const pieBackground = pieSlices.length > 0
    ? `conic-gradient(${pieSlices.join(', ')})`
    : 'conic-gradient(#e5e7eb 0% 100%)'

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Laboratorio - Dashboard" />

      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard de Laboratorio</h1>
            <p className="mt-1 text-sm text-gray-500">Vista operativa y analítica del día para el área de laboratorio.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/medical/laboratory/samples">
              <Button variant="outline">
                <Beaker className="mr-2 h-4 w-4" />
                Muestras
              </Button>
            </Link>
            <Link href="/medical/laboratory/results/create">
              <Button>
                <FlaskConical className="mr-2 h-4 w-4" />
                Cargar resultados
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500">Total de muestras</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold">{stats.total_samples}</p>
                <Beaker className="h-5 w-5 text-sky-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500">En análisis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold">{stats.in_analysis_samples}</p>
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500">Pendiente validación</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold">{stats.pending_validation_samples}</p>
                <BarChart3 className="h-5 w-5 text-amber-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500">Validadas hoy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold">{stats.validated_today}</p>
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>Tendencia de muestras (7 días)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2 items-end h-40">
                {dailyTrend.map((point) => (
                  <div key={point.date} className="flex flex-col items-center gap-1">
                    <div
                      className="w-full max-w-[34px] rounded-t bg-sky-500"
                      style={{ height: `${Math.max((point.total / maxTrend) * 120, 6)}px` }}
                      title={`${point.label}: ${point.total}`}
                    />
                    <p className="text-[11px] text-gray-500">{point.label}</p>
                    <p className="text-[11px] font-medium">{point.total}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-4 w-4" />
                Distribución por estado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="mx-auto h-36 w-36 rounded-full border" style={{ background: pieBackground }} />
              <div className="space-y-2">
                {statusDistribution.map((row, index) => (
                  <div key={row.status} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                      />
                      <span>{row.label}</span>
                    </div>
                    <span className="font-semibold">{row.total}</span>
                  </div>
                ))}
                {statusDistribution.length === 0 && (
                  <p className="text-sm text-gray-500">Sin datos para graficar.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Top servicios solicitados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topServices.map((service) => (
                <div key={service.service_name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate pr-2">{service.service_name}</span>
                    <span className="font-semibold">{service.total}</span>
                  </div>
                  <div className="h-2 rounded bg-slate-100">
                    <div
                      className="h-2 rounded bg-emerald-500"
                      style={{ width: `${(service.total / maxTopService) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              {topServices.length === 0 && (
                <p className="text-sm text-gray-500">Aún no hay servicios para mostrar.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Últimos pedidos de laboratorio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {latestRequests.map((row) => (
                  <Link
                    key={row.id}
                    href={`/medical/laboratory/samples/${row.id}`}
                    className="block rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold">{row.sample_number}</span>
                      <span className="text-xs text-slate-500">{getStatusLabel(row.status)}</span>
                    </div>
                    <p className="text-sm text-slate-700 truncate">{row.service_name || 'Sin estudio'}</p>
                    <p className="text-xs text-slate-500">
                      {row.patient_name || 'Paciente N/A'} - {formatDateTime(row.created_at)}
                    </p>
                  </Link>
                ))}
                {latestRequests.length === 0 && (
                  <p className="text-sm text-gray-500">No hay pedidos recientes.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
