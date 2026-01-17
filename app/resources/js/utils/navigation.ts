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
  Clock,
} from 'lucide-react'

// Definición de permisos por módulo
export const MODULE_PERMISSIONS = {
  DASHBOARD: undefined, // Siempre accesible
  MEDICAL_SYSTEM: 'access-medical-system',
  FINANCIAL: 'access-financial', // Nuevo menú padre
  TREASURY: 'access-treasury',
  COMMISSIONS: 'access-commissions',
  REPORTS: 'access-reports',
  SETTINGS: 'access-settings',
  CATALOGS: 'access-catalogs',
  USERS: 'access-user-management',
  AUDIT: 'access-audit-logs',
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
    title: 'Sistema Médico',
    icon: Stethoscope,
    permission: MODULE_PERMISSIONS.MEDICAL_SYSTEM,
    items: [
      {
        title: 'Recepción',
        href: { url: '/medical/service-requests', method: 'get' },
      },
      {
        title: 'Atención Médica',
        href: { url: '/medical', method: 'get' },
      },
      {
        title: 'Agenda',
        href: { url: '/medical/schedule', method: 'get' },
      },
    ],
  },
  {
    title: 'Financiero',
    icon: DollarSign,
    permission: MODULE_PERMISSIONS.FINANCIAL,
    items: [
      {
        title: 'Caja',
        href: { url: '/cash-register', method: 'get' },
        permission: MODULE_PERMISSIONS.TREASURY,
      },
      {
        title: 'Liquidación de Comisiones',
        href: { url: '/medical/commissions', method: 'get' },
        permission: MODULE_PERMISSIONS.COMMISSIONS,
      },
      {
        title: 'Tesorería',
        href: { url: '/treasury', method: 'get' },
        permission: MODULE_PERMISSIONS.TREASURY,
      },
    ],
  },
  {
    title: 'Configuración',
    icon: Settings,
    permission: MODULE_PERMISSIONS.SETTINGS,
    items: [
      {
        title: 'Catálogos',
        items: [
          {
            title: 'Profesionales',
            href: { url: '/settings/professionals', method: 'get' },
          },
          {
            title: 'Pacientes',
            href: { url: '/settings/patients', method: 'get' },
          },
          {
            title: 'Especialidades',
            href: { url: '/settings/specialties', method: 'get' },
          },
          {
            title: 'Servicios Médicos',
            href: { url: '/settings/services', method: 'get' },
          },
          {
            title: 'Seguros',
            href: { url: '/settings/insurance-types', method: 'get' },
          },
        ],
      },
    ],
  },
  {
    title: 'Usuarios',
    icon: Users,
    permission: MODULE_PERMISSIONS.USERS,
    items: [
      {
        title: 'Usuarios',
        href: { url: '/users', method: 'get' },
      },
      {
        title: 'Roles',
        href: { url: '/roles', method: 'get' },
      },
      {
        title: 'Permisos',
        href: { url: '/permissions', method: 'get' },
      },
    ],
  },
  {
    title: 'Reportes',
    href: { url: '/reports', method: 'get' },
    icon: BarChart3,
    permission: MODULE_PERMISSIONS.REPORTS,
  },
  {
    title: 'Auditoría',
    href: { url: '/settings/audit', method: 'get' },
    icon: Clock,
    permission: MODULE_PERMISSIONS.AUDIT,
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
    'access-financial',
    'access-medical-system', 
    'access-reports',
    'access-settings',
    'access-catalogs',
    'access-user-management',
    'access-audit-logs',
  ],
  'admin': [
    'access-treasury',
    'access-commissions',
    'access-financial',
    'access-medical-system',
    'access-reports',
    'access-settings',
    'access-catalogs',
    'access-audit-logs',
  ],
  'cashier': [
    'access-treasury',
    'access-financial',
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
    'access-financial',
    'access-reports',
    'access-audit-logs',
  ],
} as const

export type UserRole = keyof typeof ROLE_PERMISSIONS