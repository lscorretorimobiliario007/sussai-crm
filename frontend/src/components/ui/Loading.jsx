import { Box, CircularProgress, Skeleton, Stack } from "@mui/material";

export default function Loading({ variant = "spinner", rows = 5, minHeight = 240 }) {
  if (variant === "skeleton") {
    return (
      <Stack spacing={1.75} aria-label="Carregando conteúdo" sx={{ animation: "sussaiFadeUp .25s ease" }}>
        {Array.from({ length: Math.min(rows, 3) }, (_, index) => (
          <Skeleton key={`hero-${index}`} variant="rounded" height={index === 0 ? 88 : 64} sx={{ borderRadius: 3 }} />
        ))}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1.5 }}>
          {Array.from({ length: Math.max(rows - 1, 2) }, (_, index) => (
            <Skeleton key={`card-${index}`} variant="rounded" height={120} sx={{ borderRadius: 3 }} />
          ))}
        </Box>
      </Stack>
    );
  }

  return (
    <Box sx={{ minHeight, display: "grid", placeItems: "center" }} role="status" aria-label="Carregando">
      <CircularProgress size={36} thickness={4} />
    </Box>
  );
}
