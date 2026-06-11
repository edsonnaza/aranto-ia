import { Head, router } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { useLabAreas } from '@/hooks/useLabAreas';

import AreaForm from './Form';

interface Area {
    id: number;
    name: string;
    code: string;
    description?: string | null;
    status: 'active' | 'inactive';
    display_order?: number | null;
}

interface Props {
    area: Area;
}

export default function LabAreasEdit({ area }: Props) {
    const { update, loading } = useLabAreas();

    const breadcrumbs = [
        { href: '/medical', title: 'Sistema Médico' },
        { href: '/medical/laboratory', title: 'Laboratorio' },
        { href: '/medical/laboratory/areas', title: 'Áreas' },
        { href: `/medical/laboratory/areas/${area.id}/edit`, title: 'Editar', current: true },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Editar Área: ${area.name}`} />

            <div className="px-4 py-6 sm:px-6 lg:px-8">
                <div className="mb-6 flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={() => router.visit('/medical/laboratory/areas')}>
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Volver
                    </Button>
                    <div>
                        <h1 className="text-lg font-bold tracking-tight">Editar Área de Laboratorio</h1>
                        <p className="text-sm text-muted-foreground">{area.name}</p>
                    </div>
                </div>

                <AreaForm
                    title="Datos del Área"
                    submitLabel="Actualizar Área"
                    loading={loading}
                    initialValues={{
                        name: area.name,
                        code: area.code,
                        description: area.description || '',
                        status: area.status,
                        display_order: String(area.display_order ?? 0),
                    }}
                    onSubmit={(values) =>
                        update(
                            area.id,
                            {
                                ...values,
                                display_order: values.display_order ? Number(values.display_order) : 0,
                            },
                            () => {
                                toast.success('Área actualizada exitosamente');
                                router.visit('/medical/laboratory/areas');
                            },
                        )
                    }
                />
            </div>
        </AppLayout>
    );
}
