"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useAuth } from "@/store/auth";

export default function EditProfilePage() {
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const saveProfile = useAuth((s) => s.saveProfile);
  const loading = useAuth((s) => s.loading);
  const [name, setName] = useState(user?.name ?? "");
  const [area, setArea] = useState(user?.area ?? "");
  const [city, setCity] = useState(user?.city ?? "");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await saveProfile({ name: name.trim(), area: area.trim(), city: city.trim() });
      router.replace("/home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        p: 2,
        bgcolor: "background.default",
      }}
    >
      <Card sx={{ width: "100%", maxWidth: 480 }}>
        <CardContent>
          <Stack spacing={2} component="form" onSubmit={onSubmit}>
            <Typography variant="h5" fontWeight={700}>
              Complete your profile
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tell us a bit about you so neighbors can recognize your work.
            </Typography>
            <TextField
              label="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <TextField
              label="Area / Neighborhood"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              required
            />
            <TextField
              label="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />
            {error && <Alert severity="error">{error}</Alert>}
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? "Saving…" : "Save and continue"}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
