"use client";

import { useState } from "react";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import { useTransitionInitiative } from "@/lib/queries";
import type { Initiative, ParticipantRole } from "@/types";
import { ApiError } from "@/lib/api/client";

type To = "open" | "inProgress" | "completed" | "cancelled";

type Step = {
  to: To;
  label: string;
  hint?: string;
  enabled: boolean;
  variant: "contained" | "outlined";
  warn?: string;
  needsReason?: boolean;
};

function nextSteps(i: Initiative, role: ParticipantRole | null): Step[] {
  const status = i.status;
  const isHost = role === "host";
  const isEditor = isHost || role === "cohost";
  const beforeOk = (i.beforePhotos || []).length >= 1;
  const afterOk = (i.afterPhotos || []).length >= 1;

  if (status === "draft" && isHost) {
    return [{
      to: "open",
      label: "Publish",
      enabled: true,
      variant: "contained",
    }];
  }
  if (status === "open" && isEditor) {
    return [
      {
        to: "inProgress",
        label: "Mark as in progress",
        hint: beforeOk ? undefined : "Add at least 1 Before photo first",
        enabled: beforeOk,
        variant: "contained",
        warn: "Once started, the initiative will appear as in-progress to participants.",
      },
      ...(isHost
        ? ([{
            to: "cancelled" as To,
            label: "Cancel initiative",
            enabled: true,
            variant: "outlined" as const,
            needsReason: true,
            warn: "This cannot be undone.",
          }])
        : []),
    ];
  }
  if (status === "inProgress" && isEditor) {
    return [
      {
        to: "completed",
        label: "Mark as complete",
        hint: afterOk ? undefined : "Add at least 1 After photo first",
        enabled: afterOk,
        variant: "contained",
        warn: "Once completed, you can no longer edit the initiative.",
      },
      ...(isHost
        ? ([{
            to: "cancelled" as To,
            label: "Cancel initiative",
            enabled: true,
            variant: "outlined" as const,
            needsReason: true,
            warn: "This cannot be undone.",
          }])
        : []),
    ];
  }
  return [];
}

export function LifecycleActions({
  initiative,
  role,
}: {
  initiative: Initiative;
  role: ParticipantRole | null;
}) {
  const transition = useTransitionInitiative(initiative.id);
  const [pending, setPending] = useState<Step | null>(null);
  const [reason, setReason] = useState("");

  const steps = nextSteps(initiative, role);
  if (steps.length === 0) return null;

  const submit = async () => {
    if (!pending) return;
    try {
      await transition.mutateAsync({
        to: pending.to,
        ...(pending.needsReason && reason ? { reason } : {}),
      });
      setPending(null);
      setReason("");
    } catch (_e) {
      // Error rendered inline below.
    }
  };

  const errorBody =
    transition.error instanceof ApiError ? transition.error.body : null;

  return (
    <>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        sx={{ mt: 2 }}
      >
        {steps.map((s) => (
          <Button
            key={s.to}
            variant={s.variant}
            color={s.to === "cancelled" ? "error" : "primary"}
            disabled={!s.enabled || transition.isPending}
            onClick={() => setPending(s)}
            title={s.hint}
          >
            {s.label}
            {s.hint && !s.enabled ? ` — ${s.hint}` : ""}
          </Button>
        ))}
      </Stack>

      <Dialog
        open={!!pending}
        onClose={() => !transition.isPending && setPending(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirm: {pending?.label}</DialogTitle>
        <DialogContent>
          {pending?.warn && (
            <DialogContentText sx={{ mb: 2 }}>{pending.warn}</DialogContentText>
          )}
          {pending?.needsReason && (
            <TextField
              label="Reason (optional)"
              fullWidth
              multiline
              minRows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          )}
          {errorBody && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {errorBody}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            disabled={transition.isPending}
            onClick={() => setPending(null)}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color={pending?.to === "cancelled" ? "error" : "primary"}
            disabled={transition.isPending}
            onClick={submit}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
