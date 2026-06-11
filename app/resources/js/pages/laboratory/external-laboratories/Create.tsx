import { Head, router } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { useLabExternalLaboratories } from '@/hooks/useLabExternalLaboratories';

import ExternalLaboratoryForm from './Form';

export default function ExternalLaboratoriesCreate() {
    const { create, loading } = useLabExternalLaboratories();

    const breadcrumbs = [
        { href: '/medical', title: 'Sistema Médico' },
        { href: '/medical/laboratory', title: 'Laboratorio' },
        { href: '/medical/laboratory/external-laboratories', title: 'Laboratorios Externos' },
        { href: '/medical/laboratory/external-laboratories/create', title: 'Nuevo', current: true },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Nuevo Laboratorio Externo" />

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
                        <h1 className="text-lg font-bold tracking-tight">Nuevo Laboratorio Externo</h1>
                        <p className="text-sm text-muted-foreground">
                            Registrar un laboratorio para estudios derivados.
                        </p>
                    </div>
                </div>

                <ExternalLaboratoryForm
                    title="Datos del Laboratorio"
                    submitLabel="Crear Laboratorio"
                    loading={loading}
                    initialValues={{
                        name: '',
                        contact_name: '',
                        phone: '',
                        whatsapp: '',
                        email: '',
                        address: '',
                        notes: '',
                        status: 'active',
                    }}
                    onSubmit={(values) =>
                        create(values, () => {
                            toast.success('Laboratorio externo creado exitosamente');
                            router.visit('/medical/laboratory/external-laboratories');
                        })
                    }
                />
            </div>
        </AppLayout>
    );
}
