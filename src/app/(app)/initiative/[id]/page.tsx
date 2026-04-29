"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import GroupAddRoundedIcon from "@mui/icons-material/GroupAddRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import {
  useAddCohost,
  useDeleteInitiative,
  useInitiative,
  useJoinInitiative,
  useParticipants,
  useRemoveCohost,
  useVerifications,
  useVerifyInitiative,
} from "@/lib/queries";
import { useAuth } from "@/store/auth";
import { StatusChip } from "@/components/StatusChip";
import {
  CATEGORY_LABEL,
  ROLE_LABEL,
  type Participant,
} from "@/types";
import { MIN_VERIFICATIONS_FOR_CONFIRMED } from "@/lib/scoring";

export default function InitiativeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const me = useAuth((s) => s.user);
  const initiative = useInitiative(id);
  const participants = useParticipants(id);
  const verifications = useVerifications(id);
  const join = useJoinInitiative();
  const verify = useVerifyInitiative();
  const remove = useDeleteInitiative();
  const addCohost = useAddCohost(id);
  const removeCohost = useRemoveCohost(id);

  const [error, setError] = useState<string | null>(null);
  const [cohostOpen, setCohostOpen] = useState(false);
  const [cohostUserId, setCohostUserId] = useState("");
  const [cohostUserName, setCohostUserName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (initiative.isLoading || !initiative.data) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const i = initiative.data;
  const isHost = me?.id === i.createdBy;
  const myParticipation = participants.data?.find((p) => p.userId === me?.id);
  const isCohost = myParticipation?.role === "cohost";
  const canManage = isHost || isCohost;
  const hasJoined = !!myParticipation;
  const myVerification = verifications.data?.find((v) => v.userId === me?.id);
  const verifiedCount = verifications.data?.length ?? 0;
  const isConfirmed = verifiedCount >= MIN_VERIFICATIONS_FOR_CONFIRMED;

  const cohosts = (participants.data ?? []).filter((p) => p.role === "cohost");
  const others = (participants.data ?? []).filter(
    (p) => p.role === "participant",
  );
  const host = (participants.data ?? []).find((p) => p.role === "host");

  async function onJoin() {
    setError(null);
    try {
      await join.mutateAsync(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Join failed");
    }
  }
  async function onVerify() {
    setError(null);
    try {
      await verify.mutateAsync(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verify failed");
    }
  }
  async function onDelete() {
    setError(null);
    try {
      await remove.mutateAsync(id);
      router.replace("/home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }
  async function onAddCohost() {
    setError(null);
    try {
      await addCohost.mutateAsync({
        userId: cohostUserId.trim(),
        userName: cohostUserName.trim(),
      });
      setCohostOpen(false);
      setCohostUserId("");
      setCohostUserName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Add co-host failed");
    }
  }

  return (
    <Stack spacing={2}>
      <Card>
        <CardContent>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            spacing={1}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="h5" fontWeight={700}>
                  {i.title}
                </Typography>
                <StatusChip status={i.status} />
                {isConfirmed && (
                  <Chip
                    icon={<VerifiedRoundedIcon />}
                    label="Confirmed"
                    color="success"
                    size="small"
                  />
                )}
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {CATEGORY_LABEL[i.category]} · Hosted by{" "}
                {host?.userName ?? i.createdByName}
              </Typography>
            </Box>
            {isHost && (
              <Stack direction="row" spacing={1}>
                <Button
                  component={Link}
                  href={`/initiative/${i.id}/edit`}
                  startIcon={<EditRoundedIcon />}
                  variant="outlined"
                >
                  Edit
                </Button>
                <IconButton
                  color="error"
                  onClick={() => setConfirmDelete(true)}
                >
                  <DeleteRoundedIcon />
                </IconButton>
              </Stack>
            )}
          </Stack>

          <Typography sx={{ mt: 2, whiteSpace: "pre-wrap" }}>
            {i.description}
          </Typography>

          <Stack
            direction="row"
            flexWrap="wrap"
            spacing={2}
            sx={{ mt: 2, color: "text.secondary" }}
            rowGap={0.5}
          >
            {i.address && (
              <Box display="inline-flex" alignItems="center" gap={0.5}>
                <LocationOnRoundedIcon fontSize="inherit" />
                <Typography variant="body2">{i.address}</Typography>
              </Box>
            )}
            <Typography variant="body2">
              {i.lat.toFixed(4)}, {i.lng.toFixed(4)}
            </Typography>
            {i.scheduledAt && (
              <Typography variant="body2">
                Starts {new Date(i.scheduledAt).toLocaleString()}
              </Typography>
            )}
            {i.endAt && (
              <Typography variant="body2">
                Ends {new Date(i.endAt).toLocaleString()}
              </Typography>
            )}
            {i.maxParticipants && (
              <Typography variant="body2">
                Cap: {i.maxParticipants}
              </Typography>
            )}
          </Stack>

          {i.tags.length > 0 && (
            <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap" rowGap={1}>
              {i.tags.map((t) => (
                <Chip key={t} label={t} size="small" />
              ))}
            </Stack>
          )}

          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            sx={{ mt: 3 }}
          >
            {!hasJoined && i.status !== "completed" && (
              <Button
                variant="contained"
                onClick={onJoin}
                disabled={join.isPending}
                fullWidth
              >
                {join.isPending ? "Joining…" : "Join initiative"}
              </Button>
            )}
            {hasJoined && !myVerification && i.status !== "open" && (
              <Button
                variant="contained"
                color="success"
                onClick={onVerify}
                disabled={verify.isPending}
                startIcon={<VerifiedRoundedIcon />}
                fullWidth
              >
                {verify.isPending ? "Verifying…" : "Verify completion"}
              </Button>
            )}
            {canManage && (
              <Button
                variant="outlined"
                startIcon={<GroupAddRoundedIcon />}
                onClick={() => setCohostOpen(true)}
                fullWidth
              >
                Add co-host
              </Button>
            )}
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={700}>
            Participants ({participants.data?.length ?? 0})
          </Typography>
          <List>
            {host && (
              <ParticipantRow p={host} canRemove={false} onRemove={() => {}} />
            )}
            {cohosts.map((p) => (
              <ParticipantRow
                key={p.id}
                p={p}
                canRemove={isHost}
                onRemove={() => removeCohost.mutate(p.userId)}
              />
            ))}
            {others.map((p) => (
              <ParticipantRow key={p.id} p={p} canRemove={false} onRemove={() => {}} />
            ))}
            {(participants.data?.length ?? 0) === 0 && (
              <Typography variant="body2" color="text.secondary">
                No participants yet.
              </Typography>
            )}
          </List>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={700}>
            Verifications ({verifiedCount})
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {MIN_VERIFICATIONS_FOR_CONFIRMED} verifications needed to confirm
            completion.
          </Typography>
          <Divider sx={{ my: 1.5 }} />
          {(verifications.data ?? []).length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No verifications yet.
            </Typography>
          ) : (
            <List dense>
              {(verifications.data ?? []).map((v) => (
                <ListItem key={v.id} disableGutters>
                  <ListItemText
                    primary={v.userName}
                    secondary={new Date(v.timestamp).toLocaleString()}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Add co-host dialog */}
      <Dialog open={cohostOpen} onClose={() => setCohostOpen(false)}>
        <DialogTitle>Add co-host</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1, minWidth: 320 }}>
            <TextField
              label="User ID"
              value={cohostUserId}
              onChange={(e) => setCohostUserId(e.target.value)}
            />
            <TextField
              label="Display name"
              value={cohostUserName}
              onChange={(e) => setCohostUserName(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCohostOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={onAddCohost}
            disabled={addCohost.isPending}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm delete */}
      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <DialogTitle>Delete initiative?</DialogTitle>
        <DialogContent>
          <Typography>
            This cannot be undone. All participants and verifications will be
            removed.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(false)}>Cancel</Button>
          <Button color="error" onClick={onDelete} disabled={remove.isPending}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

function ParticipantRow({
  p,
  canRemove,
  onRemove,
}: {
  p: Participant;
  canRemove: boolean;
  onRemove: () => void;
}) {
  return (
    <ListItem
      disableGutters
      secondaryAction={
        canRemove ? (
          <IconButton edge="end" onClick={onRemove}>
            <DeleteRoundedIcon />
          </IconButton>
        ) : null
      }
    >
      <ListItemAvatar>
        <Avatar sx={{ bgcolor: "secondary.main" }}>
          {(p.userName || "?").slice(0, 1).toUpperCase()}
        </Avatar>
      </ListItemAvatar>
      <ListItemText primary={p.userName} secondary={ROLE_LABEL[p.role]} />
    </ListItem>
  );
}
