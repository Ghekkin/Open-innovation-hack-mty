"use client";
import React, { useState } from "react";
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
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
import { useRouter } from "next/navigation";
import Image from "next/image";

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
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

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

  const currentDrawerWidth = desktopCollapsed ? collapsedDrawerWidth : drawerWidth;

  const drawer = (
    <Box sx={{ mt: isMobile ? 2 : 0 }}>
      {/* Logo solo para desktop - clickable con toggle */}
      {!isMobile && (
        <Tooltip title={desktopCollapsed ? "Haz clic para expandir" : "Haz clic para colapsar"} placement="right">
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            p: 2,
            bgcolor: "primary.main",
            transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
            cursor: "pointer",
            minHeight: 90,
            borderBottom: "1px solid rgba(255,255,255,0.12)",
          }}
          onClick={handleLogoToggle}
        >
            <Image
              src={desktopCollapsed ? "/banorte-icon.png" : "/logo-banorte.png"}
              alt="Banorte Logo"
              width={desktopCollapsed ? 32 : 160}
              height={desktopCollapsed ? 32 : 80}
              style={{
                filter: "brightness(0) invert(1)", // Convertir logo a blanco
                transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
                maxWidth: "100%",
                height: "auto",
              }}
              priority
            />
          </Box>
        </Tooltip>
      )}
      <List sx={{
        pt: 0.25,
        pb: 2,
        "& .MuiListItem-root": {
          mb: desktopCollapsed ? 1 : 0
        }
      }}>
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
          <Tooltip title={desktopCollapsed ? "Logout" : ""} placement="right">
            <ListItemButton
              onClick={() => router.push("/")}
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
                  primary="Logout"
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
          <Toolbar sx={{ height: "64px" }}>
            <IconButton
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: "none" }, color: "white" }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div" sx={{ color: "white" }} fontWeight="bold">
              Asistente Virtual Banorte
            </Typography>
          </Toolbar>
        </AppBar>

        <Box
          component="nav"
          sx={{ width: { sm: currentDrawerWidth }, flexShrink: { sm: 0 } }}
        >
          <Drawer
            variant={isMobile ? "temporary" : "permanent"}
            open={isMobile ? mobileOpen : true}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true, // Better open performance on mobile.
            }}
            className="banorte"
            sx={{
              "& .MuiDrawer-paper": {
                boxSizing: "border-box",
                width: currentDrawerWidth,
                bgcolor: "#eb0029",
                backgroundImage: "url(/navigation.png)",
                backgroundRepeat: "repeat-x",
                backgroundSize: "43.5px 64px",
                borderRight: "1px solid rgba(0, 0, 0, 0.12)",
                transition: "width 0.3s ease-in-out",
                overflowX: "hidden",
              },
            }}
          >
            {drawer}
          </Drawer>
        </Box>

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
            transition: "width 0.3s ease-in-out, padding 0.3s ease-in-out",
            minHeight: "100vh",
          }}
        >
          {children}
        </Box>
      </Box>
    </ThemeProvider>
  );
}