"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import MyLocationRoundedIcon from "@mui/icons-material/MyLocationRounded";
import {
  useCreateInitiative,
  useEditInitiative,
} from "@/lib/queries";
import {
  CATEGORY_LABEL,
  STATUS_LABEL,
  type Initiative,
  type InitiativeCategory,
  type InitiativeStatus,
} from "@/types";

interface Props {
  initial?: Initiative;
  mode: "create" | "edit";
}

const CATEGORIES: InitiativeCategory[] = [
  "cleaning",
  "repair",
  "plantation",
  "other",
];
const STATUSES: InitiativeStatus[] = ["open", "inProgress", "completed"];

// Convert an ISO string into the value format expected by
// <input type="datetime-local"> (YYYY-MM-DDTHH:mm in local time).
function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(s: string): string | null {
  if (!s) return null;
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function InitiativeForm({ initial, mode }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState<InitiativeCategory>(
    initial?.category ?? "cleaning",
  );
  const [status, setStatus] = useState<InitiativeStatus>(
    initial?.status ?? "open",
  );
  const [lat, setLat] = useState<string>(
    initial ? String(initial.lat) : "",
  );
  const [lng, setLng] = useState<string>(
    initial ? String(initial.lng) : "",
  );
  const [scheduledAt, setScheduledAt] = useState(
    toLocalInput(initial?.scheduledAt),
  );
  const [endAt, setEndAt] = useState(toLocalInput(initial?.endAt));
  const [address, setAddress] = useState(initial?.address ?? "");
  const [maxParticipants, setMaxParticipants] = useState<string>(
    initial?.maxParticipants ? String(initial.maxParticipants) : "",
  );
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const create = useCreateInitiative();
  const edit = useEditInitiative(initial?.id ?? "");

  useEffect(() => {
    if (mode === "create" && !lat && !lng && typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude.toString());
          setLng(pos.coords.longitude.toString());
        },
        () => {},
        { timeout: 6000 },
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function useMyLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toString());
        setLng(pos.coords.longitude.toString());
        setLocating(false);
      },
      (err) => {
        setError(err.message);
        setLocating(false);
      },
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
      setError("Latitude and longitude are required.");
      return;
    }
    const maxNum = maxParticipants ? parseInt(maxParticipants, 10) : null;

    try {
      if (mode === "create") {
        const created = await create.mutateAsync({
          title: title.trim(),
          description: description.trim(),
          category,
          lat: latNum,
          lng: lngNum,
          scheduledAt: fromLocalInput(scheduledAt),
          endAt: fromLocalInput(endAt),
          address: address.trim() || null,
          maxParticipants: maxNum,
          tags,
        });
        router.replace(`/initiative/${created.id}`);
      } else if (initial) {
        await edit.mutateAsync({
          title: title.trim(),
          description: description.trim(),
          category,
          status,
          lat: latNum,
          lng: lngNum,
          scheduledAt: fromLocalInput(scheduledAt),
          endAt: fromLocalInput(endAt),
          address: address.trim() || null,
          maxParticipants: maxNum,
          tags,
        });
        router.replace(`/initiative/${initial.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }

  const submitting = create.isPending || edit.isPending;

  return (
    <Card>
      <CardContent>
        <Stack spacing={2} component="form" onSubmit={onSubmit}>
          <Typography variant="h5" fontWeight={700}>
            {mode === "create" ? "New initiative" : "Edit initiative"}
          </Typography>
          <TextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            minRows={3}
            required
          />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              select
              label="Category"
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as InitiativeCategory)
              }
            >
              {CATEGORIES.map((c) => (
                <MenuItem key={c} value={c}>
                  {CATEGORY_LABEL[c]}
                </MenuItem>
              ))}
            </TextField>
            {mode === "edit" && (
              <TextField
                select
                label="Status"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as InitiativeStatus)
                }
              >
                {STATUSES.map((s) => (
                  <MenuItem key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </MenuItem>
                ))}
              </TextField>
            )}
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Latitude"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              type="number"
              inputProps={{ step: "any" }}
              required
            />
            <TextField
              label="Longitude"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              type="number"
              inputProps={{ step: "any" }}
              required
            />
            <Button
              variant="outlined"
              onClick={useMyLocation}
              disabled={locating}
              startIcon={
                locating ? (
                  <CircularProgress size={16} />
                ) : (
                  <MyLocationRoundedIcon />
                )
              }
              sx={{ minWidth: 160 }}
            >
              Use my location
            </Button>
          </Stack>
          <TextField
            label="Address (optional)"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Scheduled at"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Ends at"
              type="datetime-local"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
          <TextField
            label="Max participants (optional)"
            type="number"
            value={maxParticipants}
            onChange={(e) => setMaxParticipants(e.target.value)}
          />
          <Autocomplete
            multiple
            freeSolo
            options={[]}
            value={tags}
            onChange={(_, v) => setTags(v as string[])}
            renderInput={(params) => (
              <TextField {...params} label="Tags (press Enter to add)" />
            )}
          />
          <Box>
            <Typography variant="caption" color="text.secondary">
              Image upload is coming soon — initiatives are matched to verifiers
              by location and time for now.
            </Typography>
          </Box>
          {error && <Alert severity="error">{error}</Alert>}
          <Stack direction="row" spacing={2}>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              fullWidth
            >
              {submitting ? "Saving…" : mode === "create" ? "Create" : "Save"}
            </Button>
            <Button onClick={() => router.back()} disabled={submitting}>
              Cancel
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
