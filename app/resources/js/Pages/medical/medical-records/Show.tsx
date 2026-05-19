import React from 'react'
import { Head, Link } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'
import HeadingSmall from '@/components/heading-small'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function Show({ medicalRecord }: any) {
  const patient = medicalRecord.patient

  return (
    <AppLayout breadcrumbs={[{ title: 'Pacientes', href: '/medical/patients' }, { title: `${patient.first_name} ${patient.last_name}`, href:`/medical/patients/${patient.id}` }, { title: 'Historia Clínica', href: '' }]}>
      <Head title={`Historia Clínica - ${patient.first_name} ${patient.last_name}`} />

      <div className="space-y-6">
        <HeadingSmall title={`Consulta - ${new Date(medicalRecord.consultation_date).toLocaleString()}`} description={`Paciente: ${patient.first_name} ${patient.last_name}`} />

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
              {medicalRecord.files && medicalRecord.files.length ? (
                <ul className="space-y-2">
                  {medicalRecord.files.map((f: any) => (
                    <li key={f.id} className="flex items-center justify-between">
                      <div>{f.original_name || f.file_path}</div>
                      <div>
                        <a href={`/medical/medical-record-files/${f.id}/download`} className="text-blue-600">Descargar</a>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No hay archivos adjuntos.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
