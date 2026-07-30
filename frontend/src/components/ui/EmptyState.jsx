import { Box, Typography } from "@mui/material";
import { InboxOutlined } from "@mui/icons-material";
import Button from "./Button";

export default function EmptyState({
  title = "Nenhum registro encontrado",
  description = "Quando houver informações, elas aparecerão aqui.",
  actionLabel,
  onAction,
  icon: Icon = InboxOutlined,
}) {
  return (
    <Box
      sx={{
        py: { xs: 6, md: 8 },
        px: 2,
        textAlign: "center",
        color: "text.secondary",
        animation: "sussaiFadeUp .35s ease",
      }}
    >
      <Box
        sx={{
          width: 64,
          height: 64,
          display: "grid",
          placeItems: "center",
          mx: "auto",
          mb: 2,
          borderRadius: 3.5,
          bgcolor: "primary.main",
          color: "#fff",
          background: "linear-gradient(145deg, #2563eb 0%, #0f766e 120%)",
          boxShadow: "0 14px 30px rgba(37,99,235,.28)",
        }}
      >
        <Icon sx={{ fontSize: 30 }} />
      </Box>
      <Typography variant="h6" color="text.primary" fontWeight={800}>{title}</Typography>
      <Typography variant="body2" sx={{ mt: 0.75, mb: actionLabel ? 2.75 : 0, maxWidth: 420, mx: "auto" }}>
        {description}
      </Typography>
      {actionLabel && <Button variant="contained" onClick={onAction}>{actionLabel}</Button>}
    </Box>
  );
}
