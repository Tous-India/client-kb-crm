import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import { useDesktopNotifications } from '../../hooks/useDesktopNotifications'
import NotificationSettings from '../../components/NotificationSettings'
import './BuyerLayout.css'

function BuyerLayout() {
  // Desktop notifications hook
  const { requestPermission } = useDesktopNotifications();
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);

  // Request notification permission on first load
  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  return (
    <div className="buyer-layout">
      <Header onNotificationSettingsClick={() => setShowNotificationSettings(true)} />

      <div className="buyer-container">
        <Sidebar />

        <main className="buyer-content">
          <Outlet />
        </main>
      </div>

      {/* Notification Settings Modal */}
      <NotificationSettings
        open={showNotificationSettings}
        onClose={() => setShowNotificationSettings(false)}
      />
    </div>
  )
}

export default BuyerLayout
