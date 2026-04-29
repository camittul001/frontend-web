"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface OverrideCoords {
  lat: number;
  lng: number;
  label?: string;
}

interface LocationOverrideState {
  coords: OverrideCoords | null;
  set: (c: OverrideCoords | null) => void;
}

// Persisted manual override of the feed location for users who decline
// browser GPS or are on desktop without geolocation.
export const useLocationOverride = create<LocationOverrideState>()(
  persist(
    (set) => ({
      coords: null,
      set: (coords) => set({ coords }),
    }),
    { name: "a2n.locationOverride" },
  ),
);
