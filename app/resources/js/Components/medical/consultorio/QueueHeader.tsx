import { Badge } from '@/components/ui/badge'
import type { QueuePagination } from '@/hooks/medical/useConsultorioRealtime'

interface QueueHeaderProps {
  pagination: QueuePagination
}

export default function QueueHeader({ pagination }: QueueHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">Cola médica en tiempo real</p>
        <h1 className="text-2xl font-semibold tracking-tight">Mi Cola de Pacientes</h1>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="default">{pagination.total} pacientes</Badge>
        <Badge variant="secondary">Página {pagination.current_page} de {pagination.last_page}</Badge>
        <Badge variant="outline">Mostrando {pagination.data.length} registros</Badge>
      </div>
    </div>
  )
}
