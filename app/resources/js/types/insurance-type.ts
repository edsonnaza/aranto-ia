export interface InsuranceType {
    id: number;
    name: string;
    description?: string;
    coverage_percentage: number;
    deductible_amount: number;
    max_coverage_amount?: number;
    status: 'active' | 'inactive';
    created_at: string;
    updated_at: string;
}

export interface InsuranceTypeFormData {
    name: string;
    description?: string;
    coverage_percentage: number;
    deductible_amount: number;
    max_coverage_amount?: number;
    status: 'active' | 'inactive';
}

export interface InsuranceTypeStats {
    total: number;
    active: number;
    inactive: number;
    avg_coverage: number;
    total_patients_with_insurance: number;
}