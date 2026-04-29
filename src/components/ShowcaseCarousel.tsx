"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Button,
  Card,
  CardActionArea,
  Chip,
  Skeleton,
  Stack,
  Typography,
  alpha,
} from "@mui/material";
import GroupRoundedIcon from "@mui/icons-material/GroupRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import { useTheme } from "@mui/material/styles";
import { publicApi } from "@/lib/api/public";
import { maybePhotoUrl } from "@/lib/media-url";
import { CATEGORY_LABEL } from "@/types";
import type { ShowcaseItem } from "@/types";

interface Props {
  city?: string | null;
  limit?: number;
}

/**
 * "Recent impact in {city}" rail — public-readable carousel of confirmed
 * initiatives with before/after photos. Renders for logged-out visitors
 * too; paired with the `<EmptyState />` only when the API returns zero
 * rows even after backfill.
 *
 * Data is loaded via react-query so navigating away and back doesn't
 * re-pay the Lambda call within the 30s staleTime configured in
 * providers.tsx.
 */
export function ShowcaseCarousel({ city, limit = 10 }: Props) {
  const q = useQuery({
    queryKey: ["showcase", city ?? null, limit],
    queryFn: () => publicApi.showcase({ city, limit }),
    // Showcase is content-driven and doesn't need second-by-second freshness;
    // cap at 60s on the client too.
    staleTime: 60_000,
  });

  const headingScope = city
    ? q.data?.backfilled
      ? "across the country"
      : `in ${city}`
    : "across the country";

  return (
    <Box>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 1.5 }}
      >
        <Typography variant="h6" fontWeight={700}>
          Recent impact {headingScope}
        </Typography>
      </Stack>

      {q.isLoading ? (
        <CarouselRow>
          {[0, 1, 2].map((i) => (
            <CardShell key={i}>
              <Skeleton variant="rectangular" height={160} />
              <Box sx={{ p: 1.5 }}>
                <Skeleton width="80%" />
                <Skeleton width="40%" />
              </Box>
            </CardShell>
          ))}
        </CarouselRow>
      ) : q.error ? (
        <Typography color="error.main" variant="body2">
          Couldn&apos;t load the showcase. Pull to refresh.
        </Typography>
      ) : !q.data || q.data.items.length === 0 ? (
        <EmptyShowcase />
      ) : (
        <CarouselRow>
          {q.data.items.map((it) => (
            <ShowcaseCard key={it.id} item={it} />
          ))}
        </CarouselRow>
      )}
    </Box>
  );
}

function CarouselRow({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        display: "flex",
        gap: 1.5,
        overflowX: "auto",
        pb: 1.5,
        // Hide scrollbar visually but keep keyboard/touch scrolling.
        scrollSnapType: "x mandatory",
        "& > *": { scrollSnapAlign: "start", flex: "0 0 auto" },
        "&::-webkit-scrollbar": { height: 6 },
      }}
    >
      {children}
    </Box>
  );
}

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <Card
      sx={{
        width: { xs: 280, sm: 320 },
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      {children}
    </Card>
  );
}

function ShowcaseCard({ item }: { item: ShowcaseItem }) {
  const cityChip =
    item.addressComponents?.city ||
    item.addressComponents?.locality ||
    null;

  return (
    <CardShell>
      <CardActionArea
        component={Link}
        href={`/initiative/${item.id}/story`}
        sx={{ display: "block" }}
      >
        <BeforeAfterSplit
          beforeKey={item.beforePhoto}
          afterKey={item.afterPhoto}
        />
        <Box sx={{ p: 1.5 }}>
          <Stack direction="row" spacing={0.5} sx={{ mb: 0.5 }}>
            <Chip size="small" label={CATEGORY_LABEL[item.category]} />
            {cityChip && (
              <Chip
                size="small"
                variant="outlined"
                icon={<LocationOnRoundedIcon fontSize="small" />}
                label={cityChip}
              />
            )}
          </Stack>
          <Typography
            variant="subtitle1"
            fontWeight={700}
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {item.title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            by {item.createdByName || "Anonymous"}
          </Typography>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mt: 1 }}
          >
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <GroupRoundedIcon fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                {item.participantCount}{" "}
                {item.participantCount === 1 ? "person" : "people"}
              </Typography>
            </Stack>
            <Button size="small" variant="text">
              View story
            </Button>
          </Stack>
        </Box>
      </CardActionArea>
    </CardShell>
  );
}

function BeforeAfterSplit({
  beforeKey,
  afterKey,
}: {
  beforeKey: string | null;
  afterKey: string | null;
}) {
  const theme = useTheme();
  const before = maybePhotoUrl(beforeKey, "md");
  const after = maybePhotoUrl(afterKey, "md");
  return (
    <Box
      sx={{
        position: "relative",
        height: 160,
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        bgcolor: alpha(theme.palette.text.primary, 0.05),
      }}
    >
      <Half src={before} label="Before" />
      <Half src={after} label="After" />
      <Box
        sx={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: "50%",
          width: 2,
          bgcolor: "background.paper",
          opacity: 0.85,
        }}
      />
    </Box>
  );
}

function Half({ src, label }: { src: string | null; label: string }) {
  return (
    <Box
      sx={{
        position: "relative",
        backgroundImage: src ? `url(${src})` : "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: 8,
          left: 8,
          px: 0.75,
          py: 0.25,
          borderRadius: 0.5,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 0.5,
          textTransform: "uppercase",
          bgcolor: "rgba(0,0,0,0.55)",
          color: "common.white",
        }}
      >
        {label}
      </Box>
    </Box>
  );
}

function EmptyShowcase() {
  return (
    <Card variant="outlined" sx={{ p: 3, textAlign: "center" }}>
      <Typography variant="subtitle1" fontWeight={600}>
        No completed initiatives yet — be the first.
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        Start an initiative, do the work, post the after photo. Your story
        shows up here.
      </Typography>
    </Card>
  );
}
