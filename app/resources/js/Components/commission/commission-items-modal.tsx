import React, { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
  
import { CommissionItemsTable, CommissionItem } from './commission-items-table'

interface CommissionItemsModalProps {
  isOpen: boolean
  onClose: () => void
  liquidationId: number
  liquidationTitle?: string
  professionalName?: string
}

export function CommissionItemsModal({
  isOpen,
  onClose,
  liquidationId,
  liquidationTitle = `Liquidación #${liquidationId}`,
  professionalName = '',
}: CommissionItemsModalProps) {
  const [items, setItems] = useState<CommissionItem[]>([])
  const [loading, setLoading] = useState(false)

  const loadItems = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/medical/commissions/${liquidationId}/details`)
      if (response.ok) {
        const data = await response.json()
        setItems(data.details || [])
      }
    } catch (error) {
      console.error('Error loading commission items:', error)
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [liquidationId])

  useEffect(() => {
    if (isOpen && liquidationId) {
      loadItems()
    }
  }, [isOpen, liquidationId, loadItems])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[80vw]! max-h-[85vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <div className="flex-1">
            <DialogTitle>{liquidationTitle}</DialogTitle>
            {professionalName && (
              <DialogDescription>
                Profesional: {professionalName}
              </DialogDescription>
            )}
          </div>
        
        </DialogHeader>

        <div className="mt-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Cargando items...
            </div>
          ) : (
            <CommissionItemsTable
              items={items}
              title="Servicios Incluidos"
              showTitle={true}
              searchPlaceholder="Buscar por paciente o servicio..."
              emptyMessage="No hay servicios en esta liquidación"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
