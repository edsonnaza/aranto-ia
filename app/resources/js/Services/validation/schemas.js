import { z } from 'zod';

// Esquema para abrir sesión de caja
export const openSessionSchema = z.object({
  initial_amount: z
    .number()
    .min(0, 'El monto inicial debe ser mayor o igual a 0')
    .max(100000, 'El monto inicial no puede exceder $100,000'),
  notes: z
    .string()
    .max(500, 'Las notas no pueden exceder 500 caracteres')
    .optional(),
});

// Esquema para cerrar sesión de caja
export const closeSessionSchema = z.object({
  final_physical_amount: z
    .number()
    .min(0, 'El monto físico final debe ser mayor o igual a 0'),
  difference_justification: z
    .string()
    .min(1, 'La justificación es requerida cuando hay diferencias')
    .max(1000, 'La justificación no puede exceder 1000 caracteres')
    .optional(),
});

// Esquema para procesar pago de servicio
export const servicePaymentSchema = z.object({
  service_id: z
    .number()
    .min(1, 'Debe seleccionar un servicio'),
  amount: z
    .number()
    .min(0.01, 'El monto debe ser mayor a 0')
    .max(50000, 'El monto no puede exceder $50,000'),
  concept: z
    .string()
    .min(1, 'El concepto es requerido')
    .max(255, 'El concepto no puede exceder 255 caracteres'),
  patient_id: z
    .number()
    .min(1, 'Debe seleccionar un paciente')
    .optional(),
  professional_id: z
    .number()
    .min(1, 'Debe seleccionar un profesional')
    .optional(),
  payment_method: z
    .enum(['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'TRANSFER', 'CHECK'])
    .default('CASH'),
  reference: z
    .string()
    .max(100, 'La referencia no puede exceder 100 caracteres')
    .optional(),
  financial_entity: z
    .string()
    .max(100, 'La entidad financiera no puede exceder 100 caracteres')
    .optional(),
});

// Esquema para pago a proveedor
export const supplierPaymentSchema = z.object({
  amount: z
    .number()
    .min(0.01, 'El monto debe ser mayor a 0')
    .max(50000, 'El monto no puede exceder $50,000'),
  concept: z
    .string()
    .min(1, 'El concepto es requerido')
    .max(255, 'El concepto no puede exceder 255 caracteres'),
  supplier_name: z
    .string()
    .min(1, 'El nombre del proveedor es requerido')
    .max(255, 'El nombre del proveedor no puede exceder 255 caracteres'),
  payment_method: z
    .enum(['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'TRANSFER', 'CHECK'])
    .default('CASH'),
  reference: z
    .string()
    .max(100, 'La referencia no puede exceder 100 caracteres')
    .optional(),
  financial_entity: z
    .string()
    .max(100, 'La entidad financiera no puede exceder 100 caracteres')
    .optional(),
});

// Esquema para liquidación de comisiones
export const commissionLiquidationSchema = z.object({
  professional_id: z
    .number()
    .min(1, 'Debe seleccionar un profesional'),
  amount: z
    .number()
    .min(0.01, 'El monto debe ser mayor a 0')
    .max(50000, 'El monto no puede exceder $50,000'),
  concept: z
    .string()
    .min(1, 'El concepto es requerido')
    .max(255, 'El concepto no puede exceder 255 caracteres'),
  liquidation_id: z
    .number()
    .min(1)
    .optional(),
  payment_method: z
    .enum(['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'TRANSFER', 'CHECK'])
    .default('CASH'),
});

// Esquema para cancelar transacción
export const cancelTransactionSchema = z.object({
  reason: z
    .string()
    .min(5, 'La razón debe tener al menos 5 caracteres')
    .max(500, 'La razón no puede exceder 500 caracteres'),
});

// Esquema para filtros de reportes
export const reportFiltersSchema = z.object({
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
  user_id: z
    .number()
    .min(1)
    .optional(),
  transaction_type: z
    .enum(['INCOME', 'EXPENSE', 'ALL'])
    .default('ALL'),
  category: z
    .enum(['SERVICE_PAYMENT', 'SUPPLIER_PAYMENT', 'COMMISSION_LIQUIDATION', 'CASH_DIFFERENCE', 'OTHER', 'ALL'])
    .default('ALL'),
}).refine((data) => {
  const startDate = new Date(data.start_date);
  const endDate = new Date(data.end_date);
  return startDate <= endDate;
}, {
  message: "La fecha de inicio debe ser anterior o igual a la fecha de fin",
  path: ["end_date"],
});

// Esquema para login
export const loginSchema = z.object({
  email: z
    .string()
    .email('El formato del email es inválido')
    .min(1, 'El email es requerido'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida'),
  remember: z
    .boolean()
    .default(false),
});

// Esquema para registro de usuario
export const registerSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(255, 'El nombre no puede exceder 255 caracteres'),
  email: z
    .string()
    .email('El formato del email es inválido'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'La contraseña debe contener al menos una mayúscula, una minúscula y un número'),
  password_confirmation: z
    .string(),
}).refine((data) => data.password === data.password_confirmation, {
  message: "Las contraseñas no coinciden",
  path: ["password_confirmation"],
});