"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  initiativesApi,
  type CreateInitiativeInput,
  type EditInitiativeInput,
} from "./api/initiatives";

// Mirrors Riverpod providers in frontend_mobile/lib/features/* — same query
// invalidation pattern as ref.invalidate().
export const queryKeys = {
  initiatives: ["initiatives"] as const,
  initiative: (id: string) => ["initiatives", id] as const,
  participants: (id: string) => ["initiatives", id, "participants"] as const,
  verifications: (id: string) => ["initiatives", id, "verifications"] as const,
  myInitiatives: ["me", "initiatives"] as const,
  leaderboard: ["leaderboard"] as const,
};

export const useInitiatives = () =>
  useQuery({
    queryKey: queryKeys.initiatives,
    queryFn: () => initiativesApi.list(),
  });

export const useInitiative = (id: string | undefined) =>
  useQuery({
    queryKey: id ? queryKeys.initiative(id) : ["initiatives", "_"],
    queryFn: () => initiativesApi.get(id as string),
    enabled: !!id,
  });

export const useParticipants = (id: string | undefined) =>
  useQuery({
    queryKey: id ? queryKeys.participants(id) : ["participants", "_"],
    queryFn: () => initiativesApi.participants(id as string),
    enabled: !!id,
  });

export const useVerifications = (id: string | undefined) =>
  useQuery({
    queryKey: id ? queryKeys.verifications(id) : ["verifications", "_"],
    queryFn: () => initiativesApi.verifications(id as string),
    enabled: !!id,
  });

export const useMyInitiatives = () =>
  useQuery({
    queryKey: queryKeys.myInitiatives,
    queryFn: () => initiativesApi.myInitiatives(),
  });

export const useLeaderboard = () =>
  useQuery({
    queryKey: queryKeys.leaderboard,
    queryFn: () => initiativesApi.leaderboard(),
  });

export function useCreateInitiative() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInitiativeInput) => initiativesApi.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.initiatives });
      qc.invalidateQueries({ queryKey: queryKeys.myInitiatives });
      qc.invalidateQueries({ queryKey: queryKeys.leaderboard });
    },
  });
}

export function useEditInitiative(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: EditInitiativeInput) => initiativesApi.edit(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.initiatives });
      qc.invalidateQueries({ queryKey: queryKeys.initiative(id) });
      qc.invalidateQueries({ queryKey: queryKeys.myInitiatives });
      qc.invalidateQueries({ queryKey: queryKeys.leaderboard });
    },
  });
}

export function useDeleteInitiative() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => initiativesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.initiatives });
      qc.invalidateQueries({ queryKey: queryKeys.myInitiatives });
    },
  });
}

export function useJoinInitiative() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => initiativesApi.join(id),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: queryKeys.participants(id) });
      qc.invalidateQueries({ queryKey: queryKeys.myInitiatives });
      qc.invalidateQueries({ queryKey: queryKeys.leaderboard });
    },
  });
}

export function useVerifyInitiative() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => initiativesApi.verify(id),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: queryKeys.verifications(id) });
      qc.invalidateQueries({ queryKey: queryKeys.initiative(id) });
      qc.invalidateQueries({ queryKey: queryKeys.leaderboard });
    },
  });
}

export function useAddCohost(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { userId: string; userName: string }) =>
      initiativesApi.addCohost(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.participants(id) });
    },
  });
}

export function useRemoveCohost(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => initiativesApi.removeCohost(id, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.participants(id) });
    },
  });
}
