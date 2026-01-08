/**
 * Hook para obtener la etiqueta traducida del tipo de recepción
 * Centraliza el mapeo de tipos de recepción para evitar duplicación
 * 
 * Tipos soportados:
 * - scheduled: Agendado
 * - walk_in: Sin Agenda
 * - emergency: Emergencia
 * - inpatient_discharge: Alta Hospitalaria
 * 
 * También soporta valores con prefijo (RECEPTION_*) usados en algunos contextos:
 * - RECEPTION_SCHEDULED: Agendado
 * - RECEPTION_WALK_IN: Sin Agenda
 */

export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

export const RECEPTION_TYPE_CONFIG: Record<string, { label: string; variant: BadgeVariant }> = {
  // Sin prefijo (usado en ServiceRequest model)
  'scheduled': { label: 'Agendado', variant: 'outline' },
  'walk_in': { label: 'Sin Agenda', variant: 'outline' },
  'emergency': { label: 'Emergencia', variant: 'destructive' },
  'inpatient_discharge': { label: 'Alta Hospitalaria', variant: 'secondary' },
  
  // Con prefijo RECEPTION_ (usado en algunos contexts)
  'RECEPTION_SCHEDULED': { label: 'Agendado', variant: 'outline' },
  'RECEPTION_WALK_IN': { label: 'Sin Agenda', variant: 'outline' },
  'EMERGENCY': { label: 'Emergencia', variant: 'destructive' },
  'INPATIENT_DISCHARGE': { label: 'Alta Hospitalaria', variant: 'secondary' },
};

/**
 * Mapeo solo de labels para compatibilidad
 */
export const RECEPTION_TYPE_LABELS: Record<string, string> = {
  'scheduled': 'Agendado',
  'walk_in': 'Sin Agenda',
  'emergency': 'Emergencia',
  'inpatient_discharge': 'Alta Hospitalaria',
  'RECEPTION_SCHEDULED': 'Agendado',
  'RECEPTION_WALK_IN': 'Sin Agenda',
  'EMERGENCY': 'Emergencia',
  'INPATIENT_DISCHARGE': 'Alta Hospitalaria',
};

/**
 * Obtiene la configuración completa (label y variant) para un tipo de recepción
 * @param type - El tipo de recepción (ej: 'scheduled', 'walk_in', etc.)
 * @returns Objeto con label y variant
 */
export const getReceptionTypeConfig = (type: string): { label: string; variant: BadgeVariant } => {
  if (!type) return { label: 'Desconocido', variant: 'default' };
  return RECEPTION_TYPE_CONFIG[type] || { label: type, variant: 'default' };
};

/**
 * Obtiene solo la etiqueta traducida para un tipo de recepción
 * @param type - El tipo de recepción (ej: 'scheduled', 'walk_in', etc.)
 * @returns La etiqueta traducida al español
 */
export const getReceptionTypeLabel = (type: string): string => {
  if (!type) return 'Desconocido';
  return RECEPTION_TYPE_LABELS[type] || type;
};

/**
 * Hook personalizado para obtener configuración de tipo de recepción
 * Útil si necesitas usar reactivity en el futuro
 */
export const useReceptionTypeLabel = (type: string): { label: string; variant: BadgeVariant } => {
  return getReceptionTypeConfig(type);
};

/**
 * Obtiene todas las opciones de tipos de recepción para selectores
 */
export const getReceptionTypeOptions = () => [
  { value: 'scheduled', label: 'Agendado' },
  { value: 'walk_in', label: 'Sin Agenda' },
  { value: 'emergency', label: 'Emergencia' },
  { value: 'inpatient_discharge', label: 'Alta Hospitalaria' },
];
