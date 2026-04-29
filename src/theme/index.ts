"use client";

import { createTheme } from "@mui/material/styles";
import { colors } from "./colors";

// Mirrors frontend_mobile/lib/core/theme/app_theme.dart (Material 3, blue
// primary, green secondary, orange accent/tertiary, 12px card radius,
// rounded outlined inputs).
export const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: colors.primary, contrastText: "#FFFFFF" },
    secondary: { main: colors.secondary, contrastText: "#FFFFFF" },
    warning: { main: colors.accent },
    background: { default: colors.background, paper: colors.surface },
    text: { primary: colors.textPrimary, secondary: colors.textSecondary },
    divider: colors.border,
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily:
      'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    h6: { fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiAppBar: {
      defaultProps: { elevation: 0, color: "primary" },
      styleOverrides: { root: { backgroundColor: colors.primary } },
    },
    MuiCard: {
      defaultProps: { variant: "outlined" },
      styleOverrides: {
        root: {
          borderRadius: 12,
          borderColor: colors.border,
          backgroundColor: colors.surface,
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: 10, paddingBlock: 10 } },
    },
    MuiOutlinedInput: {
      styleOverrides: { root: { borderRadius: 10 } },
    },
    MuiTextField: { defaultProps: { fullWidth: true, size: "medium" } },
  },
});
