import React from 'react'
import { Head } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'
import { getPriorityLabel } from '@/utils/formatters'

interface Props {
  in_consultation: any[]
  last_called: any[]
  waiting: any[]
}

export default function WaitingRoom({ in_consultation = [], last_called = [], waiting = [] }: Props) {
  return (
    <AppLayout breadcrumbs={[{ title: 'Consultorio', href: '/medical/consultorio' }, { title: 'Sala de Espera', href: '' }]}> 
      <Head title="Sala de Espera" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded shadow">
          <h3 className="text-lg font-semibold">En consulta</h3>
          <ul className="mt-2 space-y-2">
            {in_consultation.map(item => (
              <li key={item.id} className="border rounded p-2">
                <div className="font-medium">{item.patient}</div>
                <div className="text-sm text-slate-500">Médico: {item.doctor}</div>
              </li>
            ))}
            {in_consultation.length === 0 && <li className="text-sm text-slate-500">Nadie en consulta</li>}
          </ul>
        </div>

        <div className="p-4 bg-white rounded shadow">
          <h3 className="text-lg font-semibold">Últimos llamados</h3>
          <ul className="mt-2 space-y-2">
            {last_called.map(item => (
              <li key={item.id} className="border rounded p-2">
                <div className="font-medium">{item.patient}</div>
                <div className="text-sm text-slate-500">Llamado: {item.called_at}</div>
              </li>
            ))}
            {last_called.length === 0 && <li className="text-sm text-slate-500">Sin llamados recientes</li>}
          </ul>
        </div>

        <div className="p-4 bg-white rounded shadow">
          <h3 className="text-lg font-semibold">En espera</h3>
          <ul className="mt-2 space-y-2">
            {waiting.map(item => (
              <li key={item.id} className="border rounded p-2">
                <div className="font-medium">{item.patient}</div>
                <div className="text-sm text-slate-500">Prioridad: {getPriorityLabel(item.priority)}</div>
              </li>
            ))}
            {waiting.length === 0 && <li className="text-sm text-slate-500">Sin pacientes en espera</li>}
          </ul>
        </div>
      </div>
    </AppLayout>
  )
}
