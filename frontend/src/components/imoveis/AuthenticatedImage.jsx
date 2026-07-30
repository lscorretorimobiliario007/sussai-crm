import { Box } from "@mui/material";
import { HomeWorkOutlined } from "@mui/icons-material";

export default function AuthenticatedImage({ src, alt = "", sx }) {
  if (!src) {
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
      src={`http://localhost:3000${src}`}
      alt={alt}
      sx={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
        ...sx,
      }}
      onError={(e) => {
        e.currentTarget.style.display = "none";
      }}
    />
  );
}
