import { useState } from "react";
import {
  AppBar,
  Avatar,
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  DarkModeOutlined,
  LightModeOutlined,
  Logout,
  Menu as MenuIcon,
  PlayCircleOutlined,
  Refresh,
  TourOutlined,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useThemeMode } from "../../context/ThemeModeContext";
import { useToast } from "../ui/Toast";
import { resetTourFlag } from "../tour/GuidedTour";
import { DRAWER_WIDTH } from "./Sidebar";

export default function Navbar({ title, onMenuClick, onStartTour }) {
  const navigate = useNavigate();
  const { usuario, logout, resetarDemo } = useAuth();
  const { mode, toggleMode } = useThemeMode();
  const toast = useToast();
  const [anchor, setAnchor] = useState(null);
  const [resetting, setResetting] = useState(false);
  const isDemo = Boolean(usuario?.demo) || usuario?.email === "demo@sussai.com.br";

  const handleLogout = () => {
    setAnchor(null);
    logout();
    navigate("/login", { replace: true });
  };

  const handleResetDemo = async () => {
    setResetting(true);
    try {
      await resetarDemo();
      resetTourFlag();
      toast.success("Dados de demonstração reiniciados.");
      onStartTour?.();
      navigate("/", { replace: true });
      window.setTimeout(() => window.location.reload(), 400);
    } catch (error) {
      toast.error(error.response?.data?.erro || "Não foi possível reiniciar a demonstração.");
    } finally {
      setResetting(false);
    }
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: { xs: "100%", md: `calc(100% - ${DRAWER_WIDTH}px)` },
        ml: { xs: 0, md: `${DRAWER_WIDTH}px` },
        color: "text.primary",
        bgcolor: (theme) => theme.palette.mode === "dark" ? "rgba(15,23,42,.82)" : "rgba(255,255,255,.82)",
        backdropFilter: "blur(18px)",
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      <Toolbar sx={{ minHeight: { xs: 64, md: 72 }, gap: 1 }}>
        <IconButton onClick={onMenuClick} sx={{ display: { md: "none" } }} aria-label="Abrir menu">
          <MenuIcon />
        </IconButton>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="h6" noWrap>{title}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: { xs: "none", sm: "block" } }} noWrap>
            {usuario?.empresaNome}
          </Typography>
        </Box>

        <Stack direction="row" spacing={0.75} alignItems="center">
          {isDemo && (
            <Chip
              data-tour="demo-mode"
              icon={resetting ? <CircularProgress size={14} color="inherit" /> : <PlayCircleOutlined sx={{ fontSize: 16 }} />}
              label={resetting ? "Reiniciando…" : "Modo Demonstração"}
              onClick={handleResetDemo}
              onDelete={handleResetDemo}
              deleteIcon={
                <Tooltip title="Reiniciar dados fictícios">
                  <Refresh sx={{ fontSize: 16 }} />
                </Tooltip>
              }
              sx={{
                display: { xs: "none", sm: "flex" },
                fontWeight: 750,
                bgcolor: (theme) => theme.palette.mode === "dark" ? "rgba(37,99,235,.22)" : "rgba(37,99,235,.10)",
                color: "primary.main",
                border: "1px solid",
                borderColor: "primary.main",
                "& .MuiChip-icon": { color: "primary.main" },
                "& .MuiChip-deleteIcon": { color: "primary.main" },
              }}
            />
          )}
          <Tooltip title="Iniciar tour guiado">
            <IconButton onClick={() => onStartTour?.()} aria-label="Tour guiado" data-tour="tour-start">
              <TourOutlined />
            </IconButton>
          </Tooltip>
          <Tooltip title={mode === "light" ? "Ativar tema escuro" : "Ativar tema claro"}>
            <IconButton onClick={toggleMode} aria-label="Alternar tema">
              {mode === "light" ? <DarkModeOutlined /> : <LightModeOutlined />}
            </IconButton>
          </Tooltip>
          <IconButton onClick={(event) => setAnchor(event.currentTarget)} aria-label="Menu do usuário">
            <Avatar sx={{ width: 34, height: 34, bgcolor: "primary.main", fontSize: 14, fontWeight: 750 }}>
              {usuario?.nome?.slice(0, 2).toUpperCase()}
            </Avatar>
          </IconButton>
        </Stack>

        <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)} slotProps={{ paper: { sx: { mt: 1, minWidth: 220 } } }}>
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="body2" fontWeight={700}>{usuario?.nome}</Typography>
            <Typography variant="caption" color="text.secondary">{usuario?.email}</Typography>
            {isDemo && (
              <Chip size="small" label="Demo" color="primary" sx={{ mt: 1, fontWeight: 700 }} />
            )}
          </Box>
          {isDemo && (
            <MenuItem onClick={() => { setAnchor(null); handleResetDemo(); }} disabled={resetting}>
              <Refresh fontSize="small" sx={{ mr: 1.5 }} />Reiniciar demonstração
            </MenuItem>
          )}
          <MenuItem onClick={() => { setAnchor(null); onStartTour?.(); }}>
            <TourOutlined fontSize="small" sx={{ mr: 1.5 }} />Tour guiado
          </MenuItem>
          <MenuItem onClick={handleLogout}><Logout fontSize="small" sx={{ mr: 1.5 }} />Sair</MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
