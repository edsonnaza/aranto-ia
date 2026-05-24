import { Stethoscope, UserCheck, Clock } from 'lucide-react'
import { useEffect, useState } from 'react'

export interface InConsultationPatient {
  id: number
  patient: string
  doctor?: string
  started_at?: string
  fresh?: boolean
}

interface Props {
  patients: InConsultationPatient[]
}

function ElapsedTime({ started_at }: { started_at?: string }) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now())
    }, 1000 * 60) // update every minute
    return () => clearInterval(interval)
  }, [])

  if (!started_at) return null
  const start = new Date(started_at)
  const diffMs = now - start.getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 0) return null
  return (
    <span className="flex items-center gap-1 text-slate-400 text-xs">
      <Clock size={11} />
      {mins < 1 ? 'Recién ingresó' : `${mins} min`}
    </span>
  )
}

function ConsultationCard({ patient: p, index }: { patient: InConsultationPatient; index: number }) {
  const isFirst = index === 0

  return (
    <div
      className={[
        'relative overflow-hidden rounded-2xl transition-all duration-500',
        isFirst
          ? 'bg-linear-to-br from-emerald-950/80 to-[#0a1f18]/90 border border-emerald-500/40 animate-glow-pulse-green'
          : 'bg-linear-to-br from-slate-900/60 to-[#0d1f35]/80 border border-slate-700/50',
        p.fresh ? 'animate-slide-in-top' : '',
      ].join(' ')}
    >
      {/* top accent */}
      {isFirst && (
        <div className="absolute top-0 left-0 right-0 h-2px bg-linear-to-r from-transparent via-emerald-400/80 to-transparent" />
      )}

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* avatar */}
            <div
              className={[
                'shrink-0 w-12 h-12 rounded-xl flex items-center justify-center',
                isFirst
                  ? 'bg-emerald-500/20 border border-emerald-500/30'
                  : 'bg-slate-700/40 border border-slate-600/30',
              ].join(' ')}
            >
              <UserCheck size={22} className={isFirst ? 'text-emerald-400' : 'text-slate-400'} />
            </div>

            <div className="min-w-0">
              <p className="text-[11px] font-semibold tracking-[0.12em] text-emerald-400/80 uppercase mb-0.5">
                En Consulta
              </p>
              <p
                className={[
                  'font-bold truncate leading-tight',
                  isFirst ? 'text-2xl text-white' : 'text-lg text-slate-200',
                ].join(' ')}
              >
                {p.patient}
              </p>
            </div>
          </div>

          {isFirst && (
            <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-400 tracking-wide uppercase">Activo</span>
            </div>
          )}
        </div>

        {(p.doctor || p.started_at) && (
          <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
            {p.doctor && (
              <div className="flex items-center gap-1.5">
                <Stethoscope size={13} className="text-sky-400/70" />
                <span className="text-sm text-slate-400">{p.doctor}</span>
              </div>
            )}
            <ElapsedTime started_at={p.started_at} />
          </div>
        )}
      </div>
    </div>
  )
}

export default function ConsultationPanel({ patients }: Props) {
  return (
    <div className="flex flex-col h-full">
      {/* panel header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
          <Stethoscope size={17} className="text-emerald-400" />
        </div>
        <div>
          <h2 className="text-sm font-bold tracking-[0.12em] text-emerald-400 uppercase">
            En Consulta
          </h2>
          <p className="text-[11px] text-slate-500">
            {patients.length} {patients.length === 1 ? 'paciente' : 'pacientes'}
          </p>
        </div>
        <div className="ml-auto flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/15 border border-emerald-500/20 text-xs font-bold text-emerald-400">
          {patients.length}
        </div>
      </div>

      {/* cards */}
      <div className="flex flex-col gap-3 flex-1 overflow-auto">
        {patients.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center mb-3">
              <Stethoscope size={28} className="text-slate-600" />
            </div>
            <p className="text-slate-500 text-sm">Nadie en consulta</p>
          </div>
        ) : (
          patients.map((p, i) => (
            <ConsultationCard key={p.id} patient={p} index={i} />
          ))
        )}
      </div>
    </div>
  )
}
