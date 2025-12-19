import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
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

  useEffect(() => {
    if (isOpen && liquidationId) {
      loadItems()
    }
  }, [isOpen, liquidationId])

  const loadItems = async () => {
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
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <div className="flex-1">
            <DialogTitle>{liquidationTitle}</DialogTitle>
            {professionalName && (
              <DialogDescription>
                Profesional: {professionalName}
              </DialogDescription>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-6 w-6"
          >
            <X className="h-4 w-4" />
          </Button>
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
