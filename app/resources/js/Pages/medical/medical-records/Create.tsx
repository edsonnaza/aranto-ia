import React, { useState, useRef, useEffect } from 'react'
import { Head, useForm, router } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'
import HeadingSmall from '@/components/heading-small'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface CreateProps {
  patient: any
  doctors?: { id: number, name: string }[]
  currentDoctor?: { id: number, name: string } | null
  fromQueue?: boolean
}

export default function Create({ patient, doctors = [], currentDoctor = null, fromQueue = false }: CreateProps) {
  const { data, setData, errors, processing } = useForm({
    consultation_date: new Date().toISOString().slice(0,16),
    reason: '',
    symptoms: '',
    diagnosis: '',
    treatment: '',
    notes: '',
    doctor_id: currentDoctor ? String(currentDoctor.id) : '',
    prescriptions: [] as any[],
    files: [] as File[],
    vital_signs: {
      blood_pressure: '',
      temperature: '',
      pulse: '',
      spo2: '',
    } as any,
  })

  const [prescriptions, setPrescriptions] = useState<any[]>([])
  const reasonRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    // Autofocus motivo to speed up capture
    if (reasonRef.current) reasonRef.current.focus()
    // If we have a currentDoctor, ensure the form field is set for submission
    if (currentDoctor) setData('doctor_id', String(currentDoctor.id))
  }, [])

  const addPrescription = () => {
    setPrescriptions([...prescriptions, { medication_name: '', dosage: '', frequency: '', duration: '', notes: '' }])
  }

  const updatePrescription = (index: number, field: string, value: any) => {
    const copy = [...prescriptions]
    // @ts-ignore
    copy[index][field] = value
    setPrescriptions(copy)
  }

  const removePrescription = (index: number) => {
    const copy = [...prescriptions]
    copy.splice(index, 1)
    setPrescriptions(copy)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    setData('files', Array.from(e.target.files))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const form = new FormData()
    form.append('consultation_date', data.consultation_date)
    form.append('reason', data.reason || '')
    form.append('symptoms', data.symptoms || '')
    form.append('diagnosis', data.diagnosis || '')
    form.append('treatment', data.treatment || '')
    form.append('notes', data.notes || '')
    form.append('doctor_id', data.doctor_id || '')

    // Vital signs snapshot
    if (data.vital_signs) {
      form.append('vital_signs[temperature]', data.vital_signs.temperature || '')
      form.append('vital_signs[pulse]', data.vital_signs.pulse || '')
      form.append('vital_signs[spo2]', data.vital_signs.spo2 || '')
      form.append('vital_signs[blood_pressure]', data.vital_signs.blood_pressure || '')
    }

    // Prescriptions
    prescriptions.forEach((p, idx) => {
      form.append(`prescriptions[${idx}][medication_name]`, p.medication_name || '')
      form.append(`prescriptions[${idx}][dosage]`, p.dosage || '')
      form.append(`prescriptions[${idx}][frequency]`, p.frequency || '')
      form.append(`prescriptions[${idx}][duration]`, p.duration || '')
      form.append(`prescriptions[${idx}][notes]`, p.notes || '')
    })

    // Files
    if (data.files && data.files.length) {
      data.files.forEach((file: File) => {
        form.append('files[]', file)
      })
    }

    if (fromQueue) form.append('from_queue', '1')

    router.post(`/medical/patients/${patient.id}/medical-records`, form, {
      forceFormData: true,
    })
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      // @ts-ignore
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  return (
    <AppLayout breadcrumbs={[{ title: 'Pacientes', href: '/medical/patients' }, { title: `${patient.first_name} ${patient.last_name}`, href:`/medical/patients/${patient.id}` }, { title: 'Nueva Historia Clínica', href: '' }]}>
      <Head title={`Nueva Historia Clínica - ${patient.first_name} ${patient.last_name}`} />

      <div className="space-y-6">
        <HeadingSmall title={`Nueva Historia Clínica para ${patient.first_name} ${patient.last_name}`} description="Registra la consulta y prescripciones." />

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detalles de la Consulta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Fecha y hora</Label>
                  <Input type="datetime-local" value={data.consultation_date} onChange={(e) => setData('consultation_date', e.target.value)} />
                  {errors.consultation_date && <p className="text-sm text-red-500">{errors.consultation_date}</p>}
                </div>

                <div>
                  <Label>Médico</Label>
                  {currentDoctor ? (
                    <div className="px-3 py-2 border rounded bg-slate-50 text-sm">Atendiendo como: <strong>{currentDoctor.name}</strong></div>
                  ) : (
                    <select className="w-full border rounded px-2 py-2" value={data.doctor_id} onChange={(e) => setData('doctor_id', e.target.value)}>
                      <option value="">Seleccionar</option>
                      {doctors.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div>
                <Label>Motivo</Label>
                <Input autoFocus ref={reasonRef} value={data.reason} onChange={(e) => setData('reason', e.target.value)} className="text-lg py-2" />
              </div>

              <div>
                <Label>Síntomas</Label>
                <Textarea value={data.symptoms} onChange={(e) => setData('symptoms', e.target.value)} />
              </div>

              <div>
                <Label>Diagnóstico</Label>
                <Textarea value={data.diagnosis} onChange={(e) => setData('diagnosis', e.target.value)} />
              </div>

              <div>
                <Label>Tratamiento</Label>
                <Textarea value={data.treatment} onChange={(e) => setData('treatment', e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Prescripciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {prescriptions.map((p, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
                    <div>
                      <Label>Medicamento</Label>
                      <Input value={p.medication_name} onChange={(e) => updatePrescription(idx, 'medication_name', e.target.value)} />
                    </div>
                    <div>
                      <Label>Dosis</Label>
                      <Input value={p.dosage} onChange={(e) => updatePrescription(idx, 'dosage', e.target.value)} />
                    </div>
                    <div>
                      <Label>Frecuencia</Label>
                      <Input value={p.frequency} onChange={(e) => updatePrescription(idx, 'frequency', e.target.value)} />
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Label>Duración</Label>
                        <Input value={p.duration} onChange={(e) => updatePrescription(idx, 'duration', e.target.value)} />
                      </div>
                      <div className="pt-6">
                        <Button type="button" variant="destructive" onClick={() => removePrescription(idx)}>Eliminar</Button>
                      </div>
                    </div>
                  </div>
                ))}

                <div>
                  <Button type="button" onClick={addPrescription}>Agregar Prescripción</Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Signos vitales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <Label className="text-sm">Presión (ej. 120/80)</Label>
                  <Input value={data.vital_signs.blood_pressure} onChange={(e) => setData('vital_signs', {...data.vital_signs, blood_pressure: e.target.value})} />
                </div>
                <div>
                  <Label className="text-sm">Temperatura (°C)</Label>
                  <Input type="number" step="0.1" value={data.vital_signs.temperature} onChange={(e) => setData('vital_signs', {...data.vital_signs, temperature: e.target.value})} />
                </div>
                <div>
                  <Label className="text-sm">Pulso (bpm)</Label>
                  <Input type="number" value={data.vital_signs.pulse} onChange={(e) => setData('vital_signs', {...data.vital_signs, pulse: e.target.value})} />
                </div>
                <div>
                  <Label className="text-sm">Saturación (SpO2 %)</Label>
                  <Input type="number" value={data.vital_signs.spo2} onChange={(e) => setData('vital_signs', {...data.vital_signs, spo2: e.target.value})} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Archivos y Notas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Adjuntar archivos</Label>
                <input type="file" multiple onChange={handleFileChange} />
                {errors.files && <p className="text-sm text-red-500">{errors.files}</p>}
              </div>

              <div>
                <Label>Notas internas</Label>
                <Textarea value={data.notes} onChange={(e) => setData('notes', e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2 justify-end">
            <Button type="submit" disabled={processing}>Guardar Historia Clínica</Button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}
