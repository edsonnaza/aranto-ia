import React, { useState } from 'react'
import { Head } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'
import useWaitingRoomRealtime, { WaitingRoomEventPayload } from '@/hooks/medical/useWaitingRoomRealtime'
import { getPriorityLabel } from '@/utils/formatters'

interface Props {
  in_consultation: Array<{ id: number; patient: string; doctor?: string; started_at?: string }>
  last_called: Array<{ id: number; patient: string; called_at?: string }>
  waiting: Array<{ id: number; patient: string; priority?: string }>
}

function playDing() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = 'sine'
    o.frequency.value = 880
    g.gain.value = 0.03
    o.connect(g)
    g.connect(ctx.destination)
    o.start()
    setTimeout(() => { o.stop(); ctx.close().catch(() => {}) }, 180)
  } catch (e) {
    // ignore audio errors
  }
}

export default function WaitingRoom({ in_consultation = [], last_called = [], waiting = [] }: Props) {
  const [inConsultationState, setInConsultationState] = useState(() => in_consultation.map(i => ({ ...i })))
  const [lastCalledState, setLastCalledState] = useState(() => last_called.map(l => ({ ...l, fresh: false })))
  const [waitingState, setWaitingState] = useState(() => waiting.map(w => ({ ...w, fresh: false })))

  const addWaitingItem = (item: any) => {
    setWaitingState((prev) => {
      const exists = prev.find(p => p.id === item.id)
      if (exists) return prev
      const newItem = { id: item.id, patient: item.patient?.name ?? item.patient, priority: item.priority ?? 'normal', fresh: true }
      const merged = [...prev, newItem].sort((a, b) => (a.priority === b.priority ? 0 : (a.priority === 'urgent' ? -1 : 1)))
      setTimeout(() => {
        setWaitingState((cur) => cur.map(c => c.id === newItem.id ? { ...c, fresh: false } : c))
      }, 3000)
      return merged
    })
  }

  const handleCalled = (payload: WaitingRoomEventPayload) => {
    setWaitingState((prev) => prev.filter(p => p.id !== payload.id))
    setLastCalledState((prev) => {
      const next = [{ id: payload.id, patient: payload.patient?.name ?? payload.patient, called_at: payload.called_at, fresh: true }, ...prev].slice(0, 10)
      setTimeout(() => {
        setLastCalledState((cur) => cur.map(c => c.id === payload.id ? { ...c, fresh: false } : c))
      }, 2500)
      return next
    })
    playDing()
  }

  const handleInConsultation = (payload: WaitingRoomEventPayload) => {
    setWaitingState((prev) => prev.filter(p => p.id !== payload.id))
    setLastCalledState((prev) => prev.filter(p => p.id !== payload.id))
    setInConsultationState((prev) => [{ id: payload.id, patient: payload.patient?.name ?? payload.patient, doctor: payload.doctor_id ? `Dr. ${payload.doctor_id}` : undefined, started_at: payload.started_at }, ...prev].slice(0, 5))
  }

  const handleFinished = (payload: WaitingRoomEventPayload) => {
    setInConsultationState((prev) => prev.filter(p => p.id !== payload.id))
  }

  useWaitingRoomRealtime({
    onAdded: addWaitingItem,
    onCalled: handleCalled,
    onInConsultation: handleInConsultation,
    onFinished: handleFinished,
  })

  return (
    <AppLayout breadcrumbs={[{ title: 'Consultorio', href: '/medical/consultorio' }, { title: 'Sala de Espera', href: '' }]}> 
      <Head title="Sala de Espera" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded shadow">
          <h3 className="text-lg font-semibold">En consulta</h3>
          <ul className="mt-2 space-y-2">
            {inConsultationState.map(item => (
              <li key={item.id} className="border rounded p-2">
                <div className="font-medium">{item.patient}</div>
                <div className="text-sm text-slate-500">Médico: {item.doctor ?? '—'}</div>
              </li>
            ))}
            {inConsultationState.length === 0 && <li className="text-sm text-slate-500">Nadie en consulta</li>}
          </ul>
        </div>

        <div className="p-4 bg-white rounded shadow">
          <h3 className="text-lg font-semibold">Últimos llamados</h3>
          <ul className="mt-2 space-y-2">
            {lastCalledState.map(item => (
              <li key={item.id} className={`border rounded p-2 transition-all duration-300 ${item.fresh ? 'bg-yellow-50 ring-2 ring-yellow-200 animate-pulse' : ''}`}>
                <div className="font-medium">{item.patient}</div>
                <div className="text-sm text-slate-500">Llamado: {item.called_at}</div>
              </li>
            ))}
            {lastCalledState.length === 0 && <li className="text-sm text-slate-500">Sin llamados recientes</li>}
          </ul>
        </div>

        <div className="p-4 bg-white rounded shadow">
          <h3 className="text-lg font-semibold">En espera</h3>
          <ul className="mt-2 space-y-2">
            {waitingState.map(item => (
              <li key={item.id} className={`border rounded p-2 transition-opacity duration-500 ${item.fresh ? 'bg-green-50 shadow-md' : ''}`}>
                <div className="font-medium">{item.patient}</div>
                <div className="text-sm text-slate-500">Prioridad: {getPriorityLabel(item.priority)}</div>
              </li>
            ))}
            {waitingState.length === 0 && <li className="text-sm text-slate-500">Sin pacientes en espera</li>}
          </ul>
        </div>
      </div>
    </AppLayout>
  )
}
