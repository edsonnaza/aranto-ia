import React from 'react'
import { Head, Link } from '@inertiajs/react'
import { BarChart3, FileText, CheckCircle2, Clock, Beaker } from 'lucide-react'
import AppLayout from '@/layouts/app-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { type BreadcrumbItem } from '@/types'
import HeadingSmall from '@/components/heading-small'

interface LabDashboardProps {
  stats: {
    total_samples: number
    pending_samples: number
    total_results: number
    pending_validations: number
  }
  recentSamples: any[]
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: 'Laboratorio',
    href: { url: '/medical/laboratory', method: 'get' },
  },
  {
    label: 'Bandeja de Trabajo',
    active: true,
  },
]

const statCards = [
  {
    title: 'Total de Muestras',
    value: '0',
    icon: Beaker,
    color: 'bg-blue-500',
    href: '/medical/laboratory/samples',
  },
  {
    title: 'Muestras Pendientes',
    value: '0',
    icon: Clock,
    color: 'bg-yellow-500',
    href: '/medical/laboratory/samples',
  },
  {
    title: 'Resultados Registrados',
    value: '0',
    icon: CheckCircle2,
    color: 'bg-green-500',
    href: '/medical/laboratory/results',
  },
  {
    title: 'Validaciones Pendientes',
    value: '0',
    icon: FileText,
    color: 'bg-orange-500',
    href: '/medical/laboratory/validations',
  },
]

export default function LabDashboard({ stats, recentSamples }: LabDashboardProps) {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Laboratorio - Bandeja de Trabajo" />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <HeadingSmall
            title="Bandeja de Trabajo"
            description="Gestión integral del módulo de laboratorio"
            icon={<BarChart3 className="h-6 w-6" />}
          />
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card, index) => {
            const Icon = card.icon
            const value = Object.values(stats)[index] || 0
            return (
              <Link
                key={card.title}
                href={card.href}
                className="group"
              >
                <Card className="cursor-pointer transition-all hover:shadow-lg hover:scale-105">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {card.title}
                    </CardTitle>
                    <div className={`${card.color} p-2 rounded-lg text-white`}>
                      <Icon className="h-4 w-4" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{value}</div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/medical/laboratory/samples">
            <Button variant="outline" className="w-full justify-start">
              <Beaker className="mr-2 h-4 w-4" />
              Recepción de Muestras
            </Button>
          </Link>
          <Link href="/medical/laboratory/results">
            <Button variant="outline" className="w-full justify-start">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Registrar Resultados
            </Button>
          </Link>
          <Link href="/medical/laboratory/validations">
            <Button variant="outline" className="w-full justify-start">
              <FileText className="mr-2 h-4 w-4" />
              Validar Resultados
            </Button>
          </Link>
          <Link href="/medical/laboratory/reports">
            <Button variant="outline" className="w-full justify-start">
              <BarChart3 className="mr-2 h-4 w-4" />
              Informes
            </Button>
          </Link>
        </div>

        {/* Recent Samples */}
        <Card>
          <CardHeader>
            <CardTitle>Muestras Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            {recentSamples && recentSamples.length > 0 ? (
              <div className="space-y-4">
                {recentSamples.slice(0, 5).map((sample: any) => (
                  <Link
                    key={sample.id}
                    href={`/medical/laboratory/samples/${sample.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="font-medium">
                        {sample.patient?.name || 'Paciente'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {sample.lab_order_number || `Muestra #${sample.id}`}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {sample.status || 'pending'}
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                No hay muestras recientes
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
