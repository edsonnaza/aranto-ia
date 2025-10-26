import { z } from 'zod';
import { 
  openSessionSchema, 
  closeSessionSchema, 
  servicePaymentSchema, 
  supplierPaymentSchema, 
  commissionLiquidationSchema, 
  cancelTransactionSchema, 
  reportFiltersSchema, 
  loginSchema, 
  registerSchema 
} from '../Services/validation/schemas.js';

// Tipos TypeScript derivados de los esquemas Zod
export type OpenSessionData = z.infer<typeof openSessionSchema>;
export type CloseSessionData = z.infer<typeof closeSessionSchema>;
export type ServicePaymentData = z.infer<typeof servicePaymentSchema>;
export type SupplierPaymentData = z.infer<typeof supplierPaymentSchema>;
export type CommissionLiquidationData = z.infer<typeof commissionLiquidationSchema>;
export type CancelTransactionData = z.infer<typeof cancelTransactionSchema>;
export type ReportFiltersData = z.infer<typeof reportFiltersSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;

// Tipos para modelos del backend
export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at?: string;
  created_at: string;
  updated_at: string;
  permissions?: string[];
  roles?: string[];
}

export interface Service {
  id: number;
  code: string;
  name: string;
  description?: string;
  base_price: number;
  category: 'CONSULTATION' | 'PROCEDURE' | 'EMERGENCY' | 'HOSPITALIZATION' | 'DIAGNOSTIC' | 'OTHER';
  is_active: boolean;
  professional_commission_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface CashRegisterSession {
  id: number;
  user_id: number;
  opening_date: string;
  closing_date?: string;
  initial_amount: number;
  final_physical_amount?: number;
  calculated_balance: number;
  total_income: number;
  total_expenses: number;
  difference?: number;
  status: 'open' | 'closed';
  difference_justification?: string;
  authorized_by?: number;
  created_at: string;
  updated_at: string;
  user?: User;
  authorizedBy?: User;
  transactions?: Transaction[];
}

export interface Transaction {
  id: number;
  cash_register_session_id: number;
  type: 'INCOME' | 'EXPENSE';
  category: 'SERVICE_PAYMENT' | 'SUPPLIER_PAYMENT' | 'COMMISSION_LIQUIDATION' | 'CASH_DIFFERENCE' | 'OTHER';
  amount: number;
  concept: string;
  patient_id?: number;
  professional_id?: number;
  liquidation_id?: number;
  user_id: number;
  status: 'active' | 'cancelled';
  original_transaction_id?: number;
  cancellation_reason?: string;
  cancelled_by?: number;
  cancelled_at?: string;
  created_at: string;
  updated_at: string;
  user?: User;
  cancelledBy?: User;
  cashRegisterSession?: CashRegisterSession;
}

export interface AuditLog {
  id: number;
  auditable_type: string;
  auditable_id: number;
  event: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  user_id?: number;
  user_agent?: string;
  ip_address?: string;
  description?: string;
  created_at: string;
  updated_at: string;
  user?: User;
}

// Tipos para respuestas de API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
  error_code?: string;
}

export interface SessionSummary {
  initial_amount: number;
  total_income: number;
  total_expenses: number;
  calculated_balance: number;
  transactions_count: number;
  income_transactions_count?: number;
  expense_transactions_count?: number;
}

export interface PaymentMethod {
  type: 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'TRANSFER' | 'CHECK';
  amount: number;
  reference?: string;
  financial_entity?: string;
}

// Tipos para notificaciones
export interface Notification {
  id: string;
  title: string;
  description?: string;
  variant: 'default' | 'success' | 'warning' | 'destructive';
  duration: number;
  createdAt: Date;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Tipos para props de páginas (Inertia)
export interface PageProps {
  auth: {
    user: User;
  };
  errors: Record<string, string>;
  flash?: {
    message?: string;
    error?: string;
    success?: string;
  };
}

// Tipos para filtros y paginación
export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
  links: {
    first: string;
    last: string;
    prev?: string;
    next?: string;
  };
}

// Tipos para reportes
export interface TransactionReport {
  transactions: Transaction[];
  summary: {
    total_transactions: number;
    total_income: number;
    total_expenses: number;
    net_amount: number;
  };
  period: {
    start_date: string;
    end_date: string;
  };
}

export interface AuditReport {
  audit_logs: AuditLog[];
  summary: {
    total_events: number;
    sessions_opened: number;
    sessions_closed: number;
    total_differences: number;
    average_difference: number;
    max_difference: number;
    min_difference: number;
  };
  period: {
    start_date: string;
    end_date: string;
  };
}