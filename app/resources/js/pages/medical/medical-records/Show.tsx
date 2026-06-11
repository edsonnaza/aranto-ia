import React, { useState, useRef, useEffect } from 'react'
import { Head, router } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'
import HeadingSmall from '@/components/heading-small'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, FileText, FlaskConical } from 'lucide-react'

export default function Show({ medicalRecord }: any) {
  const patient = medicalRecord.patient
  const [amendmentContent, setAmendmentContent] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const files = Array.isArray(medicalRecord.files) ? medicalRecord.files : []
  const isLaboratoryImport =
    medicalRecord?.reason === 'Adjuntos de laboratorio externo'
    || String(medicalRecord?.notes || '').toLowerCase().includes('documentos externos incorporados desde laboratorio')

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [])

  const submitAmendment = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!amendmentContent.trim()) return
    router.post(`/medical/medical-records/${medicalRecord.id}/amendments`, { content: amendmentContent })
  }

  // Keyboard shortcut: Cmd/Ctrl + Enter to submit
  const onKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      submitAmendment()
    }
  }

  return (
    <AppLayout breadcrumbs={[{ title: 'Pacientes', href: '/medical/patients' }, { title: `${patient.first_name} ${patient.last_name}`, href:`/medical/patients/${patient.id}` }, { title: 'Historia Clínica', href: '' }]}>
      <Head title={`Historia Clínica - ${patient.first_name} ${patient.last_name}`} />

      <div className="space-y-6">
        <div className="space-y-2">
          <HeadingSmall title={`Consulta - ${new Date(medicalRecord.consultation_date).toLocaleString()}`} description={`Paciente: ${patient.first_name} ${patient.last_name}`} />
          <div className="flex flex-wrap items-center gap-2">
            {isLaboratoryImport && (
              <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700">
                <FlaskConical className="mr-1 h-3 w-3" />
                Importado desde laboratorio externo
              </Badge>
            )}
            {files.length > 0 && (
              <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                <FileText className="mr-1 h-3 w-3" />
                {files.length} archivo{files.length === 1 ? '' : 's'} adjunto{files.length === 1 ? '' : 's'}
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
            </CardHeader>
            <CardContent>
              <p><strong>Motivo:</strong> {medicalRecord.reason}</p>
              <p className="mt-2"><strong>Diagnóstico:</strong> {medicalRecord.diagnosis}</p>
              <p className="mt-2"><strong>Tratamiento:</strong> {medicalRecord.treatment}</p>
              <p className="mt-2"><strong>Notas:</strong> {medicalRecord.notes}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Prescripciones</CardTitle>
            </CardHeader>
            <CardContent>
              {medicalRecord.prescriptions && medicalRecord.prescriptions.length ? (
                <ul className="space-y-2">
                  {medicalRecord.prescriptions.map((p: any) => (
                    <li key={p.id} className="border p-2 rounded">
                      <div className="font-medium">{p.medication_name}</div>
                      <div className="text-sm">{p.dosage} • {p.frequency} • {p.duration}</div>
                      {p.notes && <div className="text-sm text-gray-600">{p.notes}</div>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No hay prescripciones registradas.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Archivos</CardTitle>
            </CardHeader>
            <CardContent>
              {files.length ? (
                <ul className="space-y-2">
                  {files.map((f: any) => (
                    <li key={f.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                      <div className="min-w-0">
                        <div className="truncate font-medium text-slate-900">{f.original_name || f.file_path}</div>
                        <div className="text-xs text-slate-500">{f.file_type || 'Archivo adjunto'}</div>
                      </div>
                      <a
                        href={`/medical/medical-record-files/${f.id}/download`}
                        className="inline-flex shrink-0 items-center gap-1 text-blue-600 hover:text-blue-800"
                      >
                        <Download className="h-4 w-4" />
                        Descargar
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No hay archivos adjuntos.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {isLaboratoryImport && files.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Documentos de laboratorio incorporados</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                Estos documentos fueron incorporados desde el flujo de laboratorio y quedaron asociados a la historia clínica del paciente como respaldo documental.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Amendments */}
        <Card>
          <CardHeader>
            <CardTitle>Enmiendas / Notas (audit trail)</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitAmendment} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Registrar enmienda</label>
                <textarea
                  ref={textareaRef}
                  value={amendmentContent}
                  onChange={(e) => setAmendmentContent(e.target.value)}
                  onKeyDown={onKeyDown}
                  rows={4}
                  className="w-full border rounded px-3 py-2 mt-1"
                  placeholder="Registrar corrección o nota (se guardará como enmienda, no edita el registro original). Usa Cmd/Ctrl+Enter para guardar rápidamente."
                />
              </div>

              <div className="flex justify-end">
                <Button type="button" onClick={submitAmendment}>Registrar Enmienda</Button>
              </div>
            </form>

            <div className="mt-6">
              {medicalRecord.amendments && medicalRecord.amendments.length ? (
                <ul className="space-y-3">
                  {medicalRecord.amendments.map((a: any) => (
                    <li key={a.id} className="border rounded p-3">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-700">{a.content}</div>
                        <div className="text-xs text-gray-500">{a.createdBy?.name || 'Usuario'} • {new Date(a.created_at).toLocaleString()}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No hay enmiendas registradas.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
