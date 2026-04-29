// Public API helpers — these endpoints don't require auth, so they can
// be called from both server components (SSR for the story page +
// OG-tag scrapers) and client components (home-page carousel).
//
// Kept separate from `client.ts` because that one pulls in
// `aws-amplify/auth`, which can't run on the server.

import type { InitiativeStory, ShowcasePage } from "@/types";

function publicBaseUrl(): string {
  // Same env var as the auth'd client. Set in Amplify Hosting.
  const u = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!u) throw new Error("NEXT_PUBLIC_API_BASE_URL is not set");
  return u.replace(/\/+$/, "");
}

async function fetchPublic<T>(
  path: string,
  init?: RequestInit & { revalidate?: number },
): Promise<T> {
  const { revalidate, ...rest } = init || {};
  const res = await fetch(`${publicBaseUrl()}${path}`, {
    ...rest,
    // Showcase data only changes when an initiative gets confirmed —
    // a 60-second cache cuts duplicate Lambda invocations from the
    // homepage carousel without making content meaningfully stale.
    next: { revalidate: revalidate ?? 60 },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Public API ${path} → ${res.status}: ${body}`);
  }
  return (await res.json()) as T;
}

export interface ShowcaseQuery {
  city?: string | null;
  limit?: number;
  cursor?: string | null;
}

export const publicApi = {
  showcase: (q: ShowcaseQuery = {}) => {
    const params = new URLSearchParams();
    if (q.city) params.set("city", q.city);
    if (q.limit) params.set("limit", String(q.limit));
    if (q.cursor) params.set("cursor", q.cursor);
    const qs = params.toString();
    return fetchPublic<ShowcasePage>(
      `/initiatives/showcase${qs ? `?${qs}` : ""}`,
    );
  },

  story: (id: string) =>
    fetchPublic<InitiativeStory>(`/initiatives/${encodeURIComponent(id)}/story`),
};

// Server-component variant: don't cache when used inside a story page
// because we want fresh OG data on the first fetch after a confirmation.
export const publicApiNoCache = {
  story: (id: string) =>
    fetchPublic<InitiativeStory>(
      `/initiatives/${encodeURIComponent(id)}/story`,
      { revalidate: 0 },
    ),
};
