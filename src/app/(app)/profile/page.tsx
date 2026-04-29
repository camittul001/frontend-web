"use client";

import Link from "next/link";
import {
  Box,
  Button,
  Card,
  CardContent,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import { useLeaderboard, useMyInitiatives } from "@/lib/queries";
import { useAuth } from "@/store/auth";
import { useUserLocation } from "@/lib/geolocation";
import { haversineKm } from "@/lib/distance";
import { InitiativeCard } from "@/components/InitiativeCard";
import { EmptyState } from "@/components/EmptyState";

export default function ProfilePage() {
  const user = useAuth((s) => s.user);
  const mine = useMyInitiatives();
  const leaderboard = useLeaderboard();
  const { coords } = useUserLocation();

  const score =
    leaderboard.data?.find((e) => e.user.id === user?.id)?.score ?? 0;
  const rank =
    leaderboard.data?.find((e) => e.user.id === user?.id)?.rank ?? null;

  return (
    <Stack spacing={3}>
      <Card>
        <CardContent>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
          >
            <Box>
              <Typography variant="h5" fontWeight={700}>
                {user?.name || "Your profile"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.email}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {[user?.area, user?.city].filter(Boolean).join(", ") ||
                  "No location set"}
              </Typography>
            </Box>
            <Button
              component={Link}
              href="/profile/edit"
              variant="outlined"
              startIcon={<EditRoundedIcon />}
            >
              Edit profile
            </Button>
          </Stack>
          <Stack direction="row" spacing={3} sx={{ mt: 2 }}>
            <StatTile label="Points" value={score} />
            <StatTile label="Rank" value={rank ? `#${rank}` : "—"} />
            <StatTile label="Initiatives" value={mine.data?.length ?? 0} />
          </Stack>
        </CardContent>
      </Card>

      <Box>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5 }}>
          My initiatives
        </Typography>
        {mine.isLoading ? (
          <Stack spacing={1.5}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} variant="rounded" height={92} />
            ))}
          </Stack>
        ) : (mine.data ?? []).length === 0 ? (
          <EmptyState
            title="You haven't joined or created anything yet"
            description="Browse the feed to find initiatives nearby."
          />
        ) : (
          <Stack spacing={1.5}>
            {(mine.data ?? []).map((i) => (
              <InitiativeCard
                key={i.id}
                initiative={i}
                distanceKm={haversineKm(coords.lat, coords.lng, i.lat, i.lng)}
              />
            ))}
          </Stack>
        )}
      </Box>
    </Stack>
  );
}

function StatTile({ label, value }: { label: string; value: number | string }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h6" fontWeight={700}>
        {value}
      </Typography>
    </Box>
  );
}
