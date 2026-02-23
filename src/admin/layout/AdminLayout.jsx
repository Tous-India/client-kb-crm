import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Stack,
  useTheme,
  useMediaQuery,
  Menu,
  MenuItem,
  Button,
  Tooltip,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Dashboard,
  ShoppingCart,
  LocalShipping,
  Receipt,
  Assignment,
  Inventory,
  People,
  Logout as LogoutIcon,
  Storefront as StorefrontIcon,
  RequestQuote,
  CheckCircle,
  NoteAdd,
  Business,
  Category as CategoryIcon,
  Label as LabelIcon,
  Notifications as NotificationsIcon,
  Close as CloseIcon,
  Description,
  Settings as SettingsIcon,
  HowToReg,
  Archive as ArchiveIcon,
} from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import useNotificationStore from "../../stores/useNotificationStore";
import { useNotificationCounts } from "../../context/NotificationCountsContext";
import { useDesktopNotifications } from "../../hooks/useDesktopNotifications";
import NotificationSettings from "../../components/NotificationSettings";
import Logo from "../../components/Logo";
import Badge from "@mui/material/Badge";

const drawerWidth = 260;
const drawerWidthCollapsed = 70;

function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();

  // Notification store
  const {
    notifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
  } = useNotificationStore();
  const unreadCount = getUnreadCount();

  // Notification counts for sidebar badges
  const { counts: notifCounts, markAsViewed } = useNotificationCounts();

  // Desktop notifications hook
  const { requestPermission } = useDesktopNotifications();
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);

  // Request notification permission on first load
  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleProfileMenuClose();
    logout();
    navigate("/login");
  };

  const handleNotificationMenuOpen = (event) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationMenuClose = () => {
    setNotificationAnchorEl(null);
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    if (notification.type === "QUOTE_REQUEST") {
      navigate("/admin/purchase-orders");
    }
    handleNotificationMenuClose();
  };

  const menuItems = [
    { text: "Dashboard", icon: <Dashboard />, path: "/admin" },
    { text: "Products", icon: <Inventory />, path: "/admin/products" },
    { text: "Categories", icon: <CategoryIcon />, path: "/admin/categories" },
    { text: "Brands", icon: <LabelIcon />, path: "/admin/brands" },
    {
      text: "Purchase Orders",
      icon: <ShoppingCart />,
      path: "/admin/purchase-orders",
      badgeCount: notifCounts.pendingOrders,
      badgeKey: "purchase-orders",
    },
    {
      text: "Quotations",
      icon: <Description />,
      path: "/admin/quotations",
    },
    {
      text: "Performa Invoices",
      icon: <RequestQuote />,
      path: "/admin/performa-invoices",
    },
    {
      text: "Payment Records",
      icon: <Receipt />,
      path: "/admin/payment-records",
      badgeCount: notifCounts.pendingPayments,
      badgeKey: "payment-records",
    },
    { text: "Invoices", icon: <Receipt />, path: "/admin/invoices" },
    {
      text: "Manual Invoice",
      icon: <NoteAdd />,
      path: "/admin/manual-invoice",
    },
    { text: "Open Orders", icon: <LocalShipping />, path: "/admin/orders" },
    {
      text: "Dispatched Orders",
      icon: <CheckCircle />,
      path: "/admin/dispatched-orders",
    },
    // { text: 'Payments', icon: <Payment />, path: '/admin/payments' },
    { text: "Users", icon: <People />, path: "/admin/users" },
    {
      text: "Pending Approvals",
      icon: <HowToReg />,
      path: "/admin/pending-approvals",
      badgeCount: notifCounts.pendingApprovals,
      badgeKey: "pending-approvals",
    },
    { divider: true, text: "Purchase Management" },
    { text: "Suppliers", icon: <Business />, path: "/admin/suppliers" },
    { text: "PI Allocation", icon: <Assignment />, path: "/admin/pi-allocation" },
    { text: "Purchase Dashboard", icon: <Dashboard />, path: "/admin/purchase-dashboard" },
    { text: "Statements", icon: <Assignment />, path: "/admin/statements" },
    { divider: true, text: "Legacy Data" },
    { text: "Archives", icon: <ArchiveIcon />, path: "/admin/archives" },
  ];

  // Add buyer portal access for admins
  if (user?.role === "ADMIN") {
    menuItems.push({
      text: "Buyer Portal",
      icon: <StorefrontIcon />,
      path: "/",
    });
  }

  const handleNavigation = (path, badgeKey) => {
    navigate(path);
    // Mark as viewed to reset badge count
    if (badgeKey) {
      markAsViewed(badgeKey);
    }
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const currentDrawerWidth = sidebarCollapsed ? drawerWidthCollapsed : drawerWidth;

  const drawer = (isCollapsed = false) => (
    <Box>
      <Toolbar>
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          justifyContent={isCollapsed ? "center" : "flex-start"}
          sx={{ width: '100%' }}
        >
          <Logo width={isCollapsed ? 36 : 48} height={isCollapsed ? 36 : 48} variant="sidebar" />
          {!isCollapsed && (
            <Typography variant="h6" noWrap component="div" fontWeight="bold">
              KB CRM
            </Typography>
          )}
        </Stack>
      </Toolbar>
      <Divider />
      <List sx={{ px: 1, py: 2 }}>
        {menuItems.map((item, index) => {
          // Handle divider items
          if (item.divider) {
            return (
              <Box key={`divider-${index}`} sx={{ my: 1.5 }}>
                <Divider sx={{ mb: 1 }} />
                {!isCollapsed && (
                  <Typography
                    variant="caption"
                    sx={{
                      px: 2,
                      color: "text.secondary",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      fontSize: "0.7rem",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {item.text}
                  </Typography>
                )}
              </Box>
            );
          }

          const isActive = location.pathname === item.path;
          const hasBadge = item.badgeCount > 0;

          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <Tooltip
                title={isCollapsed ? `${item.text}${hasBadge ? ` (${item.badgeCount} new)` : ""}` : ""}
                placement="right"
              >
                <ListItemButton
                  onClick={() => handleNavigation(item.path, item.badgeKey)}
                  selected={isActive}
                  sx={{
                    borderRadius: 1,
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    "&.Mui-selected": {
                      bgcolor: "primary.main",
                      color: "white",
                      "&:hover": {
                        bgcolor: "primary.dark",
                      },
                      "& .MuiListItemIcon-root": {
                        color: "white",
                      },
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: isCollapsed ? 'auto' : 40 }}>
                    {hasBadge ? (
                      <Badge
                        badgeContent={item.badgeCount}
                        color="error"
                        max={99}
                        sx={{
                          "& .MuiBadge-badge": {
                            fontSize: "0.65rem",
                            height: 16,
                            minWidth: 16,
                            padding: "0 4px",
                          },
                        }}
                      >
                        {item.icon}
                      </Badge>
                    ) : (
                      item.icon
                    )}
                  </ListItemIcon>
                  {!isCollapsed && (
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                      <ListItemText
                        primary={item.text}
                        slotProps={{
                          primary: {
                            fontSize: "0.9rem",
                            fontWeight: isActive ? 600 : 400,
                          },
                        }}
                      />
                      {hasBadge && (
                        <Badge
                          badgeContent={item.badgeCount}
                          color="error"
                          max={99}
                          sx={{
                            mr: 1,
                            "& .MuiBadge-badge": {
                              position: "relative",
                              transform: "none",
                              fontSize: "0.7rem",
                              height: 18,
                              minWidth: 18,
                              borderRadius: "9px",
                            },
                          }}
                        />
                      )}
                    </Box>
                  )}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex" }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${currentDrawerWidth}px)` },
          ml: { md: `${currentDrawerWidth}px` },
          bgcolor: "white",
          color: "text.primary",
          boxShadow: 1,
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <Toolbar>
          {/* Mobile Menu Toggle */}
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { xs: 'block', md: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          {/* Desktop Sidebar Toggle */}
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleSidebarToggle}
            sx={{ mr: 2, display: { xs: 'none', md: "block" } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" noWrap component="div" fontWeight="bold">
              Admin Panel
            </Typography>
          </Box>
          <Stack direction="row" spacing={2} alignItems="center">
            {/* Create Invoice Button */}
            <Button
              variant="contained"
              startIcon={<NoteAdd />}
              onClick={() => navigate("/admin/manual-invoice")}
              size="small"
              sx={{
                display: { xs: "none", sm: "flex" },
                fontSize: "13px",
                textTransform: "none",
              }}
            >
              Create Invoice
            </Button>
            {/* Mobile Create Invoice Button (icon only) */}
            <Tooltip title="Create Invoice">
              <IconButton
                color="primary"
                onClick={() => navigate("/admin/manual-invoice")}
                sx={{
                  display: { xs: "flex", sm: "none" },
                  bgcolor: "primary.main",
                  color: "white",
                  "&:hover": {
                    bgcolor: "primary.dark",
                  },
                }}
                size="small"
              >
                <NoteAdd fontSize="small" />
              </IconButton>
            </Tooltip>
            {/* Notification Settings */}
            <Tooltip title="Notification Settings">
              <IconButton
                color="inherit"
                onClick={() => setShowNotificationSettings(true)}
                size="small"
              >
                <SettingsIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {/* Notification Bell */}
            <Tooltip title={`${unreadCount} new notifications`}>
              <IconButton
                color="inherit"
                onClick={handleNotificationMenuOpen}
                sx={{
                  position: "relative",
                }}
              >
                <Badge badgeContent={unreadCount} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            <IconButton onClick={handleProfileMenuOpen} sx={{ p: 0 }}>
              <Avatar sx={{ bgcolor: "primary.main", width: 36, height: 36 }}>
                {user?.name?.charAt(0).toUpperCase() || "A"}
              </Avatar>
            </IconButton>
            <Box
              sx={{
                display: { xs: "none", sm: "block" },
              }}
            >
              <Typography variant="body2" fontWeight="medium">
                {user?.name || "Admin User"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.role || "Administrator"}
              </Typography>
            </Box>
            <IconButton onClick={handleLogout} color="inherit" title="Logout">
              <LogoutIcon />
            </IconButton>
          </Stack>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
          >
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Logout</ListItemText>
            </MenuItem>
          </Menu>
          {/* Notification Menu */}
          <Menu
            anchorEl={notificationAnchorEl}
            open={Boolean(notificationAnchorEl)}
            onClose={handleNotificationMenuClose}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            PaperProps={{
              sx: {
                width: 360,
                maxHeight: 400,
              },
            }}
          >
            <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="subtitle1" fontWeight="bold">
                Notifications ({unreadCount} new)
              </Typography>
              {unreadCount > 0 && (
                <Button size="small" onClick={markAllAsRead}>
                  Mark all read
                </Button>
              )}
            </Box>
            {notifications.length === 0 ? (
              <Box sx={{ p: 3, textAlign: "center" }}>
                <NotificationsIcon sx={{ fontSize: 40, color: "grey.400", mb: 1 }} />
                <Typography color="text.secondary">No notifications</Typography>
              </Box>
            ) : (
              notifications.slice(0, 10).map((notification) => (
                <MenuItem
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  sx={{
                    py: 1.5,
                    px: 2,
                    bgcolor: notification.read ? "transparent" : "primary.lighter",
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    "&:hover": {
                      bgcolor: notification.read ? "action.hover" : "primary.light",
                    },
                  }}
                >
                  <Box sx={{ width: "100%" }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <Typography variant="body2" fontWeight={notification.read ? "normal" : "bold"}>
                        {notification.title}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(notification.id);
                        }}
                        sx={{ ml: 1, p: 0.5 }}
                      >
                        <CloseIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                      {notification.message}
                    </Typography>
                    <Typography variant="caption" color="primary.main" sx={{ fontSize: "10px" }}>
                      {new Date(notification.timestamp).toLocaleString()}
                    </Typography>
                  </Box>
                </MenuItem>
              ))
            )}
            {notifications.length > 0 && (
              <Box sx={{ p: 1, borderTop: "1px solid", borderColor: "divider", textAlign: "center" }}>
                <Button size="small" onClick={() => { navigate("/admin/purchase-orders"); handleNotificationMenuClose(); }}>
                  View Web Orders
                </Button>
              </Box>
            )}
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: currentDrawerWidth }, flexShrink: { md: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better mobile performance
          }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
        >
          {drawer(false)}
        </Drawer>
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: currentDrawerWidth,
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
              overflowX: 'hidden',
            },
          }}
          open
        >
          {drawer(sidebarCollapsed)}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${currentDrawerWidth}px)` },
          minHeight: "100vh",
          bgcolor: "grey.50",
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <Toolbar /> {/* Spacer for fixed AppBar */}
        <Outlet />
      </Box>

      {/* Notification Settings Modal */}
      <NotificationSettings
        open={showNotificationSettings}
        onClose={() => setShowNotificationSettings(false)}
      />
    </Box>
  );
}

export default AdminLayout;
