import { Head } from '@inertiajs/react';
import { useState } from 'react';

import HeadingSmall from '@/components/heading-small';
import TestModal from '@/components/cash-register/test-modal';
import TransactionModal from '@/components/cash-register/transaction-modal';
import { type BreadcrumbItem } from '@/types';
import { type CashRegisterSession, type Transaction, type CashRegisterBalance } from '@/types/cash-register';

import AppLayout from '@/layouts/app-layout';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Tesorería',
        href: '/cash-register',
    },
];

interface CashRegisterDashboardProps {
    activeSession?: CashRegisterSession;
    todayTransactions: Transaction[];
    balance: CashRegisterBalance;
}

export default function CashRegisterDashboard({
    activeSession,
    todayTransactions = [],
    balance,
}: CashRegisterDashboardProps) {
    const [isOpenModalVisible, setIsOpenModalVisible] = useState(false);
    const [isIncomeModalVisible, setIsIncomeModalVisible] = useState(false);
    const [isExpenseModalVisible, setIsExpenseModalVisible] = useState(false);

    console.log('Dashboard rendered, activeSession:', activeSession);
    console.log('isOpenModalVisible:', isOpenModalVisible);

    const handleOpenModal = () => {
        console.log('Button clicked, opening modal...');
        setIsOpenModalVisible(true);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tesorería - Dashboard" />

            <div className="space-y-6">
                <HeadingSmall
                    title="Tesorería - Caja Registradora"
                    description="Gestión de caja registradora y transacciones diarias"
                />

                <div className="grid gap-4 md:grid-cols-4">
                    {/* Session Status Card */}
                    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <h3 className="tracking-tight text-sm font-medium">Estado de Caja</h3>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                className="h-4 w-4 text-muted-foreground"
                            >
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                        </div>
                        <div className="text-2xl font-bold">
                            {activeSession ? 'ABIERTA' : 'CERRADA'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {activeSession 
                                ? `Abierta desde: ${new Date(activeSession.opening_date).toLocaleTimeString()}`
                                : 'Caja cerrada'
                            }
                        </p>
                    </div>

                    {/* Balance Apertura */}
                    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <h3 className="tracking-tight text-sm font-medium">Balance Apertura</h3>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                className="h-4 w-4 text-muted-foreground"
                            >
                                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                            </svg>
                        </div>
                        <div className="text-2xl font-bold">
                            ${balance?.opening?.toFixed(2) || '0.00'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Balance inicial del día
                        </p>
                    </div>

                    {/* Ingresos */}
                    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <h3 className="tracking-tight text-sm font-medium">Ingresos</h3>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                className="h-4 w-4 text-green-600"
                            >
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                        </div>
                        <div className="text-2xl font-bold text-green-600">
                            ${balance?.income?.toFixed(2) || '0.00'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Total de ingresos del día
                        </p>
                    </div>

                    {/* Balance Actual */}
                    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <h3 className="tracking-tight text-sm font-medium">Balance Actual</h3>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                className="h-4 w-4 text-muted-foreground"
                            >
                                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                            </svg>
                        </div>
                        <div className="text-2xl font-bold">
                            ${balance?.current?.toFixed(2) || '0.00'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Balance total disponible
                        </p>
                    </div>
                </div>

                {/* Actions Section */}
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div className="flex flex-col space-y-1.5 p-6">
                        <h3 className="text-2xl font-semibold leading-none tracking-tight">Acciones Rápidas</h3>
                        <p className="text-sm text-muted-foreground">
                            Gestiona las operaciones de caja registradora
                        </p>
                    </div>
                    <div className="p-6 pt-0">
                        <div className="flex gap-4">
                            {!activeSession ? (
                                <button 
                                    onClick={handleOpenModal}
                                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                                >
                                    <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
                                        <path d="M9 12l2 2 4-4" />
                                        <path d="M21 12c.552 0 1-.449 1-1s-.448-1-1-1" />
                                    </svg>
                                    Abrir Caja
                                </button>
                            ) : (
                                <>
                                    <button 
                                        onClick={() => setIsIncomeModalVisible(true)}
                                        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-green-600 text-primary-foreground hover:bg-green-700 h-10 px-4 py-2"
                                    >
                                        <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
                                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                        </svg>
                                        Registrar Ingreso
                                    </button>
                                    <button 
                                        onClick={() => setIsExpenseModalVisible(true)}
                                        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-orange-600 text-primary-foreground hover:bg-orange-700 h-10 px-4 py-2"
                                    >
                                        <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
                                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                        </svg>
                                        Registrar Egreso
                                    </button>
                                    <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-red-600 text-primary-foreground hover:bg-red-700 h-10 px-4 py-2">
                                        <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
                                            <path d="M18 6L6 18M6 6l12 12" />
                                        </svg>
                                        Cerrar Caja
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Recent Transactions Table */}
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div className="flex flex-col space-y-1.5 p-6">
                        <h3 className="text-2xl font-semibold leading-none tracking-tight">Transacciones Recientes</h3>
                        <p className="text-sm text-muted-foreground">
                            Últimas transacciones del día
                        </p>
                    </div>
                    <div className="p-6 pt-0">
                        <div className="relative w-full overflow-auto">
                            <table className="w-full caption-bottom text-sm">
                                <thead className="[&_tr]:border-b">
                                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">
                                            Hora
                                        </th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">
                                            Tipo
                                        </th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">
                                            Descripción
                                        </th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">
                                            Monto
                                        </th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">
                                            Usuario
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0">
                                    {todayTransactions.length > 0 ? (
                                        todayTransactions.map((transaction: Transaction, index: number) => (
                                            <tr key={index} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                                <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0">
                                                    {new Date(transaction.created_at).toLocaleTimeString()}
                                                </td>
                                                <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0">
                                                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                                        transaction.type === 'INCOME' 
                                                            ? 'bg-green-100 text-green-800' 
                                                            : 'bg-red-100 text-red-800'
                                                    }`}>
                                                        {transaction.type === 'INCOME' ? 'Ingreso' : 'Egreso'}
                                                    </span>
                                                </td>
                                                <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0">
                                                    {transaction.description}
                                                </td>
                                                <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0">
                                                    <span className={transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}>
                                                        {transaction.type === 'INCOME' ? '+' : '-'}${transaction.amount.toFixed(2)}
                                                    </span>
                                                </td>
                                                <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0">
                                                    {transaction.user?.name || 'N/A'}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="p-4 align-middle text-center text-muted-foreground">
                                                No hay transacciones registradas hoy
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal for opening cash register */}
            <TestModal 
                isOpen={isOpenModalVisible}
                onClose={() => setIsOpenModalVisible(false)}
            />

            {/* Modal for income transactions */}
            <TransactionModal 
                isOpen={isIncomeModalVisible}
                onClose={() => setIsIncomeModalVisible(false)}
                type="INCOME"
                services={[]} // We'll need to pass services from props later
            />

            {/* Modal for expense transactions */}
            <TransactionModal 
                isOpen={isExpenseModalVisible}
                onClose={() => setIsExpenseModalVisible(false)}
                type="EXPENSE"
            />
        </AppLayout>
    );
}