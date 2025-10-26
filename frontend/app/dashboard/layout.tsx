"use client";
import { useState, useEffect } from "react";
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
  Chip,
  Avatar,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import HomeIcon from "@mui/icons-material/Home";
import ChatIcon from "@mui/icons-material/Chat";
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import LogoutIcon from "@mui/icons-material/Logout";
import BusinessIcon from "@mui/icons-material/Business";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getCurrentUser, logout, formatUsername } from "@/lib/auth";

const drawerWidth = 240;

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
  const [username, setUsername] = useState<string>("");
  const [userType, setUserType] = useState<'empresa' | 'personal' | null>(null);
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

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

  const drawer = (
    <Box sx={{ mt: isMobile ? 2 : 0, height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Logo solo para desktop */}
      {!isMobile && (
        <Box sx={{ display: "flex", justifyContent: "center", p: 3, bgcolor: "primary.main" }}>
          <Image
            src="/logo-banorte.png"
            alt="Banorte Logo"
            width={200}
            height={100}
            style={{ filter: "brightness(0) invert(1)" }} // Convertir logo a blanco
            priority
          />
        </Box>
      )}

      {/* Información del usuario */}
      {username && (
        <Box sx={{ 
          p: 2, 
          bgcolor: "rgba(255,255,255,0.1)", 
          mx: 2, 
          my: 2, 
          borderRadius: 2,
          border: "1px solid rgba(255,255,255,0.2)"
        }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
            <Avatar sx={{ 
              bgcolor: "white", 
              color: "primary.main", 
              width: 36, 
              height: 36,
              mr: 1.5
            }}>
              {userType === 'empresa' ? <BusinessIcon /> : <AccountCircleIcon />}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ color: "white", fontWeight: 600 }}>
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
          </Box>
        </Box>
      )}

      <List sx={{ flex: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton onClick={() => handleNavigation(item.path)}>
              <ListItemIcon sx={{ color: "white" }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} sx={{ color: "white" }} />
            </ListItemButton>
          </ListItem>
        ))}
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon sx={{ color: "white" }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Cerrar Sesión" sx={{ color: "white" }} />
          </ListItemButton>
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
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            ml: { sm: `${drawerWidth}px` },
            bgcolor: "#eb0029",
            backgroundImage: "url(/navigation.png)",
            backgroundRepeat: "repeat-x",
            backgroundSize: "43.5px 64px",
            boxShadow: 1,
            height: "64px",
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
          sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
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
                width: drawerWidth,
                bgcolor: "#eb0029",
                backgroundImage: "url(/navigation.png)",
                backgroundRepeat: "repeat-x",
                backgroundSize: "43.5px 64px",
                borderRight: "1px solid rgba(0, 0, 0, 0.12)",
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
            p: 3,
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            mt: 8,
          }}
        >
          {children}
        </Box>
      </Box>
    </ThemeProvider>
  );
}