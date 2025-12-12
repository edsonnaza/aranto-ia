// Tipos para el módulo de liquidación de comisiones
export interface CommissionLiquidation {
  id: number
  professional_id: number
  period_start: string
  period_end: string
  total_services: number
  gross_amount: number
  commission_percentage: number
  commission_amount: number
  // allow 'pending' status used by UI components
  status: 'draft' | 'pending' | 'approved' | 'paid' | 'cancelled'
  generated_by: number
  approved_by?: number
  approved_at?: string
  paid_at?: string
  payment_movement_id?: number
  professional?: Professional
  generatedBy?: User
  approvedBy?: User
  paymentMovement?: Transaction
  details?: CommissionLiquidationDetail[]
  created_at: string
  updated_at: string

  // Convenience/flattened fields often returned by APIs
  professional_name?: string
  specialty_name?: string
  total_amount?: number
}

export interface CommissionLiquidationDetail {
  id: number
  liquidation_id: number
  service_request_id: number
  patient_id: number
  service_id: number
  service_date: string
  payment_date: string
  service_amount: number
  commission_percentage: number
  commission_amount: number
  payment_movement_id: number
  liquidation?: CommissionLiquidation
  serviceRequest?: ServiceRequest
  patient?: Patient
  service?: MedicalService
  paymentMovement?: Transaction
  // convenience flattened fields used by UI
  patient_name?: string
  patient_document?: string
  service_name?: string
  created_at: string
  updated_at: string
}

export interface CommissionReport {
  // For reports we expose a list of professionals summary
  professionals: Array<{
    professional_name: string
    specialty_name?: string
    total_services: number
    total_service_amount: number
    commission_percentage: number
    commission_amount: number
    liquidation_status?: string
  }>
  period?: {
    start: string
    end: string
  }
  summary: {
    total_liquidations: number
    total_commission: number
    paid_commission: number
    pending_commission: number
  }
  liquidations: CommissionLiquidation[]
}

export interface CommissionData {
  professional: Professional
  period: {
    start: string
    end: string
  }
  summary: {
    total_services: number
    gross_amount: number
    commission_percentage: number
    commission_amount: number
  }
  services: Array<{
    movement_id: number
    service_request_id: number
    patient_id: number
    service_id?: number
    service_date: string
    payment_date: string
    service_amount: number
    commission_percentage: number
    commission_amount: number
  }>
}

// A lightweight structure for pending approvals used in the UI
export interface CommissionPendingApproval {
  id: number
  professional_name: string
  specialty_name?: string
  period_start: string
  period_end: string
  total_services: number
  total_amount: number
  commission_percentage: number
  commission_amount: number
  created_at: string
}

// Summary used by the report page
export interface CommissionReportSummary {
  total_professionals: number
  total_services: number
  total_amount: number
  total_commissions: number
}

// Settings structure used by the settings UI
export interface CommissionSettings {
  default_commission_percentage: number
  minimum_commission_amount: number
  maximum_commission_amount: number
  auto_approve_threshold: number
  payment_deadline_days: number
}

// Tipos para formularios
export interface CommissionLiquidationFormData {
  professional_id: number
  period_start: string
  period_end: string
}

export interface CommissionPaymentFormData {
  cash_register_session_id: number
  amount: number
  concept: string
}

// Tipos para respuestas de API
export type CommissionLiquidationsIndexData = PaginatedData<CommissionLiquidation>

export interface CommissionReportData {
  report: CommissionReport
  filters: {
    professional_id?: number
    start_date?: string
    end_date?: string
  }
}

// Tipos para estadísticas
export interface CommissionStats {
  total_liquidations: number
  pending_approvals: number
  total_commission_paid: number
  total_commission_pending: number
  professionals_with_commissions: number
  average_commission_percentage: number
}

// Import types from other modules
import { Professional, Patient, MedicalService, PaginatedData } from './medical'
// User should be imported from the sibling index (the root of /resources/js/types)
import { User } from './index'
// Import Transaction from cash-register instead of redefining it
import type { Transaction } from './cash-register'

// Note: These types need to be imported from their respective modules
interface ServiceRequest {
  id: number
  request_number: string
  patient_name: string
  status: string
  created_at: string
}