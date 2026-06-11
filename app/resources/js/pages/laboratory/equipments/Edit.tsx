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

interface Equipment {
    id: number;
    name: string;
    code?: string | null;
    manufacturer?: string | null;
    model?: string | null;
    serial_number?: string | null;
    department?: string | null;
    lab_area_id?: number | null;
    status: 'active' | 'maintenance' | 'inactive';
    notes?: string | null;
}

interface Props {
    equipment: Equipment;
    areas: Area[];
}

export default function LabEquipmentsEdit({ equipment, areas }: Props) {
    const { update, loading } = useLabEquipments();

    const breadcrumbs = [
        { href: '/medical', title: 'Sistema Médico' },
        { href: '/medical/laboratory', title: 'Laboratorio' },
        { href: '/medical/laboratory/equipments', title: 'Equipos' },
        { href: `/medical/laboratory/equipments/${equipment.id}/edit`, title: 'Editar', current: true },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Editar Equipo: ${equipment.name}`} />

            <div className="px-4 py-6 sm:px-6 lg:px-8">
                <div className="mb-6 flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={() => router.visit('/medical/laboratory/equipments')}>
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Volver
                    </Button>
                    <div>
                        <h1 className="text-lg font-bold tracking-tight">Editar Equipo de Laboratorio</h1>
                        <p className="text-sm text-muted-foreground">{equipment.name}</p>
                    </div>
                </div>

                <EquipmentForm
                    title="Datos del Equipo"
                    submitLabel="Actualizar Equipo"
                    loading={loading}
                    areas={areas}
                    initialValues={{
                        name: equipment.name,
                        code: equipment.code || '',
                        manufacturer: equipment.manufacturer || '',
                        model: equipment.model || '',
                        serial_number: equipment.serial_number || '',
                        department: equipment.department || '',
                        lab_area_id: equipment.lab_area_id || null,
                        status: equipment.status,
                        notes: equipment.notes || '',
                    }}
                    onSubmit={(values) =>
                        update(equipment.id, values, () => {
                            toast.success('Equipo actualizado exitosamente');
                            router.visit('/medical/laboratory/equipments');
                        })
                    }
                />
            </div>
        </AppLayout>
    );
}
