import React, { useState, useMemo } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Settings, User, Edit, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '../ui/data-table' 
//import { DataTableProps } from '@/components/ui/data-table'
import { useProfessionalCommissions } from '@/hooks/useProfessionalCommissions'

import type { Professional } from '@/types'

interface CommissionSettingsProps {
  professionals: Professional[]
  defaultCommission: number
}

interface ProfessionalRow {
  id: number
  first_name: string
  last_name: string
  specialty: string
  commission_percentage: number | null
  isCustom: boolean
  defaultCommission: number
}

export default function CommissionSettings({
  professionals: initialProfessionals,
  defaultCommission,
}: CommissionSettingsProps) {
  const { loading: updating, error: updateError, updateCommission } = useProfessionalCommissions()
  const [professionals, setProfessionals] = useState<Professional[]>(initialProfessionals)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editValue, setEditValue] = useState<string>('')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleEditClick = (professionalId: number, currentPercentage: number) => {
    setEditingId(professionalId)
    setEditValue(currentPercentage.toString())
    setSaveError(null)
    setSuccessMessage(null)
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditValue('')
    setSaveError(null)
  }

  const handleSave = async (professionalId: number, professionalName: string) => {
    try {
      setSaveError(null)
      setSuccessMessage(null)

      const percentage = parseFloat(editValue)
      if (isNaN(percentage) || percentage < 0 || percentage > 100) {
        setSaveError('El porcentaje debe ser un número entre 0 y 100')
        return
      }

      await updateCommission(professionalId, percentage)

      // Actualizar el estado local
      setProfessionals(prevProfessionals =>
        prevProfessionals.map(p =>
          p.id === professionalId
            ? { ...p, commission_percentage: percentage }
            : p
        )
      )

      setSuccessMessage(`Comisión de ${professionalName} actualizada a ${percentage}%`)
      setEditingId(null)
      setEditValue('')

      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Error al guardar')
    }
  }

  // Preparar datos para la tabla
  const tableData: ProfessionalRow[] = useMemo(() => {
    return professionals.map(professional => {
      const specialty =
        professional.specialties && professional.specialties.length > 0
          ? professional.specialties.length === 1
            ? professional.specialties[0].name
            : `${professional.specialties[0].name} + ${professional.specialties.length - 1}`
          : 'Sin especialidad'

      return {
        id: professional.id,
        first_name: professional.first_name || '',
        last_name: professional.last_name || '',
        specialty,
        commission_percentage: professional.commission_percentage ?? null,
        isCustom: professional.commission_percentage !== null && professional.commission_percentage !== undefined,
        defaultCommission,
      }
    })
  }, [professionals, defaultCommission])

  // Definir columnas de la tabla
  const columns: ColumnDef<ProfessionalRow>[] = [
    {
      id: 'name',
      header: 'Profesional',
      accessorFn: (row) => `${row.first_name} ${row.last_name}`,
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.first_name} {row.original.last_name}</div>
          <div className="text-sm text-muted-foreground">{row.original.specialty}</div>
        </div>
      ),
    },
    {
      id: 'commission',
      header: 'Porcentaje de Comisión',
      cell: ({ row }) => {
        const percentage = row.original.commission_percentage ?? row.original.defaultCommission
        const isCustom = row.original.isCustom

        if (editingId === row.original.id) {
          return (
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.10"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder="0"
                  className="w-20 text-center"
                />
                <span className="ml-1 text-sm font-medium">%</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleSave(row.original.id, `${row.original.first_name} ${row.original.last_name}`)}
                disabled={updating}
                className="gap-1"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
                disabled={updating}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )
        }

        return (
          <div className="flex items-center gap-3">
            <div className="text-left">
              <div className="text-lg font-bold text-blue-600">{percentage}%</div>
              <div className="text-xs text-muted-foreground">
             
              </div>
            </div>
            {isCustom && <Badge variant="secondary">Personalizado</Badge>}
          </div>
        )
      },
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => {
        if (editingId === row.original.id) {
          return null
        }

        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleEditClick(row.original.id, row.original.commission_percentage ?? row.original.defaultCommission)}
            className="gap-1"
          >
            <Edit className="h-4 w-4" />
            Editar
          </Button>
        )
      },
    },
  ]

  // Crear estructura de datos para DataTable
  const paginatedData = {
    data: tableData,
    current_page: 1,
    per_page: 20,
    total: tableData.length,
    last_page: 1,
    from: 1,
    to: tableData.length,
    links: [],
  }

  return (
    <div className="space-y-6">
      {/* Default Commission Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuración General de Comisiones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Porcentaje de Comisión Predeterminado</label>
              <div className="mt-2 flex items-center gap-3">
                <div className="text-3xl font-bold text-blue-600">{defaultCommission}%</div>
                <p className="text-sm text-muted-foreground">
                  Este es el porcentaje que se aplica a todos los profesionales sin comisión personalizada
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Professional Commissions Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Comisiones por Profesional
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Edita los porcentajes individuales para cada profesional. Si está vacío, se usará el predeterminado.
          </p>
        </CardHeader>
        <CardContent>
          {updateError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{updateError}</AlertDescription>
            </Alert>
          )}

          {saveError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{saveError}</AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <Alert className="mb-4 bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
            </Alert>
          )}

          {professionals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay profesionales registrados
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={paginatedData}
              searchable={true}
              searchPlaceholder="Buscar profesional..."
              searchKey="name"
              emptyMessage="No se encontraron profesionales"
              pageSizes={[10, 20, 50]}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}