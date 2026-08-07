import { createTheme } from "@mui/material/styles";

const designTokens = {
  colors: {
    primary: "#2563eb",
    primaryDark: "#1d4ed8",
    secondary: "#0f766e",
    success: "#16a34a",
    warning: "#d97706",
    error: "#dc2626",
    slate950: "#020617",
    slate900: "#0f172a",
    slate800: "#1e293b",
  },
  radius: { sm: 8, md: 12, lg: 16, xl: 24 },
  shadows: {
    card: "0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.05)",
    elevated: "0 20px 50px rgba(15, 23, 42, 0.14)",
  },
};

export function createAppTheme(mode = "light") {
  const dark = mode === "dark";

  return createTheme({
    palette: {
      mode,
      primary: { main: designTokens.colors.primary, light: "#60a5fa", dark: designTokens.colors.primaryDark },
      secondary: { main: designTokens.colors.secondary },
      background: {
        default: dark ? designTokens.colors.slate950 : "#f6f8fc",
        paper: dark ? designTokens.colors.slate900 : "#ffffff",
      },
      text: {
        primary: dark ? "#f8fafc" : designTokens.colors.slate900,
        secondary: dark ? "#94a3b8" : "#64748b",
      },
      divider: dark ? "rgba(148, 163, 184, 0.16)" : "#e5eaf2",
      success: { main: designTokens.colors.success },
      warning: { main: designTokens.colors.warning },
      error: { main: designTokens.colors.error },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h3: { fontWeight: 750, letterSpacing: "-0.04em" },
      h4: { fontWeight: 750, letterSpacing: "-0.03em" },
      h5: { fontWeight: 700, letterSpacing: "-0.02em" },
      h6: { fontWeight: 700 },
      button: { fontWeight: 700 },
    },
    shape: { borderRadius: designTokens.radius.md },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: { transition: "background-color 180ms ease, color 180ms ease" },
          "*::selection": { backgroundColor: "rgba(37, 99, 235, 0.22)" },
          "@keyframes sussaiFadeUp": {
            from: { opacity: 0, transform: "translateY(10px)" },
            to: { opacity: 1, transform: "translateY(0)" },
          },
          "@keyframes sussaiPulse": {
            "0%, 100%": { transform: "scale(1)" },
            "50%": { transform: "scale(1.03)" },
          },
        },
      },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
            minHeight: 42,
            borderRadius: designTokens.radius.sm,
            boxShadow: "none",
            transition: "transform 160ms ease, box-shadow 160ms ease, background-color 160ms ease",
            "&:hover": { transform: "translateY(-1px)", boxShadow: "0 8px 20px rgba(37, 99, 235, 0.18)" },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
            backgroundImage: "none",
            boxShadow: designTokens.shadows.card,
            border: `1px solid ${dark ? "rgba(148, 163, 184, 0.14)" : "#e9edf5"}`,
            borderRadius: designTokens.radius.lg,
            transition: "border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease",
        },
      },
    },
      MuiTextField: {
        defaultProps: { size: "small" },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            minHeight: 44,
            borderRadius: designTokens.radius.sm,
            backgroundColor: dark ? "rgba(255,255,255,0.025)" : "#fff",
          },
        },
      },
      MuiDialog: {
        styleOverrides: { paper: { borderRadius: designTokens.radius.xl, backgroundImage: "none" } },
      },
      MuiTableHead: {
        styleOverrides: { root: { backgroundColor: dark ? "rgba(255,255,255,0.03)" : "#f8fafc" } },
      },
    MuiChip: {
        styleOverrides: { root: { fontWeight: 650, borderRadius: designTokens.radius.sm } },
    },
  },
  });
}
