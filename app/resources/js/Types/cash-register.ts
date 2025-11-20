// Types for Cash Register module

export interface CashRegisterSession {
    id: number;
    user_id: number;
    initial_amount: number;
    final_physical_amount?: number;
    calculated_balance: number;
    total_income?: number;
    total_expenses?: number;
    difference?: number;
    opening_date: string;
    closing_date?: string;
    status: string;
    difference_justification?: string;
    authorized_by?: number;
    notes?: Record<string, unknown> | null;
    created_at: string;
    updated_at: string;
    user?: User;
}

export interface Transaction {
    id: number;
    cash_register_session_id: number;
    type: 'INCOME' | 'EXPENSE' | 'PAYMENT';
    amount: number;
    description: string;
    reference?: string;
    service_id?: number;
    user_id: number;
    payment_method: 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'TRANSFER' | 'CHECK' | 'DIGITAL' | 'OTHER';
    created_at: string;
    updated_at: string;
    user?: User;
    service?: Service;
    session?: CashRegisterSession;
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

export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string;
    created_at: string;
    updated_at: string;
}

export interface CashRegisterBalance {
    opening: number;
    income: number;
    expense: number;
    current: number;
}

export interface CashRegisterDashboardData {
    activeSession?: CashRegisterSession;
    todayTransactions: Transaction[];
    balance: CashRegisterBalance;
}