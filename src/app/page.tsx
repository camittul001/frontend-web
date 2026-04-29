"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import { useAuth } from "@/store/auth";

// Root entry — redirects based on auth state. Mirrors the redirect logic in
// frontend_mobile/lib/core/router/app_router.dart.
export default function RootRedirect() {
  const router = useRouter();
  const { user, initialized, init } = useAuth();

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (!initialized) return;
    if (!user) router.replace("/login");
    else if (!user.profileCompleted) router.replace("/profile/edit");
    else router.replace("/home");
  }, [initialized, user, router]);

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <CircularProgress />
    </Box>
  );
}
