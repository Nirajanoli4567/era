import React, { useState, useEffect } from "react";
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  useMediaQuery,
  useTheme,
  Badge,
  Chip,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  Button,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { Routes, Route, useNavigate, Link, useLocation } from "react-router-dom";
import AdminProducts from "../components/AdminProducts";
import AdminOrders from "../components/AdminOrders";
import AdminUsers from "../components/AdminUsers";
import AdminDashboardHome from "../components/AdminDashboardHome";
import AdminProfileDialog from "../components/AdminProfileDialog";
import AdminBargains from '../components/AdminBargains';
import AdminRevenue from "../components/AdminRevenue";
import AdminReports from "../components/AdminReports";
import "./AdminDashboard.css"; // Import the CSS file

const AdminDashboard = () => {
  const drawerWidth = 240;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [pendingBargains, setPendingBargains] = useState(0);
  const [userData, setUserData] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const location = useLocation();

  useEffect(() => {
    // Check if user is admin
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user || user.role !== "admin") {
      navigate("/login");
    } else {
      console.log("Admin user data loaded:", {
        name: user.name,
        profilePic: user.profilePic
      });
      setUserData(user);
    }
    
    // Fetch pending bargains count
    const fetchPendingBargainsCount = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5001"}/api/bargains`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const bargains = await response.json();
          const pendingCount = bargains.filter(bargain => bargain.status === "pending").length;
          setPendingBargains(pendingCount);
        }
      } catch (error) {
        console.error("Error fetching bargains:", error);
      }
    };
    
    fetchPendingBargainsCount();
    
    // Set up interval to refresh count
    const interval = setInterval(fetchPendingBargainsCount, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [navigate]);

  useEffect(() => {
    // Function to fetch notifications
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5001"}/api/admin/notifications`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setNotifications(data);
          // Count unread notifications
          const unreadCount = data.filter(notification => !notification.read).length;
          setNotificationCount(unreadCount);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };
    
    fetchNotifications();
    
    // Set up interval to check for new notifications
    const interval = setInterval(fetchNotifications, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileOpen = () => {
    setIsProfileOpen(true);
  };

  const handleProfileClose = () => {
    setIsProfileOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // Avatar menu handlers
  const handleAvatarClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleAvatarClose = () => {
    setAnchorEl(null);
  };

  // Notification menu handlers
  const handleNotificationClick = (event) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };

  const handleMarkAllRead = async () => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5001"}/api/admin/notifications/mark-all-read`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Update local state
      setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
      setNotificationCount(0);
      handleNotificationClose();
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  const menuItems = [
    { text: "Dashboard", path: "/admin", icon: "📊" },
    { text: "Revenue", path: "/admin/revenue", icon: "💰" },
    { text: "Reports", path: "/admin/reports", icon: "📋" },
    { text: "Products", path: "/admin/products", icon: "🛍️" },
    { text: "Orders", path: "/admin/orders", icon: "📦" },
    { text: "Users", path: "/admin/customers", icon: "👥" },
    { text: "Bargain Requests", path: "/admin/bargains", icon: "💲" },
  ];

  const drawer = (
    <>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Admin Panel
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const isBargainItem = item.path === '/admin/bargains';
          
          return (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                component={Link}
                to={item.path}
                onClick={() => isMobile && setMobileOpen(false)}
                sx={{
                  bgcolor: isActive ? 'rgba(0, 0, 0, 0.08)' : 'transparent',
                  '&:hover': {
                    bgcolor: isActive ? 'rgba(0, 0, 0, 0.12)' : undefined,
                  }
                }}
              >
                <ListItemIcon>
                  {isBargainItem && pendingBargains > 0 ? (
                    <Badge color="warning" badgeContent={pendingBargains}>
                      {item.icon}
                    </Badge>
                  ) : (
                    item.icon
                  )}
                </ListItemIcon>
                <ListItemText 
                  primary={
                    isBargainItem ? (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {item.text}
                        {pendingBargains > 0 && (
                          <Chip 
                            size="small" 
                            color="warning" 
                            label={`${pendingBargains} pending`} 
                            sx={{ ml: 1, height: 20 }} 
                          />
                        )}
                      </Box>
                    ) : (
                      item.text
                    )
                  } 
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={handleProfileOpen}>
            <ListItemIcon>👤</ListItemIcon>
            <ListItemText primary="Profile" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon>🚪</ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: "none" } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div">
              Admin Dashboard
            </Typography>
          </Box>
          
          {/* Notification and Avatar area */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {/* Notifications */}
            <Tooltip title="Notifications">
              <IconButton 
                color="inherit" 
                onClick={handleNotificationClick}
                aria-label="notifications"
              >
                <Badge badgeContent={notificationCount} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            
            {/* User Avatar */}
            <Tooltip title="Account">
              <IconButton
                onClick={handleAvatarClick}
                size="small"
                sx={{ ml: 2 }}
                aria-controls={Boolean(anchorEl) ? 'account-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={Boolean(anchorEl) ? 'true' : undefined}
              >
                {userData?.profilePic ? (
                  <Avatar 
                    src={(() => {
                      const avatarSrc = userData.profilePic.startsWith('http') 
                        ? userData.profilePic 
                        : `${import.meta.env.VITE_API_URL || "http://localhost:5001"}/uploads/${userData.profilePic}`;
                      console.log("Avatar src URL:", avatarSrc);
                      return avatarSrc;
                    })()}
                    alt={userData?.name || "Admin"}
                    sx={{ width: 32, height: 32 }}
                    onError={(e) => {
                      console.error("Failed to load avatar image:", e.target.src);
                      e.target.src = ""; // Clear the src to show the fallback
                    }}
                  />
                ) : (
                  <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                    {userData?.name?.charAt(0) || "A"}
                  </Avatar>
                )}
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>
      
      {/* Avatar Menu */}
      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={Boolean(anchorEl)}
        onClose={handleAvatarClose}
        onClick={handleAvatarClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleProfileOpen}>
          <Avatar /> Profile
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>🚪</ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
      
      {/* Notifications Menu */}
      <Menu
        anchorEl={notificationAnchorEl}
        id="notification-menu"
        open={Boolean(notificationAnchorEl)}
        onClose={handleNotificationClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            width: 320,
            maxHeight: 400,
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Notifications</Typography>
          {notificationCount > 0 && (
            <Button size="small" onClick={handleMarkAllRead}>
              Mark all as read
            </Button>
          )}
        </Box>
        
        {notifications.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No notifications
            </Typography>
          </Box>
        ) : (
          notifications.map((notification) => (
            <MenuItem 
              key={notification._id} 
              onClick={handleNotificationClose}
              sx={{ 
                whiteSpace: 'normal',
                backgroundColor: notification.read ? 'transparent' : 'rgba(0, 0, 0, 0.04)',
              }}
            >
              <Box sx={{ width: '100%' }}>
                <Typography variant="body1">{notification.message}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(notification.createdAt).toLocaleString()}
                </Typography>
              </Box>
            </MenuItem>
          ))
        )}
      </Menu>

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        <Routes>
          <Route index element={<AdminDashboardHome />} />
          <Route path="revenue" element={<AdminRevenue />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="customers" element={<AdminUsers />} />
          <Route path="bargains" element={<AdminBargains />} />
          <Route path="*" element={<AdminDashboardHome />} />
        </Routes>
      </Box>
      <AdminProfileDialog
        open={isProfileOpen}
        onClose={handleProfileClose}
        user={userData}
      />
    </Box>
  );
};

export default AdminDashboard;
