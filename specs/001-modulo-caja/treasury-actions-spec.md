# Especificación: Acciones de Tesorería con Dropdowns

**Fecha**: 2025-11-12  
**Estado**: Especificación de UI/UX  
**Propósito**: Definir la implementación de dropdowns para acciones rápidas de ingresos y egresos en el dashboard de tesorería

## 🎯 Objetivo

Expandir los botones de "Registrar Ingreso" y "Registrar Egreso" del dashboard de tesorería para mostrar tipos específicos de movimientos, facilitando la clasificación automática y mejorando la experiencia del usuario.

## 🖥️ Diseño de Interfaz

### Dashboard de Tesorería - Acciones Rápidas

```
┌─────────────────────────────────────────────────────┐
│                DASHBOARD TESORERÍA                  │
├─────────────────────────────────────────────────────┤
│  Sesión Actual: #2025-001 | Saldo: ₲ 2,450,000     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [Registrar Ingreso ▼]  [Registrar Egreso ▼]      │
│                                                     │
│  Dropdown Ingresos:      Dropdown Egresos:         │
│  ┌──────────────────┐   ┌──────────────────────┐    │
│  │🏥 Cobro de Servicio    │👨‍⚕️ Pago de Comisiones   │    │
│  │🏩 Alta Internado       │🛒 Pago a Proveedores     │    │
│  │🚨 Alta Urgencia        │⚖️ Diferencias de Caja    │    │
│  │🏛️ Depósito Sanatorial │💸 Devolución Depósitos   │    │
│  │💰 Otros Ingresos       │📤 Otros Egresos          │    │
│  └──────────────────┘   └──────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

## 📋 Especificación Técnica

### Estructura de Datos para Dropdowns

```typescript
interface DropdownAction {
  id: string;
  label: string;
  icon: LucideIcon;
  category: MovementCategory;
  type: 'INCOME' | 'EXPENSE';
  description?: string;
  action: () => void;
}

// Configuración de acciones de ingreso
const INCOME_ACTIONS: DropdownAction[] = [
  {
    id: 'service_payment',
    label: 'Cobro de Servicio',
    icon: Stethoscope,
    category: 'SERVICE_PAYMENT',
    type: 'INCOME',
    description: 'Consultas y procedimientos médicos regulares',
    action: () => openServicePaymentModal()
  },
  {
    id: 'inpatient_discharge',
    label: 'Alta Internado', 
    icon: Building2,
    category: 'INPATIENT_DISCHARGE_PAYMENT',
    type: 'INCOME',
    description: 'Facturación al alta hospitalaria',
    action: () => openInpatientDischargeModal()
  },
  {
    id: 'emergency_discharge',
    label: 'Alta Urgencia',
    icon: Zap,
    category: 'EMERGENCY_DISCHARGE_PAYMENT', 
    type: 'INCOME',
    description: 'Servicios de emergencias y urgencias',
    action: () => openEmergencyDischargeModal()
  },
  {
    id: 'sanatorium_deposit',
    label: 'Depósito Sanatorial',
    icon: Landmark,
    category: 'SANATORIUM_DEPOSIT',
    type: 'INCOME', 
    description: 'Anticipos y garantías de internación',
    action: () => openDepositModal()
  },
  {
    id: 'other_income',
    label: 'Otros Ingresos',
    icon: Plus,
    category: 'OTHER_INCOME',
    type: 'INCOME',
    description: 'Conceptos diversos no clasificados',
    action: () => openGenericIncomeModal()
  }
];

// Configuración de acciones de egreso  
const EXPENSE_ACTIONS: DropdownAction[] = [
  {
    id: 'commission_payment',
    label: 'Pago de Comisiones',
    icon: UserCheck,
    category: 'COMMISSION_LIQUIDATION',
    type: 'EXPENSE',
    description: 'Liquidación a profesionales médicos',
    action: () => openCommissionPaymentModal()
  },
  {
    id: 'supplier_payment', 
    label: 'Pago a Proveedores',
    icon: Truck,
    category: 'SUPPLIER_PAYMENT',
    type: 'EXPENSE',
    description: 'Medicamentos, insumos y servicios',
    action: () => openSupplierPaymentModal()
  },
  {
    id: 'cash_difference',
    label: 'Diferencias de Caja',
    icon: Scale,
    category: 'CASH_DIFFERENCE', 
    type: 'EXPENSE',
    description: 'Faltantes o sobrantes al cierre',
    action: () => openCashDifferenceModal()
  },
  {
    id: 'sanatorium_refund',
    label: 'Devolución Depósitos',
    icon: RotateCcw,
    category: 'SANATORIUM_REFUND',
    type: 'EXPENSE',
    description: 'Reintegro de anticipos y garantías',
    action: () => openRefundModal()
  },
  {
    id: 'other_expense',
    label: 'Otros Egresos', 
    icon: Minus,
    category: 'OTHER_EXPENSE',
    type: 'EXPENSE',
    description: 'Gastos operativos diversos',
    action: () => openGenericExpenseModal()
  }
];
```

## 🔄 Flujos de Usuario

### Flujo 1: Cobro de Servicio
1. Usuario hace clic en "Registrar Ingreso ▼"
2. Selecciona "🏥 Cobro de Servicio"
3. Sistema abre lista de ServiceRequest pendientes (status: 'pending_payment')
4. Usuario selecciona servicio y procesa cobro
5. Sistema crea Movement con category: 'SERVICE_PAYMENT'
6. ServiceRequest actualiza a status: 'paid'

### Flujo 2: Depósito Sanatorial  
1. Usuario selecciona "🏛️ Depósito Sanatorial"
2. Sistema abre modal específico para depósitos
3. Campos: paciente, monto, concepto, tipo de garantía
4. Sistema crea Movement con category: 'SANATORIUM_DEPOSIT'
5. Genera recibo de depósito

### Flujo 3: Pago de Comisiones
1. Usuario selecciona "👨‍⚕️ Pago de Comisiones"
2. Sistema muestra liquidaciones aprobadas pendientes de pago
3. Usuario selecciona liquidación y confirma pago
4. Sistema crea Movement con category: 'COMMISSION_LIQUIDATION'
5. Actualiza estado de liquidación a 'paid'

## 📊 Ventajas de esta Implementación

1. **Clasificación Automática**: Cada acción pre-define la categoría del movimiento
2. **UX Mejorada**: Usuario ve opciones específicas en lugar de modal genérico
3. **Trazabilidad**: Cada tipo de movimiento tiene su flujo específico
4. **Escalabilidad**: Fácil agregar nuevos tipos de movimientos
5. **Consistencia**: Iconos y colores coherentes por tipo de operación
6. **Contexto**: Descriptions help users understand each movement type

## 🚀 Fases de Implementación

### Fase 1: Dropdowns Básicos
- [ ] Implementar DropdownMenu components
- [ ] Crear configuración de acciones (INCOME_ACTIONS, EXPENSE_ACTIONS)
- [ ] Actualizar dashboard de tesorería con nuevos botones

### Fase 2: Modales Específicos
- [ ] Modal para "Cobro de Servicio" (lista de ServiceRequest)
- [ ] Modal para "Otros Ingresos" (genérico, mantener funcionalidad actual)
- [ ] Modal para "Otros Egresos" (genérico)

### Fase 3: Integraciones Avanzadas
- [ ] Modal para "Alta Internado" 
- [ ] Modal para "Alta Urgencia"
- [ ] Modal para "Depósito Sanatorial"
- [ ] Modal para "Pago de Comisiones"

### Fase 4: Validaciones y Reportes
- [ ] Validaciones específicas por tipo de movimiento
- [ ] Reportes segmentados por categoría
- [ ] Auditoría de movimientos por tipo

## ⚠️ Consideraciones

1. **Backward Compatibility**: Mantener funcionalidad existente de modales genéricos
2. **Permisos**: Verificar que el usuario tenga permisos para cada tipo de acción
3. **Validaciones**: Cada tipo de movimiento puede requerir validaciones específicas
4. **Estado de Sesión**: Verificar que hay sesión de caja abierta antes de permitir movimientos
5. **Responsive Design**: Dropdowns deben funcionar correctamente en móviles