import { useEffect, useRef, useCallback, useState } from 'react';
import { useNotificationCounts } from '../context/NotificationCountsContext';
import { playNotificationSound } from '../utils/notificationSound';

const STORAGE_KEY = 'kb-desktop-notifications-enabled';

export const useDesktopNotifications = () => {
  const { counts } = useNotificationCounts();
  const prevCountsRef = useRef(null);
  const [permissionGranted, setPermissionGranted] = useState(
    typeof Notification !== 'undefined' && Notification.permission === 'granted'
  );

  // Request permission
  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') {
      console.warn('Browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      setPermissionGranted(true);
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      setPermissionGranted(granted);
      return granted;
    }

    return false;
  }, []);

  // Check if enabled in settings
  const isEnabled = useCallback(() => {
    return localStorage.getItem(STORAGE_KEY) !== 'false';
  }, []);

  // Toggle setting
  const setEnabled = useCallback((enabled) => {
    localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
  }, []);

  // Get permission status
  const getPermissionStatus = useCallback(() => {
    if (typeof Notification === 'undefined') return 'unsupported';
    return Notification.permission;
  }, []);

  // Show desktop notification
  const showNotification = useCallback((title, body, options = {}) => {
    if (!permissionGranted || !isEnabled()) return null;

    try {
      const notification = new Notification(title, {
        body,
        icon: '/logo.png',
        badge: '/logo.png',
        tag: options.tag || 'kb-crm-notification',
        requireInteraction: false,
        silent: true, // We play our own sound
        ...options
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
        if (options.onClick) options.onClick();
      };

      // Play sound
      playNotificationSound();

      // Auto-close after 5 seconds
      setTimeout(() => notification.close(), 5000);

      return notification;
    } catch (error) {
      console.warn('Could not show notification:', error);
      return null;
    }
  }, [permissionGranted, isEnabled]);

  // Detect count increases and trigger notifications
  useEffect(() => {
    if (!counts || !prevCountsRef.current) {
      prevCountsRef.current = counts ? { ...counts } : null;
      return;
    }

    const prev = prevCountsRef.current;

    // Admin notifications
    if (counts.pendingOrders > prev.pendingOrders) {
      const diff = counts.pendingOrders - prev.pendingOrders;
      showNotification(
        'New Quote Request',
        `You have ${diff} new quote request${diff > 1 ? 's' : ''} to review`,
        { tag: 'quote-request' }
      );
    }

    if (counts.pendingPayments > prev.pendingPayments) {
      const diff = counts.pendingPayments - prev.pendingPayments;
      showNotification(
        'Payment Submitted',
        `${diff} new payment${diff > 1 ? 's' : ''} awaiting verification`,
        { tag: 'pending-payment' }
      );
    }

    // Buyer notifications
    if (counts.newQuotations > prev.newQuotations) {
      const diff = counts.newQuotations - prev.newQuotations;
      showNotification(
        'New Quotation',
        `You have ${diff} new quotation${diff > 1 ? 's' : ''} to review`,
        { tag: 'new-quotation' }
      );
    }

    if (counts.newProformaInvoices > prev.newProformaInvoices) {
      const diff = counts.newProformaInvoices - prev.newProformaInvoices;
      showNotification(
        'New Proforma Invoice',
        `You have ${diff} new PI${diff > 1 ? 's' : ''} requiring payment`,
        { tag: 'new-pi' }
      );
    }

    if (counts.newInvoices > prev.newInvoices) {
      const diff = counts.newInvoices - prev.newInvoices;
      showNotification(
        'New Invoice',
        `You have ${diff} new invoice${diff > 1 ? 's' : ''}`,
        { tag: 'new-invoice' }
      );
    }

    if (counts.orderUpdates > prev.orderUpdates) {
      const diff = counts.orderUpdates - prev.orderUpdates;
      showNotification(
        'Order Update',
        `${diff} order${diff > 1 ? 's have' : ' has'} been updated`,
        { tag: 'order-update' }
      );
    }

    // Update previous counts reference
    prevCountsRef.current = { ...counts };
  }, [counts, showNotification]);

  return {
    requestPermission,
    showNotification,
    isEnabled,
    setEnabled,
    getPermissionStatus,
    permissionGranted
  };
};

export default useDesktopNotifications;
