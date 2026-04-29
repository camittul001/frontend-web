"use client";

import { api } from "./client";

// POST /auth/profile — backend persists name/area/city + flips
// custom:profile_completed. Mirrors AuthRepository.saveProfile in
// frontend_mobile/lib/data/repositories/auth_repository.dart.
export async function saveProfile(input: {
  name: string;
  area: string;
  city: string;
}): Promise<void> {
  await api.post<unknown>("/auth/profile", input);
}
