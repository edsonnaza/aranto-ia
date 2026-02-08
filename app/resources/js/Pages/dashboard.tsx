import { Head } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'
import { type BreadcrumbItem } from '@/types'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Heart, User } from 'lucide-react'

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
    }
    charts: {
        top_services_today: Array<{ name: string; count: number }>
        top_professionals_today: Array<{ name: string; count: number }>
    }
    date_info: {
        date: string
        day_name: string
        formatted_date: string
    }
}

function StatCard({
    title,
    value,
    icon: Icon,
    description,
    className = '',
}: {
    title: string
    value: number
    icon: React.ComponentType<{ className?: string }>
    description: string
    className?: string
}) {
    return (
        <Card className={className}>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
                    <Icon className="h-5 w-5 text-blue-500 opacity-70" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold mb-1">{value}</div>
                <p className="text-xs text-gray-500">{description}</p>
            </CardContent>
        </Card>
    )
}

export default function Dashboard({
    stats,
    charts,
    date_info,
}: DashboardProps) {
    const totalAttended = stats.patients_attended_today
    const percentageInsurance =
        totalAttended > 0
            ? Math.round((stats.patients_by_insurance_today / totalAttended) * 100)
            : 0
    const percentageParticular =
        totalAttended > 0
            ? Math.round((stats.patients_particular_today / totalAttended) * 100)
            : 0

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="space-y-6 p-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard Operacional</h1>
                    <p className="text-gray-500 mt-2">{date_info.formatted_date}</p>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard
                        title="Pacientes Atendidos"
                        value={stats.patients_attended_today}
                        icon={Users}
                        description="Total atendidos hoy"
                    />
                    <StatCard
                        title="Pacientes con Seguro"
                        value={stats.patients_by_insurance_today}
                        icon={Heart}
                        description={`${percentageInsurance}% del total`}
                        className="border-blue-200 bg-blue-50"
                    />
                    <StatCard
                        title="Pacientes Particulares"
                        value={stats.patients_particular_today}
                        icon={User}
                        description={`${percentageParticular}% del total`}
                        className="border-green-200 bg-green-50"
                    />
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Services */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Top 10 Servicios Más Solicitados</CardTitle>
                            <CardDescription>Servicios del día actual</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {charts.top_services_today.length > 0 ? (
                                <ResponsiveContainer width="100%" height={400}>
                                    <BarChart
                                        data={charts.top_services_today}
                                        layout="vertical"
                                        margin={{ top: 5, right: 30, left: 300, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" />
                                        <YAxis dataKey="name" type="category" width={290} />
                                        <Tooltip cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }} />
                                        <Bar dataKey="count" fill="#3b82f6" radius={[0, 8, 8, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-96 text-gray-500">
                                    No hay datos disponibles para hoy
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Top Professionals */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Top 10 Médicos Más Solicitados</CardTitle>
                            <CardDescription>Médicos del día actual</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {charts.top_professionals_today.length > 0 ? (
                                <ResponsiveContainer width="100%" height={400}>
                                    <BarChart
                                        data={charts.top_professionals_today}
                                        layout="vertical"
                                        margin={{ top: 5, right: 30, left: 250, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" />
                                        <YAxis dataKey="name" type="category" width={240} />
                                        <Tooltip cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }} />
                                        <Bar dataKey="count" fill="#10b981" radius={[0, 8, 8, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-96 text-gray-500">
                                    No hay datos disponibles para hoy
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    )
}
