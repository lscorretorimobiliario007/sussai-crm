import { Button as MuiButton, CircularProgress } from "@mui/material";

export default function Button({ loading = false, children, disabled, ...props }) {
  return (
    <MuiButton
      disableElevation
      disabled={disabled || loading}
      {...props}
    >
      {loading && <CircularProgress size={18} color="inherit" sx={{ mr: 1 }} />}
      {children}
    </MuiButton>
  );
}
