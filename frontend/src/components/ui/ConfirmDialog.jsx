import { Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import Button from "./Button";

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Confirmar ação",
  description = "Esta ação não poderá ser desfeita.",
  confirmLabel = "Confirmar",
  loading = false,
}) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent><Typography color="text.secondary">{description}</Typography></DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button color="inherit" onClick={onClose}>Cancelar</Button>
        <Button color="error" variant="contained" loading={loading} onClick={onConfirm}>{confirmLabel}</Button>
      </DialogActions>
    </Dialog>
  );
}
