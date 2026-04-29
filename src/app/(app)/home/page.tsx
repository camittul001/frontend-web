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
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { useMemo } from "react";
import {
  useInitiatives,
  useLeaderboard,
  useMyInitiatives,
} from "@/lib/queries";
import { useAuth } from "@/store/auth";
import { useUserLocation } from "@/lib/geolocation";
import { haversineKm } from "@/lib/distance";
import { InitiativeCard } from "@/components/InitiativeCard";
import { EmptyState } from "@/components/EmptyState";
import type { Initiative } from "@/types";

export default function HomePage() {
  const user = useAuth((s) => s.user);
  const { coords } = useUserLocation();
  const initiatives = useInitiatives();
  const mine = useMyInitiatives();
  const leaderboard = useLeaderboard();

  const myUpcoming = useMemo<Initiative[]>(() => {
    const list = (mine.data ?? []).filter((i) => i.status !== "completed");
    return list
      .map((i) => ({
        i,
        d: haversineKm(coords.lat, coords.lng, i.lat, i.lng),
      }))
      .sort((a, b) => a.d - b.d)
      .map((x) => x.i);
  }, [mine.data, coords]);

  const openTop = useMemo<{ i: Initiative; d: number }[]>(() => {
    const myIds = new Set((mine.data ?? []).map((m) => m.id));
    return (initiatives.data ?? [])
      .filter((i) => i.status === "open" && !myIds.has(i.id))
      .map((i) => ({
        i,
        d: haversineKm(coords.lat, coords.lng, i.lat, i.lng),
      }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 5);
  }, [initiatives.data, mine.data, coords]);

  const myScore = useMemo(() => {
    if (!user) return 0;
    return (
      leaderboard.data?.find((e) => e.user.id === user.id)?.score ?? 0
    );
  }, [leaderboard.data, user]);

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={1}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Welcome{user?.name ? `, ${user.name.split(" ")[0]}` : ""}!
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Make your area better, one initiative at a time.
          </Typography>
        </Box>
        <Button
          component={Link}
          href="/initiative/new"
          variant="contained"
          color="warning"
          startIcon={<AddRoundedIcon />}
        >
          New initiative
        </Button>
      </Stack>

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "repeat(2, 1fr)",
            md: "repeat(4, 1fr)",
          },
        }}
      >
        <StatCard label="My points" value={myScore} loading={leaderboard.isLoading} />
        <StatCard
          label="Joined"
          value={mine.data?.length ?? 0}
          loading={mine.isLoading}
        />
        <StatCard
          label="Upcoming"
          value={myUpcoming.length}
          loading={mine.isLoading}
        />
        <StatCard
          label="Open nearby"
          value={openTop.length}
          loading={initiatives.isLoading}
        />
      </Box>

      <Section title="My upcoming events">
        {mine.isLoading ? (
          <SkeletonList />
        ) : myUpcoming.length === 0 ? (
          <EmptyState
            title="Nothing scheduled"
            description="Join or create an initiative to see it here."
          />
        ) : (
          <Stack spacing={1.5}>
            {myUpcoming.slice(0, 5).map((i) => (
              <InitiativeCard
                key={i.id}
                initiative={i}
                distanceKm={haversineKm(coords.lat, coords.lng, i.lat, i.lng)}
              />
            ))}
          </Stack>
        )}
      </Section>

      <Section title="Open near you">
        {initiatives.isLoading ? (
          <SkeletonList />
        ) : openTop.length === 0 ? (
          <EmptyState title="No open initiatives nearby" />
        ) : (
          <Stack spacing={1.5}>
            {openTop.map(({ i, d }) => (
              <InitiativeCard key={i.id} initiative={i} distanceKm={d} />
            ))}
          </Stack>
        )}
      </Section>
    </Stack>
  );
}

function StatCard({
  label,
  value,
  loading,
}: {
  label: string;
  value: number;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardContent>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h5" fontWeight={700}>
          {loading ? <Skeleton width={48} /> : value}
        </Typography>
      </CardContent>
    </Card>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5 }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

function SkeletonList() {
  return (
    <Stack spacing={1.5}>
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} variant="rounded" height={92} />
      ))}
    </Stack>
  );
}
