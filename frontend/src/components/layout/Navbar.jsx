import { useCallback, useEffect, useState } from "react";
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  DarkModeOutlined,
  LightModeOutlined,
  Logout,
  Menu as MenuIcon,
  NotificationsNoneOutlined,
  PersonOutlined,
  Search,
  TourOutlined,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/auth";
import { useThemeMode } from "../../context/themeMode";
import api from "../../api/axios";
import { DRAWER_WIDTH } from "./Sidebar";

async function fetchUnreadCount() {
  try {
    const { data } = await api.get("/notificacoes");
    const list = Array.isArray(data) ? data : data?.data || data?.notificacoes || [];
    return list.filter((item) => !item.lida).length;
  } catch {
    try {
      const { data } = await api.get("/agenda/notificacoes");
      const list = Array.isArray(data) ? data : data?.data || data?.notificacoes || [];
      return list.filter((item) => !item.lida).length;
    } catch {
      return 0;
    }
  }
}

export default function Navbar({ title, onMenuClick, onStartTour }) {
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();
  const { mode, toggleMode } = useThemeMode();
  const [anchor, setAnchor] = useState(null);
  const [search, setSearch] = useState("");
  const [unread, setUnread] = useState(0);

  const loadUnread = useCallback(async () => {
    const count = await fetchUnreadCount();
    setUnread(count);
  }, []);

  useEffect(() => {
    loadUnread();
    const timer = window.setInterval(loadUnread, 60000);
    return () => window.clearInterval(timer);
  }, [loadUnread]);

  const handleLogout = () => {
    setAnchor(null);
    logout();
    navigate("/login", { replace: true });
  };

  const handleSearch = (event) => {
    event.preventDefault();
    const q = search.trim();
    navigate(q ? `/pesquisa?q=${encodeURIComponent(q)}` : "/pesquisa");
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
      <Toolbar sx={{ minHeight: { xs: 64, md: 72 }, gap: 1.25 }}>
        <IconButton onClick={onMenuClick} sx={{ display: { md: "none" } }} aria-label="Abrir menu">
          <MenuIcon />
        </IconButton>

        <Box sx={{ minWidth: 0, display: { xs: "none", lg: "block" }, maxWidth: 220 }}>
          <Typography variant="h6" noWrap>{title}</Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {usuario?.empresa?.nome}
          </Typography>
        </Box>

        <Box
          component="form"
          onSubmit={handleSearch}
          sx={{ flexGrow: 1, maxWidth: 520, mx: { xs: 0, md: 1 } }}
        >
          <TextField
            size="small"
            fullWidth
            placeholder="Pesquisar no CRM..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 3,
                bgcolor: (theme) => theme.palette.mode === "dark" ? "rgba(255,255,255,.04)" : "rgba(15,23,42,.03)",
              },
            }}
          />
        </Box>

        <Stack direction="row" spacing={0.5} alignItems="center">
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
          <Tooltip title="Notificações">
            <IconButton onClick={() => navigate("/notificacoes")} aria-label="Notificações">
              <Badge badgeContent={unread} color="error" max={99}>
                <NotificationsNoneOutlined />
              </Badge>
            </IconButton>
          </Tooltip>
          <IconButton onClick={(event) => setAnchor(event.currentTarget)} aria-label="Menu do usuário">
            <Avatar sx={{ width: 34, height: 34, bgcolor: "primary.main", fontSize: 14, fontWeight: 750 }}>
              {usuario?.nome?.slice(0, 2).toUpperCase()}
            </Avatar>
          </IconButton>
        </Stack>

        <Menu
          anchorEl={anchor}
          open={Boolean(anchor)}
          onClose={() => setAnchor(null)}
          slotProps={{ paper: { sx: { mt: 1, minWidth: 220 } } }}
        >
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="body2" fontWeight={700}>{usuario?.nome}</Typography>
            <Typography variant="caption" color="text.secondary">{usuario?.email}</Typography>
          </Box>
          <MenuItem onClick={() => { setAnchor(null); navigate("/perfil"); }}>
            <PersonOutlined fontSize="small" sx={{ mr: 1.5 }} />Meu perfil
          </MenuItem>
          <MenuItem onClick={() => { setAnchor(null); onStartTour?.(); }}>
            <TourOutlined fontSize="small" sx={{ mr: 1.5 }} />Tour guiado
          </MenuItem>
          <MenuItem onClick={handleLogout}>
            <Logout fontSize="small" sx={{ mr: 1.5 }} />Sair
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
