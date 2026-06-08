// Types for Service Category management
export interface ServiceCategory {
    id: number;
    name: string;
    description?: string;
    status: 'active' | 'inactive';
    active_services_count: number;
    created_at: string;
    updated_at: string;
}

export interface ServiceCategoryFormData {
    name: string;
    description?: string;
    status: 'active' | 'inactive';
}

export interface ServiceCategoryStats {
    total: number;
    active: number;
    inactive: number;
    with_services: number;
    without_services: number;
}

export interface ServiceCategoriesResponse {
    data: ServiceCategory[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
}

export interface ServiceCategoryFilters {
    search?: string;
    status?: 'active' | 'inactive' | 'all';
    with_services?: 'yes' | 'no' | 'all';
    sort?: string;
    direction?: 'asc' | 'desc';
}

export interface ServiceCategoryPageProps {
    categories: ServiceCategoriesResponse;
    stats: ServiceCategoryStats;
    filters: ServiceCategoryFilters;
    flash?: {
        success?: string;
        error?: string;
    };
}

export interface ServiceCategoryShowProps {
    category: ServiceCategory;
    flash?: {
        success?: string;
        error?: string;
    };
}