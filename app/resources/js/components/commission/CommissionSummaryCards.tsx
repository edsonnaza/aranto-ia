import { DollarSign, Users, FileText, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface CommissionSummaryCardsProps {
  totalCommissions: number
  activeProfessionals: number
  totalLiquidations: number
  pendingLiquidations: number
  growthRate: number
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-PY', {
    style: 'currency',
    currency: 'PYG',
  }).format(amount)
}

export function CommissionSummaryCards({
  totalCommissions,
  activeProfessionals,
  totalLiquidations,
  pendingLiquidations,
  growthRate,
}: CommissionSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Comisiones */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Comisiones</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalCommissions)}</div>
          <p className="text-xs text-muted-foreground">Este mes</p>
        </CardContent>
      </Card>

      {/* Profesionales Activos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Profesionales Activos</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeProfessionals}</div>
          <p className="text-xs text-muted-foreground">Con comisiones este mes</p>
        </CardContent>
      </Card>

      {/* Liquidaciones */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Liquidaciones</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalLiquidations}</div>
          <p className="text-xs text-muted-foreground">{pendingLiquidations} pendientes</p>
        </CardContent>
      </Card>

      {/* Tasa de Crecimiento */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tasa de Crecimiento</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {growthRate >= 0 ? '+' : ''}{growthRate.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">vs mes anterior</p>
        </CardContent>
      </Card>
    </div>
  )
}
