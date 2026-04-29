"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
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
  ensureGoogleMapsLoaded,
  extractAddressComponents,
  geocodeByAddress,
  GOOGLE_PLACES_COUNTRY,
  reverseGeocode,
  type ResolvedPlace,
} from "@/lib/places";
import {
  CATEGORY_LABEL,
  isSessionCategory,
  STATUS_LABEL,
  type Initiative,
  type InitiativeCategory,
  type InitiativeMode,
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
  "educational",
  "training",
  "awareness",
  "health_camp",
  "blood_donation",
  "skill_workshop",
  "other",
];
const STATUSES: InitiativeStatus[] = ["open", "inProgress", "completed"];

type PlaceOption = {
  placeId: string;
  label: string;
};

type GoogleServices = {
  autocomplete: google.maps.places.AutocompleteService;
  places: google.maps.places.PlacesService;
};

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
  const [locationInput, setLocationInput] = useState<string>(
    initial?.formattedAddress ?? initial?.address ?? "",
  );
  const [selectedLocation, setSelectedLocation] = useState<ResolvedPlace | null>(
    initial
      ? {
          lat: initial.lat,
          lng: initial.lng,
          placeId: initial.placeId,
          formattedAddress: initial.formattedAddress,
          addressComponents: initial.addressComponents,
        }
      : null,
  );
  const [locationOptions, setLocationOptions] = useState<PlaceOption[]>([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [mapsReady, setMapsReady] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [mapSelection, setMapSelection] = useState<ResolvedPlace | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const mapListenerRef = useRef<google.maps.MapsEventListener | null>(null);
  const servicesRef = useRef<GoogleServices | null>(null);
  const debounceTimerRef = useRef<number | null>(null);
  const [scheduledAt, setScheduledAt] = useState(
    toLocalInput(initial?.scheduledAt),
  );
  const [endAt, setEndAt] = useState(toLocalInput(initial?.endAt));
  const [sessionMode, setSessionMode] = useState<InitiativeMode | "">(
    initial?.mode ?? "",
  );
  const [meetingLink, setMeetingLink] = useState(initial?.meetingLink ?? "");
  const [agenda, setAgenda] = useState(initial?.agenda ?? "");
  const [requirements, setRequirements] = useState(initial?.requirements ?? "");
  const [targetAudience, setTargetAudience] = useState(
    initial?.targetAudience ?? "",
  );
  const [certificateOnCompletion, setCertificateOnCompletion] = useState(
    initial?.certificateOnCompletion ?? false,
  );
  const [organizingEntity, setOrganizingEntity] = useState(
    initial?.organizingEntity ?? "",
  );
  const [waitlistEnabled, setWaitlistEnabled] = useState(
    initial?.waitlistEnabled ?? false,
  );
  const [maxParticipants, setMaxParticipants] = useState<string>(
    initial?.maxParticipants ? String(initial.maxParticipants) : "",
  );
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const create = useCreateInitiative();
  const edit = useEditInitiative(initial?.id ?? "");
  const sessionCategory = isSessionCategory(category);
  const showMeetingLink =
    sessionCategory && sessionMode !== "" && sessionMode !== "in_person";

  useEffect(() => {
    let mounted = true;
    ensureGoogleMapsLoaded()
      .then((g) => {
        if (!mounted || !g?.maps?.places) return;
        servicesRef.current = {
          autocomplete: new g.maps.places.AutocompleteService(),
          places: new g.maps.places.PlacesService(document.createElement("div")),
        };
        setMapsReady(true);
      })
      .catch(() => {
        setMapsReady(false);
      });
    return () => {
      mounted = false;
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
      mapListenerRef.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (mode === "create" && !selectedLocation && typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const resolved = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          setSelectedLocation(
            resolved ?? {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              placeId: null,
              formattedAddress: null,
              addressComponents: null,
            },
          );
          if (resolved?.formattedAddress) {
            setLocationInput(resolved.formattedAddress);
          }
        },
        () => {},
        { timeout: 6000 },
      );
    }
  }, [mode, selectedLocation]);

  useEffect(() => {
    if (!mapsReady || !servicesRef.current) return;
    const query = locationInput.trim();
    if (!query || query.length < 3) {
      setLocationOptions([]);
      return;
    }
    setLocationLoading(true);
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = window.setTimeout(() => {
      servicesRef.current?.autocomplete.getPlacePredictions(
        {
          input: query,
          componentRestrictions: GOOGLE_PLACES_COUNTRY
            ? { country: GOOGLE_PLACES_COUNTRY }
            : undefined,
        },
        (predictions) => {
          setLocationLoading(false);
          setLocationOptions(
            (predictions ?? []).map((p) => ({
              placeId: p.place_id,
              label: p.description,
            })),
          );
        },
      );
    }, 250);
  }, [locationInput, mapsReady]);

  async function resolvePlaceById(placeId: string): Promise<ResolvedPlace | null> {
    const services = servicesRef.current;
    if (!services) return null;
    return new Promise((resolve) => {
      services.places.getDetails(
        {
          placeId,
          fields: ["place_id", "formatted_address", "geometry", "address_components"],
        },
        (place, status) => {
          if (
            status !== google.maps.places.PlacesServiceStatus.OK ||
            !place?.geometry?.location
          ) {
            resolve(null);
            return;
          }
          resolve({
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            placeId: place.place_id ?? placeId,
            formattedAddress: place.formatted_address ?? null,
            addressComponents: extractAddressComponents(place.address_components),
          });
        },
      );
    });
  }

  async function useMyLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const resolved = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        setSelectedLocation(
          resolved ?? {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            placeId: null,
            formattedAddress: null,
            addressComponents: null,
          },
        );
        if (resolved?.formattedAddress) {
          setLocationInput(resolved.formattedAddress);
        }
        setLocating(false);
      },
      (err) => {
        setError(err.message);
        setLocating(false);
      },
    );
  }

  useEffect(() => {
    if (!mapOpen || !mapsReady || !mapContainerRef.current) return;
    ensureGoogleMapsLoaded().then((g) => {
      if (!g || !mapContainerRef.current) return;
      const center = selectedLocation
        ? { lat: selectedLocation.lat, lng: selectedLocation.lng }
        : { lat: 18.5204, lng: 73.8567 };
      const map = new g.maps.Map(mapContainerRef.current, {
        center,
        zoom: 14,
        mapTypeControl: false,
        streetViewControl: false,
      });
      mapRef.current = map;
      const marker = new g.maps.Marker({
        map,
        position: center,
      });
      markerRef.current = marker;
      mapListenerRef.current?.remove();
      mapListenerRef.current = map.addListener("click", async (ev: google.maps.MapMouseEvent) => {
        const lat = ev.latLng?.lat();
        const lng = ev.latLng?.lng();
        if (typeof lat !== "number" || typeof lng !== "number") return;
        marker.setPosition({ lat, lng });
        const resolved = await reverseGeocode(lat, lng);
        setMapSelection(
          resolved ?? {
            lat,
            lng,
            placeId: null,
            formattedAddress: null,
            addressComponents: null,
          },
        );
      });
    });
  }, [mapOpen, mapsReady, selectedLocation]);

  function openMapPicker() {
    setMapSelection(selectedLocation);
    setMapOpen(true);
  }

  function confirmMapSelection() {
    if (!mapSelection) {
      setError("Tap a point on the map to select a location.");
      return;
    }
    setSelectedLocation(mapSelection);
    if (mapSelection.formattedAddress) {
      setLocationInput(mapSelection.formattedAddress);
    }
    setMapOpen(false);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    let resolvedLocation = selectedLocation;
    if (!resolvedLocation && locationInput.trim()) {
      resolvedLocation = await geocodeByAddress(locationInput.trim());
      if (resolvedLocation) {
        setSelectedLocation(resolvedLocation);
      }
    }
    if (!resolvedLocation && !locationInput.trim()) {
      setError("Location is required.");
      return;
    }
    if (!resolvedLocation && locationInput.trim()) {
      setError("Please pick a suggestion or select location on map.");
      return;
    }
    const trimmedMeetingLink = meetingLink.trim();
    if (showMeetingLink && trimmedMeetingLink && !/^https:\/\//i.test(trimmedMeetingLink)) {
      setError("Meeting link must be a valid HTTPS URL.");
      return;
    }
    const maxNum = maxParticipants ? parseInt(maxParticipants, 10) : null;
    const sessionPayload = sessionCategory
      ? {
          mode: sessionMode || null,
          meetingLink: showMeetingLink ? trimmedMeetingLink || null : null,
          agenda: agenda.trim() || null,
          requirements: requirements.trim() || null,
          targetAudience: targetAudience.trim() || null,
          certificateOnCompletion,
          organizingEntity: organizingEntity.trim() || null,
          waitlistEnabled,
        }
      : {
          mode: null,
          meetingLink: null,
          agenda: null,
          requirements: null,
          targetAudience: null,
          certificateOnCompletion: false,
          organizingEntity: null,
          waitlistEnabled: false,
        };

    try {
      if (mode === "create") {
        const created = await create.mutateAsync({
          title: title.trim(),
          description: description.trim(),
          category,
          lat: resolvedLocation?.lat ?? null,
          lng: resolvedLocation?.lng ?? null,
          scheduledAt: fromLocalInput(scheduledAt),
          endAt: fromLocalInput(endAt),
          address: locationInput.trim() || resolvedLocation?.formattedAddress || null,
          placeId: resolvedLocation?.placeId ?? null,
          formattedAddress: resolvedLocation?.formattedAddress ?? null,
          addressComponents: resolvedLocation?.addressComponents ?? null,
          ...sessionPayload,
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
          lat: resolvedLocation?.lat ?? null,
          lng: resolvedLocation?.lng ?? null,
          scheduledAt: fromLocalInput(scheduledAt),
          endAt: fromLocalInput(endAt),
          address: locationInput.trim() || resolvedLocation?.formattedAddress || null,
          placeId: resolvedLocation?.placeId ?? null,
          formattedAddress: resolvedLocation?.formattedAddress ?? null,
          addressComponents: resolvedLocation?.addressComponents ?? null,
          ...sessionPayload,
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
          <Autocomplete
            options={locationOptions}
            getOptionLabel={(opt) => opt.label}
            filterOptions={(x) => x}
            loading={locationLoading}
            inputValue={locationInput}
            onInputChange={(_, val, reason) => {
              setLocationInput(val);
              if (reason === "input") {
                setSelectedLocation(null);
              }
            }}
            onChange={async (_, option) => {
              if (!option) return;
              const resolved = await resolvePlaceById(option.placeId);
              if (!resolved) {
                setError("Could not resolve selected place.");
                return;
              }
              setSelectedLocation(resolved);
              setLocationInput(resolved.formattedAddress ?? option.label);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Location"
                required
                helperText={
                  selectedLocation
                    ? `Pinned: ${selectedLocation.lat.toFixed(5)}, ${selectedLocation.lng.toFixed(5)}`
                    : "Type to search places. If not found, pick from map."
                }
              />
            )}
          />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
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
              sx={{ minWidth: 180 }}
            >
              Use my location
            </Button>
            <Button
              variant="outlined"
              onClick={openMapPicker}
              disabled={!mapsReady}
            >
              Pick on map
            </Button>
          </Stack>
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
          {sessionCategory && (
            <Box
              sx={{
                borderRadius: 3,
                border: (theme) => `1px solid ${theme.palette.divider}`,
                bgcolor: "background.default",
                p: 2,
              }}
            >
              <Stack spacing={2}>
                <Box>
                  <Typography variant="h6" fontWeight={700}>
                    About this session
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tailor this initiative for workshops, training, awareness drives,
                    camps, and other session-based formats.
                  </Typography>
                </Box>
                <TextField
                  select
                  label="Mode"
                  value={sessionMode}
                  onChange={(e) => setSessionMode(e.target.value as InitiativeMode | "")}
                >
                  <MenuItem value="">Not specified</MenuItem>
                  <MenuItem value="in_person">In person</MenuItem>
                  <MenuItem value="online">Online</MenuItem>
                  <MenuItem value="hybrid">Hybrid</MenuItem>
                </TextField>
                {showMeetingLink && (
                  <TextField
                    label="Meeting link"
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                    placeholder="https://..."
                    helperText="Shown on the detail page and included in the calendar invite."
                  />
                )}
                <TextField
                  label="Agenda"
                  value={agenda}
                  onChange={(e) => setAgenda(e.target.value)}
                  multiline
                  minRows={4}
                  helperText="Markdown is supported."
                />
                <TextField
                  label="Requirements"
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  multiline
                  minRows={3}
                />
                <TextField
                  label="Target audience"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                />
                <TextField
                  label="Organizing entity"
                  value={organizingEntity}
                  onChange={(e) => setOrganizingEntity(e.target.value)}
                  helperText="Free text for the organizer, institution, or campaign lead."
                />
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={certificateOnCompletion}
                        onChange={(e) =>
                          setCertificateOnCompletion(e.target.checked)
                        }
                      />
                    }
                    label="Offer certificate of attendance"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={waitlistEnabled}
                        onChange={(e) => setWaitlistEnabled(e.target.checked)}
                      />
                    }
                    label="Enable waitlist when full"
                  />
                </Stack>
              </Stack>
            </Box>
          )}
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
          <Dialog
            open={mapOpen}
            onClose={() => setMapOpen(false)}
            fullWidth
            maxWidth="md"
          >
            <DialogTitle>Select location on map</DialogTitle>
            <DialogContent>
              <Box
                ref={mapContainerRef}
                sx={{ width: "100%", height: 420, borderRadius: 2, overflow: "hidden" }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Click on the map to drop a pin, then confirm.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setMapOpen(false)}>Cancel</Button>
              <Button variant="contained" onClick={confirmMapSelection}>
                Use this location
              </Button>
            </DialogActions>
          </Dialog>
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
