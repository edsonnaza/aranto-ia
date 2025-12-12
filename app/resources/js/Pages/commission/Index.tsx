import React, { useState } from 'react'
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
  CommissionSettings
} from '@/components/commission'
import type { Professional } from '@/types'

interface CommissionIndexProps {
  professionals: Professional[]
}

export default function CommissionIndex({ professionals }: CommissionIndexProps) {
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
            <TabsList className="grid w-full grid-cols-7">
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
                onViewDetail={(liquidationId) => handleViewDetails(liquidationId)}
              />
            </TabsContent>

            <TabsContent value="settings">
              <CommissionSettings professionals={professionals} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  )
}