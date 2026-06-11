import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatSystemDateTime } from '@/utils/date-utils';
import { Download, FileImage, FileText, FlaskConical } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
interface LabReportItem {
    id: number;
    report_number: string;
    generated_at?: string | null;
    sample_number?: string | null;
    profiles?: string[];
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

interface Props {
    medicalRecords?: any[];
    labReports?: LabReportItem[];
}

const categoryMeta = {
    laboratory: {
        title: 'Laboratorio',
        empty: 'Sin estudios recientes.',
        icon: FlaskConical,
        iconClass: 'text-indigo-600',
    },
    image: {
        title: 'Imágenes',
        empty: 'Sin imágenes recientes.',
        icon: FileImage,
        iconClass: 'text-emerald-600',
    },
    document: {
        title: 'Documentos',
        empty: 'Sin documentos recientes.',
        icon: FileText,
        iconClass: 'text-sky-600',
    },
} as const;

export default function PatientClinicalDocumentsPreview({
    medicalRecords = [],
    labReports = [],
}: Props) {
    const [open, setOpen] = useState(false);
    const documents = useMemo<ClinicalDocumentItem[]>(() => {
        const fromRecords = medicalRecords.flatMap((record: any) => {
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
                } satisfies ClinicalDocumentItem;
            });
        });

        const fromLab = labReports.map((report) => ({
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

        return [...fromLab, ...fromRecords].sort((a, b) => {
            const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return bTime - aTime;
        });
    }, [labReports, medicalRecords]);

    const latestByCategory = {
        laboratory:
            documents.find((item) => item.category === 'laboratory') ?? null,
        image: documents.find((item) => item.category === 'image') ?? null,
        document:
            documents.find((item) => item.category === 'document') ?? null,
    };

    const laboratoryDocuments = documents.filter(
        (item) => item.category === 'laboratory',
    );
    const imageDocuments = documents.filter(
        (item) => item.category === 'image',
    );
    const genericDocuments = documents.filter(
        (item) => item.category === 'document',
    );

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
                            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
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
        <>
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <CardTitle>Últimos documentos clínicos</CardTitle>
                            <p className="mt-1 text-sm text-slate-500">
                                Referencia rápida de lo último cargado por
                                categoría, disponible sin salir de la consulta.
                            </p>
                        </div>
                        <Button
                         
                            variant="outline"
                            size="sm"
                            type="button"
                            onClick={() => setOpen(true)}
                            className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
                        >
                            Ver históricos
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-3">
                        {(
                            ['laboratory', 'image', 'document'] as Array<
                                keyof typeof latestByCategory
                            >
                        ).map((category) => {
                            const item = latestByCategory[category];
                            const meta = categoryMeta[category];
                            const Icon = meta.icon;

                            return (
                                <div
                                    key={category}
                                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                                >
                                    <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-800">
                                        <Icon
                                            className={`h-4 w-4 ${meta.iconClass}`}
                                        />
                                        {meta.title}
                                    </div>

                                    {item ? (
                                        <div className="space-y-2">
                                            <div>
                                                <p className="truncate text-sm font-medium text-slate-900">
                                                    {item.title}
                                                </p>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    {item.sourceLabel}
                                                    {item.subtitle
                                                        ? ` · ${item.subtitle}`
                                                        : ''}
                                                    {item.createdAt
                                                        ? ` · ${formatSystemDateTime(item.createdAt)}`
                                                        : ''}
                                                </p>
                                            </div>
                                            <div className="flex justify-end">
                                                <a
                                                    href={item.href}
                                                    className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
                                                >
                                                    <Download className="h-4 w-4" />
                                                    Descargar
                                                </a>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-500">
                                            {meta.empty}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-h-[85vh] max-w-5xl overflow-hidden p-0">
                    <DialogHeader className="border-b border-slate-200 px-6 py-5">
                        <DialogTitle>
                            Históricos de documentos clínicos
                        </DialogTitle>
                        <DialogDescription>
                            Revisión agrupada por categoría para consultar otros
                            históricos sin salir de la nueva consulta.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 overflow-y-auto px-6 py-5">
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
        </>
    );
}
