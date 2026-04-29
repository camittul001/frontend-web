"use client";

import Link from "next/link";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import CleaningServicesRoundedIcon from "@mui/icons-material/CleaningServicesRounded";
import BuildRoundedIcon from "@mui/icons-material/BuildRounded";
import NatureRoundedIcon from "@mui/icons-material/NatureRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";
import HealthAndSafetyRoundedIcon from "@mui/icons-material/HealthAndSafetyRounded";
import BloodtypeOutlinedIcon from "@mui/icons-material/BloodtypeOutlined";
import HandymanRoundedIcon from "@mui/icons-material/HandymanRounded";
import FlagRoundedIcon from "@mui/icons-material/FlagRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import { StatusChip } from "./StatusChip";
import { CATEGORY_LABEL, type Initiative } from "@/types";
import { formatKm } from "@/lib/distance";

interface Props {
  initiative: Initiative;
  distanceKm?: number;
}

function categoryIcon(category: Initiative["category"]) {
  switch (category) {
    case "cleaning":
      return <CleaningServicesRoundedIcon fontSize="small" />;
    case "repair":
      return <BuildRoundedIcon fontSize="small" />;
    case "plantation":
      return <NatureRoundedIcon fontSize="small" />;
    case "educational":
      return <MenuBookRoundedIcon fontSize="small" />;
    case "training":
      return <SchoolRoundedIcon fontSize="small" />;
    case "awareness":
      return <CampaignRoundedIcon fontSize="small" />;
    case "health_camp":
      return <HealthAndSafetyRoundedIcon fontSize="small" />;
    case "blood_donation":
      return <BloodtypeOutlinedIcon fontSize="small" />;
    case "skill_workshop":
      return <HandymanRoundedIcon fontSize="small" />;
    case "other":
    default:
      return <FlagRoundedIcon fontSize="small" />;
  }
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
              <Chip
                size="small"
                icon={categoryIcon(initiative.category)}
                label={CATEGORY_LABEL[initiative.category]}
                variant="outlined"
              />
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
