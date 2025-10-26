import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

const useNotificationStore = create(
  devtools(
    (set, get) => ({
      // Estado
      notifications: [],

      // Acciones
      addNotification: (notification) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newNotification = {
          id,
          title: notification.title || '',
          description: notification.description || '',
          variant: notification.variant || 'default', // default, success, warning, destructive
          duration: notification.duration || 5000,
          createdAt: new Date(),
          ...notification,
        };

        set(
          (state) => ({
            notifications: [newNotification, ...state.notifications],
          }),
          false,
          'addNotification'
        );

        // Auto-remove notification after duration
        if (newNotification.duration > 0) {
          setTimeout(() => {
            const { removeNotification } = get();
            removeNotification(id);
          }, newNotification.duration);
        }

        return id;
      },

      removeNotification: (id) => set(
        (state) => ({
          notifications: state.notifications.filter(n => n.id !== id),
        }),
        false,
        'removeNotification'
      ),

      clearAllNotifications: () => set(
        { notifications: [] },
        false,
        'clearAllNotifications'
      ),

      // Helpers para tipos específicos de notificaciones
      success: (title, description, options = {}) => {
        const { addNotification } = get();
        return addNotification({
          title,
          description,
          variant: 'success',
          ...options,
        });
      },

      error: (title, description, options = {}) => {
        const { addNotification } = get();
        return addNotification({
          title,
          description,
          variant: 'destructive',
          duration: 8000, // Errores duran más tiempo
          ...options,
        });
      },

      warning: (title, description, options = {}) => {
        const { addNotification } = get();
        return addNotification({
          title,
          description,
          variant: 'warning',
          ...options,
        });
      },

      info: (title, description, options = {}) => {
        const { addNotification } = get();
        return addNotification({
          title,
          description,
          variant: 'default',
          ...options,
        });
      },

      // Notificación persistente (no se auto-remueve)
      persistent: (title, description, variant = 'default') => {
        const { addNotification } = get();
        return addNotification({
          title,
          description,
          variant,
          duration: 0, // No se auto-remueve
        });
      },
    }),
    {
      name: 'notification-store',
    }
  )
);

export default useNotificationStore;