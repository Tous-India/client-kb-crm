import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useNotificationStore = create(
  persist(
    (set, get) => ({
      // Notifications array
      notifications: [],

      // Add a new notification
      addNotification: (notification) => {
        const newNotification = {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          read: false,
          ...notification,
        };

        set((state) => ({
          notifications: [newNotification, ...state.notifications],
        }));

        return newNotification.id;
      },

      // Mark notification as read
      markAsRead: (notificationId) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === notificationId ? { ...n, read: true } : n
          ),
        }));
      },

      // Mark all notifications as read
      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        }));
      },

      // Remove a notification
      removeNotification: (notificationId) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== notificationId),
        }));
      },

      // Clear all notifications
      clearAll: () => {
        set({ notifications: [] });
      },

      // Get unread count
      getUnreadCount: () => {
        return get().notifications.filter((n) => !n.read).length;
      },

      // Get notifications by type
      getNotificationsByType: (type) => {
        return get().notifications.filter((n) => n.type === type);
      },
    }),
    {
      name: 'kb-notifications-storage',
      version: 1,
    }
  )
);

export default useNotificationStore;
