import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Avatar,
  Divider,
  Chip,
  Stack,
} from "@mui/material";
import {
  Dashboard,
  HomeWork,
  People,
  PersonPin,
  Badge,
  TrendingUp,
  Description,
  AttachMoney,
  TaskAlt,
  CalendarMonth,
  Settings,
  Apartment,
} from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const DRAWER_WIDTH = 260;

const menuItems = [
  { path: "/", label: "Dashboard", icon: Dashboard },
  { path: "/imoveis", label: "Imóveis", icon: HomeWork },
  { path: "/clientes", label: "Clientes", icon: People },
  { path: "/proprietarios", label: "Proprietários", icon: PersonPin },
  { path: "/corretores", label: "Corretores", icon: Badge },
  { path: "/agenda", label: "Agenda", icon: CalendarMonth },
  { path: "/leads", label: "Pipeline CRM", icon: TrendingUp },
  { path: "/contratos", label: "Contratos", icon: Description },
  { path: "/financeiro", label: "Financeiro", icon: AttachMoney, roles: ["ADMIN", "GERENTE"] },
  { path: "/tarefas", label: "Tarefas", icon: TaskAlt },
  { path: "/configuracoes", label: "Configurações", icon: Settings },
];

export default function Sidebar({ mobileOpen = false, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { usuario } = useAuth();
  const visibleItems = menuItems.filter((item) => !item.roles || item.roles.includes(usuario?.tipo));

  const content = (
    <Box data-tour="sidebar" sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ px: 2.5, py: 2.5 }}>
        <Avatar variant="rounded" sx={{ bgcolor: "primary.main", width: 42, height: 42, borderRadius: 2.5, boxShadow: "0 10px 24px rgba(37,99,235,.32)" }}>
          <Apartment />
        </Avatar>
        <Box>
          <Typography variant="h6" sx={{ color: "#fff", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-.03em" }}>
            {usuario?.empresaNome || "SUSSAI"}
          </Typography>
          <Typography variant="caption" sx={{ color: "#94a3b8" }}>CRM · SUSSAI</Typography>
        </Box>
      </Stack>

      <Divider sx={{ borderColor: "#334155" }} />

      <List sx={{ px: 1.5, py: 2.5, flex: 1 }}>
        {visibleItems.map((item) => {
          const active = item.path === "/" ? location.pathname === "/" : location.pathname.startsWith(item.path);
          const Icon = item.icon;
          return (
            <ListItemButton
              key={item.path}
              onClick={() => {
                navigate(item.path);
                onClose?.();
              }}
              sx={{
                borderRadius: 2.5,
                mb: 0.75,
                minHeight: 46,
                color: active ? "#fff" : "#94a3b8",
                bgcolor: active ? "rgba(59, 130, 246, 0.18)" : "transparent",
                border: "1px solid",
                borderColor: active ? "rgba(96,165,250,.18)" : "transparent",
                "&:hover": { bgcolor: "rgba(59, 130, 246, 0.12)", color: "#fff", transform: "translateX(2px)" },
                transition: "all 160ms ease",
              }}
            >
              <ListItemIcon sx={{ color: "inherit", minWidth: 40 }}>
                <Icon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ fontSize: 14, fontWeight: active ? 600 : 400 }}
              />
            </ListItemButton>
          );
        })}
      </List>

      <Box sx={{ p: 2, m: 1.5, border: "1px solid #334155", borderRadius: 3, bgcolor: "rgba(255,255,255,.03)" }}>
        <Typography variant="body2" sx={{ color: "#fff", fontWeight: 600 }} noWrap>
          {usuario?.nome}
        </Typography>
        <Typography variant="caption" sx={{ color: "#94a3b8" }} noWrap>
          {usuario?.empresaNome}
        </Typography>
        <Chip
          label={usuario?.plano || "STARTER"}
          size="small"
          sx={{ mt: 1, bgcolor: "#3b82f6", color: "#fff", fontSize: 11 }}
        />
      </Box>
    </Box>
  );

  const drawerSx = {
    width: DRAWER_WIDTH,
    flexShrink: 0,
    "& .MuiDrawer-paper": {
      width: DRAWER_WIDTH,
      boxSizing: "border-box",
      background: "linear-gradient(180deg, #0f172a 0%, #111827 55%, #172554 130%)",
      color: "#e2e8f0",
      border: "none",
    },
  };

  return (
    <>
      <Drawer variant="permanent" sx={{ ...drawerSx, display: { xs: "none", md: "block" } }} open>
        {content}
      </Drawer>
      <Drawer variant="temporary" open={mobileOpen} onClose={onClose} ModalProps={{ keepMounted: true }} sx={{ ...drawerSx, display: { xs: "block", md: "none" } }}>
        {content}
      </Drawer>
    </>
  );
}

export { DRAWER_WIDTH };
