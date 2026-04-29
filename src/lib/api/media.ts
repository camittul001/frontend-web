"use client";

import { api } from "./client";
import type { Initiative, PhotoKind } from "@/types";

export interface PresignedPost {
  key: string;
  url: string;
  fields: Record<string, string>;
  maxBytes: number;
}

export const mediaApi = {
  uploadUrl: (contentType: string) =>
    api.post<PresignedPost>("/media/upload-url", { contentType }),
};

/**
 * Uploads a single Blob/File via a presigned POST. The key returned by
 * `uploadUrl` is `uploads/{userId}/{uuid}.{ext}`. After processing, the
 * client references the *base key* `{userId}/{uuid}` (= the upload key
 * with `uploads/` prefix and extension stripped).
 */
export async function uploadFile(
  file: Blob,
  contentType: string,
  onProgress?: (frac: number) => void,
): Promise<string> {
  const presigned = await mediaApi.uploadUrl(contentType);

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", presigned.url, true);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(e.loaded / e.total);
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed: ${xhr.status} ${xhr.responseText}`));
    };
    xhr.onerror = () => reject(new Error("Upload network error"));

    const form = new FormData();
    for (const [k, v] of Object.entries(presigned.fields)) {
      form.append(k, v);
    }
    form.append("file", file);
    xhr.send(form);
  });

  // uploads/{userId}/{uuid}.{ext} → {userId}/{uuid}
  const m = presigned.key.match(/^uploads\/([^/]+)\/([^.]+)\.[^.]+$/);
  if (!m) throw new Error(`Unexpected upload key shape: ${presigned.key}`);
  return `${m[1]}/${m[2]}`;
}

export const photosApi = {
  attach: (id: string, kind: PhotoKind, keys: string[]) =>
    api.post<Initiative>(`/initiatives/${id}/photos`, { kind, keys }),
  remove: (id: string, baseKey: string) =>
    api.delete<Initiative>(
      `/initiatives/${id}/photos/${encodeURIComponent(baseKey)}`,
    ),
};

export const lifecycleApi = {
  transition: (
    id: string,
    to: "open" | "inProgress" | "completed" | "cancelled",
    reason?: string,
  ) =>
    api.post<Initiative>(`/initiatives/${id}/transition`, {
      to,
      ...(reason ? { reason } : {}),
    }),
};

const cdnBase = (): string => {
  const u = process.env.NEXT_PUBLIC_MEDIA_CDN_BASE;
  if (!u) return "";
  return u.replace(/\/+$/, "");
};

export type PhotoSize = "thumb" | "md" | "full";

/** Resolves a base key (`{userId}/{uuid}`) to a concrete CDN URL. */
export function photoUrl(baseKey: string, size: PhotoSize = "md"): string {
  return `${cdnBase()}/public/${baseKey}_${size}.webp`;
}
