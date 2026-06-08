// Tipos base del sistema médico
export interface InsuranceType {
  id: number
  name: string
  code: string
  description?: string
  requires_authorization: boolean
  coverage_percentage: number
  has_copay: boolean
  copay_amount: number
  contact_name?: string
  contact_phone?: string
  contact_email?: string
  billing_address?: string
  status: 'active' | 'inactive'
  active: boolean
  deductible_amount?: number
  created_at: string
  updated_at: string
}

export interface ServiceCategory {
  id: number
  name: string
  description?: string
  parent_id?: number
  level: number
  path: string
  active: boolean
  children?: ServiceCategory[]
  parent?: ServiceCategory
  created_at: string
  updated_at: string
}

export interface MedicalService {
  id: number
  service_category_id: number
  name: string
  description?: string
  base_price: number
  active: boolean
  requires_professional: boolean
  category?: ServiceCategory
  created_at: string
  updated_at: string
}

export interface Specialty {
  id: number
  name: string
  code?: string
  description?: string
  status: string
  created_at: string
  updated_at: string
}

export interface Professional {
  id: number
  first_name: string
  last_name: string
  email?: string
  phone?: string
  identification?: string
  license_number?: string
  commission_percentage?: number
  is_active: boolean
  address?: string
  status: string
  specialties?: Specialty[]
  services?: MedicalService[]
  created_at: string
  updated_at: string
}

export interface Patient {
  id: number
  document_type: string
  document_number: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  birth_date?: string
  gender?: 'M' | 'F' | 'OTHER'
  address?: string
  city?: string
  state?: string
  postal_code?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  insurance_type_id?: number
  insurance_number?: string
  insurance_valid_until?: string
  insurance_coverage_percentage?: number
  status: 'active' | 'inactive'
  notes?: string
  insurance_type?: InsuranceType
  
  // Campos computados para múltiples seguros
  insurance_info?: string
  primary_insurance_info?: {
    name: string
    code: string
    number?: string
    valid_until?: string
    coverage_percentage: number
  }
  total_insurances?: number
  
  // Atributos legacy
  full_name?: string
  formatted_document?: string
  age?: number
  
  created_at: string
  updated_at: string
}

// Tipos para estadísticas y reportes
export interface InsuranceTypeStats {
  total_patients: number
  active_patients: number
  total_services: number
  total_revenue: number
  recent_patients: Patient[]
}

export interface ServiceStats {
  total_services: number
  active_services: number
  total_categories: number
  average_price: number
  most_used_services: MedicalService[]
}

// Tipos para formularios
export interface InsuranceTypeFormData {
  name: string
  description?: string
  coverage_percentage: number
  active?: boolean
}

export interface PatientFormData {
  first_name: string
  last_name: string
  email?: string
  phone?: string
  birth_date?: string
  gender?: 'male' | 'female' | 'other'
  address?: string
  city?: string
  emergency_contact?: string
  emergency_phone?: string
  insurance_type_id?: number
  insurance_number?: string
  active?: boolean
}

export interface ProfessionalFormData {
  first_name: string
  last_name: string
  email: string
  phone?: string
  specialty: string
  license_number: string
  commission_percentage: number
  active?: boolean
  hire_date: string
}

export interface ServiceCategoryFormData {
  name: string
  description?: string
  parent_id?: number
  active?: boolean
}

export interface MedicalServiceFormData {
  service_category_id: number
  name: string
  description?: string
  base_price: number
  active?: boolean
  requires_professional?: boolean
}

// Tipos para respuestas de API
export interface PaginatedData<T> {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number
  to: number
  path: string
  next_page_url?: string
  prev_page_url?: string
  first_page_url: string
  last_page_url: string
  links: Array<{
    url: string | null
    label: string
    active: boolean
  }>
}

export interface ApiResponse<T> {
  data: T
  message?: string
  status: 'success' | 'error'
}