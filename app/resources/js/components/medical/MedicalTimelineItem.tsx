import React, { useState } from 'react'
import { Link } from '@inertiajs/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronDown } from 'lucide-react'

export default function MedicalTimelineItem({ record }: any) {
  const [open, setOpen] = useState(false)

  return (
    <Card>
      <CardHeader className="flex items-start justify-between">
        <div>
          <div className="text-sm text-gray-500">{new Date(record.consultation_date).toLocaleString()}</div>
          <div className="font-medium">{record.reason}</div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="text-sm text-gray-600">{record.doctor?.name || '—'}</div>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setOpen(!open)}>
              <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
            </Button>
            <Link href={`/medical/medical-records/${record.id}`} className="inline-block">
              <Button size="sm">Ver</Button>
            </Link>
          </div>
        </div>
      </CardHeader>

      {open && (
        <CardContent>
          <div className="space-y-2">
            <div><strong>Diagnóstico:</strong> {record.diagnosis || '—'}</div>
            <div><strong>Tratamiento:</strong> {record.treatment || '—'}</div>
            <div className="text-sm text-gray-600">Notas: {record.notes || '—'}</div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
