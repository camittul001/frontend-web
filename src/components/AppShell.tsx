"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  AppBar,
  Avatar,
  Box,
  BottomNavigation,
  BottomNavigationAction,
  Container,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import ExploreRoundedIcon from "@mui/icons-material/ExploreRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import { useAuth } from "@/store/auth";

const TABS = [
  { value: "/home", label: "Home", icon: <HomeRoundedIcon /> },
  { value: "/feed", label: "Feed", icon: <ExploreRoundedIcon /> },
  { value: "/leaderboard", label: "Leaderboard", icon: <EmojiEventsRoundedIcon /> },
  { value: "/profile", label: "Profile", icon: <PersonRoundedIcon /> },
] as const;

const DRAWER_WIDTH = 240;

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const user = useAuth((s) => s.user);
  const signOut = useAuth((s) => s.signOut);
  const [menuEl, setMenuEl] = useState<null | HTMLElement>(null);

  const activeTab =
    TABS.find((t) => pathname?.startsWith(t.value))?.value ?? "/home";

  async function onSignOut() {
    setMenuEl(null);
    await signOut();
    router.replace("/login");
  }

  const initials = (user?.name || user?.email || "?")
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Box sx={{ display: "flex", minHeight: "100dvh", bgcolor: "background.default" }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: (t) => t.zIndex.drawer + 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
        }}
      >
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            Area 2 Nation
          </Typography>
          <Tooltip title={user?.email ?? ""}>
            <IconButton onClick={(e) => setMenuEl(e.currentTarget)} size="small">
              <Avatar sx={{ width: 32, height: 32, bgcolor: "secondary.main" }}>
                {initials}
              </Avatar>
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={menuEl}
            open={!!menuEl}
            onClose={() => setMenuEl(null)}
          >
            <MenuItem disabled>{user?.email}</MenuItem>
            <MenuItem onClick={onSignOut}>
              <ListItemIcon>
                <LogoutRoundedIcon fontSize="small" />
              </ListItemIcon>
              Sign out
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {isDesktop && (
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: DRAWER_WIDTH,
              boxSizing: "border-box",
              borderRight: 1,
              borderColor: "divider",
            },
          }}
        >
          <Toolbar>
            <Typography variant="h6" fontWeight={700} color="primary">
              A2N
            </Typography>
          </Toolbar>
          <List>
            {TABS.map((t) => (
              <ListItemButton
                key={t.value}
                component={Link}
                href={t.value}
                selected={activeTab === t.value}
              >
                <ListItemIcon>{t.icon}</ListItemIcon>
                <ListItemText primary={t.label} />
              </ListItemButton>
            ))}
          </List>
        </Drawer>
      )}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { xs: "100%", md: `calc(100% - ${DRAWER_WIDTH}px)` },
          pt: 8,
          pb: { xs: 9, md: 4 },
        }}
      >
        <Container maxWidth="lg" sx={{ py: 3 }}>
          {children}
        </Container>
      </Box>

      {!isDesktop && (
        <Paper
          elevation={3}
          sx={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: (t) => t.zIndex.appBar,
            borderTop: 1,
            borderColor: "divider",
          }}
        >
          <BottomNavigation
            showLabels
            value={activeTab}
            onChange={(_, v) => router.push(v)}
          >
            {TABS.map((t) => (
              <BottomNavigationAction
                key={t.value}
                value={t.value}
                label={t.label}
                icon={t.icon}
              />
            ))}
          </BottomNavigation>
        </Paper>
      )}
    </Box>
  );
}
