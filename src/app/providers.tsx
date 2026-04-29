"use client";

import { useState, type ReactNode } from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Box from "@mui/material/Box";
import { theme } from "@/theme";
import { configureAmplify } from "@/lib/amplify";

// Amplify must be configured on the client before any auth/API call.
let missingEnv: string[] = [];
if (typeof window !== "undefined") {
  missingEnv = configureAmplify();
}

export function Providers({ children }: { children: ReactNode }) {
  const [qc] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <AppRouterCacheProvider options={{ enableCssLayer: true }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {missingEnv.length > 0 ? (
          <Box sx={{ p: 3, maxWidth: 720, mx: "auto" }}>
            <Alert severity="error">
              <AlertTitle>Configuration missing</AlertTitle>
              The following <code>NEXT_PUBLIC_*</code> environment variables
              must be set in AWS Amplify Hosting (App settings → Environment
              variables) and the app must be redeployed:
              <ul>
                {missingEnv.map((v) => (
                  <li key={v}>
                    <code>{v}</code>
                  </li>
                ))}
              </ul>
              Next.js inlines these values at build time, so they must exist
              before the build runs.
            </Alert>
          </Box>
        ) : (
          <QueryClientProvider client={qc}>{children}</QueryClientProvider>
        )}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
