import { Badge } from '@/components/ui/badge'
import { Link } from '@inertiajs/react'
import { getPriorityLabel, getQueueStatusLabel } from '@/utils/formatters'
import type { QueueItem } from '@/hooks/medical/useConsultorioRealtime'
import QueueActions from './QueueActions'

interface QueueCardProps {
  item: QueueItem
  onCall: () => void
  onStart: () => void
}

const statusVariantMap: Record<string, 'default' | 'secondary' | 'pending' | 'paid' | 'destructive'> = {
  waiting: 'secondary',
  called: 'pending',
  in_consultation: 'paid',
  done: 'destructive',
}

export default function QueueCard({ item, onCall, onStart }: QueueCardProps) {
  const statusLabel = getQueueStatusLabel(item.status)
  const priorityLabel = getPriorityLabel(item.priority ?? 'normal')
  const statusVariant = statusVariantMap[item.status] ?? 'default'

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-base font-semibold text-slate-900">{item.patient.display}</p>
              <p className="text-sm text-slate-500">Paciente #{item.patient.id}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={statusVariant}>{statusLabel}</Badge>
              <Badge variant="outline">{priorityLabel}</Badge>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-500">
            <span>Agregado: {item.created_at}</span>
            {item.called_at ? <span>LLamado: {item.called_at}</span> : null}
            {item.started_at ? <span>Inicio: {item.started_at}</span> : null}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:items-end">
          <Link href={`/medical/patients/${item.patient.id}/medical-records/create`} className="inline-block">
            <Badge variant="secondary">Historia clínica</Badge>
          </Link>
          <QueueActions item={item} onCall={onCall} onStart={onStart} />
        </div>
      </div>
    </div>
  )
}
