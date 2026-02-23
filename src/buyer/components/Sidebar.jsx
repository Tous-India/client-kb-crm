import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotificationCounts } from '../../context/NotificationCountsContext';
import './Sidebar.css';

function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(true);
  const { user } = useAuth();
  const { counts, markAsViewed } = useNotificationCounts();

  const menuItems = [
    {
      path: '/',
      label: 'Home',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M3 9l9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M9 21V12h4v9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      path: '/products',
      label: 'Products',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="1" y="1" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M7 1v18M13 1v18M1 7h18M1 13h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      path: '/web-orders',
      label: 'Web Orders',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="1" y="3" width="15" height="13" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M16 8h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      path: '/quote',
      label: 'Quote',
      badgeKey: 'quotes',
      getBadgeCount: () => counts.newQuotations,
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      path: '/proforma-invoices',
      label: 'Proforma Invoice',
      badgeKey: 'pis',
      getBadgeCount: () => counts.newProformaInvoices,
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14 2v6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 13h8M8 17h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="9" cy="9" r="1" fill="currentColor"/>
        </svg>
      )
    },
    {
      path: '/open-orders',
      label: 'Open Orders',
      badgeKey: 'orders',
      getBadgeCount: () => counts.orderUpdates,
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      path: '/shipments',
      label: 'Shipments',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="1" y="3" width="15" height="11" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M16 8h3l2 4v5h-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="5.5" cy="16.5" r="2.5" stroke="currentColor" strokeWidth="2"/>
          <circle cx="17.5" cy="16.5" r="2.5" stroke="currentColor" strokeWidth="2"/>
        </svg>
      )
    },
    {
      path: '/invoices',
      label: 'Invoices',
      badgeKey: 'invoices',
      getBadgeCount: () => counts.newInvoices,
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="1" y="3" width="15" height="13" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M16 8h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="5.5" cy="18.5" r="2.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="15.5" cy="18.5" r="2.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      path: '/statements',
      label: 'Statements',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M14 2H6a2 2 0 0 0-2 2v16l4-2 4 2 4-2 4 2V4a2 2 0 0 0-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 10H8M12 14H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      path: '/8130',
      label: '8130',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 10h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      path: '/multi-search',
      label: 'Multi-Search Engine',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      path: '/profile',
      label: 'Profile',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
  ];

  // Add admin panel link for admin users
  if (user?.role === 'ADMIN') {
    menuItems.push({
      path: '/admin',
      label: 'Admin Panel',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M12 1.5v3M12 4.5A2.5 2.5 0 1 0 9.5 7c0-1.38.5-2.5 2.5-2.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M4 20v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    });
  }

  return (
    <aside className={`buyer-sidebar ${isExpanded ? 'expanded' : 'collapsed'}`}>
      {/* <div className="sidebar-header">
        <button
          className="sidebar-toggle"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span className="toggle-icon">+</span>
          {isExpanded && <span className="toggle-text">Getting Started</span>}
        </button>
      </div> */}

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const badgeCount = item.getBadgeCount ? item.getBadgeCount() : 0;
          const hasBadge = badgeCount > 0;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''} ${hasBadge ? 'has-badge' : ''}`
              }
              title={!isExpanded ? `${item.label}${hasBadge ? ` (${badgeCount} new)` : ''}` : ''}
              onClick={() => item.badgeKey && markAsViewed(item.badgeKey)}
            >
              <span className="nav-icon">
                {item.icon}
                {hasBadge && !isExpanded && (
                  <span className="nav-badge-dot" />
                )}
              </span>
              {isExpanded && (
                <>
                  <span className="nav-label">{item.label}</span>
                  {hasBadge && (
                    <span className="nav-badge">{badgeCount > 99 ? '99+' : badgeCount}</span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-section">
          <div className="section-title">APPS</div>
          <button className="app-item">
            <span className="nav-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            {isExpanded && <span className="nav-label">Bank Details</span>}
          </button>
        </div>

        {/* <button className="configure-btn">
          {isExpanded ? 'Configure Features' : '⚙'}
        </button> */}

        <button
          className="collapse-btn"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d={isExpanded ? "M12 4L6 10 12 16" : "M4 4L10 10 4 16"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
