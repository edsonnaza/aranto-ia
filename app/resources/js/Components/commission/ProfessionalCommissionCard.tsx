import React from 'react'
import { ChevronRight, Sparkles } from 'lucide-react'
import { router } from '@inertiajs/react'

interface ProfessionalCommissionCardProps {
  professional: {
    id: number
    full_name: string
    specialty: string
    commission_percentage: number
    pending_services_count: number
    pending_amount: number
    commission_amount: number
  }
  onGenerateLiquidation?: (professionalId: number) => void
}

export const ProfessionalCommissionCard: React.FC<ProfessionalCommissionCardProps> = ({
  professional,
  onGenerateLiquidation
}) => {
  const handleGenerate = () => {
    if (onGenerateLiquidation) {
      onGenerateLiquidation(professional.id)
    } else {
      // Navigate to create page with professional pre-selected
      router.get('/medical/commissions/create', {
        professional_id: professional.id
      })
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border-l-4 border-indigo-500">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{professional.full_name}</h3>
          <p className="text-sm text-gray-500">{professional.specialty}</p>
        </div>
        <div className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
          {professional.commission_percentage}%
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        {/* Servicios pendientes */}
        <div className="bg-orange-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-orange-600">
            {professional.pending_services_count}
          </div>
          <p className="text-xs text-orange-700 mt-1">Servicios sin liquidar</p>
        </div>

        {/* Monto pendiente */}
        <div className="bg-red-50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-red-600 truncate">
            ₲{(professional.pending_amount / 1000).toFixed(0)}k
          </div>
          <p className="text-xs text-red-700 mt-1">Monto pendiente</p>
        </div>

        {/* Comisión a cobrar */}
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-green-600 truncate">
            ₲{(professional.commission_amount / 1000).toFixed(0)}k
          </div>
          <p className="text-xs text-green-700 mt-1">Comisión a cobrar</p>
        </div>
      </div>

      {/* Botón para generar liquidación */}
      <button
        onClick={handleGenerate}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-linear-to-r from-indigo-600 to-indigo-700 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-indigo-800 transition-colors group"
      >
        <Sparkles className="h-4 w-4" />
        <span>Generar Liquidación</span>
        <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  )
}
