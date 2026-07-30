import { Card as MuiCard, CardContent } from "@mui/material";

export default function Card({ children, contentSx, premium = false, ...props }) {
  return (
    <MuiCard
      {...props}
      sx={{
        animation: "sussaiFadeUp .35s ease",
        ...(premium && {
          background: (theme) => theme.palette.mode === "dark"
            ? "linear-gradient(160deg, rgba(37,99,235,.16), rgba(15,23,42,.92))"
            : "linear-gradient(160deg, #ffffff 0%, #f8fbff 55%, #eef6ff 100%)",
          borderColor: (theme) => theme.palette.mode === "dark" ? "rgba(96,165,250,.28)" : "rgba(37,99,235,.14)",
          boxShadow: "0 18px 40px rgba(37,99,235,.10)",
        }),
        ...props.sx,
      }}
    >
      <CardContent sx={{ p: { xs: 2.25, md: 3 }, "&:last-child": { pb: { xs: 2.25, md: 3 } }, ...contentSx }}>
        {children}
      </CardContent>
    </MuiCard>
  );
}
