import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { toast } from 'sonner';
import LabTestProfileForm from './Form';
import { useLabTestProfiles } from '@/hooks/useLabTestProfiles';

interface Service {
  id: number;
  name: string;
  code: string;
}

interface Equipment {
  id: number;
  name: string;
  code: string | null;
}

interface Props {
  services: Service[];
  equipments: Equipment[];
}

export default function LabTestProfilesCreate({ services, equipments }: Props) {
  const { create, loading } = useLabTestProfiles();
  const breadcrumbs = [
    { href: '/medical', title: 'Sistema Médico' },
    { href: '/medical/laboratory', title: 'Laboratorio' },
    { href: '/medical/laboratory/test-profiles', title: 'Perfiles de Laboratorio' },
    { href: '/medical/laboratory/test-profiles/create', title: 'Nuevo', current: true },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Nuevo Perfil de Laboratorio" />
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <LabTestProfileForm
          title="Nuevo Perfil de Laboratorio"
          submitLabel="Crear Perfil"
          services={services}
          equipments={equipments}
          loading={loading}
          initialData={{
            medical_service_id: 0,
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
              },
            ],
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
