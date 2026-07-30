import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
} from "@mui/material";
import { Close } from "@mui/icons-material";

export default function Modal({ open, onClose, title, children, actions, maxWidth = "sm" }) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth={maxWidth}>
      <DialogTitle sx={{ pr: 6, fontWeight: 750 }}>
        {title}
        <IconButton onClick={onClose} aria-label="Fechar" sx={{ position: "absolute", right: 12, top: 12 }}>
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>{children}</DialogContent>
      {actions && <DialogActions sx={{ px: 3, py: 2 }}>{actions}</DialogActions>}
    </Dialog>
  );
}
