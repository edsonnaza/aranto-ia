import { Head } from '@inertiajs/react'
import { useState, useCallback } from 'react'
import AppLayout from '@/layouts/app-layout'
import { useLabSamples } from '@/hooks/useLabSamples'
import { useSearch } from '@/hooks/medical'
import SearchableInput from '@/components/ui/SearchableInput'
import LabSampleCartTable from '@/components/ui/LabSampleCartTable'
import SelectItem from '@/components/ui/SelectItem'
import type { LabSampleItem } from '@/components/ui/LabSampleCartItem'

interface LabCreateProps {
  sampleTypes: Array<{ id: number; name: string }>
  testProfiles: Array<{ id: number; name: string }>
}

const defaultCollectedAt = () => {
  const now = new Date()
  return now.toISOString().slice(0, 16)
}

export default function LabSamplesCreate({ sampleTypes, testProfiles }: LabCreateProps) {
  const { bulkCreate, loading, error } = useLabSamples()
  const { searchPatients } = useSearch()

  // Cabecera del pedido
  const [selectedPatient, setSelectedPatient] = useState<{ id: number; name: string } | null>(null)
  const [priority, setPriority] = useState<'routine' | 'urgent' | 'stat'>('routine')
  const [notes, setNotes] = useState('')
  const [expandedPatient, setExpandedPatient] = useState(true)
  const [expandedInfo, setExpandedInfo] = useState(true)

  // Carrito de muestras
  const [items, setItems] = useState<LabSampleItem[]>([])

  const breadcrumbs = [
    { href: '/medical/laboratory', title: 'Laboratorio' },
    { href: '/medical/laboratory/samples', title: 'Muestras' },
    { href: '/medical/laboratory/samples/create', title: 'Nueva Solicitud', current: true },
  ]

  const handlePatientSelect = (patient: { id: number; label: string }) => {
    setSelectedPatient({ id: patient.id, name: patient.label })
  }

  const addItem = useCallback(() => {
    const newItem: LabSampleItem = {
      id: Date.now().toString(),
      lab_sample_type_id: 0,
      lab_test_profile_id: 0,
      professional_id: 0,
      barcode: '',
      collected_at: defaultCollectedAt(),
      quantity: 1,
      notes: '',
    }
    setItems(prev => [...prev, newItem])
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id))
  }, [])

  const updateItem = useCallback((id: string, field: keyof LabSampleItem, value: string | number) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item))
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedPatient || items.length === 0) return

    bulkCreate({
      patient_id: selectedPatient.id,
      priority,
      notes: notes || undefined,
      samples: items.map(item => ({
        lab_sample_type_id: item.lab_sample_type_id,
        lab_test_profile_id: item.lab_test_profile_id > 0 ? item.lab_test_profile_id : undefined,
        professional_id: item.professional_id > 0 ? item.professional_id : undefined,
        barcode: item.barcode || undefined,
        collected_at: item.collected_at,
        quantity: item.quantity,
        notes: item.notes || undefined,
      })),
    })
  }

  const isSubmitDisabled = !selectedPatient || items.length === 0 || loading

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Laboratorio - Nueva Solicitud de Muestras" />

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl px-4 sm:px-6 lg:px-6">
            <div className="py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Laboratorio - Nueva Solicitud</h1>
                    <p className="text-sm text-gray-500">Registrar muestras para análisis</p>
                  </div>
                  {selectedPatient && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-full px-4 py-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-emerald-700">Paciente:</span>
                        <span className="text-sm text-emerald-600">{selectedPatient.name}</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-500">
                    {items.length} muestra{items.length !== 1 ? 's' : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => window.history.back()}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-4 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

            {/* Área principal */}
            <div className="lg:col-span-3 space-y-6">

              {/* 1. Seleccionar Paciente */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">1. Seleccionar Paciente</h2>
                  <button
                    type="button"
                    onClick={() => setExpandedPatient(!expandedPatient)}
                    className="text-gray-500 hover:text-gray-800"
                  >
                    <svg className={`h-5 w-5 transition-transform ${expandedPatient ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </button>
                </div>
                {expandedPatient && (
                  <SearchableInput
                    placeholder="Buscar paciente por nombre o documento..."
                    value={selectedPatient?.name || ''}
                    onSelect={handlePatientSelect}
                    onSearch={searchPatients}
                    className="w-full"
                  />
                )}
              </div>

              {/* 2. Información del Pedido */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">2. Información del Pedido</h2>
                  <button
                    type="button"
                    onClick={() => setExpandedInfo(!expandedInfo)}
                    className="text-gray-500 hover:text-gray-800"
                  >
                    <svg className={`h-5 w-5 transition-transform ${expandedInfo ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </button>
                </div>
                {expandedInfo && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
                      <SelectItem value={priority} onValueChange={(v) => setPriority(v as typeof priority)} required>
                        <option value="routine">Rutina</option>
                        <option value="urgent">Urgente</option>
                        <option value="stat">STAT (Inmediato)</option>
                      </SelectItem>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones generales</label>
                      <input
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Notas adicionales para el pedido..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Muestras */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">3. Muestras a Analizar</h2>
                  {items.length > 0 && (
                    <button
                      type="button"
                      onClick={addItem}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-emerald-600 border border-emerald-300 rounded-md hover:bg-emerald-50"
                    >
                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Agregar
                    </button>
                  )}
                </div>

                <LabSampleCartTable
                  items={items}
                  sampleTypes={sampleTypes}
                  testProfiles={testProfiles}
                  onUpdate={updateItem}
                  onRemove={removeItem}
                  onAdd={addItem}
                />
              </div>
            </div>

            {/* Panel lateral - Resumen */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumen</h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Paciente</span>
                    <span className="font-medium text-gray-900 text-right max-w-[120px] truncate">
                      {selectedPatient?.name || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Prioridad</span>
                    <span className={`font-medium capitalize ${
                      priority === 'stat' ? 'text-red-600' :
                      priority === 'urgent' ? 'text-orange-600' :
                      'text-gray-900'
                    }`}>
                      {priority === 'routine' ? 'Rutina' : priority === 'urgent' ? 'Urgente' : 'STAT'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Muestras</span>
                    <span className="font-bold text-emerald-600">{items.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Con perfil asignado</span>
                    <span className="font-medium text-gray-900">
                      {items.filter(i => i.lab_test_profile_id > 0).length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Con profesional</span>
                    <span className="font-medium text-gray-900">
                      {items.filter(i => i.professional_id > 0).length}
                    </span>
                  </div>
                </div>

                {/* Errores */}
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-xs text-red-600">
                      {Object.values(error).flat().join(', ')}
                    </p>
                  </div>
                )}

                {/* Validaciones */}
                {!selectedPatient && (
                  <p className="text-xs text-amber-600 mb-3">⚠ Seleccionar paciente</p>
                )}
                {items.length === 0 && (
                  <p className="text-xs text-amber-600 mb-3">⚠ Agregar al menos una muestra</p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitDisabled}
                  className="w-full py-3 px-4 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Registrando...' : `Registrar ${items.length} Muestra${items.length !== 1 ? 's' : ''}`}
                </button>
              </div>
            </div>

          </div>
        </form>
      </div>
    </AppLayout>
  )
}
