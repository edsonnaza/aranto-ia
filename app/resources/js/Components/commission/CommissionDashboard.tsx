import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Clock,
  CheckCircle,
  AlertTriangle,
  Calendar,
  TrendingUp
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useCommissionDashboard } from '@/hooks/medical/useCommissionDashboard'
import { CommissionSummaryCards } from './CommissionSummaryCards'
import { getStatusColor } from '@/lib/constants/status-colors'
import type { CommissionDashboardData } from '@/hooks/medical/useCommissionDashboard'


interface CommissionDashboardProps {
  className?: string
  professionalsWithPendingCommissions?: Array<{
    id: number
    full_name: string
    specialty: string
    commission_percentage: number
    pending_services_count: number
    pending_amount: number
    commission_amount: number
  }>
}

export default function CommissionDashboard({ 
  className, 
  professionalsWithPendingCommissions = [] 
}: CommissionDashboardProps) {
  const { data: dashboardData, loading, error, refetch } = useCommissionDashboard()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: es })
  }

  if (loading && !dashboardData) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No se pudieron cargar los datos del dashboard</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const {
    summary,
    monthly_trend,
    pending_approvals,
    recent_liquidations,
    top_professionals
  } = dashboardData

  return (
    <div className={`space-y-6 ${className}`}>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Metrics using CommissionSummaryCards component */}
      <CommissionSummaryCards
        totalCommissions={summary.total_commissions}
        activeProfessionals={summary.active_professionals}
        totalLiquidations={summary.total_liquidations}
        pendingLiquidations={summary.pending_liquidations}
        growthRate={summary.growth_rate}
      />

      {/* Monthly Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Tendencia Mensual de Comisiones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {monthly_trend.map((month: CommissionDashboardData['monthly_trend'][number], index: number) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-20 text-sm font-medium">
                    {format(new Date(month.month + '-01'), 'MMM yyyy', { locale: es })}
                  </div>
                  <div className="flex-1 max-w-xs">
                    <Progress
                      value={(month.amount / Math.max(...monthly_trend.map((m: CommissionDashboardData['monthly_trend'][number]) => m.amount))) * 100}
                      className="h-2"
                    />
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatCurrency(month.amount)}</div>
                  <div className="text-sm text-muted-foreground">
                    {month.liquidations} liquidaciones
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approvals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Aprobaciones Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pending_approvals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No hay aprobaciones pendientes</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pending_approvals.slice(0, 5).map((approval: CommissionDashboardData['pending_approvals'][number]) => (
                  <div key={approval.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{approval.professional_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(approval.period_start)} - {formatDate(approval.period_end)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(approval.commission_amount)}</div>
                      <Badge variant="secondary" className="text-xs">
                        {approval.days_pending} días
                      </Badge>
                    </div>
                  </div>
                ))}
                {pending_approvals.length > 5 && (
                  <div className="text-center text-sm text-muted-foreground">
                    ... y {pending_approvals.length - 5} más
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Professionals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Profesionales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {top_professionals.map((professional: CommissionDashboardData['top_professionals'][number], index: number) => (
                <div key={professional.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{professional.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {professional.specialty}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(professional.total_commissions)}</div>
                    <div className="text-sm text-muted-foreground">
                      {professional.liquidations_count} liquidaciones
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Liquidations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Liquidaciones Recientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Profesional</th>
                  <th className="text-left p-2">Período</th>
                  <th className="text-right p-2">Monto</th>
                  <th className="text-center p-2">Estado</th>
                  <th className="text-center p-2">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {recent_liquidations.map((liquidation: CommissionDashboardData['recent_liquidations'][number]) => (
                  <tr key={liquidation.id} className="border-b hover:bg-muted/50">
                    <td className="p-2">
                      <div>
                        <div className="font-medium">{liquidation.professional_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {liquidation.specialty_name}
                        </div>
                      </div>
                    </td>
                    <td className="p-2 text-sm">
                      {formatDate(liquidation.period_start)} - {formatDate(liquidation.period_end)}
                    </td>
                    <td className="p-2 text-right font-medium">
                      {formatCurrency(liquidation.commission_amount)}
                    </td>
                    <td className="p-2 text-center">
                      <Badge
                        variant={getStatusColor(liquidation.status)?.variant || 'outline'}
                        className={getStatusColor(liquidation.status)?.className}
                      >
                        {getStatusColor(liquidation.status)?.label || liquidation.status}
                      </Badge>
                    </td>
                    <td className="p-2 text-center text-sm">
                      {formatDate(liquidation.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Profesionales con Comisiones Pendientes */}
      {professionalsWithPendingCommissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
              Profesionales con Comisiones Pendientes
              <Badge className="ml-2 bg-indigo-100 text-indigo-700">
                {professionalsWithPendingCommissions.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {professionalsWithPendingCommissions.map((professional) => (
                <Card key={professional.id} className="border-l-4 border-l-indigo-500">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900">{professional.full_name}</h4>
                        <p className="text-sm text-gray-500">{professional.specialty}</p>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {/* Servicios pendientes */}
                        <div className="bg-orange-50 rounded-lg p-3 text-center">
                          <div className="text-2xl font-bold text-orange-600">
                            {professional.pending_services_count}
                          </div>
                          <p className="text-xs text-orange-700 mt-1">Servicios</p>
                        </div>

                        {/* Monto pendiente */}
                        <div className="bg-red-50 rounded-lg p-3 text-center">
                          <div className="text-sm font-bold text-red-600 truncate">
                            ₲{(professional.pending_amount / 1000).toFixed(0)}k
                          </div>
                          <p className="text-xs text-red-700 mt-1">Pendiente</p>
                        </div>

                        {/* Comisión a cobrar */}
                        <div className="bg-green-50 rounded-lg p-3 text-center">
                          <div className="text-sm font-bold text-green-600 truncate">
                            ₲{(professional.commission_amount / 1000).toFixed(0)}k
                          </div>
                          <p className="text-xs text-green-700 mt-1">Comisión</p>
                        </div>
                      </div>

                      <Badge className="w-full justify-center bg-indigo-100 text-indigo-700 hover:bg-indigo-200">
                        {professional.commission_percentage}% Comisión
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
