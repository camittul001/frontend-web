"use client";

import { api } from "./client";
import type {
  FollowListEntry,
  PageResponse,
  UserProfile,
} from "@/types";

export const usersApi = {
  profile: (id: string) => api.get<UserProfile>(`/users/${id}/profile`),

  followers: (id: string, cursor?: string | null) => {
    const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
    return api.get<PageResponse<FollowListEntry>>(
      `/users/${id}/followers${qs}`,
    );
  },

  following: (id: string, cursor?: string | null) => {
    const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
    return api.get<PageResponse<FollowListEntry>>(
      `/users/${id}/following${qs}`,
    );
  },

  follow: (id: string) =>
    api.post<{ ok: boolean; alreadyFollowing?: boolean }>(
      `/users/${id}/follow`,
    ),

  unfollow: (id: string) =>
    api.delete<{ ok: boolean }>(`/users/${id}/follow`),

  block: (id: string) => api.post<{ ok: boolean }>(`/users/${id}/block`),
  unblock: (id: string) => api.delete<{ ok: boolean }>(`/users/${id}/block`),

  reportUser: (id: string, reason: string, details?: string) =>
    api.post<unknown>(`/users/${id}/report`, { reason, details }),

  reportInitiative: (id: string, reason: string, details?: string) =>
    api.post<unknown>(`/initiatives/${id}/report`, { reason, details }),
};
