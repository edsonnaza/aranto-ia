import { Head } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'
import ResultForm from './ResultForm'
import { toast } from 'sonner'

interface Parameter {
  id: number
  name: string
  unit?: string | null
  parameter_type: 'numeric' | 'text' | 'option' | 'calculated'
  is_required?: boolean
  include_in_sum_100?: boolean
  reference_ranges?: Array<{
    id: number
    reference_text?: string | null
    min_value?: string | number | null
    max_value?: string | number | null
  }>
  equipment_parameter_ranges?: Array<{
    id: number
    lab_equipment_id: number
  }>
}

interface TestRequest {
  id: number
  status: string
  lab_sample_id: number
  sample?: {
    sample_number?: string
    patient?: {
      first_name?: string
      last_name?: string
    }
  }
  test_profile?: {
    id: number
    name: string
    validation_type?: 'none' | 'sum_100'
    validation_target?: number
    validation_tolerance?: number
    parameters?: Parameter[]
    profile_equipments?: Array<{
      id: number
      lab_equipment_id: number
      is_default?: boolean
      equipment?: {
        id: number
        name: string
      }
    }>
  }
}

interface Equipment {
  id: number
  name: string
}

interface Props {
  testRequests: TestRequest[]
  equipments: Equipment[]
  initialTestRequestId?: number | null
  existingResults?: Record<string, { value: string; equipment_id?: number | null }>
}

export default function ResultsCreate({ testRequests, equipments, initialTestRequestId = null, existingResults = {} }: Props) {
  const breadcrumbs = [
    { href: '/medical', title: 'Sistema Médico' },
    { href: '/medical/laboratory', title: 'Laboratorio' },
    { href: '/medical/laboratory/results', title: 'Resultados' },
    { href: '/medical/laboratory/results/create', title: initialTestRequestId ? 'Continuar Análisis' : 'Nuevo Resultado', current: true },
  ]

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Carga y edición de resultados" />

      <div className="p-4 md:p-6 space-y-4">
       

        <ResultForm
          testRequests={testRequests}
          equipments={equipments}
          initialTestRequestId={initialTestRequestId}
          existingResults={existingResults}
          onSuccess={() => {
            toast.success('Resultados guardados')
          }}
        />
      </div>
    </AppLayout>
  )
}
