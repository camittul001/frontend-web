"use client";

import { useEffect, useState } from "react";
import { useLocationOverride } from "@/store/locationOverride";

export interface Coords {
  lat: number;
  lng: number;
  source: "gps" | "override" | "fallback";
}

// Pune fallback — same default as frontend_mobile feed_provider.dart.
export const PUNE_FALLBACK: Coords = {
  lat: 18.5204,
  lng: 73.8567,
  source: "fallback",
};

export function useUserLocation(): {
  coords: Coords;
  loading: boolean;
  error: string | null;
  refresh: () => void;
} {
  const override = useLocationOverride((s) => s.coords);
  const [coords, setCoords] = useState<Coords>(
    override ? { ...override, source: "override" } : PUNE_FALLBACK,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (override) {
      setCoords({ ...override, source: "override" });
      return;
    }
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setCoords(PUNE_FALLBACK);
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          source: "gps",
        });
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setCoords(PUNE_FALLBACK);
        setLoading(false);
      },
      { timeout: 8000, maximumAge: 60_000 },
    );
  }, [override, tick]);

  return { coords, loading, error, refresh: () => setTick((t) => t + 1) };
}
