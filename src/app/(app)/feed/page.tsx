"use client";

import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import MyLocationRoundedIcon from "@mui/icons-material/MyLocationRounded";
import { useInitiatives } from "@/lib/queries";
import { useUserLocation } from "@/lib/geolocation";
import { haversineKm } from "@/lib/distance";
import { FEED_RADIUS_KM } from "@/lib/scoring";
import { InitiativeCard } from "@/components/InitiativeCard";
import { EmptyState } from "@/components/EmptyState";
import { useLocationOverride } from "@/store/locationOverride";
import type { FeedAudience } from "@/types";

export default function FeedPage() {
  const [audience, setAudience] = useState<FeedAudience>("nearby");
  const { coords, loading, error, refresh } = useUserLocation();
  const initiatives = useInitiatives(audience);
  const setOverride = useLocationOverride((s) => s.set);
  const override = useLocationOverride((s) => s.coords);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [lat, setLat] = useState(coords.lat.toString());
  const [lng, setLng] = useState(coords.lng.toString());

  const nearby = useMemo(() => {
    if (audience !== "nearby") {
      return (initiatives.data ?? []).map((i) => ({
        i,
        d: haversineKm(coords.lat, coords.lng, i.lat, i.lng),
      }));
    }
    return (initiatives.data ?? [])
      .map((i) => ({
        i,
        d: haversineKm(coords.lat, coords.lng, i.lat, i.lng),
      }))
      .filter((x) => x.d <= FEED_RADIUS_KM)
      .sort((a, b) => {
        if (a.d !== b.d) return a.d - b.d;
        return (
          new Date(b.i.createdAt).getTime() - new Date(a.i.createdAt).getTime()
        );
      });
  }, [initiatives.data, coords, audience]);

  function applyOverride() {
    const a = parseFloat(lat);
    const b = parseFloat(lng);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return;
    setOverride({ lat: a, lng: b });
    setDialogOpen(false);
  }

  return (
    <Stack spacing={2}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={1}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Feed
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Initiatives within {FEED_RADIUS_KM} km of you.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            size="small"
            icon={<MyLocationRoundedIcon />}
            label={`${coords.source}: ${coords.lat.toFixed(3)}, ${coords.lng.toFixed(3)}`}
          />
          <Button
            size="small"
            onClick={() => {
              setLat(coords.lat.toString());
              setLng(coords.lng.toString());
              setDialogOpen(true);
            }}
          >
            Set location
          </Button>
          {override && (
            <Button size="small" onClick={() => setOverride(null)}>
              Clear
            </Button>
          )}
          <Button size="small" onClick={refresh} disabled={loading}>
            Refresh
          </Button>
        </Stack>
      </Stack>

      {error && coords.source === "fallback" && (
        <Alert severity="info">
          Showing fallback location (Pune). Allow GPS or set a location to see
          your area.
        </Alert>
      )}

      <Tabs
        value={audience}
        onChange={(_, v) => setAudience(v as FeedAudience)}
        variant="fullWidth"
      >
        <Tab value="nearby" label="Nearby" />
        <Tab value="following" label="Following" />
        <Tab value="trending" label="Trending" />
      </Tabs>

      {initiatives.isLoading ? (
        <Stack spacing={1.5}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={92} />
          ))}
        </Stack>
      ) : nearby.length === 0 ? (
        <EmptyState
          title={
            audience === "following"
              ? "No initiatives from people you follow"
              : "No initiatives within 5 km"
          }
          description={
            audience === "following"
              ? "Follow more people to see their initiatives here."
              : "Be the first to start one in your area."
          }
        />
      ) : (
        <Stack spacing={1.5}>
          {nearby.map(({ i, d }) => (
            <InitiativeCard key={i.id} initiative={i} distanceKm={d} />
          ))}
        </Stack>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Set location override</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1, minWidth: 280 }}>
            <TextField
              label="Latitude"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              type="number"
              inputProps={{ step: "any" }}
            />
            <TextField
              label="Longitude"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              type="number"
              inputProps={{ step: "any" }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={applyOverride}>
            Apply
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
