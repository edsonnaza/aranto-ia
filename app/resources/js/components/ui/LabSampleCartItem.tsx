import SearchableInput from '@/components/ui/SearchableInput'
import { useSearch } from '@/hooks/medical'

export interface LabSampleItem {
  id: string
  lab_sample_type_id: number
  lab_test_profile_id: number
  professional_id: number   // técnico/profesional que realizará el análisis (future-proof)
  barcode: string
  collected_at: string
  quantity: number
  notes: string
}

interface LabSampleCartItemProps {
  item: LabSampleItem
  index: number
  sampleTypes: Array<{ id: number; name: string; value?: number; label?: string }>
  testProfiles: Array<{ id: number; name: string; value?: number; label?: string }>
  onUpdate: (id: string, field: keyof LabSampleItem, value: string | number) => void
  onRemove: (id: string) => void
}

const TrashIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

export default function LabSampleCartItem({
  item,
  index,
  sampleTypes,
  testProfiles,
  onUpdate,
  onRemove,
}: LabSampleCartItemProps) {
  const { searchProfessionals } = useSearch()

  // Búsqueda local de tipos de muestra
  const searchSampleTypes = async (query: string) => {
    if (!Array.isArray(sampleTypes) || sampleTypes.length === 0) return []
    const q = query.trim().toLowerCase()
    return sampleTypes
      .filter(t => q === '' || (t.name || t.label || '').toLowerCase().includes(q))
      .map(t => ({ id: t.id ?? t.value ?? 0, label: t.name || t.label || '' }))
  }

  // Búsqueda local de perfiles de prueba
  const searchTestProfiles = async (query: string) => {
    if (!Array.isArray(testProfiles) || testProfiles.length === 0) return []
    const q = query.trim().toLowerCase()
    return testProfiles
      .filter(p => q === '' || (p.name || p.label || '').toLowerCase().includes(q))
      .map(p => ({ id: p.id ?? p.value ?? 0, label: p.name || p.label || '' }))
  }

  const selectedSampleType = sampleTypes.find(t => (t.id ?? t.value) === item.lab_sample_type_id)
  const selectedTestProfile = testProfiles.find(p => (p.id ?? p.value) === item.lab_test_profile_id)

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      {/* Item Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 text-sm font-medium">
            {index + 1}
          </span>
          <h3 className="font-medium text-gray-900">
            {selectedSampleType ? selectedSampleType.name || selectedSampleType.label : 'Nueva Muestra'}
          </h3>
        </div>
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
          title="Eliminar muestra"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Fila principal: Tipo de muestra + Perfil de prueba */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de Muestra *
          </label>
          <SearchableInput
            placeholder="Buscar tipo de muestra..."
            value={selectedSampleType?.name || selectedSampleType?.label || ''}
            onSelect={(selected) => onUpdate(item.id, 'lab_sample_type_id', selected.id)}
            onSearch={searchSampleTypes}
            minSearchLength={0}
            maxResults={15}
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Perfil de Prueba *
          </label>
          <SearchableInput
            placeholder="Buscar perfil de prueba..."
            value={selectedTestProfile?.name || selectedTestProfile?.label || ''}
            onSelect={(selected) => onUpdate(item.id, 'lab_test_profile_id', selected.id)}
            onSearch={searchTestProfiles}
            minSearchLength={0}
            maxResults={15}
            className="w-full"
          />
        </div>
      </div>

      {/* Fila secundaria: Profesional + Código de barras + Fecha recolección + Cantidad */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Profesional Analista
            <span className="ml-1 text-xs text-gray-400">(opcional)</span>
          </label>
          <SearchableInput
            placeholder="Buscar profesional..."
            value={''} // TODO: resolución de nombre cuando se cargue
            onSelect={(selected) => onUpdate(item.id, 'professional_id', selected.id)}
            onSearch={searchProfessionals}
            minSearchLength={1}
            maxResults={10}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Código de Barras
          </label>
          <input
            type="text"
            value={item.barcode}
            onChange={(e) => onUpdate(item.id, 'barcode', e.target.value)}
            placeholder="Escanear o ingresar..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha/Hora Recolección
          </label>
          <input
            type="datetime-local"
            value={item.collected_at}
            onChange={(e) => onUpdate(item.id, 'collected_at', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cantidad
          </label>
          <input
            type="number"
            min="1"
            max="20"
            value={item.quantity}
            onChange={(e) => onUpdate(item.id, 'quantity', Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Observaciones */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Observaciones
        </label>
        <input
          type="text"
          value={item.notes}
          onChange={(e) => onUpdate(item.id, 'notes', e.target.value)}
          placeholder="Instrucciones especiales, condiciones de recolección..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>
    </div>
  )
}
