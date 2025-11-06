// Types for Cash Register module

export interface CashRegisterSession {
    id: number;
    user_id: number;
    opening_balance: number;
    closing_balance?: number;
    opened_at: string;
    closed_at?: string;
    notes?: string;
    is_forced_close: boolean;
    forced_close_reason?: string;
    forced_close_by?: number;
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
    payment_method: 'CASH' | 'CARD' | 'TRANSFER' | 'CHECK' | 'OTHER';
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