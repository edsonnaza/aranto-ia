import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

const useAuthStore = create(
  devtools(
    (set, get) => ({
      // Estado
      user: null,
      permissions: [],
      roles: [],
      isAuthenticated: false,
      isLoading: false,

      // Acciones
      setUser: (user) => set(
        {
          user,
          isAuthenticated: !!user,
          permissions: user?.permissions || [],
          roles: user?.roles || [],
        },
        false,
        'setUser'
      ),

      setLoading: (isLoading) => set(
        { isLoading },
        false,
        'setLoading'
      ),

      logout: () => set(
        {
          user: null,
          permissions: [],
          roles: [],
          isAuthenticated: false,
        },
        false,
        'logout'
      ),

      // Helpers para verificar permisos
      hasPermission: (permission) => {
        const { permissions } = get();
        return permissions.includes(permission);
      },

      hasRole: (role) => {
        const { roles } = get();
        return roles.includes(role);
      },

      hasAnyPermission: (permissionList) => {
        const { permissions } = get();
        return permissionList.some(permission => permissions.includes(permission));
      },

      hasAllPermissions: (permissionList) => {
        const { permissions } = get();
        return permissionList.every(permission => permissions.includes(permission));
      },

      // Verificaciones específicas del módulo de caja
      canOpenCashRegister: () => {
        const { hasPermission } = get();
        return hasPermission('cash_register.open');
      },

      canCloseCashRegister: () => {
        const { hasPermission } = get();
        return hasPermission('cash_register.close');
      },

      canProcessPayments: () => {
        const { hasPermission } = get();
        return hasPermission('payments.process');
      },

      canCancelTransactions: () => {
        const { hasPermission } = get();
        return hasPermission('transactions.cancel');
      },

      canViewAuditReports: () => {
        const { hasPermission } = get();
        return hasPermission('audit.view_reports');
      },

      canManageUsers: () => {
        const { hasPermission } = get();
        return hasPermission('users.manage');
      },

      canViewAllSessions: () => {
        const { hasPermission } = get();
        return hasPermission('cash_register.view_all');
      },

      // Inicializar usuario desde página (Inertia)
      initializeFromPage: (pageProps) => {
        const { setUser } = get();
        if (pageProps.auth?.user) {
          setUser(pageProps.auth.user);
        }
      },
    }),
    {
      name: 'auth-store',
    }
  )
);

export default useAuthStore;