import React, { useState } from 'react'
import { Head, usePage } from '@inertiajs/react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import AppLayout from '@/layouts/app-layout'
import {
  CommissionDashboard,
  CommissionLiquidationForm,
  CommissionLiquidationList,
  CommissionLiquidationDetail,
  CommissionReport,
  CommissionPendingApprovals,
  CommissionSettings,
  CommissionPaidLiquidations
} from '@/components/commission'
import type { Professional, CommissionLiquidation } from '@/types'

interface CommissionIndexProps {
  professionals: Professional[]
  liquidations?: any
  pendingApprovals?: CommissionLiquidation[]
  defaultCommission?: number
  filters?: {
    professional_id?: string
    status?: string
    date_from?: string
    date_to?: string
  }
}

export default function CommissionIndex({ 
  professionals, 
  liquidations, 
  pendingApprovals, 
  defaultCommission = 10,
  filters = {}
}: CommissionIndexProps) {
  const { props } = usePage()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedLiquidationId, setSelectedLiquidationId] = useState<number | null>(null)

  const handleViewDetails = (liquidationId: number) => {
    setSelectedLiquidationId(liquidationId)
    setActiveTab('details')
  }

  const handleBackToList = () => {
    setSelectedLiquidationId(null)
    setActiveTab('list')
  }

  const handleLiquidationSuccess = () => {
    setActiveTab('list')
  }

  return (
    <AppLayout>
      <Head title="Comisiones" />

      <div className="py-6">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-8">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="create">Crear Liquidación</TabsTrigger>
              <TabsTrigger value="list">Liquidaciones</TabsTrigger>
              <TabsTrigger value="reports">Reportes</TabsTrigger>
              <TabsTrigger value="approvals">Aprobaciones</TabsTrigger>
              <TabsTrigger value="settings">Configuración</TabsTrigger>
              <TabsTrigger value="details" disabled={!selectedLiquidationId}>
                Detalles
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard">
              <CommissionDashboard />
            </TabsContent>

            <TabsContent value="create">
              <CommissionLiquidationForm
                professionals={professionals}
                onSuccess={handleLiquidationSuccess}
                onCancel={() => setActiveTab('dashboard')}
              />
            </TabsContent>

            <TabsContent value="list">
              <CommissionLiquidationList
                liquidations={liquidations || { data: [], current_page: 1, last_page: 1, per_page: 20, total: 0, from: 1, to: 0, path: '' }}
                filters={filters}
                onViewDetails={(liquidation) => handleViewDetails(liquidation.id)}
                onEdit={() => {
                  // TODO: Implement edit functionality
                  setActiveTab('create')
                  // Could set form data for editing
                }}
                onDelete={() => {
                  // TODO: Implement delete functionality with confirmation
                  // if (confirm('¿Eliminar liquidación?')) {
                  //   // Call delete API
                  // }
                }}
              />
            </TabsContent>

            <TabsContent value="paid">
              <CommissionPaidLiquidations initialLiquidations={liquidations?.data || []} />
            </TabsContent>

            <TabsContent value="details">
              {selectedLiquidationId ? (
                <CommissionLiquidationDetail
                  liquidationId={selectedLiquidationId}
                  onBack={handleBackToList}
                />
              ) : (
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center text-muted-foreground">
                      Selecciona una liquidación para ver los detalles
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="reports">
              <CommissionReport />
            </TabsContent>

            <TabsContent value="approvals">
              <CommissionPendingApprovals
                initialApprovals={
                  (pendingApprovals || []).map((approval) => ({
                    id: approval.id,
                    professional_name: approval.professional_name || 'N/A',
                    specialty_name: approval.specialty_name,
                    period_start: approval.period_start,
                    period_end: approval.period_end,
                    total_services: approval.total_services,
                    total_amount: approval.total_amount || approval.gross_amount || 0,
                    commission_percentage: approval.commission_percentage,
                    commission_amount: approval.commission_amount,
                    created_at: approval.created_at,
                  }))
                }
                onViewDetail={(liquidationId) => handleViewDetails(liquidationId)}
              />
            </TabsContent>

            <TabsContent value="settings">
              <CommissionSettings professionals={professionals} defaultCommission={defaultCommission} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  )
}