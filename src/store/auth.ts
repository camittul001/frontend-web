"use client";

import {
  fetchAuthSession,
  fetchUserAttributes,
  getCurrentUser,
  signIn as amplifySignIn,
  signOut as amplifySignOut,
  signUp as amplifySignUp,
} from "aws-amplify/auth";
import { create } from "zustand";
import type { User } from "@/types";
import { saveProfile as apiSaveProfile } from "@/lib/api/auth";

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  init: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  saveProfile: (input: {
    name: string;
    area: string;
    city: string;
  }) => Promise<void>;
  refresh: () => Promise<void>;
}

const normalizeEmail = (raw: string) => raw.trim().toLowerCase();

async function loadCurrentUser(): Promise<User | null> {
  const session = await fetchAuthSession();
  if (!session.tokens?.idToken) return null;
  const cu = await getCurrentUser();
  const attrs = await fetchUserAttributes();
  const get = (k: string) => attrs[k] ?? "";
  return {
    id: cu.userId,
    name: get("name"),
    email: get("email"),
    area: get("custom:area") || null,
    city: get("custom:city") || null,
    profileCompleted: get("custom:profile_completed") === "true",
  };
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  loading: false,
  initialized: false,

  init: async () => {
    if (get().initialized) return;
    set({ loading: true });
    try {
      const u = await loadCurrentUser();
      set({ user: u });
    } catch {
      set({ user: null });
    } finally {
      set({ loading: false, initialized: true });
    }
  },

  signIn: async (email, password) => {
    set({ loading: true });
    try {
      const res = await amplifySignIn({
        username: normalizeEmail(email),
        password,
      });
      if (!res.isSignedIn) {
        throw new Error(`Sign-in incomplete: ${res.nextStep.signInStep}`);
      }
      const u = await loadCurrentUser();
      set({ user: u });
    } finally {
      set({ loading: false });
    }
  },

  signUp: async (email, password) => {
    set({ loading: true });
    try {
      const username = normalizeEmail(email);
      await amplifySignUp({
        username,
        password,
        options: {
          userAttributes: {
            email: username,
            "custom:profile_completed": "false",
          },
        },
      });
      // PreSignUp lambda auto-confirms in dev — sign in immediately.
      const res = await amplifySignIn({ username, password });
      if (!res.isSignedIn) {
        throw new Error(`Sign-in incomplete: ${res.nextStep.signInStep}`);
      }
      const u = await loadCurrentUser();
      set({ user: u });
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    await amplifySignOut();
    set({ user: null });
  },

  saveProfile: async (input) => {
    set({ loading: true });
    try {
      await apiSaveProfile(input);
      const u = await loadCurrentUser();
      set({ user: u });
    } finally {
      set({ loading: false });
    }
  },

  refresh: async () => {
    const u = await loadCurrentUser();
    set({ user: u });
  },
}));
