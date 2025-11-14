// Treasury actions configuration for dropdown menus
// Archivo: /resources/js/config/treasury-actions.ts

import { 
  Stethoscope, 
  Building2, 
  Zap, 
  Landmark, 
  Plus,
  UserCheck,
  Truck,
  Scale,
  RotateCcw,
  Minus,
  type LucideIcon 
} from 'lucide-react'

export type MovementCategory = 
  | 'SERVICE_PAYMENT'
  | 'INPATIENT_DISCHARGE_PAYMENT' 
  | 'EMERGENCY_DISCHARGE_PAYMENT'
  | 'SANATORIUM_DEPOSIT'
  | 'OTHER_INCOME'
  | 'COMMISSION_LIQUIDATION'
  | 'SUPPLIER_PAYMENT'
  | 'CASH_DIFFERENCE'
  | 'SANATORIUM_REFUND'
  | 'OTHER_EXPENSE'

export interface TreasuryAction {
  id: string;
  label: string;
  icon: LucideIcon;
  category: MovementCategory;
  type: 'INCOME' | 'EXPENSE';
  description: string;
  requiredPermissions?: string[];
}

// Configuración de acciones de ingreso
export const INCOME_ACTIONS: TreasuryAction[] = [
  {
    id: 'service_payment',
    label: 'Cobro de Servicio',
    icon: Stethoscope,
    category: 'SERVICE_PAYMENT',
    type: 'INCOME',
    description: 'Consultas y procedimientos médicos regulares',
    requiredPermissions: ['access-treasury']
  },
  {
    id: 'inpatient_discharge',
    label: 'Alta Internado', 
    icon: Building2,
    category: 'INPATIENT_DISCHARGE_PAYMENT',
    type: 'INCOME',
    description: 'Facturación al alta hospitalaria',
    requiredPermissions: ['access-treasury']
  },
  {
    id: 'emergency_discharge',
    label: 'Alta Urgencia',
    icon: Zap,
    category: 'EMERGENCY_DISCHARGE_PAYMENT', 
    type: 'INCOME',
    description: 'Servicios de emergencias y urgencias',
    requiredPermissions: ['access-treasury']
  },
  {
    id: 'sanatorium_deposit',
    label: 'Depósito Sanatorial',
    icon: Landmark,
    category: 'SANATORIUM_DEPOSIT',
    type: 'INCOME', 
    description: 'Anticipos y garantías de internación',
    requiredPermissions: ['access-treasury']
  },
  {
    id: 'other_income',
    label: 'Otros Ingresos',
    icon: Plus,
    category: 'OTHER_INCOME',
    type: 'INCOME',
    description: 'Conceptos diversos no clasificados',
    requiredPermissions: ['access-treasury']
  }
];

// Configuración de acciones de egreso  
export const EXPENSE_ACTIONS: TreasuryAction[] = [
  {
    id: 'commission_payment',
    label: 'Pago de Comisiones',
    icon: UserCheck,
    category: 'COMMISSION_LIQUIDATION',
    type: 'EXPENSE',
    description: 'Liquidación a profesionales médicos',
    requiredPermissions: ['access-treasury', 'manage-commissions']
  },
  {
    id: 'supplier_payment', 
    label: 'Pago a Proveedores',
    icon: Truck,
    category: 'SUPPLIER_PAYMENT',
    type: 'EXPENSE',
    description: 'Medicamentos, insumos y servicios',
    requiredPermissions: ['access-treasury', 'manage-suppliers']
  },
  {
    id: 'cash_difference',
    label: 'Diferencias de Caja',
    icon: Scale,
    category: 'CASH_DIFFERENCE', 
    type: 'EXPENSE',
    description: 'Faltantes o sobrantes al cierre',
    requiredPermissions: ['access-treasury', 'manage-cash-differences']
  },
  {
    id: 'sanatorium_refund',
    label: 'Devolución Depósitos',
    icon: RotateCcw,
    category: 'SANATORIUM_REFUND',
    type: 'EXPENSE',
    description: 'Reintegro de anticipos y garantías',
    requiredPermissions: ['access-treasury']
  },
  {
    id: 'other_expense',
    label: 'Otros Egresos', 
    icon: Minus,
    category: 'OTHER_EXPENSE',
    type: 'EXPENSE',
    description: 'Gastos operativos diversos',
    requiredPermissions: ['access-treasury']
  }
];

// Helper function to filter actions by user permissions
export function getAvailableActions(
  actions: TreasuryAction[], 
  userPermissions: string[]
): TreasuryAction[] {
  return actions.filter(action => {
    if (!action.requiredPermissions) return true;
    return action.requiredPermissions.every(permission => 
      userPermissions.includes(permission)
    );
  });
}

// Helper function to get action by category
export function getActionByCategory(category: MovementCategory): TreasuryAction | undefined {
  const allActions = [...INCOME_ACTIONS, ...EXPENSE_ACTIONS];
  return allActions.find(action => action.category === category);
}