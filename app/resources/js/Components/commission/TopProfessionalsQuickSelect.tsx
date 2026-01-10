import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles } from 'lucide-react'

interface TopProfessional {
  id: number
  full_name: string
  specialty: string
  commission_percentage: number
  pending_services_count: number
  pending_amount: number
  commission_amount: number
  period_start?: string
  period_end?: string
}

interface TopProfessionalsQuickSelectProps {
  limit?: number
  onSelectProfessional: (professionalId: number, startDate?: string, endDate?: string) => void
  loading?: boolean
}

export const TopProfessionalsQuickSelect: React.FC<TopProfessionalsQuickSelectProps> = ({
  limit = 5,
  onSelectProfessional,
  loading = false
}) => {
  const [professionals, setProfessionals] = useState<TopProfessional[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTopProfessionals = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/medical/commissions/top-professionals?limit=${limit}`)

        if (!response.ok) {
          throw new Error('Error al obtener profesionales')
        }

        const data = await response.json()
        setProfessionals(data.professionals || [])
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
        setProfessionals([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchTopProfessionals()
  }, [limit])

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            Cargando profesionales...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="text-center text-red-700">
            {error}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (professionals.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="text-center text-green-700">
            No hay profesionales con comisiones pendientes
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-yellow-500" />
          Top {Math.min(professionals.length, limit)} Profesionales con Mayor Comisión Pendiente
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {professionals.map((prof, index) => (
            <div
              key={prof.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                    #{index + 1}
                  </Badge>
                  <h4 className="font-semibold text-gray-900">
                    {prof.full_name}
                  </h4>
                  <Badge variant="secondary" className="ml-2">
                    {prof.commission_percentage}%
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {prof.specialty} • {prof.pending_services_count} servicios sin liquidar
                </p>
                <div className="flex gap-4 mt-2 text-sm">
                  <span className="text-gray-700">
                    <span className="font-medium text-red-600">₲{(prof.pending_amount).toLocaleString('es-PY')}</span> pendiente
                  </span>
                  <span className="text-gray-700">
                    <span className="font-medium text-green-600">₲{(prof.commission_amount).toLocaleString('es-PY')}</span> a cobrar
                  </span>
                </div>
              </div>
              <Button
                onClick={() => onSelectProfessional(prof.id, prof.period_start, prof.period_end)}
                disabled={loading}
                className="ml-4 whitespace-nowrap"
              >
                Seleccionar
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
