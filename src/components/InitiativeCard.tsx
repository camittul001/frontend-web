"use client";

import Link from "next/link";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Stack,
  Typography,
} from "@mui/material";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import { StatusChip } from "./StatusChip";
import { CATEGORY_LABEL, type Initiative } from "@/types";
import { formatKm } from "@/lib/distance";

interface Props {
  initiative: Initiative;
  distanceKm?: number;
}

export function InitiativeCard({ initiative, distanceKm }: Props) {
  return (
    <Card>
      <CardActionArea
        component={Link}
        href={`/initiative/${initiative.id}`}
        sx={{ p: 0 }}
      >
        <CardContent>
          <Stack direction="row" justifyContent="space-between" spacing={1}>
            <Typography variant="subtitle1" fontWeight={700} noWrap>
              {initiative.title}
            </Typography>
            <StatusChip status={initiative.status} />
          </Stack>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 0.5,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {initiative.description}
          </Typography>
          <Stack
            direction="row"
            flexWrap="wrap"
            spacing={2}
            sx={{ mt: 1.5, color: "text.secondary" }}
            rowGap={0.5}
          >
            <Box display="inline-flex" alignItems="center" gap={0.5}>
              <Typography variant="caption">
                {CATEGORY_LABEL[initiative.category]}
              </Typography>
            </Box>
            {initiative.address && (
              <Box display="inline-flex" alignItems="center" gap={0.5}>
                <LocationOnRoundedIcon fontSize="inherit" />
                <Typography variant="caption" noWrap>
                  {initiative.address}
                </Typography>
              </Box>
            )}
            {initiative.scheduledAt && (
              <Box display="inline-flex" alignItems="center" gap={0.5}>
                <EventRoundedIcon fontSize="inherit" />
                <Typography variant="caption">
                  {new Date(initiative.scheduledAt).toLocaleString()}
                </Typography>
              </Box>
            )}
            {distanceKm !== undefined && (
              <Typography variant="caption">{formatKm(distanceKm)}</Typography>
            )}
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
