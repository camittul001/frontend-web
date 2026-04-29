"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  initiativesApi,
  type CreateInitiativeInput,
  type EditInitiativeInput,
} from "./api/initiatives";
import { usersApi } from "./api/users";
import type { FeedAudience, UserProfile } from "@/types";

// Mirrors Riverpod providers in frontend_mobile/lib/features/* — same query
// invalidation pattern as ref.invalidate().
export const queryKeys = {
  initiatives: ["initiatives"] as const,
  initiativesByAudience: (a: FeedAudience) =>
    ["initiatives", "audience", a] as const,
  initiative: (id: string) => ["initiatives", id] as const,
  participants: (id: string) => ["initiatives", id, "participants"] as const,
  verifications: (id: string) => ["initiatives", id, "verifications"] as const,
  myInitiatives: ["me", "initiatives"] as const,
  leaderboard: ["leaderboard"] as const,
  profile: (id: string) => ["profile", id] as const,
  followers: (id: string) => ["followers", id] as const,
  following: (id: string) => ["following", id] as const,
};

export const useInitiatives = (audience: FeedAudience = "nearby") =>
  useQuery({
    queryKey: queryKeys.initiativesByAudience(audience),
    queryFn: () => initiativesApi.list(audience),
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

// ─────────────────────────────────────────────────────────────
// Social graph — profile, followers, following, follow/unfollow
// ─────────────────────────────────────────────────────────────

export const useUserProfile = (id: string | undefined) =>
  useQuery({
    queryKey: id ? queryKeys.profile(id) : ["profile", "_"],
    queryFn: () => usersApi.profile(id as string),
    enabled: !!id,
  });

export const useFollowers = (id: string | undefined) =>
  useInfiniteQuery({
    queryKey: id ? queryKeys.followers(id) : ["followers", "_"],
    queryFn: ({ pageParam }) =>
      usersApi.followers(id as string, pageParam as string | null),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.cursor ?? null,
    enabled: !!id,
  });

export const useFollowing = (id: string | undefined) =>
  useInfiniteQuery({
    queryKey: id ? queryKeys.following(id) : ["following", "_"],
    queryFn: ({ pageParam }) =>
      usersApi.following(id as string, pageParam as string | null),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.cursor ?? null,
    enabled: !!id,
  });

// Optimistically flip the profile's follow flag + counts; rollback on error.
const applyFollowDelta = (
  qc: ReturnType<typeof useQueryClient>,
  id: string,
  delta: 1 | -1,
) => {
  const key = queryKeys.profile(id);
  const prev = qc.getQueryData<UserProfile>(key);
  if (prev) {
    qc.setQueryData<UserProfile>(key, {
      ...prev,
      isFollowedByMe: delta === 1,
      followersCount: Math.max(0, prev.followersCount + delta),
    });
  }
  return prev;
};

export function useFollow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.follow(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: queryKeys.profile(id) });
      const prev = applyFollowDelta(qc, id, 1);
      return { prev, id };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKeys.profile(ctx.id), ctx.prev);
    },
    onSettled: (_d, _e, id) => {
      qc.invalidateQueries({ queryKey: queryKeys.profile(id) });
      qc.invalidateQueries({ queryKey: queryKeys.followers(id) });
      qc.invalidateQueries({
        queryKey: queryKeys.initiativesByAudience("following"),
      });
    },
  });
}

export function useUnfollow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.unfollow(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: queryKeys.profile(id) });
      const prev = applyFollowDelta(qc, id, -1);
      return { prev, id };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKeys.profile(ctx.id), ctx.prev);
    },
    onSettled: (_d, _e, id) => {
      qc.invalidateQueries({ queryKey: queryKeys.profile(id) });
      qc.invalidateQueries({ queryKey: queryKeys.followers(id) });
      qc.invalidateQueries({
        queryKey: queryKeys.initiativesByAudience("following"),
      });
    },
  });
}

export function useBlockUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.block(id),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: queryKeys.profile(id) });
      qc.invalidateQueries({ queryKey: ["initiatives"] });
    },
  });
}

export function useUnblockUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.unblock(id),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: queryKeys.profile(id) });
    },
  });
}
