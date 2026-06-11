import { Head, router } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { useLabExternalLaboratories } from '@/hooks/useLabExternalLaboratories';

import ExternalLaboratoryForm from './Form';

interface ExternalLaboratory {
    id: number;
    name: string;
    contact_name?: string | null;
    phone?: string | null;
    whatsapp?: string | null;
    email?: string | null;
    address?: string | null;
    notes?: string | null;
    status: 'active' | 'inactive';
}

interface Props {
    externalLaboratory: ExternalLaboratory;
}

export default function ExternalLaboratoriesEdit({ externalLaboratory }: Props) {
    const { update, loading } = useLabExternalLaboratories();

    const breadcrumbs = [
        { href: '/medical', title: 'Sistema Médico' },
        { href: '/medical/laboratory', title: 'Laboratorio' },
        { href: '/medical/laboratory/external-laboratories', title: 'Laboratorios Externos' },
        {
            href: `/medical/laboratory/external-laboratories/${externalLaboratory.id}/edit`,
            title: 'Editar',
            current: true,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Editar Laboratorio Externo: ${externalLaboratory.name}`} />

            <div className="px-4 py-6 sm:px-6 lg:px-8">
                <div className="mb-6 flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.visit('/medical/laboratory/external-laboratories')}
                    >
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Volver
                    </Button>
                    <div>
                        <h1 className="text-lg font-bold tracking-tight">Editar Laboratorio Externo</h1>
                        <p className="text-sm text-muted-foreground">{externalLaboratory.name}</p>
                    </div>
                </div>

                <ExternalLaboratoryForm
                    title="Datos del Laboratorio"
                    submitLabel="Actualizar Laboratorio"
                    loading={loading}
                    initialValues={{
                        name: externalLaboratory.name,
                        contact_name: externalLaboratory.contact_name || '',
                        phone: externalLaboratory.phone || '',
                        whatsapp: externalLaboratory.whatsapp || '',
                        email: externalLaboratory.email || '',
                        address: externalLaboratory.address || '',
                        notes: externalLaboratory.notes || '',
                        status: externalLaboratory.status,
                    }}
                    onSubmit={(values) =>
                        update(externalLaboratory.id, values, () => {
                            toast.success('Laboratorio externo actualizado exitosamente');
                            router.visit('/medical/laboratory/external-laboratories');
                        })
                    }
                />
            </div>
        </AppLayout>
    );
}
