import React from 'react'

interface PatientCardProps {
  name: string
  priority?: string
  doctor?: string
  calledAt?: string
  highlight?: boolean
  section?: 'waiting' | 'called' | 'consultation'
}

export default function PatientCard({ name, priority, doctor, calledAt, highlight, section }: PatientCardProps) {
  return (
    <div
      className={`rounded-xl p-4 shadow transition-all duration-300 border bg-white ${
        highlight
          ? section === 'waiting'
            ? 'bg-green-50 ring-2 ring-green-200 animate-pulse'
            : section === 'called'
            ? 'bg-yellow-50 ring-2 ring-yellow-200 animate-pulse'
            : 'bg-blue-50 ring-2 ring-blue-200 animate-pulse'
          : ''
      }`}
    >
      <div className="font-semibold text-lg text-slate-800">{name}</div>
      {priority && (
        <div className="text-xs text-green-700 font-bold mt-1">Prioridad: {priority}</div>
      )}
      {doctor && (
        <div className="text-xs text-blue-700 mt-1">Médico: {doctor}</div>
      )}
      {calledAt && (
        <div className="text-xs text-yellow-700 mt-1">Llamado: {calledAt}</div>
      )}
    </div>
  )
}
