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
  Stack,
} from "@mui/material";
import {
  AdminPanelSettingsOutlined,
  Apartment,
  AssessmentOutlined,
  BackupOutlined,
  CalendarMonthOutlined,
  Dashboard,
  DescriptionOutlined,
  ExtensionOutlined,
  HistoryEduOutlined,
  HomeWork,
  NotificationsNoneOutlined,
  PeopleAltOutlined,
  PersonOutlined,
  PersonPin,
  SettingsOutlined,
  TaskAltOutlined,
  TerminalOutlined,
  TrendingUp,
  AccountBalanceWalletOutlined,
  HandshakeOutlined,
} from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/auth";
import { getUserRole } from "../../utils/roles";

const DRAWER_WIDTH = 260;

const menuGroups = [
  {
    title: "Principal",
    items: [
      { path: "/", label: "Dashboard", icon: Dashboard, roles: ["ADMIN", "GERENTE", "CORRETOR"] },
      { path: "/imoveis", label: "Imóveis", icon: HomeWork, roles: ["ADMIN", "GERENTE", "CORRETOR"] },
      { path: "/proprietarios", label: "Proprietários", icon: PersonPin, roles: ["ADMIN", "GERENTE", "CORRETOR"] },
      { path: "/clientes", label: "Clientes", icon: PeopleAltOutlined, roles: ["ADMIN", "GERENTE", "CORRETOR"] },
      { path: "/leads", label: "Pipeline CRM", icon: TrendingUp, roles: ["ADMIN", "GERENTE", "CORRETOR"] },
    ],
  },
  {
    title: "Operação",
    items: [
      { path: "/agenda", label: "Agenda", icon: CalendarMonthOutlined, roles: ["ADMIN", "GERENTE", "CORRETOR"] },
      { path: "/tarefas", label: "Tarefas", icon: TaskAltOutlined, roles: ["ADMIN", "GERENTE", "CORRETOR"] },
      { path: "/contratos", label: "Contratos", icon: HandshakeOutlined, roles: ["ADMIN", "GERENTE", "CORRETOR"] },
      { path: "/documentos", label: "Documentos", icon: DescriptionOutlined, roles: ["ADMIN", "GERENTE", "CORRETOR"] },
      { path: "/relatorios", label: "Relatórios", icon: AssessmentOutlined, roles: ["ADMIN", "GERENTE", "CORRETOR"] },
    ],
  },
  {
    title: "Gestão",
    items: [
      { path: "/financeiro", label: "Financeiro", icon: AccountBalanceWalletOutlined, roles: ["ADMIN", "GERENTE"] },
      { path: "/corretores", label: "Corretores", icon: PeopleAltOutlined, roles: ["ADMIN", "GERENTE"] },
      { path: "/configuracoes", label: "Configurações", icon: SettingsOutlined, roles: ["ADMIN", "GERENTE"] },
    ],
  },
  {
    title: "Sistema",
    items: [
      { path: "/admin", label: "Admin", icon: AdminPanelSettingsOutlined, roles: ["ADMIN"] },
      { path: "/auditoria", label: "Auditoria", icon: HistoryEduOutlined, roles: ["ADMIN"] },
      { path: "/integracoes", label: "Integrações", icon: ExtensionOutlined, roles: ["ADMIN"] },
      { path: "/backup", label: "Backup", icon: BackupOutlined, roles: ["ADMIN"] },
      { path: "/logs", label: "Logs", icon: TerminalOutlined, roles: ["ADMIN"] },
    ],
  },
  {
    title: "Conta",
    items: [
      { path: "/notificacoes", label: "Notificações", icon: NotificationsNoneOutlined, roles: ["ADMIN", "GERENTE", "CORRETOR"] },
      { path: "/perfil", label: "Perfil", icon: PersonOutlined, roles: ["ADMIN", "GERENTE", "CORRETOR"] },
    ],
  },
];

export default function Sidebar({ mobileOpen = false, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { usuario } = useAuth();
  const role = getUserRole(usuario) || "CORRETOR";

  const content = (
    <Box data-tour="sidebar" sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ px: 2.5, py: 2.5 }}>
        <Avatar variant="rounded" sx={{ bgcolor: "primary.main", width: 42, height: 42, borderRadius: 2.5, boxShadow: "0 10px 24px rgba(37,99,235,.32)" }}>
          <Apartment />
        </Avatar>
        <Box>
          <Typography variant="h6" sx={{ color: "#fff", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-.03em" }}>
            {usuario?.empresa?.nome || "SUSSAI"}
          </Typography>
          <Typography variant="caption" sx={{ color: "#94a3b8" }}>CRM · {role}</Typography>
        </Box>
      </Stack>

      <Divider sx={{ borderColor: "#334155" }} />

      <Box sx={{ px: 1.5, py: 2, flex: 1, overflowY: "auto" }}>
        {menuGroups.map((group) => {
          const visibleItems = group.items.filter((item) => item.roles.includes(role));
          if (!visibleItems.length) return null;

          return (
            <Box key={group.title} sx={{ mb: 2 }}>
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  px: 1.5,
                  mb: 0.75,
                  color: "#64748b",
                  fontWeight: 700,
                  letterSpacing: ".08em",
                  textTransform: "uppercase",
                }}
              >
                {group.title}
              </Typography>
              <List disablePadding>
                {visibleItems.map((item) => {
                  const active = item.path === "/"
                    ? location.pathname === "/"
                    : location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
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
                        mb: 0.5,
                        minHeight: 44,
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
            </Box>
          );
        })}
      </Box>

      <Box sx={{ p: 2, m: 1.5, border: "1px solid #334155", borderRadius: 3, bgcolor: "rgba(255,255,255,.03)" }}>
        <Typography variant="body2" sx={{ color: "#fff", fontWeight: 600 }} noWrap>
          {usuario?.nome}
        </Typography>
        <Typography variant="caption" sx={{ color: "#94a3b8" }} noWrap>
          {usuario?.empresa?.nome}
        </Typography>
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
