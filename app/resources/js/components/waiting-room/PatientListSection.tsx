import React from 'react'
import PatientCard from './PatientCard'

interface PatientListSectionProps {
  title: string
  emptyText: string
  patients: Array<any>
  section: 'waiting' | 'called' | 'consultation'
}

export default function PatientListSection({ title, emptyText, patients, section }: PatientListSectionProps) {
  return (
    <section className="mb-6">
      <h2 className="text-xl font-semibold mb-3 text-primary-800">{title}</h2>
      <div className="space-y-3">
        {patients.length === 0 ? (
          <div className="text-slate-400 italic text-center">{emptyText}</div>
        ) : (
          patients.map((p: any) => (
            <PatientCard
              key={p.id}
              name={p.patient}
              priority={p.priority}
              doctor={p.doctor}
              calledAt={p.called_at}
              highlight={!!p.fresh}
              section={section}
            />
          ))
        )}
      </div>
    </section>
  )
}
