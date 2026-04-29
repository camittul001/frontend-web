import type { ReactNode } from "react";

// `(public)` route group — no auth gate, no AppShell. Hosts pages that
// need to be SSR-rendered for unauthenticated visitors and link
// scrapers (currently the showcase story page).
//
// The MUI ThemeProvider + emotion cache are already mounted in the
// root layout via `Providers`, so we just pass children through.
export default function PublicLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
