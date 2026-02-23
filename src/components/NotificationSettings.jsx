import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Switch,
  FormControlLabel,
  Typography,
  Alert,
  Box,
  Divider,
  Stack
} from '@mui/material';
import { Notifications, VolumeUp, NotificationsActive } from '@mui/icons-material';
import { useDesktopNotifications } from '../hooks/useDesktopNotifications';
import { playNotificationSound } from '../utils/notificationSound';

export default function NotificationSettings({ open, onClose }) {
  const {
    requestPermission,
    isEnabled,
    setEnabled,
    getPermissionStatus,
    showNotification
  } = useDesktopNotifications();

  const [enabled, setEnabledState] = useState(isEnabled());
  const [permissionStatus, setPermissionStatus] = useState(getPermissionStatus());

  // Update state when modal opens
  useEffect(() => {
    if (open) {
      setEnabledState(isEnabled());
      setPermissionStatus(getPermissionStatus());
    }
  }, [open, isEnabled, getPermissionStatus]);

  const handleToggle = async (event) => {
    const newValue = event.target.checked;

    if (newValue && permissionStatus !== 'granted') {
      const granted = await requestPermission();
      setPermissionStatus(getPermissionStatus());
      if (!granted) return;
    }

    setEnabledState(newValue);
    setEnabled(newValue);
  };

  const handleTestSound = () => {
    playNotificationSound();
  };

  const handleTestNotification = () => {
    showNotification(
      'Test Notification',
      'Desktop notifications are working correctly!',
      { tag: 'test-notification' }
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Notifications color="primary" />
        Notification Settings
      </DialogTitle>
      <DialogContent>
        {permissionStatus === 'denied' && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Notifications are blocked by your browser. To enable them:
            <ol style={{ marginBottom: 0, paddingLeft: '1.2em' }}>
              <li>Click the lock icon in your browser's address bar</li>
              <li>Find "Notifications" and change to "Allow"</li>
              <li>Refresh the page</li>
            </ol>
          </Alert>
        )}

        {permissionStatus === 'unsupported' && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Your browser does not support desktop notifications.
          </Alert>
        )}

        <FormControlLabel
          control={
            <Switch
              checked={enabled && permissionStatus === 'granted'}
              onChange={handleToggle}
              disabled={permissionStatus === 'denied' || permissionStatus === 'unsupported'}
              color="primary"
            />
          }
          label={
            <Typography fontWeight="medium">
              Enable desktop notifications
            </Typography>
          }
        />

        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, ml: 6 }}>
          Get notified when new quotations, invoices, or orders arrive - even when this tab is in the background.
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" gutterBottom>
          Test Notifications
        </Typography>

        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <Button
            startIcon={<VolumeUp />}
            onClick={handleTestSound}
            variant="outlined"
            size="small"
          >
            Test Sound
          </Button>

          <Button
            startIcon={<NotificationsActive />}
            onClick={handleTestNotification}
            variant="outlined"
            size="small"
            disabled={!enabled || permissionStatus !== 'granted'}
          >
            Test Notification
          </Button>
        </Stack>

        <Box sx={{ mt: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            <strong>Tip:</strong> Notifications work even when the browser tab is minimized or in the background. You'll receive alerts for:
          </Typography>
          <ul style={{ margin: '4px 0 0 0', paddingLeft: '1.2em' }}>
            <Typography component="li" variant="caption" color="text.secondary">
              New quotations received
            </Typography>
            <Typography component="li" variant="caption" color="text.secondary">
              New proforma invoices
            </Typography>
            <Typography component="li" variant="caption" color="text.secondary">
              Order status updates
            </Typography>
            <Typography component="li" variant="caption" color="text.secondary">
              New invoices generated
            </Typography>
          </ul>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
}
