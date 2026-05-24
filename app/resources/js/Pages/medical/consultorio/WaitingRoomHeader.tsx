import { useEffect, useState } from 'react'
import { Activity, Heart, Wifi } from 'lucide-react'

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function formatDate(date: Date) {
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function WaitingRoomHeader() {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
  const dateStr = formatDate(now)

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* backdrop */}
      <div className="absolute inset-0 bg-[#060d1a]/90 backdrop-blur-md border-b border-sky-900/40" />

      {/* subtle top accent line */}
      <div className="absolute top-0 left-0 right-0 h-2px bg-linear-to-r from-transparent via-sky-400/70 to-transparent" />

      <div className="relative flex items-center justify-between px-8 py-4 max-w-1920px mx-auto">
        {/* Left: branding */}
        <div className="flex items-center gap-4 min-w-0">
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-sky-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-sky-500/30">
              <Heart size={22} className="text-white fill-white" />
            </div>
            {/* ping ring */}
            <span className="absolute inset-0 rounded-2xl border border-sky-400/40 animate-ping-slow" />
          </div>
          <div>
            <p className="text-[10px] font-semibold tracking-[0.2em] text-sky-400/80 uppercase leading-none mb-1">
              Sistema de Turnos
            </p>
            <h1 className="text-xl font-bold text-white tracking-wide leading-none">
              Clínica Médica Central
            </h1>
          </div>
        </div>

        {/* Center: title */}
        <div className="hidden md:flex flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-emerald-400" />
            <span className="text-sm font-semibold tracking-[0.15em] text-emerald-400 uppercase">
              Sala de Espera
            </span>
            <Activity size={16} className="text-emerald-400" />
          </div>
          <p className="text-xs text-slate-500 tracking-wide">
            Visualización en tiempo real
          </p>
        </div>

        {/* Right: clock + live badge */}
        <div className="flex items-center gap-5 min-w-0">
          {/* EN VIVO badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/30">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-live-dot shrink-0" />
            <span className="text-xs font-bold tracking-[0.15em] text-red-400 uppercase">
              En Vivo
            </span>
            <Wifi size={12} className="text-red-400/70" />
          </div>

          {/* Clock */}
          <div className="text-right">
            <div className="text-3xl font-bold tracking-widest text-white tabular-nums leading-none">
              {timeStr}
            </div>
            <div className="text-[11px] text-slate-400 capitalize tracking-wide mt-0.5">
              {dateStr}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
