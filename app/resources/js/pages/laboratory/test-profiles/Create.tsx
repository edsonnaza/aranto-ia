import { useLabTestProfiles } from '@/hooks/useLabTestProfiles';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { toast } from 'sonner';
import LabTestProfileForm from './Form';

interface Service {
    id: number;
    name: string;
    code: string;
    lab_area_id: number | null;
    lab_area_code?: string | null;
}

interface LabArea {
    id: number;
    name: string;
    code: string;
}

interface Equipment {
    id: number;
    name: string;
    code: string | null;
    lab_area_id: number | null;
}

interface ReferenceRange {
    gender: 'male' | 'female' | 'all';
    age_min?: string;
    age_max?: string;
    min_value?: string;
    max_value?: string;
    reference_text?: string;
}

interface Parameter {
    name: string;
    code: string;
    parameter_type: 'numeric' | 'text' | 'option' | 'calculated';
    unit?: string;
    is_required: boolean;
    include_in_sum_100: boolean;
    formula?: string;
    reference_ranges: ReferenceRange[];
}

interface Props {
    areas: LabArea[];
    services: Service[];
    equipments: Equipment[];
}

export default function LabTestProfilesCreate({
    areas,
    services,
    equipments,
}: Props) {
    const { create, loading } = useLabTestProfiles();
    const breadcrumbs = [
        { href: '/medical', title: 'Sistema Médico' },
        { href: '/medical/laboratory', title: 'Laboratorio' },
        {
            href: '/medical/laboratory/test-profiles',
            title: 'Perfiles de Laboratorio',
        },
        {
            href: '/medical/laboratory/test-profiles/create',
            title: 'Nuevo',
            current: true,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Nuevo Perfil de Laboratorio" />
            <div className="px-4 py-6 sm:px-6 lg:px-8">
                <LabTestProfileForm
                    title="Nuevo Perfil de Laboratorio"
                    submitLabel="Crear Perfil"
                    areas={areas}
                    services={services}
                    equipments={equipments}
                    loading={loading}
                    initialData={{
                        medical_service_id: 0,
                        lab_area_id: null,
                        name: '',
                        code: '',
                        description: '',
                        status: 'active',
                        validation_type: 'none',
                        validation_target: 100,
                        validation_tolerance: 0,
                        equipment_ids: [],
                        default_equipment_id: null,
                        parameters: [
                            {
                                name: '',
                                code: '',
                                parameter_type: 'numeric',
                                unit: '',
                                is_required: true,
                                include_in_sum_100: false,
                                formula: '',
                                reference_ranges: [
                                    {
                                        gender: 'all',
                                        age_min: '',
                                        age_max: '',
                                        min_value: '',
                                        max_value: '',
                                        reference_text: '',
                                    },
                                ],
                            },
                        ] as Parameter[],
                    }}
                    onSubmit={(data) =>
                        create(data, () => {
                            toast.success('Perfil creado exitosamente');
                        })
                    }
                />
            </div>
        </AppLayout>
    );
}
