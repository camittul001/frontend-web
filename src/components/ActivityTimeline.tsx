"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { STATUS_LABEL } from "@/types";
import type { TimelineEntry } from "@/types";

function fmt(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function ActivityTimeline({ entries }: { entries: TimelineEntry[] }) {
  if (!entries || entries.length === 0) return null;

  return (
    <Stack spacing={1.5}>
      {entries.map((e, idx) => (
        <Box
          key={`${e.at}-${idx}`}
          sx={{
            position: "relative",
            pl: 3,
            "&::before": {
              content: '""',
              position: "absolute",
              left: 6,
              top: 6,
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: "primary.main",
            },
            "&::after":
              idx < entries.length - 1
                ? {
                    content: '""',
                    position: "absolute",
                    left: 9,
                    top: 18,
                    bottom: -8,
                    width: 2,
                    bgcolor: "divider",
                  }
                : undefined,
          }}
        >
          <Typography variant="body2">
            <strong>{e.byName || "Someone"}</strong>{" "}
            moved from <em>{STATUS_LABEL[e.from] ?? e.from}</em> to{" "}
            <em>{STATUS_LABEL[e.to] ?? e.to}</em>
          </Typography>
          {e.reason && (
            <Typography variant="caption" color="text.secondary">
              “{e.reason}”
            </Typography>
          )}
          <Typography variant="caption" color="text.secondary" display="block">
            {fmt(e.at)}
          </Typography>
        </Box>
      ))}
    </Stack>
  );
}
