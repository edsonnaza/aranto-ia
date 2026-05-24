import { Bell, Volume2 } from 'lucide-react'

export interface CalledPatient {
  id: number
  patient: string
  called_at?: string
  fresh?: boolean
}

interface Props {
  patients: CalledPatient[]
}

function timeLabel(called_at?: string) {
  if (!called_at) return null
  const d = new Date(called_at)
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

function CalledItem({ patient: p, index }: { patient: CalledPatient; index: number }) {
  const isFirst = index === 0

  return (
    <div
      className={[
        'relative overflow-hidden rounded-xl transition-all duration-500',
        isFirst
          ? 'bg-gradient-to-r from-amber-950/70 to-[#150f00]/80 border border-amber-500/50'
          : 'bg-slate-900/40 border border-slate-700/30',
        p.fresh ? 'animate-slide-in-top' : '',
      ].join(' ')}
    >
      {isFirst && (
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/80 to-transparent" />
      )}
      {isFirst && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400/60 rounded-l-xl" />
      )}

      <div className={['flex items-center gap-3 py-3', isFirst ? 'pl-4 pr-4' : 'px-4'].join(' ')}>
        {/* icon */}
        <div
          className={[
            'flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center',
            isFirst
              ? 'bg-amber-500/20 border border-amber-500/30'
              : 'bg-slate-800/50 border border-slate-700/30',
          ].join(' ')}
        >
          {isFirst ? (
            <Volume2 size={16} className="text-amber-400 animate-pulse" />
          ) : (
            <Bell size={14} className="text-slate-500" />
          )}
        </div>

        {/* name */}
        <div className="flex-1 min-w-0">
          {isFirst && (
            <p className="text-[10px] font-bold tracking-[0.12em] text-amber-400/80 uppercase leading-none mb-0.5">
              Ultimo Llamado
            </p>
          )}
          <p
            className={[
              'font-semibold truncate leading-tight',
              isFirst ? 'text-xl text-white' : 'text-base text-slate-300',
            ].join(' ')}
          >
            {p.patient}
          </p>
        </div>

        {/* time */}
        {p.called_at && (
          <span className={['flex-shrink-0 text-xs tabular-nums', isFirst ? 'text-amber-400/70' : 'text-slate-600'].join(' ')}>
            {timeLabel(p.called_at)}
          </span>
        )}
      </div>
    </div>
  )
}

export default function LastCalledPanel({ patients }: Props) {
  return (
    <div className="flex flex-col h-full">
      {/* header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
          <Bell size={17} className="text-amber-400" />
        </div>
        <div>
          <h2 className="text-sm font-bold tracking-[0.12em] text-amber-400 uppercase">
            Ultimos Llamados
          </h2>
          <p className="text-[11px] text-slate-500">Historial reciente</p>
        </div>
        <div className="ml-auto flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/15 border border-amber-500/20 text-xs font-bold text-amber-400">
          {patients.length}
        </div>
      </div>

      {/* list */}
      <div className="flex flex-col gap-2 flex-1 overflow-auto">
        {patients.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center mb-3">
              <Bell size={28} className="text-slate-600" />
            </div>
            <p className="text-slate-500 text-sm">Sin llamados recientes</p>
          </div>
        ) : (
          patients.map((p, i) => (
            <CalledItem key={p.id} patient={p} index={i} />
          ))
        )}
      </div>
    </div>
  )
}
