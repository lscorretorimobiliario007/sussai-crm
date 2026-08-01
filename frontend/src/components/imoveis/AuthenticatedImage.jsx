import { useEffect, useMemo, useState } from "react";
import { Box } from "@mui/material";
import { HomeWorkOutlined } from "@mui/icons-material";
import api from "../../api/axios";

function resolveImageUrl(src) {
  if (!src) return null;
  if (/^(blob:|data:|https?:\/\/)/i.test(src)) return src;

  const apiBaseUrl = String(api.defaults.baseURL || "").replace(/\/+$/, "");
  const apiOrigin = apiBaseUrl ? new URL(apiBaseUrl, window.location.origin).origin : window.location.origin;
  const normalizedSrc = String(src).replace(/\\/g, "/");

  if (normalizedSrc.startsWith("/uploads/")) return `${apiOrigin}${normalizedSrc}`;
  if (normalizedSrc.startsWith("uploads/")) return `${apiOrigin}/${normalizedSrc}`;
  if (normalizedSrc.startsWith("properties/")) return `${apiOrigin}/uploads/${normalizedSrc}`;

  return `${apiBaseUrl}/${normalizedSrc.replace(/^\/+/, "")}`;
}

export default function AuthenticatedImage({ src, alt = "", sx }) {
  const resolvedSrc = useMemo(() => resolveImageUrl(src), [src]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [resolvedSrc]);

  if (!resolvedSrc || failed) {
    return (
      <Box
        sx={{
          display: "grid",
          placeItems: "center",
          bgcolor: "action.hover",
          color: "text.disabled",
          ...sx,
        }}
      >
        <HomeWorkOutlined sx={{ fontSize: 48 }} />
      </Box>
    );
  }

  return (
    <Box
      component="img"
      src={resolvedSrc}
      alt={alt}
      sx={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
        ...sx,
      }}
      onError={() => setFailed(true)}
    />
  );
}
