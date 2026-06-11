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
    gender?: 'male' | 'female' | 'all';
    age_min?: number | string | null;
    age_max?: number | string | null;
    min_value?: number | string | null;
    max_value?: number | string | null;
    reference_text?: string | null;
}

interface Profile {
    id: number;
    medical_service_id: number;
    lab_area_id: number | null;
    name: string;
    code: string;
    description?: string;
    status: 'active' | 'inactive';
    validation_type: 'none' | 'sum_100';
    validation_target: number;
    validation_tolerance: number;
    parameters: Array<{
        name: string;
        code: string;
        parameter_type: 'numeric' | 'text' | 'option' | 'calculated';
        unit?: string;
        is_required: boolean;
        include_in_sum_100?: boolean;
        formula?: string;
        reference_ranges?: ReferenceRange[];
    }>;
    profile_equipments: Array<{
        lab_equipment_id: number;
        is_default: boolean;
    }>;
}

interface Props {
    profile: Profile;
    areas: LabArea[];
    services: Service[];
    equipments: Equipment[];
}

export default function LabTestProfilesEdit({
    profile,
    areas,
    services,
    equipments,
}: Props) {
    const { update, loading } = useLabTestProfiles();
    const breadcrumbs = [
        { href: '/medical', title: 'Sistema Médico' },
        { href: '/medical/laboratory', title: 'Laboratorio' },
        {
            href: '/medical/laboratory/test-profiles',
            title: 'Perfiles de Laboratorio',
        },
        {
            href: `/medical/laboratory/test-profiles/${profile.id}/edit`,
            title: 'Editar',
            current: true,
        },
    ];

    const defaultEquipment = profile.profile_equipments.find(
        (item) => item.is_default,
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Editar Perfil ${profile.name}`} />
            <div className="px-4 py-6 sm:px-6 lg:px-8">
                <LabTestProfileForm
                    title={`Editar Perfil: ${profile.name}`}
                    submitLabel="Guardar Cambios"
                    areas={areas}
                    services={services}
                    equipments={equipments}
                    loading={loading}
                    initialData={{
                        medical_service_id: profile.medical_service_id,
                        lab_area_id: profile.lab_area_id,
                        name: profile.name,
                        code: profile.code,
                        description: profile.description || '',
                        status: profile.status,
                        validation_type: profile.validation_type || 'none',
                        validation_target: profile.validation_target ?? 100,
                        validation_tolerance: profile.validation_tolerance ?? 0,
                        equipment_ids: profile.profile_equipments.map(
                            (item) => item.lab_equipment_id,
                        ),
                        default_equipment_id:
                            defaultEquipment?.lab_equipment_id || null,
                        parameters:
                            profile.parameters.length > 0
                                ? profile.parameters.map((parameter) => ({
                                      ...parameter,
                                      include_in_sum_100:
                                          parameter.include_in_sum_100 ?? false,
                                      reference_ranges:
                                          parameter.reference_ranges?.length
                                              ? parameter.reference_ranges.map((range) => ({
                                                    gender: range.gender || 'all',
                                                    age_min: range.age_min != null ? String(range.age_min) : '',
                                                    age_max: range.age_max != null ? String(range.age_max) : '',
                                                    min_value: range.min_value != null ? String(range.min_value) : '',
                                                    max_value: range.max_value != null ? String(range.max_value) : '',
                                                    reference_text: range.reference_text || '',
                                                }))
                                              : [
                                                    {
                                                        gender: 'all',
                                                        age_min: '',
                                                        age_max: '',
                                                        min_value: '',
                                                        max_value: '',
                                                        reference_text: '',
                                                    },
                                                ],
                                  }))
                                : [
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
                                  ],
                    }}
                    onSubmit={(data) =>
                        update(profile.id, data, () => {
                            toast.success('Perfil actualizado exitosamente');
                        })
                    }
                />
            </div>
        </AppLayout>
    );
}
