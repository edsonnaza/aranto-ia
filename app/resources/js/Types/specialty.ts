export interface Specialty {
  id: number;
  name: string;
  code?: string;
  description?: string;
  status: 'active' | 'inactive';
  active_professionals_count: number;
  primary_professionals_count: number;
  created_at: string;
  updated_at: string;
}

export interface SpecialtiesIndexData {
  specialties: {
    data: Specialty[];
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
  };
  filters: {
    search?: string;
    status?: string;
  };
  stats: {
    total: number;
    active: number;
    total_professionals: number;
  };
  flash?: {
    success?: string;
    error?: string;
  };
}

export interface SpecialtyFormData {
  name: string;
  code?: string;
  description?: string;
  status: 'active' | 'inactive';
}
