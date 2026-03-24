import React, { useEffect, useState } from 'react'
import { Head } from '@inertiajs/react'
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

interface ProfessionalWithCommission {
  id: number
  full_name: string
  specialty: string
  commission_percentage: number
  pending_services_count: number
  pending_amount: number
  commission_amount: number
}

interface CommissionIndexProps {
  professionals: Professional[]
  liquidations?: {
    data: CommissionLiquidation[]
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number
    to: number
    path: string
    links: Array<{ url: string | null; label: string; active: boolean }>
  }
  pendingApprovals?: CommissionLiquidation[]
  defaultCommission?: number
  filters?: {
    professional_id?: string
    status?: string
    date_from?: string
    date_to?: string
  }
  initialTab?: string
  selectedLiquidationId?: number | null
  editingLiquidationId?: number | null
  createProfessionalId?: number | null
  professionalsWithPendingCommissions?: ProfessionalWithCommission[]
}

export default function CommissionIndex({ 
  professionals, 
  liquidations, 
  pendingApprovals, 
  defaultCommission = 10,
  filters = {},
  initialTab = 'dashboard',
  selectedLiquidationId: initialSelectedLiquidationId = null,
  editingLiquidationId: initialEditingLiquidationId = null,
  createProfessionalId = null,
  professionalsWithPendingCommissions = []
}: CommissionIndexProps) {
  // const { props } = usePage()
  const [activeTab, setActiveTab] = useState(initialTab)
  const [selectedLiquidationId, setSelectedLiquidationId] = useState<number | null>(initialSelectedLiquidationId)
  const [editingLiquidationId, setEditingLiquidationId] = useState<number | null>(initialEditingLiquidationId)

  const syncTabUrl = (tab: string, options?: {
    liquidationId?: number | null
    editLiquidationId?: number | null
    createProfessionalId?: number | null
  }) => {
    const params = new URLSearchParams(window.location.search)

    params.set('tab', tab)

    if (options?.liquidationId) {
      params.set('liquidation_id', String(options.liquidationId))
    } else {
      params.delete('liquidation_id')
    }

    if (options?.editLiquidationId) {
      params.set('edit_liquidation_id', String(options.editLiquidationId))
    } else {
      params.delete('edit_liquidation_id')
    }

    if (options?.createProfessionalId) {
      params.set('create_professional_id', String(options.createProfessionalId))
    } else {
      params.delete('create_professional_id')
    }

    const nextQuery = params.toString()
    const nextUrl = nextQuery ? `${window.location.pathname}?${nextQuery}` : window.location.pathname
    window.history.replaceState(window.history.state, '', nextUrl)
  }

  useEffect(() => {
    setActiveTab(initialTab)
    setSelectedLiquidationId(initialSelectedLiquidationId)
    setEditingLiquidationId(initialEditingLiquidationId)
  }, [initialEditingLiquidationId, initialSelectedLiquidationId, initialTab])

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)

    if (tab === 'details' && selectedLiquidationId) {
      syncTabUrl(tab, { liquidationId: selectedLiquidationId })
      return
    }

    if (tab === 'create') {
      syncTabUrl(tab)
      return
    }

    syncTabUrl(tab)
  }

  const handleViewDetails = (liquidationId: number) => {
    setSelectedLiquidationId(liquidationId)
    setActiveTab('details')
    syncTabUrl('details', { liquidationId })
  }

  const handleBackToList = () => {
    setSelectedLiquidationId(null)
    setActiveTab('list')
    syncTabUrl('list')
  }

  const handleLiquidationSuccess = () => {
    setActiveTab('list')
  }

  return (
    <AppLayout>
      <Head title="Comisiones" />

      <div className="py-6">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
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
              <CommissionDashboard professionalsWithPendingCommissions={professionalsWithPendingCommissions} />
            </TabsContent>

            <TabsContent value="create">
              <CommissionLiquidationForm
                professionals={professionals}
                liquidationId={editingLiquidationId}
                initialProfessionalId={createProfessionalId}
                onSuccess={() => {
                  setEditingLiquidationId(null)
                  setActiveTab('list')
                  syncTabUrl('list')
                }}
                onCancel={() => {
                  setEditingLiquidationId(null)
                  setActiveTab('dashboard')
                  syncTabUrl('dashboard')
                }}
              />
            </TabsContent>

            <TabsContent value="list">
              <CommissionLiquidationList
                liquidations={liquidations || { data: [], current_page: 1, last_page: 1, per_page: 20, total: 0, from: 1, to: 0, path: '', links: [] }}
                filters={filters}
                onEdit={(liquidation) => {
                  setEditingLiquidationId(liquidation.id)
                  setActiveTab('create')
                  syncTabUrl('create', { editLiquidationId: liquidation.id })
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
                onEdit={(liquidationId) => {
                  setEditingLiquidationId(liquidationId)
                  setActiveTab('create')
                  syncTabUrl('create', { editLiquidationId: liquidationId })
                }}
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