import { useEffect, useState } from "react";
import { Box, Toolbar } from "@mui/material";
import Sidebar, { DRAWER_WIDTH } from "./Sidebar";
import Navbar from "./Navbar";
import GuidedTour, { shouldAutoStartTour } from "../tour/GuidedTour";
import { useAuth } from "../../context/AuthContext";

export default function MainLayout({ title, children }) {
  const { usuario } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);

  useEffect(() => {
    if (shouldAutoStartTour(usuario)) {
      const timer = window.setTimeout(() => setTourOpen(true), 700);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [usuario]);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <Navbar
        title={title}
        onMenuClick={() => setMobileOpen(true)}
        onStartTour={() => setTourOpen(true)}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { xs: "100%", md: `calc(100% - ${DRAWER_WIDTH}px)` },
          minWidth: 0,
          p: { xs: 2, sm: 2.5, lg: 3.5 },
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 64, md: 72 } }} />
        <Box sx={{ maxWidth: 1600, mx: "auto", animation: "pageEnter 240ms ease-out" }}>
          {children}
        </Box>
      </Box>
      <GuidedTour open={tourOpen} onClose={() => setTourOpen(false)} />
    </Box>
  );
}
