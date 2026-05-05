import type { ComponentType } from 'react'
import { Head } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'
import { type BreadcrumbItem } from '@/types'
import {
    Area,
    AreaChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Activity, CreditCard, ShieldCheck, Users } from 'lucide-react'

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
]

interface DashboardProps {
    stats: {
        patients_attended_today: number
        patients_by_insurance_today: number
        patients_particular_today: number
        service_requests_today: number
        active_income_transactions_today: number
        open_cash_sessions: number
    }
    charts: {
        top_services_today: Array<{ name: string; count: number }>
        top_professionals_today: Array<{ name: string; count: number }>
        daily_trend: Array<{ date: string; label: string; patients: number; income: number }>
        payment_status_today: Array<{ status: string; count: number }>
    }
    recent_requests: Array<{
        id: number
        request_number: string
        patient: string
        total_amount: number
        paid_amount: number
        payment_status: string
        created_at: string | null
    }>
    date_info: {
        date: string
        day_name: string
        formatted_date: string
    }
}

function StatCard({ title, value, icon: Icon, subtitle }: {
    title: string
    value: string
    icon: ComponentType<{ className?: string }>
    subtitle: string
}) {
    return (
        <Card className="border-slate-200/80 shadow-sm">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                    <CardDescription className="text-xs uppercase tracking-wide text-slate-500">{title}</CardDescription>
                    <div className="rounded-md bg-slate-100 p-2">
                        <Icon className="h-4 w-4 text-slate-600" />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
                <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
            </CardContent>
        </Card>
    )
}

function paymentStatusLabel(status: string): string {
    const labels: Record<string, string> = {
        paid: 'Pagado',
        partial: 'Parcial',
        pending: 'Pendiente',
        cancelled: 'Cancelado',
    }

    return labels[status] ?? status
}

function paymentStatusBadge(status: string): string {
    const classes: Record<string, string> = {
        paid: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        partial: 'bg-amber-100 text-amber-700 border-amber-200',
        pending: 'bg-slate-100 text-slate-700 border-slate-200',
        cancelled: 'bg-rose-100 text-rose-700 border-rose-200',
    }

    return classes[status] ?? 'bg-slate-100 text-slate-700 border-slate-200'
}

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-PY', {
        style: 'currency',
        currency: 'PYG',
        maximumFractionDigits: 0,
    }).format(value)
}

export default function Dashboard({
    stats,
    charts,
    recent_requests,
    date_info,
}: DashboardProps) {
    const totalCoverageBase = stats.patients_by_insurance_today + stats.patients_particular_today
    const insuranceShare =
        totalCoverageBase > 0
            ? Math.round((stats.patients_by_insurance_today / totalCoverageBase) * 100)
            : 0
    const privateShare =
        totalCoverageBase > 0
            ? Math.round((stats.patients_particular_today / totalCoverageBase) * 100)
            : 0
    const totalPayments = charts.payment_status_today.reduce((acc, item) => acc + item.count, 0)

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="space-y-6 bg-linear-to-b from-slate-50 to-white p-4 md:p-6">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
                                Dashboard Operacional
                            </h1>
                            <p className="mt-1 text-sm text-slate-500">{date_info.formatted_date}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                                {stats.open_cash_sessions} caja(s) abierta(s)
                            </Badge>
                            <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                                {date_info.day_name}
                            </Badge>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        title="Pacientes Agendados"
                        value={String(stats.patients_attended_today)}
                        icon={Users}
                        subtitle="Con turnos scheduled hoy"
                    />
                    <StatCard
                        title="Solicitudes"
                        value={String(stats.service_requests_today)}
                        icon={Activity}
                        subtitle="Registradas hoy"
                    />
                    <StatCard
                        title="Transacciones"
                        value={String(stats.active_income_transactions_today)}
                        icon={CreditCard}
                        subtitle="Ingresos activos de hoy"
                    />
                    <StatCard
                        title="Cobertura"
                        value={`${insuranceShare}%`}
                        icon={ShieldCheck}
                        subtitle={`${privateShare}% particulares`}
                    />
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                    <Card className="xl:col-span-2">
                        <CardHeader>
                            <CardTitle>Tendencia Ultimos 7 dias</CardTitle>
                            <CardDescription>Pacientes atendidos por dia</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={320}>
                                <AreaChart data={charts.daily_trend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="patientsGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#0f766e" stopOpacity={0.28} />
                                            <stop offset="95%" stopColor="#0f766e" stopOpacity={0.02} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="label" tickLine={false} axisLine={false} />
                                    <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                                    <Tooltip
                                        formatter={(value: number) => [value, 'Pacientes']}
                                        labelFormatter={(label) => `Dia: ${label}`}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="patients"
                                        stroke="#0f766e"
                                        fill="url(#patientsGradient)"
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Top 5 Profesionales</CardTitle>
                            <CardDescription>Distribución de demanda hoy</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {charts.top_professionals_today.length > 0 ? (() => {
                                const PIE_COLORS = ['#0f766e', '#0891b2', '#7c3aed', '#db2777', '#d97706']
                                const data = charts.top_professionals_today.slice(0, 5)
                                return (
                                    <ResponsiveContainer width="100%" height={320}>
                                        <PieChart>
                                            <Pie
                                                data={data}
                                                dataKey="count"
                                                nameKey="name"
                                                cx="50%"
                                                cy="45%"
                                                outerRadius={100}
                                                innerRadius={48}
                                                paddingAngle={3}
                                                label={({ percent }) => `${Math.round(percent * 100)}%`}
                                                labelLine={false}
                                            >
                                                {data.map((_: unknown, index: number) => (
                                                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value: number, name: string) => [value, name]} />
                                            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )
                            })() : (
                                <div className="flex h-60 items-center justify-center text-sm text-slate-500">
                                    No hay profesionales registrados hoy
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
                    <Card className="xl:col-span-2">
                        <CardHeader>
                            <CardTitle>Top Servicios</CardTitle>
                            <CardDescription>Mas solicitados hoy</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {charts.top_services_today.length > 0 ? (
                                charts.top_services_today.slice(0, 6).map((service, idx) => {
                                    const max = charts.top_services_today[0]?.count || 1
                                    const pct = Math.round((service.count / max) * 100)

                                    return (
                                        <div key={service.name} className="space-y-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="truncate text-sm text-slate-700">
                                                    {idx + 1}. {service.name}
                                                </p>
                                                <span className="text-xs font-medium text-slate-500">{service.count}</span>
                                            </div>
                                            <Progress value={pct} className="h-1.5" />
                                        </div>
                                    )
                                })
                            ) : (
                                <div className="flex h-44 items-center justify-center text-sm text-slate-500">
                                    No hay servicios registrados hoy
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Estado de Pagos (Hoy)</CardTitle>
                            <CardDescription>{totalPayments} solicitudes en total</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {charts.payment_status_today.length > 0 ? (
                                charts.payment_status_today.map((item) => {
                                    const percentage = totalPayments > 0 ? Math.round((item.count / totalPayments) * 100) : 0
                                    return (
                                        <div key={item.status} className="space-y-2">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-sm font-medium text-slate-700">
                                                    {paymentStatusLabel(item.status)}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <Badge className={paymentStatusBadge(item.status)} variant="outline">
                                                        {item.count}
                                                    </Badge>
                                                    <span className="text-xs text-slate-500">{percentage}%</span>
                                                </div>
                                            </div>
                                            <Progress value={percentage} className="h-2" />
                                        </div>
                                    )
                                })
                            ) : (
                                <div className="flex h-60 items-center justify-center text-sm text-slate-500">
                                    Sin registros de pago para hoy
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="xl:col-span-2">
                        <CardHeader>
                            <CardTitle>Solicitudes Recientes</CardTitle>
                            <CardDescription>Ultimas atenciones registradas hoy</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {recent_requests.length > 0 ? (
                                <div className="space-y-2">
                                    {recent_requests.map((row) => (
                                        <div
                                            key={row.id}
                                            className="grid grid-cols-[1.1fr_1fr_auto] items-center gap-3 rounded-lg border border-slate-100 px-3 py-2"
                                        >
                                            <div>
                                                <p className="text-sm font-medium text-slate-800">{row.patient || 'Paciente sin nombre'}</p>
                                                <p className="text-xs text-slate-500">{row.request_number} · {row.created_at ?? '--:--'}</p>
                                            </div>
                                            <div className="text-xs text-slate-600">
                                                <p>Total: {formatCurrency(row.total_amount)}</p>
                                                <p>Pagado: {formatCurrency(row.paid_amount)}</p>
                                            </div>
                                            <Badge className={paymentStatusBadge(row.payment_status)} variant="outline">
                                                <CreditCard className="mr-1 h-3.5 w-3.5" />
                                                {paymentStatusLabel(row.payment_status)}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex h-60 items-center justify-center text-sm text-slate-500">
                                    Sin solicitudes recientes para mostrar
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    )
}
