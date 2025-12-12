// Ejemplo de implementación de control de acceso por roles en sidebar
// Archivo: /resources/js/utils/navigation.ts

import { NavItem } from '@/types'
import { 
  LayoutGrid, 
  DollarSign, 
  Stethoscope, 
  BarChart3, 
  Settings,
  Users,
  Percent,
} from 'lucide-react'

// Definición de permisos por módulo
export const MODULE_PERMISSIONS = {
  DASHBOARD: undefined, // Siempre accesible
  TREASURY: 'access-treasury',
  COMMISSIONS: 'access-commissions',
  MEDICAL: 'access-medical-system',
  REPORTS: 'access-reports',
  SETTINGS: 'access-settings',
  USERS: 'access-user-management',
} as const

// Todos los items de navegación disponibles
const ALL_NAV_ITEMS: (NavItem & { permission?: string })[] = [
  {
    title: 'Dashboard',
    href: { url: '/dashboard', method: 'get' },
    icon: LayoutGrid,
    permission: MODULE_PERMISSIONS.DASHBOARD,
  },
  {
    title: 'Tesorería',
    href: { url: '/cash-register', method: 'get' },
    icon: DollarSign,
    permission: MODULE_PERMISSIONS.TREASURY,
  },
  {
    title: 'Comisiones',
    href: { url: '/medical/commissions', method: 'get' },
    icon: Percent,
    permission: MODULE_PERMISSIONS.COMMISSIONS,
  },
  {
    title: 'Sistema Médico',
    href: { url: '/medical', method: 'get' },
    icon: Stethoscope,
    permission: MODULE_PERMISSIONS.MEDICAL,
  },
  {
    title: 'Reportes',
    href: { url: '/reports', method: 'get' },
    icon: BarChart3,
    permission: MODULE_PERMISSIONS.REPORTS,
  },
  {
    title: 'Usuarios',
    href: { url: '/users', method: 'get' },
    icon: Users,
    permission: MODULE_PERMISSIONS.USERS,
  },
  {
    title: 'Configuración',
    href: { url: '/settings', method: 'get' },
    icon: Settings,
    permission: MODULE_PERMISSIONS.SETTINGS,
  },
]

// Función para filtrar navegación según permisos del usuario
export function getNavigationForUser(userPermissions: string[]): NavItem[] {
  return ALL_NAV_ITEMS
    .filter(item => {
      // Si no requiere permiso, siempre mostrar
      if (!item.permission) return true
      
      // Si requiere permiso, verificar que el usuario lo tenga
      return userPermissions.includes(item.permission)
    })
    .map(item => ({
      title: item.title,
      href: item.href,
      icon: item.icon,
      isActive: item.isActive,
    }))
}

// Función helper para verificar si un usuario puede acceder a un módulo
export function canAccessModule(userPermissions: string[], module: keyof typeof MODULE_PERMISSIONS): boolean {
  const requiredPermission = MODULE_PERMISSIONS[module]
  if (!requiredPermission) return true
  return userPermissions.includes(requiredPermission)
}

// Permisos predefinidos por rol (ejemplo)
export const ROLE_PERMISSIONS = {
  'super-admin': [
    'access-treasury',
    'access-commissions',
    'access-medical-system', 
    'access-reports',
    'access-settings',
    'access-user-management',
  ],
  'admin': [
    'access-treasury',
    'access-commissions',
    'access-medical-system',
    'access-reports',
  ],
  'cashier': [
    'access-treasury',
  ],
  'medical-staff': [
    'access-medical-system',
  ],
  'receptionist': [
    'access-medical-system',
  ],
  'viewer': [
    'access-reports',
  ],
  'accountant': [
    'access-commissions',
    'access-reports',
  ],
} as const

export type UserRole = keyof typeof ROLE_PERMISSIONS