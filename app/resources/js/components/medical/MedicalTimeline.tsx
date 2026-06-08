import React from 'react'
import MedicalTimelineItem from './MedicalTimelineItem'

export default function MedicalTimeline({ records = [] }: any) {
  if (!records || !records.length) {
    return <div className="text-gray-500">No hay consultas registradas.</div>
  }

  return (
    <div className="space-y-3">
      {records.map((r: any) => (
        <MedicalTimelineItem key={r.id} record={r} />
      ))}
    </div>
  )
}
