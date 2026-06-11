import React, { useState } from 'react'
import { Link } from '@inertiajs/react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronDown, Download, FileText, FlaskConical, Paperclip } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function MedicalTimelineItem({ record }: any) {
  const [open, setOpen] = useState(false)
  const files = Array.isArray(record.files) ? record.files : []
  const isLaboratoryImport =
    record?.reason === 'Adjuntos de laboratorio externo'
    || String(record?.notes || '').toLowerCase().includes('documentos externos incorporados desde laboratorio')

  return (
    <Card>
      <CardHeader className="flex items-start justify-between">
        <div>
          <div className="text-sm text-gray-500">{new Date(record.consultation_date).toLocaleString()}</div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <div className="font-medium">{record.reason}</div>
            {isLaboratoryImport && (
              <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700">
                <FlaskConical className="mr-1 h-3 w-3" />
                Laboratorio externo
              </Badge>
            )}
            {files.length > 0 && (
              <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                <Paperclip className="mr-1 h-3 w-3" />
                {files.length} adjunto{files.length === 1 ? '' : 's'}
              </Badge>
            )}
          </div>
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
            {files.length > 0 && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-800">
                  <FileText className="h-4 w-4" />
                  Documentos adjuntos
                </div>
                <div className="space-y-2">
                  {files.map((file: any) => (
                    <div key={file.id} className="flex items-center justify-between gap-3 rounded-md bg-white px-3 py-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-slate-900">
                          {file.original_name || 'Documento adjunto'}
                        </div>
                        <div className="text-xs text-slate-500">
                          {file.file_type || 'Archivo'}
                        </div>
                      </div>
                      <a
                        href={`/medical/medical-record-files/${file.id}/download`}
                        className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        <Download className="h-4 w-4" />
                        Descargar
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
