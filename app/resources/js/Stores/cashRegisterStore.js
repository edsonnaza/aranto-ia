import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

const useCashRegisterStore = create(
  devtools(
    (set, get) => ({
      // Estado
      activeSession: null,
      transactions: [],
      summary: {
        initial_amount: 0,
        total_income: 0,
        total_expenses: 0,
        calculated_balance: 0,
        transactions_count: 0,
      },
      isLoading: false,
      error: null,

      // Acciones
      setActiveSession: (session) => set(
        { activeSession: session },
        false,
        'setActiveSession'
      ),

      setTransactions: (transactions) => set(
        { transactions },
        false,
        'setTransactions'
      ),

      addTransaction: (transaction) => set(
        (state) => ({
          transactions: [transaction, ...state.transactions],
        }),
        false,
        'addTransaction'
      ),

      updateTransaction: (transactionId, updates) => set(
        (state) => ({
          transactions: state.transactions.map(t =>
            t.id === transactionId ? { ...t, ...updates } : t
          ),
        }),
        false,
        'updateTransaction'
      ),

      setSummary: (summary) => set(
        { summary },
        false,
        'setSummary'
      ),

      setLoading: (isLoading) => set(
        { isLoading },
        false,
        'setLoading'
      ),

      setError: (error) => set(
        { error },
        false,
        'setError'
      ),

      clearError: () => set(
        { error: null },
        false,
        'clearError'
      ),

      // Acciones complejas
      openSession: async (initialAmount, notes) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/cash-register/open', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
            },
            body: JSON.stringify({ initial_amount: initialAmount, notes }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || 'Error al abrir sesión');
          }

          set({
            activeSession: data.data,
            transactions: [],
            summary: {
              initial_amount: data.data.initial_amount,
              total_income: 0,
              total_expenses: 0,
              calculated_balance: data.data.initial_amount,
              transactions_count: 0,
            },
            isLoading: false,
          });

          return data.data;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      closeSession: async (finalPhysicalAmount, differenceJustification) => {
        const { activeSession } = get();
        if (!activeSession) throw new Error('No hay sesión activa');

        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`/api/cash-register/${activeSession.id}/close`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
            },
            body: JSON.stringify({
              final_physical_amount: finalPhysicalAmount,
              difference_justification: differenceJustification,
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || 'Error al cerrar sesión');
          }

          set({
            activeSession: data.data,
            isLoading: false,
          });

          return data.data;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      processPayment: async (paymentData) => {
        const { activeSession } = get();
        if (!activeSession) throw new Error('No hay sesión activa');

        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/cash-register/payment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
            },
            body: JSON.stringify({
              ...paymentData,
              cash_register_session_id: activeSession.id,
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || 'Error al procesar pago');
          }

          const { addTransaction } = get();
          addTransaction(data.data.transaction);

          // Actualizar resumen
          set((state) => ({
            summary: {
              ...state.summary,
              total_income: data.data.session.total_income,
              total_expenses: data.data.session.total_expenses,
              calculated_balance: data.data.session.calculated_balance,
              transactions_count: state.transactions.length + 1,
            },
            isLoading: false,
          }));

          return data.data;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      loadActiveSession: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/cash-register/active-session');
          const data = await response.json();

          if (!response.ok) {
            if (response.status === 404) {
              // No hay sesión activa
              set({
                activeSession: null,
                transactions: [],
                summary: {
                  initial_amount: 0,
                  total_income: 0,
                  total_expenses: 0,
                  calculated_balance: 0,
                  transactions_count: 0,
                },
                isLoading: false,
              });
              return null;
            }
            throw new Error(data.message || 'Error al cargar sesión');
          }

          set({
            activeSession: data.data.session,
            transactions: data.data.transactions || [],
            summary: data.data.summary,
            isLoading: false,
          });

          return data.data;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      // Reset completo del store
      reset: () => set(
        {
          activeSession: null,
          transactions: [],
          summary: {
            initial_amount: 0,
            total_income: 0,
            total_expenses: 0,
            calculated_balance: 0,
            transactions_count: 0,
          },
          isLoading: false,
          error: null,
        },
        false,
        'reset'
      ),
    }),
    {
      name: 'cash-register-store',
    }
  )
);

export default useCashRegisterStore;