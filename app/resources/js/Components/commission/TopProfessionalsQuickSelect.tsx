import React, { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, ChevronUp, Search, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TopProfessional {
  id: number
  group_key?: string
  reception_group?: 'scheduled' | 'without_schedule'
  reception_label?: string
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

type ReceptionFilter = 'all' | 'scheduled' | 'without_schedule'

export const TopProfessionalsQuickSelect: React.FC<TopProfessionalsQuickSelectProps> = ({
  limit = 50,
  onSelectProfessional,
  loading = false
}) => {
  const [professionals, setProfessionals] = useState<TopProfessional[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [receptionFilter, setReceptionFilter] = useState<ReceptionFilter>('all')
  const [selectedKey, setSelectedKey] = useState<string | null>(null)

  const getProfessionalKey = (professional: TopProfessional) => {
    return professional.group_key || `${professional.id}-${professional.reception_group || 'default'}`
  }

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

  const filteredProfessionals = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return professionals.filter((professional) => {
      const matchesType = receptionFilter === 'all' || professional.reception_group === receptionFilter
      const matchesSearch = !normalizedSearch || professional.full_name.toLowerCase().includes(normalizedSearch)

      return matchesType && matchesSearch
    })
  }, [professionals, receptionFilter, searchTerm])

  const typeCounts = useMemo(() => {
    return professionals.reduce(
      (counts, professional) => {
        if (professional.reception_group === 'scheduled') {
          counts.scheduled += 1
        } else {
          counts.without_schedule += 1
        }

        return counts
      },
      { all: professionals.length, scheduled: 0, without_schedule: 0 }
    )
  }, [professionals])

  const selectedProfessional = useMemo(() => {
    if (!selectedKey) return null

    return professionals.find((professional) => getProfessionalKey(professional) === selectedKey) || null
  }, [professionals, selectedKey])

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
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <Card className="overflow-hidden">
        <CardHeader className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              Top {Math.min(professionals.length, limit)} Profesionales con Mayor Comisión Pendiente
            </CardTitle>
            <CollapsibleTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="shrink-0 gap-2">
                {isExpanded ? (
                  <>
                    Contraer <ChevronUp className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Ver atajos <ChevronDown className="h-4 w-4" />
                  </>
                )}
              </Button>
            </CollapsibleTrigger>
          </div>

          {selectedProfessional && !isExpanded && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/40 px-3 py-2 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">Seleccionado</Badge>
                <span className="font-medium text-foreground">{selectedProfessional.full_name}</span>
                <Badge
                  variant="outline"
                  className={selectedProfessional.reception_group === 'scheduled'
                    ? 'border-blue-300 bg-blue-50 text-blue-700'
                    : 'border-amber-300 bg-amber-50 text-amber-700'}
                >
                  {selectedProfessional.reception_label || (selectedProfessional.reception_group === 'scheduled' ? 'Consulta agendada' : 'Sin agenda')}
                </Badge>
                <span className="text-muted-foreground">{selectedProfessional.specialty}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsExpanded(true)}>
                  Cambiar
                </Button>
              </div>
            </div>
          )}
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-4 pt-0">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Buscar profesional</label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Buscar por nombre..."
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2 md:justify-end">
                {([
                  { key: 'all', label: `Todos (${typeCounts.all})` },
                  { key: 'scheduled', label: `Agendadas (${typeCounts.scheduled})` },
                  { key: 'without_schedule', label: `Sin agenda (${typeCounts.without_schedule})` },
                ] as const).map((filter) => (
                  <Button
                    key={filter.key}
                    type="button"
                    variant={receptionFilter === filter.key ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setReceptionFilter(filter.key)}
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Mostrando {filteredProfessionals.length} de {professionals.length}
              </span>
              <span>Se contrae automáticamente al seleccionar</span>
            </div>

            <div className="max-h-105 space-y-3 overflow-y-auto pr-1">
              {filteredProfessionals.length === 0 ? (
                <div className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
                  No hay resultados para el filtro seleccionado.
                </div>
              ) : (
                filteredProfessionals.map((prof, index) => {
                  const cardKey = getProfessionalKey(prof)

                  return (
                    <div
                      key={cardKey}
                      className={cn(
                        'flex flex-col gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/40 md:flex-row md:items-center md:justify-between',
                        selectedKey === cardKey && 'border-primary bg-primary/5'
                      )}
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                            #{index + 1}
                          </Badge>
                          <h4 className="font-semibold text-gray-900">{prof.full_name}</h4>
                          <Badge variant="secondary">{prof.commission_percentage}%</Badge>
                          <Badge
                            variant="outline"
                            className={prof.reception_group === 'scheduled'
                              ? 'border-blue-300 bg-blue-50 text-blue-700'
                              : 'border-amber-300 bg-amber-50 text-amber-700'}
                          >
                            {prof.reception_label || (prof.reception_group === 'scheduled' ? 'Consulta agendada' : 'Sin agenda')}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {prof.specialty} • {prof.pending_services_count} servicios sin liquidar
                        </p>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <span className="text-gray-700">
                            <span className="font-medium text-red-600">₲{prof.pending_amount.toLocaleString('es-PY')}</span> pendiente
                          </span>
                          <span className="text-gray-700">
                            <span className="font-medium text-green-600">₲{prof.commission_amount.toLocaleString('es-PY')}</span> a cobrar
                          </span>
                        </div>
                      </div>

                      <Button
                        onClick={() => {
                          setSelectedKey(cardKey)
                          onSelectProfessional(prof.id, prof.period_start, prof.period_end)
                          setIsExpanded(false)
                        }}
                        disabled={loading}
                        className="shrink-0 whitespace-nowrap"
                      >
                        Seleccionar
                      </Button>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
