"use client";

import { use } from "react";
import Link from "next/link";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import { useState } from "react";
import {
  useFollow,
  useUnfollow,
  useUserProfile,
} from "@/lib/queries";
import { ApiError } from "@/lib/api/client";

export default function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: profile, isLoading, error } = useUserProfile(id);
  const follow = useFollow();
  const unfollow = useUnfollow();
  const [tab, setTab] = useState<"hosted" | "joined" | "verified">("hosted");

  if (isLoading) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    const status = error instanceof ApiError ? error.status : 0;
    return (
      <Card>
        <CardContent>
          <Typography variant="h6">
            {status === 403
              ? "This profile is private"
              : status === 404
                ? "User not found"
                : "Could not load profile"}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (!profile) return null;

  const onFollowToggle = () => {
    if (profile.isFollowedByMe) unfollow.mutate(id);
    else follow.mutate(id);
  };

  const initial = (profile.name || "?").substring(0, 1).toUpperCase();

  return (
    <Stack spacing={3}>
      <Card>
        <CardContent>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Avatar sx={{ width: 72, height: 72, fontSize: 28 }}>
              {initial}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" fontWeight={700}>
                {profile.name || "—"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {[profile.area, profile.city].filter(Boolean).join(", ") ||
                  "No location"}
              </Typography>
              {profile.isFollowingMe && (
                <Chip
                  size="small"
                  label="Follows you"
                  sx={{ mt: 1 }}
                  variant="outlined"
                />
              )}
            </Box>
            {!profile.isSelf && (
              <Button
                variant={profile.isFollowedByMe ? "outlined" : "contained"}
                startIcon={
                  profile.isFollowedByMe ? <HowToRegIcon /> : <PersonAddIcon />
                }
                onClick={onFollowToggle}
                disabled={follow.isPending || unfollow.isPending}
              >
                {profile.isFollowedByMe ? "Following" : "Follow"}
              </Button>
            )}
          </Stack>

          <Stack direction="row" spacing={3} sx={{ mt: 3 }} flexWrap="wrap">
            <CountTile
              label="Followers"
              value={profile.followersCount}
              href={`/u/${id}/followers`}
            />
            <CountTile
              label="Following"
              value={profile.followingCount}
              href={`/u/${id}/following`}
            />
            <CountTile label="Hosted" value={profile.hostedCount} />
            <CountTile label="Joined" value={profile.participatedCount} />
            <CountTile label="Verified" value={profile.verifiedCount} />
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="fullWidth"
        >
          <Tab value="hosted" label="Hosted" />
          <Tab value="joined" label="Joined" />
          <Tab value="verified" label="Verified" />
        </Tabs>
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            {tab === "hosted" && "Initiatives this user has hosted."}
            {tab === "joined" && "Initiatives this user has joined."}
            {tab === "verified" && "Initiatives this user has verified."}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            (List view will populate from /me/initiatives style endpoint by
            user — coming next.)
          </Typography>
        </CardContent>
      </Card>
    </Stack>
  );
}

function CountTile({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href?: string;
}) {
  const inner = (
    <Box>
      <Typography variant="h6" fontWeight={700}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Box>
  );
  return href ? (
    <Box
      component={Link}
      href={href}
      sx={{ textDecoration: "none", color: "inherit" }}
    >
      {inner}
    </Box>
  ) : (
    inner
  );
}
