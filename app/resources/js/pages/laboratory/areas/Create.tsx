import { Head, router } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { useLabAreas } from '@/hooks/useLabAreas';

import AreaForm from './Form';

export default function LabAreasCreate() {
    const { create, loading } = useLabAreas();

    const breadcrumbs = [
        { href: '/medical', title: 'Sistema Médico' },
        { href: '/medical/laboratory', title: 'Laboratorio' },
        { href: '/medical/laboratory/areas', title: 'Áreas' },
        { href: '/medical/laboratory/areas/create', title: 'Nueva', current: true },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Nueva Área de Laboratorio" />

            <div className="px-4 py-6 sm:px-6 lg:px-8">
                <div className="mb-6 flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={() => router.visit('/medical/laboratory/areas')}>
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Volver
                    </Button>
                    <div>
                        <h1 className="text-lg font-bold tracking-tight">Nueva Área de Laboratorio</h1>
                        <p className="text-sm text-muted-foreground">Crear área organizativa para perfiles y equipos.</p>
                    </div>
                </div>

                <AreaForm
                    title="Datos del Área"
                    submitLabel="Crear Área"
                    loading={loading}
                    initialValues={{
                        name: '',
                        code: '',
                        description: '',
                        status: 'active',
                        display_order: '0',
                    }}
                    onSubmit={(values) =>
                        create(
                            {
                                ...values,
                                display_order: values.display_order ? Number(values.display_order) : 0,
                            },
                            () => {
                                toast.success('Área creada exitosamente');
                                router.visit('/medical/laboratory/areas');
                            },
                        )
                    }
                />
            </div>
        </AppLayout>
    );
}
