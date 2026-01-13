/**
 * Centralized route configuration
 * 
 * All routes are defined here and sourced from environment variables
 * This is the single source of truth for all API/navigation routes
 * 
 * If a route changes, update it here or in .env
 * All hooks should use these routes
 */

// Medical Module Routes
export const ROUTES = {
  MEDICAL: import.meta.env.VITE_MEDICAL_BASE_ROUTE || '/medical',
  
  PATIENTS: import.meta.env.VITE_PATIENTS_BASE_ROUTE || '/medical/patients',
  
  CASHREGISTER: import.meta.env.VITE_CASHREGISTER_BASE_ROUTE || '/cashregister',
  
  SETTINGS: import.meta.env.VITE_SETTINGS_BASE_ROUTE || '/settings',
}

/**
 * Helper to build routes dynamically
 * 
 * Usage:
 * buildRoute('PATIENTS', 'show', patientId)
 * // Returns: /medical/patients/123
 */
export function buildRoute(
  module: keyof typeof ROUTES,
  action?: string,
  id?: string | number
): string {
  const baseRoute = ROUTES[module]
  
  if (!action) return baseRoute
  if (!id) return `${baseRoute}/${action}`
  
  return `${baseRoute}/${id}/${action}`
}

/**
 * Specific patient routes
 */
export const patientRoutes = {
  list: () => ROUTES.PATIENTS,
  create: () => `${ROUTES.PATIENTS}/create`,
  show: (id: number | string) => `${ROUTES.PATIENTS}/${id}`,
  edit: (id: number | string) => `${ROUTES.PATIENTS}/${id}/edit`,
  delete: (id: number | string) => `${ROUTES.PATIENTS}/${id}`,
}
