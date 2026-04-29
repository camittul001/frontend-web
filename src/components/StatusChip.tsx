"use client";

import Chip from "@mui/material/Chip";
import type { InitiativeStatus } from "@/types";
import { STATUS_LABEL } from "@/types";
import { colors } from "@/theme/colors";

const COLOR: Record<InitiativeStatus, string> = {
  draft: "#6B7280",
  open: colors.statusOpen,
  inProgress: colors.statusInProgress,
  completed: colors.statusCompleted,
  confirmed: "#0EA5E9",
  cancelled: "#9CA3AF",
};

export function StatusChip({ status }: { status: InitiativeStatus }) {
  return (
    <Chip
      size="small"
      label={STATUS_LABEL[status]}
      sx={{
        bgcolor: COLOR[status],
        color: "#fff",
        fontWeight: 600,
      }}
    />
  );
}
