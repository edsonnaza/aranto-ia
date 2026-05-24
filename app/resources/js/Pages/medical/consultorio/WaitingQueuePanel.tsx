import { Users, AlertTriangle, Clock } from 'lucide-react'

export interface WaitingPatient {
  id: number
  patient: string
  priority?: string
  fresh?: boolean
}

interface Props {
  patients: WaitingPatient[]
}

function PriorityBadge({ priority }: { priority?: string }) {
  if (priority === 'urgent') {
    return (
      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/40">
        <AlertTriangle size={10} className="text-red-400" />
        <span className="text-[10px] font-bold text-red-400 tracking-wide uppercase">Urgente</span>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/25">
      <Clock size={10} className="text-sky-400/80" />
      <span className="text-[10px] font-semibold text-sky-400/80 tracking-wide uppercase">Normal</span>
    </div>
  )
}

function QueueItem({ patient: p, position }: { patient: WaitingPatient; position: number }) {
  const isUrgent = p.priority === 'urgent'

  return (
    <div
      className={[
        'relative overflow-hidden rounded-xl transition-all duration-300',
        isUrgent
          ? 'bg-linear-to-r from-red-950/60 to-slate-900/60 border border-red-500/40'
          : 'bg-slate-900/40 border border-slate-700/30 hover:border-sky-700/40 hover:bg-slate-800/40',
        p.fresh ? 'animate-fade-in' : '',
      ].join(' ')}
    >
      {isUrgent && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500/70 rounded-l-xl" />
      )}

      <div className={['flex items-center gap-3 py-3', isUrgent ? 'pl-4 pr-3' : 'px-3'].join(' ')}>
        {/* position number */}
        <div
          className={[
            'shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold',
            isUrgent
              ? 'bg-red-500/20 border border-red-500/30 text-red-400'
              : 'bg-slate-800/60 border border-slate-700/40 text-slate-400',
          ].join(' ')}
        >
          {position}
        </div>

        {/* name */}
        <p className="flex-1 min-w-0 font-semibold text-base text-slate-200 truncate leading-tight">
          {p.patient}
        </p>

        <PriorityBadge priority={p.priority} />
      </div>
    </div>
  )
}

export default function WaitingQueuePanel({ patients }: Props) {
  const urgentCount = patients.filter(p => p.priority === 'urgent').length

  return (
    <div className="flex flex-col h-full">
      {/* header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center shrink-0">
          <Users size={17} className="text-sky-400" />
        </div>
        <div>
          <h2 className="text-sm font-bold tracking-[0.12em] text-sky-400 uppercase">
            En Espera
          </h2>
          <p className="text-[11px] text-slate-500">
            {urgentCount > 0 ? `${urgentCount} urgente${urgentCount > 1 ? 's' : ''}` : 'Cola de turnos'}
          </p>
        </div>
        <div
          className={[
            'ml-auto flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold',
            patients.length > 0
              ? 'bg-sky-500/15 border border-sky-500/20 text-sky-400'
              : 'bg-slate-800/50 border border-slate-700/30 text-slate-500',
          ].join(' ')}
        >
          {patients.length}
        </div>
      </div>

      {/* list */}
      <div className="flex flex-col gap-2 flex-1 overflow-auto">
        {patients.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center mb-3">
              <Users size={28} className="text-slate-600" />
            </div>
            <p className="text-slate-500 text-sm">Sin pacientes en espera</p>
          </div>
        ) : (
          patients.map((p, i) => (
            <QueueItem key={p.id} patient={p} position={i + 1} />
          ))
        )}
      </div>
    </div>
  )
}
