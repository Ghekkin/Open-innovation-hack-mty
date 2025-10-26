"use client";
import React, { useState, useEffect } from "react";
import {
  AppBar,
  Avatar,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Button,
  Chip,
  CssBaseline,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
  ThemeProvider,
  createTheme,
  Tooltip,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import HomeIcon from "@mui/icons-material/Home";
import ChatIcon from "@mui/icons-material/Chat";
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import LogoutIcon from "@mui/icons-material/Logout";
import BusinessIcon from "@mui/icons-material/Business";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { getCurrentUser, logout, formatUsername } from "@/lib/auth";

const drawerWidth = 240;
const collapsedDrawerWidth = 64;

const customTheme = createTheme({
  palette: {
    primary: {
      main: "#EC0029", // Spanish Red
      light: "#FF3355",
      dark: "#C00020",
    },
    background: {
      default: "#F5F5F5", // Cultured
      paper: "#FFFFFF",
    },
    grey: {
      100: "#F5F5F5",
      200: "#C7C9C9", // Chinese Silver
      500: "#6A6867", // Dim Gray
    }
  },
});

const menuItems = [
  { text: "Inicio", icon: <HomeIcon />, path: "/dashboard" },
  { text: "Asistente", icon: <ChatIcon />, path: "/dashboard/asistente" },
  { text: "Plan Financiero", icon: <AccountBalanceWalletIcon />, path: "/dashboard/plan-financiero" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [username, setUsername] = useState<string>("");
  const [userType, setUserType] = useState<'empresa' | 'personal' | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  
  const currentDrawerWidth = isMobile 
    ? drawerWidth 
    : (desktopCollapsed ? collapsedDrawerWidth : drawerWidth);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setUsername(user.username);
      setUserType(user.type);
    }
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogoToggle = () => {
    setDesktopCollapsed(!desktopCollapsed);
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const handleLogoutClick = () => {
    setLogoutDialogOpen(true);
  };

  const handleLogoutConfirm = () => {
    setLogoutDialogOpen(false);
    handleLogout();
  };

  const handleLogoutCancel = () => {
    setLogoutDialogOpen(false);
  };

  const getCurrentValue = () => {
    const currentPath = pathname || "/dashboard";
    if (currentPath === "/dashboard") return 0;
    if (currentPath === "/dashboard/asistente") return 1;
    if (currentPath === "/dashboard/plan-financiero") return 2;
    return 0;
  };

  const drawer = (
    <Box sx={{ mt: isMobile ? 2 : 0, height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Logo solo para desktop */}
      {!isMobile && (
        <Tooltip title={desktopCollapsed ? "Haz clic para expandir" : "Haz clic para colapsar"} placement="right">
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            p: 2,
            bgcolor: "#C00020",
            transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
            cursor: "pointer",
            minHeight: 90,
            maxHeight: 90,
            borderBottom: "1px solid rgba(255,255,255,0.12)",
            overflow: "hidden",
          }}
          onClick={handleLogoToggle}
        >
            <Image
              src={desktopCollapsed ? "/banorte-icon.png" : "/logo-banorte.png"}
              alt="Banorte Logo"
              width={desktopCollapsed ? 40 : 160}
              height={desktopCollapsed ? 40 : 80}
              style={{
                filter: "brightness(0) invert(1)",
                transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
                maxWidth: desktopCollapsed ? "40px" : "160px",
                maxHeight: desktopCollapsed ? "40px" : "80px",
                width: "auto",
                height: "auto",
                objectFit: "contain",
              }}
              priority
            />
          </Box>
        </Tooltip>
      )}

      {/* Información del usuario */}
      {username && !isMobile && (
        <Tooltip title={desktopCollapsed ? `${username} (${userType === 'empresa' ? 'Empresa' : 'Personal'})` : ""} placement="right">
          <Box sx={{ 
            p: desktopCollapsed ? 1 : 2, 
            bgcolor: "rgba(255,255,255,0.1)", 
            mx: desktopCollapsed ? 1 : 2, 
            my: 2, 
            borderRadius: 2,
            border: "1px solid rgba(255,255,255,0.2)",
            display: "flex",
            flexDirection: desktopCollapsed ? "column" : "row",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
          }}>
            <Avatar sx={{ 
              bgcolor: "white", 
              color: "primary.main", 
              width: desktopCollapsed ? 32 : 36, 
              height: desktopCollapsed ? 32 : 36,
              mr: desktopCollapsed ? 0 : 1.5,
              mb: desktopCollapsed ? 0 : 0,
              transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
            }}>
              {userType === 'empresa' ? <BusinessIcon fontSize={desktopCollapsed ? "small" : "medium"} /> : <AccountCircleIcon fontSize={desktopCollapsed ? "small" : "medium"} />}
            </Avatar>
            {!desktopCollapsed && (
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ color: "white", fontWeight: 600, fontSize: "0.875rem" }}>
                  {username}
                </Typography>
                <Chip
                  label={userType === 'empresa' ? 'Empresa' : 'Personal'}
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: "0.65rem",
                    bgcolor: "rgba(255,255,255,0.2)",
                    color: "white",
                    mt: 0.5
                  }}
                />
              </Box>
            )}
          </Box>
        </Tooltip>
      )}

      <List sx={{ flex: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <Tooltip title={desktopCollapsed ? item.text : ""} placement="right">
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                sx={{
                  minHeight: desktopCollapsed ? 64 : 60,
                  px: desktopCollapsed ? 2 : 2.5,
                  py: desktopCollapsed ? 2.2 : 1.6,
                  justifyContent: desktopCollapsed ? "center" : "flex-start",
                  borderRadius: desktopCollapsed ? 1 : 0,
                  mx: desktopCollapsed ? 1 : 0,
                  mb: desktopCollapsed ? 1 : 0,
                  "&:hover": {
                    bgcolor: "rgba(255,255,255,0.1)",
                    transform: desktopCollapsed ? "scale(1.05)" : "none",
                    transition: "all 0.2s ease-in-out",
                  },
                  "&.Mui-selected": {
                    bgcolor: "rgba(255,255,255,0.15)",
                    "&:hover": {
                      bgcolor: "rgba(255,255,255,0.2)",
                    }
                  }
                }}
              >
                <ListItemIcon sx={{
                  color: "white",
                  minWidth: desktopCollapsed ? "auto" : 48,
                  mr: desktopCollapsed ? 0 : 2.5,
                  justifyContent: "center",
                  alignItems: "center"
                }}>
                  {React.cloneElement(item.icon, {
                    sx: {
                      fontSize: desktopCollapsed ? "1.75rem" : "1.5rem",
                      transition: "font-size 0.35s cubic-bezier(0.4, 0, 0.2, 1)"
                    }
                  })}
                </ListItemIcon>
                {!desktopCollapsed && (
                  <ListItemText
                    primary={item.text}
                    sx={{
                      color: "white",
                      "& .MuiTypography-root": {
                        fontSize: "1.1rem",
                        fontWeight: 600,
                        letterSpacing: "0.03em",
                        lineHeight: 1.3
                      }
                    }}
                  />
                )}
              </ListItemButton>
            </Tooltip>
          </ListItem>
        ))}
        <ListItem disablePadding sx={{ mt: "auto" }}>
          <Tooltip title={desktopCollapsed ? "Cerrar Sesión" : ""} placement="right">
            <ListItemButton
              onClick={handleLogoutClick}
              sx={{
                minHeight: desktopCollapsed ? 64 : 60,
                px: desktopCollapsed ? 2 : 2.5,
                py: desktopCollapsed ? 2.2 : 1.6,
                justifyContent: desktopCollapsed ? "center" : "flex-start",
                borderRadius: desktopCollapsed ? 1 : 0,
                mx: desktopCollapsed ? 1 : 0,
                mb: desktopCollapsed ? 1 : 0,
                "&:hover": {
                  bgcolor: "rgba(255,255,255,0.1)",
                  transform: desktopCollapsed ? "scale(1.05)" : "none",
                  transition: "all 0.2s ease-in-out",
                },
                borderTop: "1px solid rgba(255,255,255,0.12)",
                mt: 0.5
              }}
            >
              <ListItemIcon sx={{
                color: "white",
                minWidth: desktopCollapsed ? "auto" : 48,
                mr: desktopCollapsed ? 0 : 2.5,
                justifyContent: "center",
                alignItems: "center"
              }}>
                {React.cloneElement(<LogoutIcon />, {
                  sx: {
                    fontSize: desktopCollapsed ? "1.75rem" : "1.5rem",
                    transition: "font-size 0.3s ease-in-out"
                  }
                })}
              </ListItemIcon>
              {!desktopCollapsed && (
                <ListItemText
                  primary="Cerrar Sesión"
                  sx={{
                    color: "white",
                    "& .MuiTypography-root": {
                      fontSize: "1.1rem",
                      fontWeight: 600,
                      letterSpacing: "0.03em",
                      lineHeight: 1.3
                    }
                  }}
                />
              )}
            </ListItemButton>
          </Tooltip>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <ThemeProvider theme={customTheme}>
      <Box sx={{ display: "flex" }}>
        <CssBaseline />
        <AppBar
          position="fixed"
          className="banorte"
          sx={{
            width: {
              xs: "100%",
              sm: `calc(100% - ${currentDrawerWidth}px)`
            },
            ml: {
              xs: 0,
              sm: `${currentDrawerWidth}px`
            },
            bgcolor: "#eb0029",
            backgroundImage: "url(/navigation.png)",
            backgroundRepeat: "repeat-x",
            backgroundSize: "43.5px 64px",
            boxShadow: 1,
            height: "64px",
            transition: "width 0.3s ease-in-out, margin-left 0.3s ease-in-out",
          }}
        >
          <Toolbar sx={{ height: "64px", py: 2 }}>
            <Typography 
              variant="h6" 
              noWrap 
              component="div" 
              sx={{ 
                color: "white",
                fontSize: "1.5rem",
                letterSpacing: "0.05em",
                fontWeight: "bold",
                textTransform: "uppercase"
              }}
            >
              Asistente Virtual Banorte
            </Typography>
          </Toolbar>
        </AppBar>

        {/* Drawer solo para desktop */}
        {!isMobile && (
          <Box
            component="nav"
            sx={{ width: { sm: currentDrawerWidth }, flexShrink: { sm: 0 } }}
          >
            <Drawer
              variant="permanent"
              open={true}
              className="banorte"
              sx={{
                "& .MuiDrawer-paper": {
                  boxSizing: "border-box",
                  width: currentDrawerWidth,
                  bgcolor: "#C00020",
                  backgroundImage: "none",
                  borderRight: "1px solid rgba(0, 0, 0, 0.12)",
                  transition: "width 0.3s ease-in-out",
                  overflowX: "hidden",
                },
              }}
            >
              {drawer}
            </Drawer>
          </Box>
        )}

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 3 },
            width: {
              xs: "100%",
              sm: `calc(100% - ${currentDrawerWidth}px)`
            },
            mt: { xs: 8, sm: 8 },
            mb: { xs: 10, sm: 0 },
            transition: "width 0.3s ease-in-out, padding 0.3s ease-in-out",
            minHeight: "100vh",
          }}
        >
          {children}
        </Box>

        {/* Bottom Navigation para móvil - Flotante y moderno */}
        {isMobile && (
          <Paper
            sx={{
              position: "fixed",
              bottom: 16,
              left: "50%",
              transform: "translateX(-50%)",
              width: "calc(100% - 32px)",
              maxWidth: 400,
              borderRadius: 4,
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
              zIndex: 1000,
              overflow: "hidden",
              backdropFilter: "blur(10px)",
              backgroundColor: "rgba(255, 255, 255, 0.95)",
            }}
            elevation={8}
          >
            <BottomNavigation
              value={getCurrentValue()}
              onChange={(event, newValue) => {
                if (newValue === 0) handleNavigation("/dashboard");
                else if (newValue === 1) handleNavigation("/dashboard/asistente");
                else if (newValue === 2) handleNavigation("/dashboard/plan-financiero");
                else if (newValue === 3) handleLogoutClick();
              }}
              showLabels
              sx={{
                height: 70,
                backgroundColor: "transparent",
                "& .MuiBottomNavigationAction-root": {
                  minWidth: "auto",
                  padding: "8px 12px",
                  color: "grey.600",
                  transition: "all 0.3s ease",
                  "&.Mui-selected": {
                    color: "primary.main",
                    "& .MuiSvgIcon-root": {
                      transform: "scale(1.15)",
                    },
                  },
                  "& .MuiSvgIcon-root": {
                    fontSize: "1.5rem",
                    transition: "transform 0.3s ease",
                  },
                  "& .MuiBottomNavigationAction-label": {
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    marginTop: "4px",
                    "&.Mui-selected": {
                      fontSize: "0.7rem",
                    },
                  },
                },
              }}
            >
              <BottomNavigationAction
                label="Inicio"
                icon={<HomeIcon />}
              />
              <BottomNavigationAction
                label="Asistente"
                icon={<ChatIcon />}
              />
              <BottomNavigationAction
                label="Plan"
                icon={<AccountBalanceWalletIcon />}
              />
              <BottomNavigationAction
                label="Salir"
                icon={<LogoutIcon />}
              />
            </BottomNavigation>
          </Paper>
        )}

        {/* Diálogo de confirmación de cierre de sesión */}
        <Dialog
          open={logoutDialogOpen}
          onClose={handleLogoutCancel}
          aria-labelledby="logout-dialog-title"
          aria-describedby="logout-dialog-description"
          PaperProps={{
            sx: {
              borderRadius: 3,
              minWidth: { xs: "280px", sm: "400px" },
            }
          }}
        >
          <DialogTitle id="logout-dialog-title" sx={{ pb: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <LogoutIcon sx={{ color: "primary.main" }} />
              <Typography variant="h6" component="span" fontWeight={600}>
                Cerrar Sesión
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="logout-dialog-description" sx={{ color: "text.primary" }}>
              ¿Estás seguro de que deseas cerrar sesión? Tendrás que volver a iniciar sesión para acceder a tu cuenta.
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
            <Button 
              onClick={handleLogoutCancel} 
              variant="outlined"
              sx={{ 
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                px: 3
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleLogoutConfirm} 
              variant="contained"
              color="primary"
              autoFocus
              sx={{ 
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                px: 3
              }}
            >
              Cerrar Sesión
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
}