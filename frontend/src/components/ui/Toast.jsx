import { useMemo, useState } from "react";
import { Alert, Snackbar } from "@mui/material";
import { ToastContext } from "../../context/toast";

export { useToast } from "../../context/toast";

export function ToastProvider({ children }) {
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  const api = useMemo(() => {
    const show = (message, severity = "success") => {
      setToast({ open: true, message, severity });
    };
    return {
      show,
      success: (message) => show(message, "success"),
      error: (message) => show(message, "error"),
      info: (message) => show(message, "info"),
      warning: (message) => show(message, "warning"),
    };
  }, []);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((current) => ({ ...current, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={toast.severity} variant="filled" onClose={() => setToast((current) => ({ ...current, open: false }))}>
          {toast.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}
