"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Box, CircularProgress } from "@mui/material";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/store/auth";

// Auth gate for the authenticated app — mirrors the GoRouter redirect block
// in frontend_mobile/lib/core/router/app_router.dart.
export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, initialized, init } = useAuth();

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (!initialized) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!user.profileCompleted && pathname !== "/profile/edit") {
      router.replace("/profile/edit");
    }
  }, [initialized, user, pathname, router]);

  if (!initialized || !user) {
    return (
      <Box
        sx={{
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Profile-edit screen runs without the bottom-nav shell.
  if (!user.profileCompleted || pathname === "/profile/edit") {
    return <>{children}</>;
  }

  return <AppShell>{children}</AppShell>;
}
