import HeadingSmall from '@/components/heading-small';
import PatientClinicalDocumentsPreview from '@/components/medical/PatientClinicalDocumentsPreview';
import PatientVitalsPreview from '@/components/medical/PatientVitalsPreview';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DateInputWithCalendar } from '@/components/ui/date-input-with-calendar';
import { FileUploadField } from '@/components/ui/file-upload-field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import {
    calculateAge,
    formatSystemDate,
    formatSystemDateForBackend,
} from '@/utils/date-utils';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { AlertCircle, FileText, Plus, Trash2 } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';

interface CreateProps {
    patient: any;
    doctors?: { id: number; name: string }[];
    currentDoctor?: { id: number; name: string } | null;
    fromQueue?: boolean;
    recentMedicalRecords?: any[];
    recentLabReports?: Array<{
        id: number;
        report_number: string;
        generated_at?: string | null;
        sample_number?: string | null;
        profiles?: string[];
    }>;
}

const QUICK_REASONS = [
    'Control clínico',
    'Dolor abdominal',
    'Fiebre',
    'Cefalea',
    'Control de laboratorio',
    'Infección urinaria',
];

const DRAFT_PREFIX = 'medical-record-draft';

const neutralInputClass =
    'border-slate-300 bg-white focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20';
const emptyVitalSigns = {
    blood_pressure: '',
    temperature: '',
    pulse: '',
    spo2: '',
};

const getVitalAlert = (field: string, value: string) => {
    const numeric = Number(value);
    if (!value || Number.isNaN(numeric)) return null;

    if (field === 'temperature' && (numeric < 35 || numeric > 38))
        return 'Revisar temperatura fuera del rango habitual.';
    if (field === 'pulse' && (numeric < 50 || numeric > 120))
        return 'Revisar pulso fuera del rango habitual.';
    if (field === 'spo2' && numeric < 92)
        return 'SpO2 baja. Verificar contexto clínico.';
    return null;
};

const getInitials = (firstName?: string, lastName?: string) =>
    `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.trim().toUpperCase() || 'P';

const getGenderLabel = (gender?: string | null) => {
    if (gender === 'M' || gender === 'male') return 'Masculino';
    if (gender === 'F' || gender === 'female') return 'Femenino';
    if (gender === 'OTHER' || gender === 'other') return 'Otro';
    return 'No especificado';
};

type SubmitGuardState =
    | { open: false; mode: null; missing: string[] }
    | {
          open: true;
          mode: 'required' | 'recommended';
          missing: string[];
      };

export default function Create({
    patient,
    doctors = [],
    currentDoctor = null,
    fromQueue = false,
    recentMedicalRecords = [],
    recentLabReports = [],
}: CreateProps) {
    const draftKey = `${DRAFT_PREFIX}:${patient.id}`;
    const reasonRef = useRef<HTMLInputElement | null>(null);
    const consultationTimeRef = useRef(
        (() => {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            return `${hours}:${minutes}:${seconds}`;
        })(),
    );
    const [prescriptions, setPrescriptions] = useState<any[]>([
        {
            medication_name: '',
            dosage: '',
            frequency: '',
            duration: '',
            notes: '',
        },
    ]);
    const [selectedFileNames, setSelectedFileNames] = useState<string[]>([]);
    const [draftLoaded, setDraftLoaded] = useState(false);
    const [submitGuard, setSubmitGuard] = useState<SubmitGuardState>({
        open: false,
        mode: null,
        missing: [],
    });
    const [highlightedFields, setHighlightedFields] = useState<string[]>([]);

    const { data, setData, errors, processing } = useForm({
        consultation_date: formatSystemDate(new Date()),
        reason: '',
        symptoms: '',
        diagnosis: '',
        treatment: '',
        notes: '',
        doctor_id: currentDoctor ? String(currentDoctor.id) : '',
        prescriptions: [] as any[],
        files: [] as File[],
        vital_signs: {
            ...emptyVitalSigns,
        } as any,
    });

    useEffect(() => {
        if (reasonRef.current) reasonRef.current.focus();
        if (currentDoctor) setData('doctor_id', String(currentDoctor.id));

        const stored = window.localStorage.getItem(draftKey);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setData(
                    'consultation_date',
                    (
                        parsed.consultation_date || formatSystemDate(new Date())
                    ).split(' ')[0],
                );
                setData('reason', parsed.reason || '');
                setData('symptoms', parsed.symptoms || '');
                setData('diagnosis', parsed.diagnosis || '');
                setData('treatment', parsed.treatment || '');
                setData('notes', parsed.notes || '');
                setData(
                    'doctor_id',
                    currentDoctor
                        ? String(currentDoctor.id)
                        : parsed.doctor_id || '',
                );
                setData('vital_signs', {
                    ...emptyVitalSigns,
                    ...(parsed.vital_signs || {}),
                });
                if (
                    Array.isArray(parsed.prescriptions) &&
                    parsed.prescriptions.length > 0
                ) {
                    setPrescriptions(parsed.prescriptions);
                }
            } catch {
                window.localStorage.removeItem(draftKey);
            }
        }

        setDraftLoaded(true);
    }, []);

    useEffect(() => {
        if (!draftLoaded) return;

        const payload = {
            consultation_date: data.consultation_date,
            reason: data.reason,
            symptoms: data.symptoms,
            diagnosis: data.diagnosis,
            treatment: data.treatment,
            notes: data.notes,
            doctor_id: data.doctor_id,
            prescriptions,
            vital_signs: data.vital_signs,
        };

        window.localStorage.setItem(draftKey, JSON.stringify(payload));
    }, [
        draftLoaded,
        data.consultation_date,
        data.reason,
        data.symptoms,
        data.diagnosis,
        data.treatment,
        data.notes,
        data.doctor_id,
        data.vital_signs,
        prescriptions,
    ]);

    const addPrescription = () => {
        setPrescriptions((prev) => [
            ...prev,
            {
                medication_name: '',
                dosage: '',
                frequency: '',
                duration: '',
                notes: '',
            },
        ]);
    };

    const updatePrescription = (index: number, field: string, value: any) => {
        setPrescriptions((prev) =>
            prev.map((item, idx) =>
                idx === index ? { ...item, [field]: value } : item,
            ),
        );
    };

    const removePrescription = (index: number) => {
        setPrescriptions((prev) => prev.filter((_, idx) => idx !== index));
    };

    const handleFilesChange = (files: File[]) => {
        setData('files', files);
        setSelectedFileNames(files.map((file) => file.name));
    };

    const removeFile = (index: number) => {
        const nextFiles = data.files.filter((_, idx) => idx !== index);
        setData('files', nextFiles);
        setSelectedFileNames(nextFiles.map((file) => file.name));
    };

    const submitRecord = () => {
        const form = new FormData();
        form.append(
            'consultation_date',
            `${formatSystemDateForBackend(data.consultation_date)} ${consultationTimeRef.current}`,
        );
        form.append('reason', data.reason || '');
        form.append('symptoms', data.symptoms || '');
        form.append('diagnosis', data.diagnosis || '');
        form.append('treatment', data.treatment || '');
        form.append('notes', data.notes || '');
        form.append('doctor_id', data.doctor_id || '');

        form.append(
            'vital_signs[temperature]',
            data.vital_signs.temperature || '',
        );
        form.append('vital_signs[pulse]', data.vital_signs.pulse || '');
        form.append('vital_signs[spo2]', data.vital_signs.spo2 || '');
        form.append(
            'vital_signs[blood_pressure]',
            data.vital_signs.blood_pressure || '',
        );

        prescriptions.forEach((p, idx) => {
            form.append(
                `prescriptions[${idx}][medication_name]`,
                p.medication_name || '',
            );
            form.append(`prescriptions[${idx}][dosage]`, p.dosage || '');
            form.append(`prescriptions[${idx}][frequency]`, p.frequency || '');
            form.append(`prescriptions[${idx}][duration]`, p.duration || '');
            form.append(`prescriptions[${idx}][notes]`, p.notes || '');
        });

        data.files.forEach((file: File) => form.append('files[]', file));

        if (fromQueue) form.append('from_queue', '1');

        router.post(`/medical/patients/${patient.id}/medical-records`, form, {
            forceFormData: true,
            onSuccess: () => {
                window.localStorage.removeItem(draftKey);
            },
        });
    };

    const getRequiredMissingFields = () => {
        const missing: string[] = [];

        if (!data.consultation_date?.trim()) {
            missing.push('Fecha de la consulta');
        }

        if (!data.reason?.trim()) {
            missing.push('Motivo de la consulta');
        }

        return missing;
    };

    const getRecommendedMissingFields = () => {
        const missing: string[] = [];

        if (!data.symptoms?.trim()) {
            missing.push('Síntomas');
        }

        if (!data.diagnosis?.trim()) {
            missing.push('Diagnóstico');
        }

        if (!data.treatment?.trim()) {
            missing.push('Tratamiento');
        }

        const hasAnyVitalSign = Object.values(data.vital_signs || {}).some(
            (value) => String(value || '').trim() !== '',
        );

        if (!hasAnyVitalSign) {
            missing.push('Signos vitales');
        }

        const hasPrescription = prescriptions.some((prescription) =>
            [
                prescription.medication_name,
                prescription.dosage,
                prescription.frequency,
                prescription.duration,
                prescription.notes,
            ].some((value) => String(value || '').trim() !== ''),
        );

        if (!hasPrescription) {
            missing.push('Prescripciones');
        }

        return missing;
    };

    const hasAnyVitalSign = Object.values(data.vital_signs || {}).some(
        (value) => String(value || '').trim() !== '',
    );

    const hasPrescription = prescriptions.some((prescription) =>
        [
            prescription.medication_name,
            prescription.dosage,
            prescription.frequency,
            prescription.duration,
            prescription.notes,
        ].some((value) => String(value || '').trim() !== ''),
    );

    const shouldHighlightField = (field: string) => {
        if (!highlightedFields.includes(field)) return false;

        switch (field) {
            case 'Fecha de la consulta':
                return !data.consultation_date?.trim();
            case 'Motivo de la consulta':
                return !data.reason?.trim();
            case 'Síntomas':
                return !data.symptoms?.trim();
            case 'Diagnóstico':
                return !data.diagnosis?.trim();
            case 'Tratamiento':
                return !data.treatment?.trim();
            case 'Signos vitales':
                return !hasAnyVitalSign;
            case 'Prescripciones':
                return !hasPrescription;
            default:
                return false;
        }
    };

    const getHighlightClass = (field: string, className: string) =>
        cn(
            className,
            shouldHighlightField(field) &&
                'border-red-300 ring-1 ring-red-200 focus-visible:border-red-500 focus-visible:ring-red-200',
        );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const requiredMissing = getRequiredMissingFields();
        if (requiredMissing.length > 0) {
            setHighlightedFields(requiredMissing);
            setSubmitGuard({
                open: true,
                mode: 'required',
                missing: requiredMissing,
            });
            return;
        }

        const recommendedMissing = getRecommendedMissingFields();
        if (recommendedMissing.length > 0) {
            setHighlightedFields(recommendedMissing);
            setSubmitGuard({
                open: true,
                mode: 'recommended',
                missing: recommendedMissing,
            });
            return;
        }

        setHighlightedFields([]);
        submitRecord();
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            handleSubmit(e as unknown as React.FormEvent);
        }
    };

    const pressureHint = useMemo(() => {
        if (!data.vital_signs.blood_pressure) return null;
        return /^\d{2,3}\/\d{2,3}$/.test(data.vital_signs.blood_pressure)
            ? null
            : 'Use formato 120/80.';
    }, [data.vital_signs.blood_pressure]);

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Pacientes', href: '/medical/patients' },
                {
                    title: `${patient.first_name} ${patient.last_name}`,
                    href: `/medical/patients/${patient.id}`,
                },
                { title: 'Nueva Historia Clínica', href: '' },
            ]}
        >
            <Head
                title={`Nueva Historia Clínica - ${patient.first_name} ${patient.last_name}`}
            />

            <div className="space-y-6 pb-28">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="flex min-w-0 items-start gap-4">
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xl font-semibold text-emerald-700">
                                {getInitials(
                                    patient.first_name,
                                    patient.last_name,
                                )}
                            </div>
                            <div className="min-w-0">
                                <HeadingSmall
                                    title={`Nueva Historia Clínica para ${patient.first_name} ${patient.last_name}`}
                                    description="Registre la consulta, signos vitales, prescripciones y documentos de respaldo."
                                />
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <Badge
                                        className={
                                            patient.status === 'active'
                                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                                                : 'bg-slate-100 text-slate-700 hover:bg-slate-100'
                                        }
                                    >
                                        {patient.status === 'active'
                                            ? 'Activo'
                                            : 'Inactivo'}
                                    </Badge>
                                    <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                                        {patient.birth_date
                                            ? `${calculateAge(patient.birth_date)} años`
                                            : 'Edad no disponible'}
                                    </span>
                                    <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                                        {getGenderLabel(patient.gender)}
                                    </span>
                                    <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                                        {patient.document_number ||
                                            'Sin documento'}
                                    </span>
                                    <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                                        {patient.insurance_type?.name ||
                                            'Sin seguro'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <form
                    onSubmit={handleSubmit}
                    onKeyDown={onKeyDown}
                    className="space-y-6"
                >
                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(340px,0.9fr)]">
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>
                                        Detalles de la consulta
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div>
                                            <Label>
                                                Fecha de la consulta{' '}
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                            </Label>
                                            <DateInputWithCalendar
                                                value={data.consultation_date}
                                                onChange={(value) =>
                                                    setData(
                                                        'consultation_date',
                                                        value,
                                                    )
                                                }
                                                format="local"
                                                placeholder="dd-mm-yyyy"
                                                className={cn(
                                                    'w-full',
                                                    shouldHighlightField(
                                                        'Fecha de la consulta',
                                                    ) &&
                                                        '[&_input]:border-red-300 [&_input]:ring-1 [&_input]:ring-red-200 [&_input:focus-visible]:border-red-500 [&_input:focus-visible]:ring-red-200',
                                                )}
                                            />
                                            <p className="mt-1 text-xs text-slate-500">
                                                La hora del registro se guarda
                                                internamente y se refleja en el
                                                historial.
                                            </p>
                                            {errors.consultation_date && (
                                                <p className="mt-1 text-sm text-red-500">
                                                    {errors.consultation_date}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <Label>Médico</Label>
                                            {currentDoctor ? (
                                                <div className="rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm">
                                                    Atendiendo como:{' '}
                                                    <strong>
                                                        {currentDoctor.name}
                                                    </strong>
                                                </div>
                                            ) : (
                                                <select
                                                    className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
                                                    value={data.doctor_id}
                                                    onChange={(e) =>
                                                        setData(
                                                            'doctor_id',
                                                            e.target.value,
                                                        )
                                                    }
                                                >
                                                    <option value="">
                                                        Seleccionar
                                                    </option>
                                                    {doctors.map((d) => (
                                                        <option
                                                            key={d.id}
                                                            value={d.id}
                                                        >
                                                            {d.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <Label>
                                            Motivo{' '}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            autoFocus
                                            ref={reasonRef}
                                            list="medical-record-reasons"
                                            value={data.reason}
                                            onChange={(e) =>
                                                setData(
                                                    'reason',
                                                    e.target.value,
                                                )
                                            }
                                            className={getHighlightClass(
                                                'Motivo de la consulta',
                                                `text-base ${neutralInputClass}`,
                                            )}
                                            placeholder="Motivo principal de la consulta"
                                            required
                                        />
                                        <datalist id="medical-record-reasons">
                                            {QUICK_REASONS.map((reason) => (
                                                <option
                                                    key={reason}
                                                    value={reason}
                                                />
                                            ))}
                                        </datalist>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {QUICK_REASONS.map((reason) => (
                                                <button
                                                    key={reason}
                                                    type="button"
                                                    onClick={() =>
                                                        setData(
                                                            'reason',
                                                            reason,
                                                        )
                                                    }
                                                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700 hover:bg-slate-100"
                                                >
                                                    {reason}
                                                </button>
                                            ))}
                                        </div>
                                        {errors.reason && (
                                            <p className="mt-1 text-sm text-red-500">
                                                {errors.reason}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <Label>Síntomas</Label>
                                        <Textarea
                                            value={data.symptoms}
                                            onChange={(e) =>
                                                setData(
                                                    'symptoms',
                                                    e.target.value,
                                                )
                                            }
                                            className={getHighlightClass(
                                                'Síntomas',
                                                neutralInputClass,
                                            )}
                                        />
                                    </div>

                                    <div>
                                        <Label>Diagnóstico</Label>
                                        <Textarea
                                            value={data.diagnosis}
                                            onChange={(e) =>
                                                setData(
                                                    'diagnosis',
                                                    e.target.value,
                                                )
                                            }
                                            className={getHighlightClass(
                                                'Diagnóstico',
                                                neutralInputClass,
                                            )}
                                        />
                                    </div>

                                    <div>
                                        <Label>Tratamiento</Label>
                                        <Textarea
                                            value={data.treatment}
                                            onChange={(e) =>
                                                setData(
                                                    'treatment',
                                                    e.target.value,
                                                )
                                            }
                                            className={getHighlightClass(
                                                'Tratamiento',
                                                neutralInputClass,
                                            )}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card
                                className={cn(
                                    shouldHighlightField('Prescripciones') &&
                                        'border-red-300 ring-1 ring-red-200',
                                )}
                            >
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle>Prescripciones</CardTitle>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={addPrescription}
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Agregar prescripción
                                    </Button>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {prescriptions.map((p, idx) => (
                                        <div
                                            key={idx}
                                            className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                                        >
                                            <div className="mb-3 flex items-center justify-between">
                                                <p className="text-sm font-medium text-slate-900">
                                                    Prescripción {idx + 1}
                                                </p>
                                                {prescriptions.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            removePrescription(
                                                                idx,
                                                            )
                                                        }
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-red-50 hover:text-red-600"
                                                        aria-label="Eliminar prescripción"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                                <div>
                                                    <Label>Medicamento</Label>
                                                    <Input
                                                        value={
                                                            p.medication_name
                                                        }
                                                        onChange={(e) =>
                                                            updatePrescription(
                                                                idx,
                                                                'medication_name',
                                                                e.target.value,
                                                            )
                                                        }
                                                        className={
                                                            neutralInputClass
                                                        }
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Dosis</Label>
                                                    <Input
                                                        value={p.dosage}
                                                        onChange={(e) =>
                                                            updatePrescription(
                                                                idx,
                                                                'dosage',
                                                                e.target.value,
                                                            )
                                                        }
                                                        className={
                                                            neutralInputClass
                                                        }
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Frecuencia</Label>
                                                    <Input
                                                        value={p.frequency}
                                                        onChange={(e) =>
                                                            updatePrescription(
                                                                idx,
                                                                'frequency',
                                                                e.target.value,
                                                            )
                                                        }
                                                        className={
                                                            neutralInputClass
                                                        }
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Duración</Label>
                                                    <Input
                                                        value={p.duration}
                                                        onChange={(e) =>
                                                            updatePrescription(
                                                                idx,
                                                                'duration',
                                                                e.target.value,
                                                            )
                                                        }
                                                        className={
                                                            neutralInputClass
                                                        }
                                                    />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <Label>
                                                        Notas de la prescripción
                                                    </Label>
                                                    <Textarea
                                                        value={p.notes}
                                                        onChange={(e) =>
                                                            updatePrescription(
                                                                idx,
                                                                'notes',
                                                                e.target.value,
                                                            )
                                                        }
                                                        className={
                                                            neutralInputClass
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-6">
                            <PatientVitalsPreview patientId={patient.id} />
                            <PatientClinicalDocumentsPreview
                                medicalRecords={recentMedicalRecords}
                                labReports={recentLabReports}
                            />

                            <Card
                                className={cn(
                                    shouldHighlightField('Signos vitales') &&
                                        'border-red-300 ring-1 ring-red-200',
                                )}
                            >
                                <CardHeader>
                                    <CardTitle>Signos vitales</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <Label>Presión arterial</Label>
                                            <Input
                                                value={
                                                    data.vital_signs
                                                        .blood_pressure
                                                }
                                                onChange={(e) =>
                                                    setData('vital_signs', {
                                                        ...data.vital_signs,
                                                        blood_pressure:
                                                            e.target.value,
                                                    })
                                                }
                                                className={getHighlightClass(
                                                    'Signos vitales',
                                                    neutralInputClass,
                                                )}
                                                placeholder="120/80"
                                            />
                                            {pressureHint && (
                                                <p className="mt-1 text-xs text-amber-600">
                                                    {pressureHint}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <Label>
                                                Temperatura{' '}
                                                <span className="text-xs text-slate-500">
                                                    (°C)
                                                </span>
                                            </Label>
                                            <Input
                                                type="number"
                                                step="0.1"
                                                value={
                                                    data.vital_signs.temperature
                                                }
                                                onChange={(e) =>
                                                    setData('vital_signs', {
                                                        ...data.vital_signs,
                                                        temperature:
                                                            e.target.value,
                                                    })
                                                }
                                                className={getHighlightClass(
                                                    'Signos vitales',
                                                    neutralInputClass,
                                                )}
                                            />
                                            {getVitalAlert(
                                                'temperature',
                                                data.vital_signs.temperature,
                                            ) && (
                                                <p className="mt-1 text-xs text-amber-600">
                                                    {getVitalAlert(
                                                        'temperature',
                                                        data.vital_signs
                                                            .temperature,
                                                    )}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <Label>
                                                Pulso{' '}
                                                <span className="text-xs text-slate-500">
                                                    (bpm)
                                                </span>
                                            </Label>
                                            <Input
                                                type="number"
                                                value={data.vital_signs.pulse}
                                                onChange={(e) =>
                                                    setData('vital_signs', {
                                                        ...data.vital_signs,
                                                        pulse: e.target.value,
                                                    })
                                                }
                                                className={getHighlightClass(
                                                    'Signos vitales',
                                                    neutralInputClass,
                                                )}
                                            />
                                            {getVitalAlert(
                                                'pulse',
                                                data.vital_signs.pulse,
                                            ) && (
                                                <p className="mt-1 text-xs text-amber-600">
                                                    {getVitalAlert(
                                                        'pulse',
                                                        data.vital_signs.pulse,
                                                    )}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <Label>
                                                SpO2{' '}
                                                <span className="text-xs text-slate-500">
                                                    (%)
                                                </span>
                                            </Label>
                                            <Input
                                                type="number"
                                                value={data.vital_signs.spo2}
                                                onChange={(e) =>
                                                    setData('vital_signs', {
                                                        ...data.vital_signs,
                                                        spo2: e.target.value,
                                                    })
                                                }
                                                className={getHighlightClass(
                                                    'Signos vitales',
                                                    neutralInputClass,
                                                )}
                                            />
                                            {getVitalAlert(
                                                'spo2',
                                                data.vital_signs.spo2,
                                            ) && (
                                                <p className="mt-1 text-xs text-amber-600">
                                                    {getVitalAlert(
                                                        'spo2',
                                                        data.vital_signs.spo2,
                                                    )}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Archivos y notas</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label>Adjuntar archivos</Label>
                                        <div className="mt-2">
                                            <FileUploadField
                                                id="medical_record_files"
                                                multiple
                                                accept=".pdf,image/png,image/jpeg,.doc,.docx"
                                                onChangeMultiple={
                                                    handleFilesChange
                                                }
                                                fileNames={selectedFileNames}
                                                placeholder="Arrastre o seleccione archivos"
                                                hint="PDF, PNG, JPG, DOC o DOCX hasta 5 MB por archivo."
                                                note="Los borradores guardan el texto del formulario, pero no conservan archivos seleccionados si recarga la página."
                                            />
                                        </div>
                                        {errors.files && (
                                            <p className="mt-1 text-sm text-red-500">
                                                {errors.files}
                                            </p>
                                        )}
                                        {data.files.length > 0 && (
                                            <div className="mt-3 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                                                {data.files.map(
                                                    (file, index) => (
                                                        <div
                                                            key={`${file.name}-${index}`}
                                                            className="flex items-center justify-between gap-3 rounded-md bg-white px-3 py-2"
                                                        >
                                                            <div className="min-w-0">
                                                                <div className="truncate text-sm font-medium text-slate-900">
                                                                    {file.name}
                                                                </div>
                                                                <div className="text-xs text-slate-500">
                                                                    {file.type ||
                                                                        'Archivo'}{' '}
                                                                    ·{' '}
                                                                    {(
                                                                        file.size /
                                                                        1024 /
                                                                        1024
                                                                    ).toFixed(
                                                                        2,
                                                                    )}{' '}
                                                                    MB
                                                                </div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    removeFile(
                                                                        index,
                                                                    )
                                                                }
                                                                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-red-50 hover:text-red-600"
                                                                aria-label="Quitar archivo"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <Label>Notas internas</Label>
                                        <Textarea
                                            value={data.notes}
                                            onChange={(e) =>
                                                setData('notes', e.target.value)
                                            }
                                            className={neutralInputClass}
                                        />
                                    </div>

                                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900">
                                        <div className="flex items-start gap-2">
                                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                            <div>
                                                <p className="font-medium">
                                                    Borrador automático activo
                                                </p>
                                                <p className="text-xs text-amber-800">
                                                    El contenido escrito del
                                                    formulario se guarda
                                                    localmente mientras completa
                                                    la consulta.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    <div className="sticky bottom-0 z-20 border-t border-slate-200 bg-white/95 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-white/80">
                        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <FileText className="h-4 w-4" />
                                <span>
                                    Cmd/Ctrl + Enter para guardar rápido
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <Button type="button" variant="outline" asChild>
                                    <Link
                                        href={`/medical/patients/${patient.id}`}
                                    >
                                        Cancelar
                                    </Link>
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing
                                        ? 'Guardando...'
                                        : 'Guardar Historia Clínica'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>

            <AlertDialog
                open={submitGuard.open}
                onOpenChange={(open) =>
                    setSubmitGuard((current) =>
                        open
                            ? current
                            : { open: false, mode: null, missing: [] },
                    )
                }
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {submitGuard.mode === 'required'
                                ? 'Faltan campos obligatorios'
                                : 'Hay datos clínicos sin registrar'}
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-3">
                                <p>
                                    {submitGuard.mode === 'required'
                                        ? 'Complete estos campos antes de guardar la nueva consulta:'
                                        : 'La consulta se puede guardar igual, pero faltan datos importantes. Revise si desea continuar sin registrar:'}
                                </p>
                                <ul className="list-disc space-y-1 pl-5 text-left">
                                    {submitGuard.missing.map((item) => (
                                        <li key={item}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        {submitGuard.mode === 'required' ? (
                            <AlertDialogAction
                                onClick={() =>
                                    setSubmitGuard({
                                        open: false,
                                        mode: null,
                                        missing: [],
                                    })
                                }
                            >
                                Entendido
                            </AlertDialogAction>
                        ) : (
                            <>
                                <AlertDialogCancel>
                                    Volver y completar
                                </AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={() => {
                                        setSubmitGuard({
                                            open: false,
                                            mode: null,
                                            missing: [],
                                        });
                                        submitRecord();
                                    }}
                                >
                                    Guardar de todos modos
                                </AlertDialogAction>
                            </>
                        )}
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
