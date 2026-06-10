import { Head, router } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { useLabEquipments } from '@/hooks/useLabEquipments';

import EquipmentForm from './Form';

interface Area {
    id: number;
    name: string;
    code: string;
}

interface Props {
    areas: Area[];
}

export default function LabEquipmentsCreate({ areas }: Props) {
    const { create, loading } = useLabEquipments();

    const breadcrumbs = [
        { href: '/medical', title: 'Sistema Médico' },
        { href: '/medical/laboratory', title: 'Laboratorio' },
        { href: '/medical/laboratory/equipments', title: 'Equipos' },
        { href: '/medical/laboratory/equipments/create', title: 'Nuevo', current: true },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Nuevo Equipo de Laboratorio" />

            <div className="px-4 py-6 sm:px-6 lg:px-8">
                <div className="mb-6 flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={() => router.visit('/medical/laboratory/equipments')}>
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Volver
                    </Button>
                    <div>
                        <h1 className="text-lg font-bold tracking-tight">Nuevo Equipo de Laboratorio</h1>
                        <p className="text-sm text-muted-foreground">Registrar un equipo utilizable en perfiles y resultados.</p>
                    </div>
                </div>

                <EquipmentForm
                    title="Datos del Equipo"
                    submitLabel="Crear Equipo"
                    loading={loading}
                    areas={areas}
                    initialValues={{
                        name: '',
                        code: '',
                        manufacturer: '',
                        model: '',
                        serial_number: '',
                        department: '',
                        lab_area_id: null,
                        status: 'active',
                        notes: '',
                    }}
                    onSubmit={(values) =>
                        create(values, () => {
                            toast.success('Equipo creado exitosamente');
                            router.visit('/medical/laboratory/equipments');
                        })
                    }
                />
            </div>
        </AppLayout>
    );
}
