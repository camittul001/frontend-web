// Server-safe media URL resolver. The `media.ts` companion is marked
// "use client" because it imports the Amplify upload helpers; this
// shared helper is used by both server components (story page OG tags)
// and client components.

export type PhotoSize = "thumb" | "md" | "full";

function cdnBase(): string {
  const u = process.env.NEXT_PUBLIC_MEDIA_CDN_BASE;
  if (!u) return "";
  return u.replace(/\/+$/, "");
}

/** Resolves a base key (`{userId}/{uuid}`) to a concrete CDN URL. */
export function photoUrl(baseKey: string, size: PhotoSize = "md"): string {
  return `${cdnBase()}/public/${baseKey}_${size}.webp`;
}

/** Returns null if the key is empty / null so callers can skip rendering. */
export function maybePhotoUrl(
  baseKey: string | null | undefined,
  size: PhotoSize = "md",
): string | null {
  if (!baseKey) return null;
  return photoUrl(baseKey, size);
}
