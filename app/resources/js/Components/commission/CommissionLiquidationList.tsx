import React, { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Eye, Edit, Trash2, CheckCircle, Clock, AlertCircle, MoreHorizontal, XCircle } from 'lucide-react'
import { router } from '@inertiajs/react'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { DataTable, PaginatedData } from '@/components/ui/data-table'
import { CommissionItemsModal } from './commission-items-modal'
import { useCommissionLiquidations } from '@/hooks/medical'
import { useDateFormat } from '@/hooks/useDateFormat'
import { useCurrencyFormatter } from '@/stores/currency'
import { getStatusColor, getStatusClassName } from '@/lib/constants/status-colors'
import { cn } from '@/lib/utils'
import type { CommissionLiquidation } from '@/types'


interface CommissionLiquidationListProps {
  liquidations: PaginatedData<CommissionLiquidation>
  filters: {
    professional_id?: string
    status?: string
    date_from?: string
    date_to?: string
  }
  onViewDetails?: (liquidation: CommissionLiquidation) => void
  onEdit?: (liquidation: CommissionLiquidation) => void
  onDelete?: (liquidation: CommissionLiquidation) => void
}

export default CommissionLiquidationList;

function CommissionLiquidationList({
  liquidations,
  filters,
  onViewDetails,
  onEdit,
  onDelete,
}: CommissionLiquidationListProps) {
  const { toBackend } = useDateFormat()
  const { format: formatCurrency } = useCurrencyFormatter()
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [confirmCancelDialogOpen, setConfirmCancelDialogOpen] = useState(false)
  const [selectedLiquidation, setSelectedLiquidation] = useState<CommissionLiquidation | null>(null)
  const [showItemsModal, setShowItemsModal] = useState(false)
  const [selectedItemsLiquidation, setSelectedItemsLiquidation] = useState<CommissionLiquidation | null>(null)

  // Usar el hook solo para delete y cancel
  const { deleteLiquidation, cancelLiquidation, error } = useCommissionLiquidations()

  const handleDeleteClick = (liquidation: CommissionLiquidation) => {
    setSelectedLiquidation(liquidation)
    setConfirmDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (!selectedLiquidation) return

    deleteLiquidation(selectedLiquidation.id, {
      onSuccess: () => {
        setSelectedLiquidation(null)
        // Refresca solo los datos necesarios usando Inertia
        router.reload({ only: ['liquidations'] })
      }
    })
  }

  const handleCancelClick = (liquidation: CommissionLiquidation) => {
    setSelectedLiquidation(liquidation)
    setConfirmCancelDialogOpen(true)
  }

  const handleConfirmCancel = () => {
    if (!selectedLiquidation) return

    cancelLiquidation(selectedLiquidation.id, {
      onSuccess: () => {
        setSelectedLiquidation(null)
        // Refresca solo los datos necesarios usando Inertia
        router.reload({ only: ['liquidations'] })
      }
    })
  }

  const getStatusBadge = (status: string) => {
    const config = getStatusColor(status)
    
    if (!config) {
      return <Badge variant="outline">{status}</Badge>
    }

    const iconMap: Record<string, React.ReactNode> = {
      pending: <Clock className="h-3 w-3" />,
      approved: <CheckCircle className="h-3 w-3" />,
      paid: <CheckCircle className="h-3 w-3" />,
      cancelled: <AlertCircle className="h-3 w-3" />,
      draft: <AlertCircle className="h-3 w-3" />,
    }

    return (
      <span className={cn('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium', getStatusClassName(status))}>
        {iconMap[status]}
        {config.label}
      </span>
    )
  }

  // Define columns for DataTable
  const columns = useMemo<ColumnDef<CommissionLiquidation>[]>(() => [
    {
      accessorKey: "professional_name",
      header: "Profesional",
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="font-medium">{row.getValue("professional_name")}</div>
          <div className="text-xs text-muted-foreground">
            {row.original.specialty_name}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "period_start",
      header: "Período",
      cell: ({ row }) => (
        <div className="text-sm">
          {format(new Date(row.getValue("period_start")), 'dd/MM/yyyy', { locale: es })} - {format(new Date(row.original.period_end), 'dd/MM/yyyy', { locale: es })}
        </div>
      ),
    },
    {
      accessorKey: "total_services",
      header: "Servicios",
      cell: ({ row }) => (
        <div className="text-center">
          {row.getValue("total_services")}
        </div>
      ),
    },
    {
      accessorKey: "total_amount",
      header: "Monto Total",
      cell: ({ row }) => {
        const total = row.getValue("total_amount") as number
        return (
          <div className="text-right font-medium">
            {formatCurrency(total)}
          </div>
        )
      },
    },
    {
      accessorKey: "commission_amount",
      header: "Comisión",
      cell: ({ row }) => (
        <div className="text-right">
          <div className="font-medium">
            {formatCurrency(row.getValue("commission_amount"))}
          </div>
          <div className="text-sm text-muted-foreground">
            ({row.original.commission_percentage}%)
          </div>
        </div>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Fecha Creación",
      cell: ({ row }) => (
        <div className="text-sm">
          {format(new Date(row.getValue("created_at")), 'dd/MM/yyyy', { locale: es })}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => getStatusBadge(row.getValue("status")),
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem 
              onClick={() => {
                setSelectedItemsLiquidation(row.original)
                setShowItemsModal(true)
              }}
            >
              <Eye className="mr-2 h-4 w-4" />
              Ver Items
            </DropdownMenuItem>
            {onViewDetails && (
              <DropdownMenuItem onClick={() => onViewDetails(row.original)}>
                <Eye className="mr-2 h-4 w-4" />
                Ver Detalles
              </DropdownMenuItem>
            )}
            {onEdit && row.original.status === 'draft' && (
              <DropdownMenuItem onClick={() => onEdit(row.original)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
            )}
            {row.original.status === 'approved' && (
              <DropdownMenuItem
                onClick={() => handleCancelClick(row.original)}
                className="text-orange-600"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancelar Aprobación
              </DropdownMenuItem>
            )}
            {onDelete && row.original.status === 'draft' && (
              <DropdownMenuItem
                onClick={() => handleDeleteClick(row.original)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [formatCurrency, onViewDetails, onEdit, onDelete])

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Liquidaciones de Comisiones</CardTitle>
          <CardDescription>
            {liquidations.total} liquidaciones encontradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <DataTable
            columns={columns}
            data={liquidations}
            searchPlaceholder="Buscar por profesional o número..."
            emptyMessage="No se encontraron liquidaciones con los filtros aplicados"
            statusFilterable={true}
            statusOptions={[
              { value: 'draft', label: 'Borrador' },
              { value: 'pending', label: 'Pendiente' },
              { value: 'approved', label: 'Aprobado' },
              { value: 'paid', label: 'Pagado' },
              { value: 'cancelled', label: 'Cancelado' },
            ]}
            dateRangeFilterable={true}
            onDateRangeChange={({ from, to }) => {
              const params = new URLSearchParams(window.location.search)
              if (from) params.set('date_from', toBackend(from))
              else params.delete('date_from')
              if (to) params.set('date_to', toBackend(to))
              else params.delete('date_to')
              params.set('page', '1')
              const url = window.location.pathname + '?' + params.toString()
              router.get(url, {}, { preserveState: true, replace: true })
            }}
            onStatusChange={(status) => {
              const params = new URLSearchParams(window.location.search)
              if (status !== 'all') params.set('status', status)
              else params.delete('status')
              params.set('page', '1')
              const url = window.location.pathname + '?' + params.toString()
              router.get(url, {}, { preserveState: true, replace: true })
            }}
            initialDateFrom={filters.date_from || ""}
            initialDateTo={filters.date_to || ""}
            initialStatus={filters.status || "all"}
          />
        </CardContent>
      </Card>

      {/* Confirmation Dialog for Delete */}
      <ConfirmationDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        title="Eliminar Liquidación"
        description={
          selectedLiquidation
            ? `¿Está seguro de eliminar la liquidación de ${selectedLiquidation.professional_name}? Esta acción no se puede deshacer.`
            : ''
        }
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={handleConfirmDelete}
        variant="destructive"
      />

      {/* Confirmation Dialog for Cancel Approval */}
      <ConfirmationDialog
        open={confirmCancelDialogOpen}
        onOpenChange={setConfirmCancelDialogOpen}
        title="Cancelar Aprobación"
        description={
          selectedLiquidation
            ? `¿Está seguro de cancelar la aprobación de la liquidación de ${selectedLiquidation.professional_name} por ${formatCurrency(selectedLiquidation.commission_amount)}? La liquidación volverá a estado borrador.`
            : ''
        }
        confirmText="Cancelar Aprobación"
        cancelText="Mantener Aprobación"
        onConfirm={handleConfirmCancel}
        variant="destructive"
      />

      {/* Commission Items Modal */}
      <CommissionItemsModal
        isOpen={showItemsModal}
        onClose={() => {
          setShowItemsModal(false)
          setSelectedItemsLiquidation(null)
        }}
        liquidationId={selectedItemsLiquidation?.id || 0}
      />
    </div>
  )
}