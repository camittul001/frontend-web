"use client";

import {
  Box,
  Button,
  Chip,
  Container,
  Divider,
  IconButton,
  Snackbar,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import ShareRoundedIcon from "@mui/icons-material/ShareRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import GroupRoundedIcon from "@mui/icons-material/GroupRounded";
import { ReactCompareSlider, ReactCompareSliderImage } from "react-compare-slider";
import { useState } from "react";
import { photoUrl } from "@/lib/media-url";
import { CATEGORY_LABEL } from "@/types";
import type { InitiativeStory } from "@/types";

/**
 * Story page chrome. Server component fetches the data; this client
 * component handles the share button + the interactive before/after
 * slider. Renders for unauthenticated visitors — never call any /me/*
 * or auth-required APIs from here.
 */
export function StoryView({ story }: { story: InitiativeStory }) {
  const before = story.beforePhotos[0];
  const after = story.afterPhotos[0];
  const city =
    story.addressComponents?.city ||
    story.addressComponents?.locality ||
    null;

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, md: 4 } }}>
      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
        <Chip size="small" color="primary" label="Confirmed" />
        <Chip size="small" label={CATEGORY_LABEL[story.category]} />
        {city && (
          <Chip
            size="small"
            variant="outlined"
            icon={<LocationOnRoundedIcon fontSize="small" />}
            label={city}
          />
        )}
      </Stack>

      <Stack
        direction="row"
        alignItems="flex-start"
        justifyContent="space-between"
        spacing={1}
      >
        <Typography variant="h4" fontWeight={800}>
          {story.title}
        </Typography>
        <ShareButton title={story.title} />
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        Hosted by {story.createdByName || "Anonymous"}
        {story.completedAt
          ? ` · Completed ${formatDate(story.completedAt)}`
          : null}
      </Typography>

      {before && after ? (
        <Box sx={{ mt: 2, borderRadius: 2, overflow: "hidden" }}>
          <ReactCompareSlider
            itemOne={
              <ReactCompareSliderImage
                src={photoUrl(before, "full")}
                alt="Before"
              />
            }
            itemTwo={
              <ReactCompareSliderImage
                src={photoUrl(after, "full")}
                alt="After"
              />
            }
            // Slightly off-center so the after side reads first — the
            // reveal is the point of the page.
            position={45}
          />
        </Box>
      ) : after ? (
        // If we only have one of the two photos, fall back to a flat
        // image so the page still has a hero.
        <Box
          component="img"
          src={photoUrl(after, "full")}
          alt={story.title}
          sx={{
            mt: 2,
            width: "100%",
            borderRadius: 2,
            display: "block",
          }}
        />
      ) : null}

      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        sx={{ mt: 2, color: "text.secondary" }}
      >
        <Stack direction="row" spacing={0.5} alignItems="center">
          <GroupRoundedIcon fontSize="small" />
          <Typography variant="body2">
            {story.participantCount} {story.participantCount === 1 ? "person" : "people"} took part
          </Typography>
        </Stack>
      </Stack>

      <Divider sx={{ my: 3 }} />

      <Typography
        variant="body1"
        sx={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}
      >
        {story.description}
      </Typography>

      {story.sponsors.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="overline" color="text.secondary">
            Sponsored by
          </Typography>
          <Stack
            direction="row"
            spacing={3}
            alignItems="center"
            sx={{ mt: 1, flexWrap: "wrap", rowGap: 2 }}
          >
            {story.sponsors.map((s) => {
              const logo = photoUrl(s.logoKey, "thumb");
              const inner = (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <Box
                    component="img"
                    src={logo}
                    alt={s.name}
                    sx={{ height: 32, width: "auto" }}
                  />
                  <Typography variant="body2" fontWeight={600}>
                    {s.name}
                  </Typography>
                </Box>
              );
              if (s.websiteUrl) {
                return (
                  <a
                    key={`${s.name}-${s.logoKey}`}
                    href={s.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    {inner}
                  </a>
                );
              }
              return <Box key={`${s.name}-${s.logoKey}`}>{inner}</Box>;
            })}
          </Stack>
        </Box>
      )}

      {(story.beforePhotos.length > 1 || story.afterPhotos.length > 1) && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="overline" color="text.secondary">
            Gallery
          </Typography>
          <Box
            sx={{
              mt: 1,
              display: "grid",
              gap: 1,
              gridTemplateColumns: {
                xs: "repeat(2, 1fr)",
                sm: "repeat(3, 1fr)",
              },
            }}
          >
            {[...story.beforePhotos, ...story.afterPhotos].map((k, i) => (
              <Box
                key={`${k}-${i}`}
                component="img"
                src={photoUrl(k, "md")}
                alt=""
                sx={{
                  width: "100%",
                  aspectRatio: "1 / 1",
                  objectFit: "cover",
                  borderRadius: 1,
                }}
              />
            ))}
          </Box>
        </Box>
      )}
    </Container>
  );
}

function ShareButton({ title }: { title: string }) {
  const [open, setOpen] = useState(false);
  const handleShare = async () => {
    const url =
      typeof window !== "undefined" ? window.location.href : "";
    // Use the Web Share API where available (mobile browsers),
    // fall back to clipboard everywhere else.
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (_) {
        // User dismissed or share unsupported — fall through to clipboard.
      }
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setOpen(true);
    }
  };
  return (
    <>
      <Tooltip title="Share">
        <IconButton onClick={handleShare} aria-label="Share story">
          <ShareRoundedIcon />
        </IconButton>
      </Tooltip>
      <Snackbar
        open={open}
        autoHideDuration={2500}
        onClose={() => setOpen(false)}
        message="Link copied"
      />
    </>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (_) {
    return iso;
  }
}
