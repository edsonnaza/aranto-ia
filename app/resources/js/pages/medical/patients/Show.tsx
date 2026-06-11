import HeadingSmall from '@/components/heading-small';
import MedicalTimeline from '@/components/medical/MedicalTimeline';
import PatientSidebarCard from '@/components/medical/PatientSidebarCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Patient } from '@/types/medical';
import { calculateAge, formatSystemDateTime } from '@/utils/date-utils';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    Download,
    FileImage,
    FilePlus2,
    FileStack,
    FileText,
    FlaskConical,
    PlusCircle,
    Shield,
    Stethoscope,
    UserRound,
} from 'lucide-react';
import { useMemo, useState } from 'react';

interface LabReportItem {
    id: number;
    report_number: string;
    generated_at?: string | null;
    sample_number?: string | null;
    profiles?: string[];
}

interface PatientsShowProps {
    patient: Patient;
    medicalRecords?: any[];
    labReports?: LabReportItem[];
}

interface ClinicalDocumentItem {
    id: string;
    category: 'laboratory' | 'image' | 'document';
    title: string;
    subtitle: string;
    createdAt: string | null;
    href: string;
    sourceLabel: string;
}

const getInitials = (firstName?: string, lastName?: string) =>
    `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.trim().toUpperCase() || 'P';

const getGenderLabel = (gender?: string | null) => {
    if (gender === 'M' || gender === 'male') return 'Masculino';
    if (gender === 'F' || gender === 'female') return 'Femenino';
    if (gender === 'OTHER' || gender === 'other') return 'Otro';
    return 'No especificado';
};

function EmptyState({
    icon,
    title,
    description,
    actionLabel,
    actionHref,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    actionLabel?: string;
    actionHref?: string;
}) {
    return (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
            <div className="mb-3 rounded-full bg-white p-3 text-slate-500 shadow-sm">
                {icon}
            </div>
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
            <p className="mt-1 max-w-md text-sm text-slate-600">
                {description}
            </p>
            {actionLabel && actionHref && (
                <Button className="mt-4" asChild>
                    <Link href={actionHref}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        {actionLabel}
                    </Link>
                </Button>
            )}
        </div>
    );
}

export default function PatientsShow({
    patient,
    medicalRecords = [],
    labReports = [],
}: PatientsShowProps) {
    const [documentsOpen, setDocumentsOpen] = useState(false);
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Sistema Médico', href: '/medical' },
        { title: 'Pacientes', href: '/medical/patients' },
        {
            title: `${patient.first_name} ${patient.last_name}`,
            href: `/medical/patients/${patient.id}`,
        },
    ];

    const patientAge = patient.birth_date
        ? `${calculateAge(patient.birth_date)}`
        : 'Edad no disponible';

    const clinicalDocuments = useMemo<ClinicalDocumentItem[]>(() => {
        const documentsFromRecords = medicalRecords.flatMap((record: any) => {
            const files = Array.isArray(record.files) ? record.files : [];

            return files.map((file: any) => {
                const fileType = String(file.file_type || '').toLowerCase();
                const originalName = file.original_name || 'Documento adjunto';
                const isImage =
                    fileType.startsWith('image/') ||
                    /\.(png|jpg|jpeg|gif|webp)$/i.test(originalName);

                return {
                    id: `record-file-${file.id}`,
                    category: isImage ? 'image' : 'document',
                    title: originalName,
                    subtitle: record.reason || 'Historia clínica',
                    createdAt:
                        record.consultation_date || record.created_at || null,
                    href: `/medical/medical-record-files/${file.id}/download`,
                    sourceLabel: isImage
                        ? 'Imagen clínica'
                        : 'Documento clínico',
                };
            });
        });

        const labDocuments = labReports.map((report) => ({
            id: `lab-report-${report.id}`,
            category: 'laboratory' as const,
            title:
                report.profiles && report.profiles.length > 0
                    ? report.profiles.join(', ')
                    : 'Estudio de laboratorio',
            subtitle: report.report_number,
            createdAt: report.generated_at ?? null,
            href: `/medical/laboratory/reports/${report.id}/download`,
            sourceLabel: 'Informe de laboratorio',
        }));

        return [...labDocuments, ...documentsFromRecords].sort((a, b) => {
            const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return bTime - aTime;
        });
    }, [labReports, medicalRecords]);

    const laboratoryDocuments = clinicalDocuments.filter(
        (item) => item.category === 'laboratory',
    );
    const imageDocuments = clinicalDocuments.filter(
        (item) => item.category === 'image',
    );
    const genericDocuments = clinicalDocuments.filter(
        (item) => item.category === 'document',
    );

    const latestByCategory = {
        laboratory: laboratoryDocuments[0] ?? null,
        image: imageDocuments[0] ?? null,
        document: genericDocuments[0] ?? null,
    };

    const renderDocumentList = (
        items: ClinicalDocumentItem[],
        emptyText: string,
    ) =>
        items.length > 0 ? (
            <div className="space-y-3">
                {items.map((item) => (
                    <div
                        key={item.id}
                        className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4"
                    >
                        <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-900">
                                {item.title}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                                {item.sourceLabel}
                                {item.subtitle ? ` · ${item.subtitle}` : ''}
                                {item.createdAt
                                    ? ` · ${formatSystemDateTime(item.createdAt)}`
                                    : ''}
                            </p>
                        </div>
                        <a
                            href={item.href}
                            className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
                        >
                            <Download className="h-4 w-4" />
                            Descargar
                        </a>
                    </div>
                ))}
            </div>
        ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                {emptyText}
            </div>
        );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head
                title={`${patient.first_name} ${patient.last_name} - Pacientes`}
            />

            <div className="space-y-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
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
                                            title={`${patient.first_name} ${patient.last_name}`}
                                            description="Información detallada del paciente"
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
                                                <UserRound className="mr-1 h-3 w-3" />
                                                {patientAge}
                                            </span>
                                            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                                                {getGenderLabel(patient.gender)}
                                            </span>
                                            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                                                {patient.document_number ||
                                                    'Sin documento'}
                                            </span>
                                            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                                                <Shield className="mr-1 h-3 w-3" />
                                                {patient.insurance_type?.name ||
                                                    'Sin seguro'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => setDocumentsOpen(true)}
                                    >
                                        <FileStack className="mr-2 h-4 w-4" />
                                        Documentos clínicos
                                    </Button>
                                    <Button variant="outline" asChild>
                                        <Link
                                            href={`/medical/patients/${patient.id}/edit`}
                                        >
                                            Editar Paciente
                                        </Link>
                                    </Button>
                                    <Button asChild>
                                        <Link
                                            href={`/medical/patients/${patient.id}/medical-records/create`}
                                            className="flex items-center gap-2"
                                        >
                                            <PlusCircle className="h-4 w-4" />
                                            Nueva Consulta
                                        </Link>
                                    </Button>
                                    <Button variant="outline" asChild>
                                        <Link href="/medical/patients">
                                            <ArrowLeft className="mr-2 h-4 w-4" />
                                            Volver
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1.5fr)_minmax(0,1fr)]">
                    <aside className="hidden xl:block">
                        <PatientSidebarCard patient={patient} />
                    </aside>

                    <Card className="xl:col-span-1">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>Historia Clínica / Consultas</span>
                                <span className="text-sm text-muted-foreground">
                                    Total: {medicalRecords.length}
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {medicalRecords.length === 0 ? (
                                <EmptyState
                                    icon={<Stethoscope className="h-5 w-5" />}
                                    title="No hay consultas registradas"
                                    description="Todavía no se creó ninguna historia clínica para este paciente."
                                    actionLabel="Registrar primera consulta"
                                    actionHref={`/medical/patients/${patient.id}/medical-records/create`}
                                />
                            ) : (
                                <MedicalTimeline records={medicalRecords} />
                            )}
                        </CardContent>
                    </Card>

                    <Card className="xl:col-span-1">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <FlaskConical className="h-4 w-4 text-indigo-600" />
                                    Estudios de Laboratorio
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    Total: {labReports.length}
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {labReports.length === 0 ? (
                                <EmptyState
                                    icon={<FilePlus2 className="h-5 w-5" />}
                                    title="Sin estudios publicados"
                                    description="Cuando se publiquen resultados de laboratorio, aparecerán aquí para descargarlos rápidamente."
                                />
                            ) : (
                                <div className="space-y-3">
                                    {labReports.map((report) => (
                                        <div
                                            key={report.id}
                                            className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                                        >
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium text-slate-900">
                                                    {report.profiles &&
                                                    report.profiles.length > 0
                                                        ? report.profiles.join(
                                                              ', ',
                                                          )
                                                        : 'Estudio de laboratorio'}
                                                </p>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    {report.report_number}
                                                    {report.sample_number
                                                        ? ` · Muestra ${report.sample_number}`
                                                        : ''}
                                                    {report.generated_at
                                                        ? ` · ${new Date(report.generated_at).toLocaleString()}`
                                                        : ''}
                                                </p>
                                            </div>
                                            <div className="mt-3">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    asChild
                                                >
                                                    <a
                                                        href={`/medical/laboratory/reports/${report.id}/download`}
                                                    >
                                                        <Download className="mr-2 h-4 w-4" />
                                                        Descargar PDF
                                                    </a>
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Dialog open={documentsOpen} onOpenChange={setDocumentsOpen}>
                <DialogContent className="max-h-[85vh] max-w-5xl overflow-hidden p-0">
                    <DialogHeader className="border-b border-slate-200 px-6 py-5">
                        <DialogTitle>
                            Documentos clínicos del paciente
                        </DialogTitle>
                        <DialogDescription>
                            Vista agrupada por categoría para revisar los
                            últimos elementos de laboratorio, imágenes y
                            documentos sin cargar más la ficha principal.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 overflow-y-auto px-6 py-5">
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-800">
                                    <FlaskConical className="h-4 w-4 text-indigo-600" />
                                    Laboratorio
                                </div>
                                <p className="text-2xl font-semibold text-slate-900">
                                    {laboratoryDocuments.length}
                                </p>
                                <p className="mt-2 text-xs text-slate-500">
                                    {latestByCategory.laboratory
                                        ? `Último: ${latestByCategory.laboratory.title}`
                                        : 'Sin estudios publicados'}
                                </p>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-800">
                                    <FileImage className="h-4 w-4 text-emerald-600" />
                                    Imágenes
                                </div>
                                <p className="text-2xl font-semibold text-slate-900">
                                    {imageDocuments.length}
                                </p>
                                <p className="mt-2 text-xs text-slate-500">
                                    {latestByCategory.image
                                        ? `Última: ${latestByCategory.image.title}`
                                        : 'Sin imágenes adjuntas'}
                                </p>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-800">
                                    <FileText className="h-4 w-4 text-sky-600" />
                                    Documentos
                                </div>
                                <p className="text-2xl font-semibold text-slate-900">
                                    {genericDocuments.length}
                                </p>
                                <p className="mt-2 text-xs text-slate-500">
                                    {latestByCategory.document
                                        ? `Último: ${latestByCategory.document.title}`
                                        : 'Sin documentos adjuntos'}
                                </p>
                            </div>
                        </div>

                        <Tabs defaultValue="laboratory" className="gap-4">
                            <TabsList className="w-full justify-start">
                                <TabsTrigger value="laboratory">
                                    Laboratorio
                                </TabsTrigger>
                                <TabsTrigger value="images">
                                    Imágenes
                                </TabsTrigger>
                                <TabsTrigger value="documents">
                                    Documentos
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="laboratory">
                                {renderDocumentList(
                                    laboratoryDocuments,
                                    'No hay informes de laboratorio disponibles.',
                                )}
                            </TabsContent>

                            <TabsContent value="images">
                                {renderDocumentList(
                                    imageDocuments,
                                    'No hay imágenes clínicas adjuntas.',
                                )}
                            </TabsContent>

                            <TabsContent value="documents">
                                {renderDocumentList(
                                    genericDocuments,
                                    'No hay documentos clínicos adjuntos.',
                                )}
                            </TabsContent>
                        </Tabs>
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
