import { useState } from 'react'
import WaitingRoomHeader from './WaitingRoomHeader'
import ConsultationPanel, { InConsultationPatient } from './ConsultationPanel'
import LastCalledPanel, { CalledPatient } from './LastCalledPanel'
import WaitingQueuePanel, { WaitingPatient } from './WaitingQueuePanel'

interface Props {
  in_consultation?: InConsultationPatient[]
  last_called?: CalledPatient[]
  waiting?: WaitingPatient[]
}

function playDing() {
  try {
    const audio = new Audio('/sounds/notify.mp3')
    audio.play().catch(() => {})
  } catch {
    // ignore audio errors
  }
}

// Stub hook type — replace with real hook import in your Laravel/Inertia project
import useWaitingRoomRealtime, { WaitingRoomEventPayload } from '@/hooks/medical/useWaitingRoomRealtime'

export default function WaitingRoom({ in_consultation = [], last_called = [], waiting = [] }: Props) {
  const [inConsultationState, setInConsultationState] = useState<InConsultationPatient[]>(() =>
    in_consultation.map(i => ({ ...i }))
  )
  const [lastCalledState, setLastCalledState] = useState<CalledPatient[]>(() =>
    last_called.map(l => ({ ...l, fresh: false }))
  )
  const [waitingState, setWaitingState] = useState<WaitingPatient[]>(() =>
    waiting.map(w => ({ ...w, fresh: false }))
  )

  // These handlers are intentionally kept identical to the original logic
  const addWaitingItem = (item: WaitingRoomEventPayload) => {
    setWaitingState(prev => {
      const exists = prev.find(p => p.id === item.id)
      if (exists) return prev
      const patientName = typeof item.patient === 'object' ? item.patient.name : item.patient
      const newItem: WaitingPatient = { id: item.id, patient: patientName, priority: item.priority ?? 'normal', fresh: true }
      const merged = [...prev, newItem].sort((a, b) =>
        a.priority === b.priority ? 0 : a.priority === 'urgent' ? -1 : 1
      )
      setTimeout(() => {
        setWaitingState(cur => cur.map(c => c.id === newItem.id ? { ...c, fresh: false } : c))
      }, 3000)
      return merged
    })
  }

  const handleCalled = (payload: WaitingRoomEventPayload) => {
    const patientName = typeof payload.patient === 'object' ? payload.patient.name : payload.patient
    setWaitingState(prev => prev.filter(p => p.id !== payload.id))
    setLastCalledState(prev => {
      const next = [{ id: payload.id, patient: patientName, called_at: payload.called_at, fresh: true }, ...prev].slice(0, 10)
      setTimeout(() => {
        setLastCalledState(cur => cur.map(c => c.id === payload.id ? { ...c, fresh: false } : c))
      }, 2500)
      return next
    })
    playDing()
  }

  const handleInConsultation = (payload: WaitingRoomEventPayload) => {
    const patientName = typeof payload.patient === 'object' ? payload.patient.name : payload.patient
    setWaitingState(prev => prev.filter(p => p.id !== payload.id))
    setLastCalledState(prev => prev.filter(p => p.id !== payload.id))
    setInConsultationState(prev =>
      [{ id: payload.id, patient: patientName, doctor: payload.doctor_id ? `Dr. ${payload.doctor_id}` : undefined, started_at: payload.started_at }, ...prev].slice(0, 5)
    )
  }

  const handleFinished = (payload: { id: number }) => {
    setInConsultationState(prev => prev.filter(p => p.id !== payload.id))
  }

  // Wire up your real hook here, e.g.:
  useWaitingRoomRealtime({
    onAdded: addWaitingItem,
    onCalled: handleCalled,
    onInConsultation: handleInConsultation,
    onFinished: handleFinished,
  })

  // Expose handlers so parent can pass through the hook
  void addWaitingItem
  void handleCalled
  void handleInConsultation
  void handleFinished

  return (
    <div className="min-h-screen bg-[#060d1a] text-white" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Subtle grid background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(14,165,233,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(14,165,233,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      {/* Ambient glow spots */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <WaitingRoomHeader />

      <main className="relative z-10 max-w-1600px mx-auto px-6 py-8">
        {/* stat bar */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <StatChip label="En Consulta" value={inConsultationState.length} color="emerald" />
          <StatChip label="Ultimos Llamados" value={lastCalledState.length} color="amber" />
          <StatChip label="En Espera" value={waitingState.length} color="sky" />
          <div className="ml-auto hidden sm:flex items-center gap-2 text-xs text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Actualizacion automatica en tiempo real
          </div>
        </div>

        {/* three columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Consultation */}
          <div className="rounded-3xl bg-linear-to-b from-[#0d1f14]/80 to-[#080f0d]/80 border border-emerald-900/40 backdrop-blur-sm p-6 min-h-500px flex flex-col shadow-2xl shadow-emerald-950/40">
            <ConsultationPanel patients={inConsultationState} />
          </div>

          {/* Last called */}
          <div className="rounded-3xl bg-linear-to-b from-[#1a150a]/80 to-[#0d0a05]/80 border border-amber-900/40 backdrop-blur-sm p-6 min-h-500px flex flex-col shadow-2xl shadow-amber-950/30">
            <LastCalledPanel patients={lastCalledState} />
          </div>

          {/* Waiting queue */}
          <div className="rounded-3xl bg-linear-to-b from-[#091422]/80 to-[#050d18]/80 border border-sky-900/40 backdrop-blur-sm p-6 min-h-500px flex flex-col shadow-2xl shadow-sky-950/30">
            <WaitingQueuePanel patients={waitingState} />
          </div>
        </div>

        {/* footer */}
        <div className="mt-8 flex items-center justify-center gap-3 text-xs text-slate-600">
          <span>Aranto - Sistema de Turnos v2.0</span>
          <span>·</span>
          <span>Todos los derechos reservados</span>
        </div>
      </main>
    </div>
  )
}

function StatChip({ label, value, color }: { label: string; value: number; color: 'emerald' | 'amber' | 'sky' }) {
  const colors = {
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    sky: 'bg-sky-500/10 border-sky-500/20 text-sky-400',
  }
  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold ${colors[color]}`}>
      <span className="text-lg font-bold tabular-nums">{value}</span>
      <span className="font-normal opacity-80">{label}</span>
    </div>
  )
}
