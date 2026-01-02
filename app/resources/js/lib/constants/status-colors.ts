/**
 * Status Colors - Paleta global de colores para estados
 * Define colores consistentes para todos los estados en la aplicación
 */

export const STATUS_COLORS = {
  // Estados de Liquidación de Comisiones
  PAID: {
    variant: 'default' as const,
    className: 'bg-green-100 text-green-800 border-green-200',
    label: 'Pagada',
  },
  PENDING: {
    variant: 'secondary' as const,
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    label: 'Pendiente',
  },
  APPROVED: {
    variant: 'default' as const,
    className: 'bg-blue-100 text-blue-800 border-blue-200',
    label: 'Aprobada',
  },
  DRAFT: {
    variant: 'secondary' as const,
    className: 'bg-gray-100 text-gray-800 border-gray-200',
    label: 'Borrador',
  },
  CANCELLED: {
    variant: 'destructive' as const,
    className: 'bg-red-100 text-red-800 border-red-200',
    label: 'Cancelada',
  },

  // Estados de Servicios
  COMPLETED: {
    variant: 'default' as const,
    className: 'bg-green-100 text-green-800 border-green-200',
    label: 'Completado',
  },
  IN_PROGRESS: {
    variant: 'secondary' as const,
    className: 'bg-blue-100 text-blue-800 border-blue-200',
    label: 'En Progreso',
  },
  CANCELLED_SERVICE: {
    variant: 'destructive' as const,
    className: 'bg-red-100 text-red-800 border-red-200',
    label: 'Cancelado',
  },

  // Estados de Pacientes
  ACTIVE: {
    variant: 'default' as const,
    className: 'bg-green-100 text-green-800 border-green-200',
    label: 'Activo',
  },
  INACTIVE: {
    variant: 'secondary' as const,
    className: 'bg-gray-100 text-gray-800 border-gray-200',
    label: 'Inactivo',
  },
}

/**
 * Obtener configuración de color por estado
 * @param status - Estado a consultar
 * @returns Configuración de color o undefined si no existe
 */
export function getStatusColor(status: string) {
  const statusKey = status.toUpperCase() as keyof typeof STATUS_COLORS
  return STATUS_COLORS[statusKey]
}

/**
 * Obtener variante de Badge por estado
 * @param status - Estado a consultar
 * @returns Variante de Badge
 */
export function getStatusVariant(status: string) {
  const config = getStatusColor(status)
  return config?.variant || 'outline'
}

/**
 * Obtener etiqueta en español por estado
 * @param status - Estado a consultar
 * @returns Etiqueta en español
 */
export function getStatusLabel(status: string) {
  const config = getStatusColor(status)
  return config?.label || status
}
