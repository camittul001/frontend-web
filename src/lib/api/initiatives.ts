"use client";

import { api } from "./client";
import type {
  AddressComponents,
  Initiative,
  InitiativeCategory,
  InitiativeStatus,
  LeaderboardEntry,
  Participant,
  Verification,
} from "@/types";

interface ListResponse<T> {
  items: T[];
}

export interface CreateInitiativeInput {
  title: string;
  description: string;
  category: InitiativeCategory;
  lat: number;
  lng: number;
  scheduledAt?: string | null;
  endAt?: string | null;
  address?: string | null;
  placeId?: string | null;
  formattedAddress?: string | null;
  addressComponents?: AddressComponents | null;
  maxParticipants?: number | null;
  tags?: string[];
}

export interface EditInitiativeInput {
  title?: string;
  description?: string;
  category?: InitiativeCategory;
  lat?: number;
  lng?: number;
  status?: InitiativeStatus;
  scheduledAt?: string | null;
  endAt?: string | null;
  address?: string | null;
  placeId?: string | null;
  formattedAddress?: string | null;
  addressComponents?: AddressComponents | null;
  maxParticipants?: number | null;
  tags?: string[];
}

// Strip undefined keys so the backend whitelist doesn't see noise.
function clean<T extends object>(obj: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (v !== undefined) out[k] = v;
  }
  return out as Partial<T>;
}

export const initiativesApi = {
  list: (audience?: "nearby" | "following" | "trending") => {
    const qs =
      audience && audience !== "nearby" ? `?audience=${audience}` : "";
    return api
      .get<ListResponse<Initiative>>(`/initiatives${qs}`)
      .then((r) => r.items ?? []);
  },

  get: (id: string) => api.get<Initiative>(`/initiatives/${id}`),

  create: (input: CreateInitiativeInput) =>
    api.post<Initiative>("/initiatives", clean(input)),

  edit: (id: string, input: EditInitiativeInput) =>
    api.patch<Initiative>(`/initiatives/${id}`, clean(input)),

  delete: (id: string) => api.delete<void>(`/initiatives/${id}`),

  // ---- co-hosts ----
  addCohost: (
    id: string,
    payload: { userId: string; userName: string },
  ) => api.post<Participant>(`/initiatives/${id}/cohosts`, payload),

  removeCohost: (id: string, userId: string) =>
    api.delete<void>(`/initiatives/${id}/cohosts/${userId}`),

  // ---- participants ----
  participants: (id: string) =>
    api
      .get<ListResponse<Participant>>(`/initiatives/${id}/participants`)
      .then((r) => r.items ?? []),

  join: (id: string) => api.post<Participant>(`/initiatives/${id}/join`),

  // ---- verifications ----
  verifications: (id: string) =>
    api
      .get<ListResponse<Verification>>(`/initiatives/${id}/verifications`)
      .then((r) => r.items ?? []),

  verify: (id: string) => api.post<Verification>(`/initiatives/${id}/verify`),

  // ---- /me ----
  myInitiatives: () =>
    api
      .get<ListResponse<Initiative>>("/me/initiatives")
      .then((r) => r.items ?? []),

  // ---- /leaderboard ----
  leaderboard: () =>
    api
      .get<ListResponse<LeaderboardEntry>>("/leaderboard")
      .then((r) => r.items ?? []),
};
