import React, { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CheckCircle2, CheckCheck, Filter, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import SearchableInput from '@/components/ui/SearchableInput'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useCommissionAuthorizations } from '@/hooks/medical'
import { useSearch } from '@/hooks/medical'
import type { ScheduledConsultationAuthorization } from '@/types/commission'

interface PaginationLink {
  url: string | null
  label: string
  active: boolean
}

interface PaginatedScheduledConsultations {
  data: ScheduledConsultationAuthorization[]
  current_page: number
  last_page: number
  links: PaginationLink[]
  total: number
}

interface AuthorizationFilters {
  authorization_date_from: string
  authorization_date_to: string
  authorization_professional_id?: string | null
}

interface ProfessionalOption {
  id: number
  first_name: string
  last_name: string
}

interface CommissionScheduledAuthorizationsProps {
  scheduledConsultations: PaginatedScheduledConsultations
  filters: AuthorizationFilters
  professionals: ProfessionalOption[]
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-PY', {
    style: 'currency',
    currency: 'PYG',
  }).format(amount)
}

const formatDate = (date: string | null): string => {
  if (!date) return '-'

  try {
    return format(new Date(`${date}T00:00:00`), 'dd/MM/yyyy', { locale: es })
  } catch {
    return date
  }
}

export default function CommissionScheduledAuthorizations({
  scheduledConsultations,
  filters,
  professionals,
}: CommissionScheduledAuthorizationsProps) {
  const { loading, filterAuthorizations, setConsultationAuthorization, bulkAuthorizeAll } = useCommissionAuthorizations()
  const { searchProfessionals } = useSearch()

  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])

  const [dateFrom, setDateFrom] = useState(filters.authorization_date_from || today)
  const [dateTo, setDateTo] = useState(filters.authorization_date_to || today)
  const [professionalId, setProfessionalId] = useState(filters.authorization_professional_id || 'all')
  const [professionalLabel, setProfessionalLabel] = useState(() => {
    if (!filters.authorization_professional_id) return ''

    const selected = professionals.find(
      (professional) => String(professional.id) === String(filters.authorization_professional_id)
    )

    return selected
      ? [selected.first_name, selected.last_name].filter(Boolean).join(' ')
      : ''
  })
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [selectedAuthorization, setSelectedAuthorization] = useState<ScheduledConsultationAuthorization | null>(null)
  const [confirmBulkOpen, setConfirmBulkOpen] = useState(false)

  const pendingCount = useMemo(
    () => scheduledConsultations.data.filter((item) => !item.is_authorized).length,
    [scheduledConsultations.data]
  )

  const handleFilter = () => {
    filterAuthorizations({
      authorization_date_from: dateFrom,
      authorization_date_to: dateTo,
      authorization_professional_id: professionalId === 'all' ? undefined : professionalId,
    })
  }

  const handleOpenConfirm = (item: ScheduledConsultationAuthorization) => {
    setSelectedAuthorization(item)
    setConfirmOpen(true)
  }

  const handleConfirmAuthorization = () => {
    if (!selectedAuthorization) return

    setConfirmOpen(false)
    setConsultationAuthorization(selectedAuthorization.id, !selectedAuthorization.is_authorized)
    setSelectedAuthorization(null)
  }

  useEffect(() => {
    // Si no llegan filtros iniciales, cargar por defecto agenda del día para todos.
    if (!filters.authorization_date_from || !filters.authorization_date_to) {
      filterAuthorizations({
        authorization_date_from: today,
        authorization_date_to: today,
        authorization_professional_id: undefined,
      })
    }
  }, [filterAuthorizations, filters.authorization_date_from, filters.authorization_date_to, today])

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Autorización de Consultas Agendadas
            </span>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{scheduledConsultations.total} registros</Badge>
              <Badge variant="outline">{pendingCount} pendientes</Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="authorization_date_from">Fecha inicio</Label>
              <Input
                id="authorization_date_from"
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="authorization_date_to">Fecha fin</Label>
              <Input
                id="authorization_date_to"
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Profesional</Label>
              <div className="flex items-center gap-2">
                <SearchableInput
                  value={professionalLabel}
                  placeholder="Buscar profesional..."
                  minSearchLength={0}
                  className="flex-1 [&_input]:h-10"
                  onSearch={searchProfessionals}
                  onSelect={(item) => {
                    setProfessionalId(String(item.id))
                    setProfessionalLabel(item.label)
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="h-10"
                  onClick={() => {
                    setProfessionalId('all')
                    setProfessionalLabel('')
                  }}
                >
                  Todos
                </Button>
              </div>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={handleFilter} disabled={loading || !dateFrom || !dateTo} className="flex-1">
                <Filter className="mr-2 h-4 w-4" />
                Filtrar
              </Button>
              <Button
                variant="outline"
                onClick={() => setConfirmBulkOpen(true)}
                disabled={loading || !dateFrom || !dateTo || pendingCount === 0}
                className="flex-1"
              >
                <CheckCheck className="mr-2 h-4 w-4" />
                Autorizar todos
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Profesional</TableHead>
                  <TableHead>Solicitud / Agenda</TableHead>
                  <TableHead>Servicios</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="text-right">Pagado</TableHead>
                  <TableHead className="text-center">Saldo pendiente</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-center">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scheduledConsultations.data.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                      No hay consultas agendadas en el rango seleccionado.
                    </TableCell>
                  </TableRow>
                )}

                {scheduledConsultations.data.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="font-medium">{item.patient_name}</div>
                      <div className="text-xs text-muted-foreground">{item.patient_document || '-'}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{item.professional_name || '-'}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{item.request_number}</div>
                      <div className="text-xs text-muted-foreground">
                        Solicitud: {formatDate(item.request_date)} | Agenda: {formatDate(item.scheduled_date)}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <span className="line-clamp-2 text-sm">{item.services_summary || '-'}</span>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(item.total_amount)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.paid_amount)}</TableCell>
                    <TableCell className="text-center">
                      {item.has_pending_balance ? (
                        <Badge variant="destructive">Si</Badge>
                      ) : (
                        <Badge variant="secondary">No</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.is_authorized ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                          Autorizado
                        </Badge>
                      ) : (
                        <Badge variant="outline">Pendiente</Badge>
                      )}
                      {item.is_liquidated && (
                        <Badge className="ml-2" variant="secondary">Liquidada</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        size="sm"
                        variant={item.is_authorized ? 'outline' : 'default'}
                        disabled={loading || (!item.can_authorize && !item.can_deauthorize)}
                        onClick={() => handleOpenConfirm(item)}
                      >
                        <CheckCircle2 className="mr-1 h-4 w-4" />
                        {item.is_authorized ? 'Desautorizar' : 'Autorizar'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {scheduledConsultations.last_page > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              {scheduledConsultations.links
                .filter((link) => link.url !== null)
                .map((link) => (
                  <Button
                    key={`${link.label}-${link.url}`}
                    type="button"
                    size="sm"
                    variant={link.active ? 'default' : 'outline'}
                    onClick={() => {
                      if (!link.url) return

                      const url = new URL(link.url)
                      const nextFrom = url.searchParams.get('authorization_date_from') || dateFrom
                      const nextTo = url.searchParams.get('authorization_date_to') || dateTo
                      const nextProfessionalId = url.searchParams.get('authorization_professional_id') || 'all'

                      setDateFrom(nextFrom)
                      setDateTo(nextTo)
                      setProfessionalId(nextProfessionalId)
                      if (nextProfessionalId === 'all') {
                        setProfessionalLabel('')
                      } else {
                        const selected = professionals.find(
                          (professional) => String(professional.id) === nextProfessionalId
                        )
                        setProfessionalLabel(selected
                          ? [selected.first_name, selected.last_name].filter(Boolean).join(' ')
                          : '')
                      }

                      filterAuthorizations({
                        authorization_date_from: nextFrom,
                        authorization_date_to: nextTo,
                        authorization_professional_id: nextProfessionalId === 'all' ? undefined : nextProfessionalId,
                      })
                    }}
                  >
                    {link.label.replace(/&laquo;|&raquo;/g, '').trim() || '...'}
                  </Button>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={confirmBulkOpen} onOpenChange={setConfirmBulkOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Autorizar todos en masa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción autorizará <strong>{pendingCount} consulta{pendingCount !== 1 ? 's' : ''}</strong> pendiente{pendingCount !== 1 ? 's' : ''} del filtro
              actual para liquidación de comisiones. Solo se autorizarán las que tengan saldo pendiente en cero
              y no hayan sido autorizadas previamente. ¿Desea continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmBulkOpen(false)
                bulkAuthorizeAll({
                  authorization_date_from: dateFrom,
                  authorization_date_to: dateTo,
                  authorization_professional_id: professionalId === 'all' ? undefined : professionalId,
                })
              }}
            >
              Sí, autorizar todos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedAuthorization?.is_authorized ? '¿Confirmar desautorización?' : '¿Confirmar autorización?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedAuthorization?.is_authorized
                ? 'Esta acción removerá la autorización de la consulta '
                : 'Esta acción habilitará la consulta '}
              {' '}
              <strong>{selectedAuthorization?.request_number ?? '-'}</strong>{' '}
              para liquidación de comisiones.
              {' '}
              {selectedAuthorization?.is_authorized
                ? 'No se permite desautorizar consultas ya liquidadas.'
                : 'Solo debe autorizarse si el saldo pendiente es cero.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedAuthorization(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAuthorization}>
              {selectedAuthorization?.is_authorized ? 'Sí, desautorizar' : 'Sí, autorizar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
