import LabSampleCartItem, { type LabSampleItem } from '@/components/ui/LabSampleCartItem'

interface LabSampleCartTableProps {
  items: LabSampleItem[]
  sampleTypes: Array<{ id: number; name: string; value?: number; label?: string }>
  testProfiles: Array<{ id: number; name: string; value?: number; label?: string }>
  onUpdate: (id: string, field: keyof LabSampleItem, value: string | number) => void
  onRemove: (id: string) => void
  onAdd: () => void
}

const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
)

const FlaskIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
  </svg>
)

export default function LabSampleCartTable({
  items,
  sampleTypes,
  testProfiles,
  onUpdate,
  onRemove,
  onAdd,
}: LabSampleCartTableProps) {
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm">
        {/* Empty State */}
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center border-2 border-dashed border-gray-200 rounded-lg">
          <FlaskIcon className="h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-base font-medium text-gray-900 mb-1">Sin muestras agregadas</h3>
          <p className="text-sm text-gray-500 mb-4">
            Agrega las muestras que se van a procesar en este pedido
          </p>
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Agregar Primera Muestra
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Items */}
      {items.map((item, index) => (
        <LabSampleCartItem
          key={item.id}
          item={item}
          index={index}
          sampleTypes={sampleTypes}
          testProfiles={testProfiles}
          onUpdate={onUpdate}
          onRemove={onRemove}
        />
      ))}

      {/* Add Button */}
      <button
        type="button"
        onClick={onAdd}
        className="w-full py-3 border-2 border-dashed border-emerald-300 rounded-lg text-emerald-600 hover:border-emerald-400 hover:bg-emerald-50 transition-colors flex items-center justify-center space-x-2"
      >
        <PlusIcon className="h-4 w-4" />
        <span className="text-sm font-medium">Agregar otra muestra</span>
      </button>
    </div>
  )
}
