import { Head, useForm } from '@inertiajs/react'
import { useState } from 'react'
import AppLayout from '@/layouts/app-layout'
import { toast } from 'sonner'
import { Check, ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface CollectPageProps {
  sample: {
    id: number
    sample_number: string
    status: string
    barcode?: string | null
    patient: {
      id: number
      full_name: string
      document?: string | null
      age?: number | null
      gender?: string | null
    } | null
    request: {
      id: number
      request_number: string
      priority?: string | null
    } | null
    requesting_professional?: string | null
    requested_study?: string | null
    studies: Array<{ id: number; name?: string | null }>
    current_sample_type?: string | null
    current_sample_type_id?: number | null
    suggested_sample_type_id?: number | null
    suggested_sample_type_name?: string | null
    initial_collection?: {
      collected_at?: string | null
      container_type?: string | null
      volume?: string | number | null
      volume_unit?: string | null
      sample_condition?: string | null
      collection_site?: string | null
      collection_notes?: string | null
    } | null
  }
  sampleTypes: Array<{
    id: number
    name: string
    code: string
    container_type?: string | null
  }>
}

const nowForDateTimeLocal = () => {
  const now = new Date()
  const timezoneOffset = now.getTimezoneOffset() * 60000
  return new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 16)
}

const toDateTimeLocal = (value?: string | null) => {
  if (!value) {
    return nowForDateTimeLocal()
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return nowForDateTimeLocal()
  }

  const timezoneOffset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16)
}

const normalize = (value?: string | null) => (value || '').toUpperCase()

const isUrineLikeCode = (code?: string | null) => {
  const c = normalize(code)
  return c.includes('URINE')
}

const isBloodLikeCode = (code?: string | null) => {
  const c = normalize(code)
  return ['BLOOD', 'SERUM', 'PLASMA'].includes(c)
}

const getCollectionSites = (code?: string | null) => {
  if (isUrineLikeCode(code)) {
    return ['Orina espontánea', 'Orina por sonda', 'Orina 24 horas', 'Chorro medio']
  }

  if (isBloodLikeCode(code)) {
    return ['Brazo derecho', 'Brazo izquierdo', 'Dorso de mano derecha', 'Dorso de mano izquierda']
  }

  return ['No aplica', 'Sitio específico según protocolo']
}

const getContainerOptions = (selectedType?: { container_type?: string | null; code?: string }) => {
  const defaultContainer = selectedType?.container_type || 'Contenedor estándar de laboratorio'

  if (isUrineLikeCode(selectedType?.code)) {
    return [defaultContainer, 'Frasco estéril', 'Recipiente 24h con conservante']
  }

  if (isBloodLikeCode(selectedType?.code)) {
    return [defaultContainer, 'Tubo tapa lila (EDTA)', 'Tubo tapa roja', 'Tubo tapa verde (Heparina)']
  }

  return [defaultContainer, 'Hisopo con medio transporte', 'Tubo estéril', 'Frasco estéril']
}

export default function CollectSample({ sample, sampleTypes }: CollectPageProps) {
  const [sampleTypeOpen, setSampleTypeOpen] = useState(false)
  const initialSampleTypeId = sample.current_sample_type_id || sample.suggested_sample_type_id || null
  const initialSelectedType = sampleTypes.find((type) => type.id === initialSampleTypeId)
  const isEditMode = sample.status === 'collected'
  const initialCollection = sample.initial_collection

  const { data, setData, post, processing, errors } = useForm({
    collected_at: toDateTimeLocal(initialCollection?.collected_at),
    lab_sample_type_id: initialSampleTypeId ? String(initialSampleTypeId) : '',
    container_type: initialCollection?.container_type || initialSelectedType?.container_type || '',
    volume: initialCollection?.volume != null ? String(initialCollection.volume) : '',
    volume_unit: initialCollection?.volume_unit || 'ml',
    sample_condition: initialCollection?.sample_condition || 'Adecuada',
    collection_site: initialCollection?.collection_site || '',
    collection_notes: initialCollection?.collection_notes || '',
    barcode: sample.barcode || sample.sample_number,
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    post(`/medical/laboratory/samples/${sample.id}/collect`, {
      onSuccess: () => {
        if (isEditMode) {
          toast.success('Toma actualizada con éxito.')
        }
      },
    })
  }

  const selectedType = sampleTypes.find((type) => String(type.id) === data.lab_sample_type_id)
  const collectionSiteOptions = getCollectionSites(selectedType?.code)
  const containerOptions = getContainerOptions(selectedType)
  const urineLike = isUrineLikeCode(selectedType?.code)

  const breadcrumbs = [
    { href: '/medical', title: 'Sistema Médico' },
    { href: '/medical/laboratory', title: 'Laboratorio' },
    { href: '/medical/laboratory/samples', title: 'Muestras' },
    { href: `/medical/laboratory/samples/${sample.id}/collect`, title: 'Tomar Muestra', current: true },
  ]

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Tomar Muestra ${sample.sample_number}`} />

      <div className="p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{isEditMode ? 'Editar Toma de Muestra' : 'Formulario de Toma de Muestra'}</h1>
          <p className="mt-1 text-sm text-gray-500">{isEditMode ? 'Actualice los datos de extracción cuando sea necesario' : 'Complete los datos de extracción para continuar el flujo de laboratorio'}</p>
        </div>

        <form onSubmit={submit} className="space-y-6">
          <div className="rounded-xl border bg-white shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Datos de Solicitud (solo lectura)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">N° Solicitud:</span> <span className="font-medium">{sample.request?.request_number || 'N/A'}</span></div>
              <div><span className="text-gray-500">N° Muestra:</span> <span className="font-medium">{sample.sample_number}</span></div>
              <div><span className="text-gray-500">Paciente:</span> <span className="font-medium">{sample.patient?.full_name || 'N/A'}</span></div>
              <div><span className="text-gray-500">Documento:</span> <span className="font-medium">{sample.patient?.document || 'N/A'}</span></div>
              <div><span className="text-gray-500">Edad:</span> <span className="font-medium">{sample.patient?.age ?? 'N/A'}</span></div>
              <div><span className="text-gray-500">Sexo:</span> <span className="font-medium">{sample.patient?.gender || 'N/A'}</span></div>
              <div><span className="text-gray-500">Médico Solicitante:</span> <span className="font-medium">{sample.requesting_professional || 'N/A'}</span></div>
              <div><span className="text-gray-500">Prioridad:</span> <span className="font-medium capitalize">{sample.request?.priority || 'normal'}</span></div>
              <div className="md:col-span-2"><span className="text-gray-500">Estudio asociado a esta muestra:</span> <span className="font-medium">{sample.requested_study || 'N/A'}</span></div>
              <div className="md:col-span-2"><span className="text-gray-500">Tipo sugerido según estudio:</span> <span className="font-medium">{sample.suggested_sample_type_name || 'No inferido'}</span></div>
            </div>

            <div className="mt-4">
              <div className="text-gray-500 text-sm mb-1">Estudios solicitados:</div>
              <ul className="list-disc pl-5 text-sm text-gray-800">
                {sample.studies.length > 0 ? sample.studies.map((study) => (
                  <li key={study.id}>{study.name || 'Estudio'}</li>
                )) : <li>N/A</li>}
              </ul>
            </div>
          </div>

          <div className="rounded-xl border bg-white shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Datos de Extracción</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y hora de extracción *</label>
                <input
                  type="datetime-local"
                  value={data.collected_at}
                  onChange={(e) => setData('collected_at', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  required
                />
                {errors.collected_at && <p className="text-xs text-red-600 mt-1">{errors.collected_at}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de muestra *</label>
                <Popover open={sampleTypeOpen} onOpenChange={setSampleTypeOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={sampleTypeOpen}
                      className="w-full justify-between"
                    >
                      {selectedType?.name || 'Seleccionar tipo de muestra'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Buscar tipo de muestra..." />
                      <CommandList>
                        <CommandEmpty>No se encontraron tipos de muestra.</CommandEmpty>
                        <CommandGroup>
                          {sampleTypes.map((type) => (
                            <CommandItem
                              key={type.id}
                              value={`${type.name} ${type.code} ${type.container_type || ''}`}
                              onSelect={() => {
                                setData('lab_sample_type_id', String(type.id))
                                setData('container_type', type.container_type || '')
                                if (isUrineLikeCode(type.code)) {
                                  setData('collection_site', 'Orina espontánea')
                                } else {
                                  setData('collection_site', '')
                                }
                                setSampleTypeOpen(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  selectedType?.id === type.id ? 'opacity-100' : 'opacity-0',
                                )}
                              />
                              <div className="flex flex-col">
                                <span className="font-medium">{type.name}</span>
                                <span className="text-xs text-gray-500">{type.code}</span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {errors.lab_sample_type_id && <p className="text-xs text-red-600 mt-1">{errors.lab_sample_type_id}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contenedor utilizado</label>
                <select
                  value={data.container_type}
                  onChange={(e) => setData('container_type', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="">Seleccionar contenedor</option>
                  {containerOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Volumen</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={data.volume}
                    onChange={(e) => setData('volume', e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
                  <select
                    value={data.volume_unit}
                    onChange={(e) => setData('volume_unit', e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value="ml">ml</option>
                    <option value="uL">uL</option>
                    <option value="g">g</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado de la muestra</label>
                <select
                  value={data.sample_condition}
                  onChange={(e) => setData('sample_condition', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="Adecuada">Adecuada</option>
                  <option value="Hemolizada">Hemolizada</option>
                  <option value="Coagulada">Coagulada</option>
                  <option value="Insuficiente">Insuficiente</option>
                  <option value="Contaminada">Contaminada</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sitio de colección</label>
                <select
                  value={data.collection_site}
                  onChange={(e) => setData('collection_site', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="">Seleccionar sitio</option>
                  {collectionSiteOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                {urineLike && (
                  <p className="text-xs text-gray-500 mt-1">Para orina se usa tipo de recolección; no se requiere lado del brazo.</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Código de barras</label>
                <input
                  type="text"
                  value={data.barcode}
                  onChange={(e) => setData('barcode', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                <textarea
                  value={data.collection_notes}
                  onChange={(e) => setData('collection_notes', e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  placeholder="Paciente difícil acceso venoso, etc."
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <a href="/medical/laboratory" className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancelar
            </a>
            <button
              type="submit"
              disabled={processing}
              className="px-4 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              {processing ? 'Guardando...' : isEditMode ? 'Actualizar Toma' : 'Tomar Muestra'}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}
