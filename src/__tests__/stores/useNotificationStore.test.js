import { describe, it, expect, beforeEach, vi } from 'vitest';
import useNotificationStore from '../../stores/useNotificationStore';

// Mock notification data
const mockNotification1 = {
  type: 'order',
  title: 'New Order',
  message: 'You have a new order ORD-00001'
};

const mockNotification2 = {
  type: 'payment',
  title: 'Payment Received',
  message: 'Payment of $5000 received for INV-001'
};

const mockNotification3 = {
  type: 'order',
  title: 'Order Shipped',
  message: 'Order ORD-00002 has been shipped'
};

const mockNotification4 = {
  type: 'system',
  title: 'System Update',
  message: 'System maintenance scheduled'
};

describe('useNotificationStore', () => {
  // Reset store before each test
  beforeEach(() => {
    useNotificationStore.setState({ notifications: [] });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('addNotification', () => {
    it('should add a new notification', () => {
      vi.setSystemTime(new Date('2024-01-15T10:00:00Z'));

      const id = useNotificationStore.getState().addNotification(mockNotification1);

      expect(id).toBe(Date.now());
      expect(useNotificationStore.getState().notifications).toHaveLength(1);
    });

    it('should add notification at the beginning of the list', () => {
      vi.setSystemTime(new Date('2024-01-15T10:00:00Z'));
      useNotificationStore.getState().addNotification(mockNotification1);

      vi.setSystemTime(new Date('2024-01-15T11:00:00Z'));
      useNotificationStore.getState().addNotification(mockNotification2);

      const notifications = useNotificationStore.getState().notifications;
      expect(notifications[0].title).toBe('Payment Received');
      expect(notifications[1].title).toBe('New Order');
    });

    it('should set notification as unread by default', () => {
      useNotificationStore.getState().addNotification(mockNotification1);

      expect(useNotificationStore.getState().notifications[0].read).toBe(false);
    });

    it('should include timestamp', () => {
      vi.setSystemTime(new Date('2024-02-20T15:30:00Z'));

      useNotificationStore.getState().addNotification(mockNotification1);

      expect(useNotificationStore.getState().notifications[0].timestamp).toBe('2024-02-20T15:30:00.000Z');
    });

    it('should generate unique ID based on timestamp', () => {
      const testDate = new Date('2024-01-15T10:00:00Z');
      vi.setSystemTime(testDate);
      const id = useNotificationStore.getState().addNotification(mockNotification1);

      expect(id).toBe(testDate.getTime());
    });

    it('should preserve all notification data', () => {
      useNotificationStore.getState().addNotification(mockNotification1);

      const notification = useNotificationStore.getState().notifications[0];
      expect(notification.type).toBe('order');
      expect(notification.title).toBe('New Order');
      expect(notification.message).toBe('You have a new order ORD-00001');
    });
  });

  describe('markAsRead', () => {
    it('should mark specific notification as read', () => {
      vi.setSystemTime(new Date('2024-01-15T10:00:00Z'));
      const id = useNotificationStore.getState().addNotification(mockNotification1);

      useNotificationStore.getState().markAsRead(id);

      expect(useNotificationStore.getState().notifications[0].read).toBe(true);
    });

    it('should not affect other notifications', () => {
      vi.setSystemTime(new Date('2024-01-15T10:00:00Z'));
      const id1 = useNotificationStore.getState().addNotification(mockNotification1);

      vi.setSystemTime(new Date('2024-01-15T11:00:00Z'));
      useNotificationStore.getState().addNotification(mockNotification2);

      useNotificationStore.getState().markAsRead(id1);

      const notifications = useNotificationStore.getState().notifications;
      expect(notifications.find(n => n.id === id1).read).toBe(true);
      expect(notifications[0].read).toBe(false); // notification2 is first
    });

    it('should handle non-existent notification ID', () => {
      useNotificationStore.getState().addNotification(mockNotification1);
      useNotificationStore.getState().markAsRead(99999);

      expect(useNotificationStore.getState().notifications[0].read).toBe(false);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', () => {
      vi.setSystemTime(new Date('2024-01-15T10:00:00Z'));
      useNotificationStore.getState().addNotification(mockNotification1);

      vi.setSystemTime(new Date('2024-01-15T11:00:00Z'));
      useNotificationStore.getState().addNotification(mockNotification2);

      vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
      useNotificationStore.getState().addNotification(mockNotification3);

      useNotificationStore.getState().markAllAsRead();

      const notifications = useNotificationStore.getState().notifications;
      expect(notifications.every(n => n.read === true)).toBe(true);
    });

    it('should handle empty notifications array', () => {
      useNotificationStore.getState().markAllAsRead();

      expect(useNotificationStore.getState().notifications).toHaveLength(0);
    });
  });

  describe('removeNotification', () => {
    it('should remove specific notification', () => {
      vi.setSystemTime(new Date('2024-01-15T10:00:00Z'));
      const id1 = useNotificationStore.getState().addNotification(mockNotification1);

      vi.setSystemTime(new Date('2024-01-15T11:00:00Z'));
      useNotificationStore.getState().addNotification(mockNotification2);

      useNotificationStore.getState().removeNotification(id1);

      expect(useNotificationStore.getState().notifications).toHaveLength(1);
      expect(useNotificationStore.getState().notifications[0].title).toBe('Payment Received');
    });

    it('should not affect other notifications when removing', () => {
      vi.setSystemTime(new Date('2024-01-15T10:00:00Z'));
      const id1 = useNotificationStore.getState().addNotification(mockNotification1);

      vi.setSystemTime(new Date('2024-01-15T11:00:00Z'));
      const id2 = useNotificationStore.getState().addNotification(mockNotification2);

      useNotificationStore.getState().removeNotification(id1);

      const remaining = useNotificationStore.getState().notifications;
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe(id2);
    });

    it('should handle non-existent notification ID', () => {
      useNotificationStore.getState().addNotification(mockNotification1);
      useNotificationStore.getState().removeNotification(99999);

      expect(useNotificationStore.getState().notifications).toHaveLength(1);
    });
  });

  describe('clearAll', () => {
    it('should clear all notifications', () => {
      vi.setSystemTime(new Date('2024-01-15T10:00:00Z'));
      useNotificationStore.getState().addNotification(mockNotification1);

      vi.setSystemTime(new Date('2024-01-15T11:00:00Z'));
      useNotificationStore.getState().addNotification(mockNotification2);

      vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
      useNotificationStore.getState().addNotification(mockNotification3);

      useNotificationStore.getState().clearAll();

      expect(useNotificationStore.getState().notifications).toHaveLength(0);
    });
  });

  describe('getUnreadCount', () => {
    it('should return count of unread notifications', () => {
      vi.setSystemTime(new Date('2024-01-15T10:00:00Z'));
      const id1 = useNotificationStore.getState().addNotification(mockNotification1);

      vi.setSystemTime(new Date('2024-01-15T11:00:00Z'));
      useNotificationStore.getState().addNotification(mockNotification2);

      vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
      useNotificationStore.getState().addNotification(mockNotification3);

      // Mark one as read
      useNotificationStore.getState().markAsRead(id1);

      expect(useNotificationStore.getState().getUnreadCount()).toBe(2);
    });

    it('should return 0 when all read', () => {
      vi.setSystemTime(new Date('2024-01-15T10:00:00Z'));
      useNotificationStore.getState().addNotification(mockNotification1);

      vi.setSystemTime(new Date('2024-01-15T11:00:00Z'));
      useNotificationStore.getState().addNotification(mockNotification2);

      useNotificationStore.getState().markAllAsRead();

      expect(useNotificationStore.getState().getUnreadCount()).toBe(0);
    });

    it('should return 0 for empty notifications', () => {
      expect(useNotificationStore.getState().getUnreadCount()).toBe(0);
    });
  });

  describe('getNotificationsByType', () => {
    beforeEach(() => {
      vi.setSystemTime(new Date('2024-01-15T10:00:00Z'));
      useNotificationStore.getState().addNotification(mockNotification1); // order

      vi.setSystemTime(new Date('2024-01-15T11:00:00Z'));
      useNotificationStore.getState().addNotification(mockNotification2); // payment

      vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
      useNotificationStore.getState().addNotification(mockNotification3); // order

      vi.setSystemTime(new Date('2024-01-15T13:00:00Z'));
      useNotificationStore.getState().addNotification(mockNotification4); // system
    });

    it('should return notifications of specific type', () => {
      const orderNotifications = useNotificationStore.getState().getNotificationsByType('order');

      expect(orderNotifications).toHaveLength(2);
      expect(orderNotifications.every(n => n.type === 'order')).toBe(true);
    });

    it('should return payment notifications', () => {
      const paymentNotifications = useNotificationStore.getState().getNotificationsByType('payment');

      expect(paymentNotifications).toHaveLength(1);
      expect(paymentNotifications[0].title).toBe('Payment Received');
    });

    it('should return system notifications', () => {
      const systemNotifications = useNotificationStore.getState().getNotificationsByType('system');

      expect(systemNotifications).toHaveLength(1);
      expect(systemNotifications[0].title).toBe('System Update');
    });

    it('should return empty array for non-existent type', () => {
      const notifications = useNotificationStore.getState().getNotificationsByType('nonexistent');

      expect(notifications).toHaveLength(0);
    });
  });

  describe('Multiple Operations', () => {
    it('should handle add, read, remove sequence', () => {
      vi.setSystemTime(new Date('2024-01-15T10:00:00Z'));
      const id1 = useNotificationStore.getState().addNotification(mockNotification1);

      vi.setSystemTime(new Date('2024-01-15T11:00:00Z'));
      const id2 = useNotificationStore.getState().addNotification(mockNotification2);

      expect(useNotificationStore.getState().notifications).toHaveLength(2);
      expect(useNotificationStore.getState().getUnreadCount()).toBe(2);

      // Mark as read
      useNotificationStore.getState().markAsRead(id1);
      expect(useNotificationStore.getState().getUnreadCount()).toBe(1);

      // Remove read notification
      useNotificationStore.getState().removeNotification(id1);
      expect(useNotificationStore.getState().notifications).toHaveLength(1);
      expect(useNotificationStore.getState().getUnreadCount()).toBe(1);

      // Mark all as read
      useNotificationStore.getState().markAllAsRead();
      expect(useNotificationStore.getState().getUnreadCount()).toBe(0);

      // Clear all
      useNotificationStore.getState().clearAll();
      expect(useNotificationStore.getState().notifications).toHaveLength(0);
    });
  });

  describe('Notification Properties', () => {
    it('should create notification with correct structure', () => {
      vi.setSystemTime(new Date('2024-01-15T10:00:00Z'));
      useNotificationStore.getState().addNotification({
        type: 'alert',
        title: 'Test Alert',
        message: 'This is a test',
        priority: 'high',
        link: '/orders/123'
      });

      const notification = useNotificationStore.getState().notifications[0];

      expect(notification).toHaveProperty('id');
      expect(notification).toHaveProperty('timestamp');
      expect(notification).toHaveProperty('read');
      expect(notification.type).toBe('alert');
      expect(notification.title).toBe('Test Alert');
      expect(notification.message).toBe('This is a test');
      expect(notification.priority).toBe('high');
      expect(notification.link).toBe('/orders/123');
    });
  });
});
