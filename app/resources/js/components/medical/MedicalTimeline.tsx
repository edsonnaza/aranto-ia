import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';
import { Stethoscope } from 'lucide-react';
import MedicalTimelineItem from './MedicalTimelineItem';

interface MedicalTimelineProps {
    records?: any[];
    emptyActionHref?: string;
}

export default function MedicalTimeline({
    records = [],
    emptyActionHref,
}: MedicalTimelineProps) {
    if (!records || !records.length) {
        return (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
                <div className="mb-3 rounded-full bg-white p-3 text-slate-500 shadow-sm">
                    <Stethoscope className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900">
                    No hay consultas registradas
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                    Todavía no se creó una historia clínica para este paciente.
                </p>
                {emptyActionHref && (
                    <Button className="mt-4" asChild>
                        <Link href={emptyActionHref}>
                            Registrar primera consulta
                        </Link>
                    </Button>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {records.map((r: any) => (
                <MedicalTimelineItem key={r.id} record={r} />
            ))}
        </div>
    );
}
