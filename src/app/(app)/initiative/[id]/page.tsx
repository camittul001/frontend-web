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
import { LifecycleActions } from "@/components/LifecycleActions";
import { PhotoUploader } from "@/components/PhotoUploader";
import { PhotoGrid } from "@/components/PhotoGrid";
import { BeforeAfterCompare } from "@/components/BeforeAfterCompare";
import { ActivityTimeline } from "@/components/ActivityTimeline";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import {
  CATEGORY_LABEL,
  getParticipationLabel,
  isSessionCategory,
  ROLE_LABEL,
  type InitiativeCategory,
  type Participant,
} from "@/types";
import { MIN_VERIFICATIONS_FOR_CONFIRMED } from "@/lib/scoring";
import { downloadInitiativeIcs } from "@/lib/calendar";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import LaunchRoundedIcon from "@mui/icons-material/LaunchRounded";
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

function categoryIcon(category: InitiativeCategory) {
  switch (category) {
    case "cleaning":
      return <CleaningServicesRoundedIcon />;
    case "repair":
      return <BuildRoundedIcon />;
    case "plantation":
      return <NatureRoundedIcon />;
    case "educational":
      return <MenuBookRoundedIcon />;
    case "training":
      return <SchoolRoundedIcon />;
    case "awareness":
      return <CampaignRoundedIcon />;
    case "health_camp":
      return <HealthAndSafetyRoundedIcon />;
    case "blood_donation":
      return <BloodtypeOutlinedIcon />;
    case "skill_workshop":
      return <HandymanRoundedIcon />;
    case "other":
    default:
      return <FlagRoundedIcon />;
  }
}

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
  const [photoTab, setPhotoTab] = useState<0 | 1 | 2>(0);

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
  const isFull =
    typeof i.maxParticipants === "number" && i.participantCount >= i.maxParticipants;
  const joinLabel = isFull && i.waitlistEnabled
    ? "Join waitlist"
    : getParticipationLabel(i.category);
  const joinPendingLabel = joinLabel === "Register"
    ? "Registering…"
    : joinLabel === "Join waitlist"
      ? "Joining waitlist…"
      : "Joining…";
  const hasSessionInfo = Boolean(
    i.mode ||
      i.meetingLink ||
      i.agenda ||
      i.requirements ||
      i.targetAudience ||
      i.organizingEntity ||
      i.certificateOnCompletion,
  );
  const showSessionSection = isSessionCategory(i.category) || hasSessionInfo;

  const cohosts = (participants.data ?? []).filter((p) => p.role === "cohost");
  const others = (participants.data ?? []).filter(
    (p) => p.role === "participant",
  );
  const waitlisted = (participants.data ?? []).filter(
    (p) => p.role === "waitlisted",
  );
  const host = (participants.data ?? []).find((p) => p.role === "host");
  const activeParticipantCount = (participants.data ?? []).filter(
    (p) => p.role !== "waitlisted",
  ).length;

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
                <Avatar sx={{ bgcolor: "primary.soft", color: "primary.main" }}>
                  {categoryIcon(i.category)}
                </Avatar>
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
            {typeof i.lat === "number" && typeof i.lng === "number" && (
              <Typography variant="body2">
                {i.lat.toFixed(4)}, {i.lng.toFixed(4)}
              </Typography>
            )}
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

          {(i.tags ?? []).length > 0 && (
            <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap" rowGap={1}>
              {(i.tags ?? []).map((t) => (
                <Chip key={t} label={t} size="small" />
              ))}
            </Stack>
          )}

          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

          {myParticipation?.role === "waitlisted" && (
            <Alert severity="info" sx={{ mt: 2 }}>
              You are currently on the waitlist. We will move you into the active list when a slot opens up.
            </Alert>
          )}

          {canManage && (
            <LifecycleActions
              initiative={i}
              role={isHost ? "host" : isCohost ? "cohost" : null}
            />
          )}

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            sx={{ mt: 3 }}
          >
            {!hasJoined && i.status !== "completed" && (
              <Button
                variant="contained"
                onClick={onJoin}
                disabled={join.isPending || Boolean(isFull && !i.waitlistEnabled)}
                fullWidth
              >
                {join.isPending ? joinPendingLabel : joinLabel}
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
          {!hasJoined && isFull && !i.waitlistEnabled && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
              This initiative is currently at capacity.
            </Typography>
          )}
        </CardContent>
      </Card>

      {showSessionSection && (
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                spacing={2}
              >
                <Box>
                  <Typography variant="h6" fontWeight={700}>
                    About this session
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Session-specific details for attendees, facilitators, and calendar planning.
                  </Typography>
                </Box>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                  {i.scheduledAt && (
                    <Button
                      variant="outlined"
                      startIcon={<DownloadRoundedIcon />}
                      onClick={() => downloadInitiativeIcs(i)}
                    >
                      Add to calendar
                    </Button>
                  )}
                  {i.meetingLink && (
                    <Button
                      component={Link}
                      href={i.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      variant="contained"
                      startIcon={<LaunchRoundedIcon />}
                    >
                      Open meeting link
                    </Button>
                  )}
                </Stack>
              </Stack>

              <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1}>
                {i.mode && (
                  <Chip label={`Mode: ${i.mode.replace("_", " ")}`} color="primary" variant="outlined" />
                )}
                {i.targetAudience && (
                  <Chip label={`Audience: ${i.targetAudience}`} variant="outlined" />
                )}
                {i.organizingEntity && (
                  <Chip label={`Organizer: ${i.organizingEntity}`} variant="outlined" />
                )}
              </Stack>

              {i.agenda && (
                <Box>
                  <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                    Agenda
                  </Typography>
                  <Typography sx={{ whiteSpace: "pre-wrap" }}>{i.agenda}</Typography>
                </Box>
              )}

              {i.requirements && (
                <Box>
                  <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                    Requirements
                  </Typography>
                  <Typography sx={{ whiteSpace: "pre-wrap" }}>{i.requirements}</Typography>
                </Box>
              )}

              <Box
                sx={{
                  borderRadius: 3,
                  border: (theme) => `1px dashed ${theme.palette.divider}`,
                  p: 2,
                  bgcolor: "background.default",
                }}
              >
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  justifyContent="space-between"
                  spacing={2}
                  alignItems={{ sm: "center" }}
                >
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700}>
                      Certificate of attendance
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {i.certificateOnCompletion
                        ? "Certificates are planned for v2 once host issuance is enabled."
                        : "This session does not currently issue attendance certificates."}
                    </Typography>
                  </Box>
                  <Button variant="outlined" disabled>
                    Coming in v2
                  </Button>
                </Stack>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={700}>
            Participants ({activeParticipantCount})
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
          {waitlisted.length > 0 && (
            <>
              <Divider sx={{ my: 1.5 }} />
              <Typography variant="subtitle1" fontWeight={700}>
                Waitlist ({waitlisted.length})
              </Typography>
              <List>
                {waitlisted.map((p) => (
                  <ParticipantRow key={p.id} p={p} canRemove={false} onRemove={() => {}} />
                ))}
              </List>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
            Photos
          </Typography>
          <Tabs
            value={photoTab}
            onChange={(_e, v) => setPhotoTab(v)}
            sx={{ mb: 2 }}
          >
            <Tab label={`Before (${(i.beforePhotos ?? []).length})`} />
            <Tab label={`After (${(i.afterPhotos ?? []).length})`} />
            <Tab
              label="Compare"
              disabled={
                (i.beforePhotos ?? []).length === 0 ||
                (i.afterPhotos ?? []).length === 0
              }
            />
          </Tabs>

          {photoTab === 0 && (
            <Stack spacing={2}>
              <PhotoGrid
                initiativeId={i.id}
                keys={i.beforePhotos ?? []}
                canEdit={canManage && i.status !== "completed" && i.status !== "confirmed" && i.status !== "cancelled"}
              />
              {canManage && i.status !== "completed" && i.status !== "confirmed" && i.status !== "cancelled" && (
                <PhotoUploader
                  initiativeId={i.id}
                  kind="before"
                  remainingSlots={Math.max(0, 8 - (i.beforePhotos ?? []).length)}
                />
              )}
            </Stack>
          )}
          {photoTab === 1 && (
            <Stack spacing={2}>
              <PhotoGrid
                initiativeId={i.id}
                keys={i.afterPhotos ?? []}
                canEdit={canManage && i.status !== "confirmed" && i.status !== "cancelled"}
              />
              {canManage && i.status !== "confirmed" && i.status !== "cancelled" && (
                <PhotoUploader
                  initiativeId={i.id}
                  kind="after"
                  remainingSlots={Math.max(0, 8 - (i.afterPhotos ?? []).length)}
                />
              )}
            </Stack>
          )}
          {photoTab === 2 &&
            (i.beforePhotos ?? []).length > 0 &&
            (i.afterPhotos ?? []).length > 0 && (
              <BeforeAfterCompare
                beforeKey={i.beforePhotos[0]}
                afterKey={i.afterPhotos[0]}
              />
            )}
        </CardContent>
      </Card>

      {(i.timeline ?? []).length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Activity
            </Typography>
            <ActivityTimeline entries={i.timeline ?? []} />
          </CardContent>
        </Card>
      )}

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
