"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import imageCompression from "browser-image-compression";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import LinearProgress from "@mui/material/LinearProgress";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { uploadFile } from "@/lib/api/media";
import { useAttachPhotos } from "@/lib/queries";
import type { PhotoKind } from "@/types";

type Props = {
  initiativeId: string;
  kind: PhotoKind;
  disabled?: boolean;
  remainingSlots: number;
};

type Job = {
  id: string;
  name: string;
  progress: number; // 0..1
  status: "uploading" | "done" | "error";
  error?: string;
};

const ACCEPT = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
};

export function PhotoUploader({
  initiativeId,
  kind,
  disabled,
  remainingSlots,
}: Props) {
  const attach = useAttachPhotos(initiativeId);
  const [jobs, setJobs] = useState<Job[]>([]);

  const onDrop = useCallback(
    async (files: File[]) => {
      const accepted = files.slice(0, remainingSlots);
      if (!accepted.length) return;

      const initial: Job[] = accepted.map((f, i) => ({
        id: `${Date.now()}-${i}-${f.name}`,
        name: f.name,
        progress: 0,
        status: "uploading",
      }));
      setJobs((prev) => [...prev, ...initial]);

      const update = (id: string, patch: Partial<Job>) =>
        setJobs((prev) =>
          prev.map((j) => (j.id === id ? { ...j, ...patch } : j)),
        );

      const baseKeys: string[] = [];
      for (let i = 0; i < accepted.length; i++) {
        const file = accepted[i];
        const job = initial[i];
        try {
          const compressed = await imageCompression(file, {
            maxSizeMB: 2,
            maxWidthOrHeight: 2400,
            useWebWorker: true,
            initialQuality: 0.85,
          });
          const ct = (compressed.type || file.type).toLowerCase();
          const baseKey = await uploadFile(compressed, ct, (frac) =>
            update(job.id, { progress: frac }),
          );
          baseKeys.push(baseKey);
          update(job.id, { progress: 1, status: "done" });
        } catch (e) {
          update(job.id, {
            status: "error",
            error: e instanceof Error ? e.message : "upload failed",
          });
        }
      }

      if (baseKeys.length > 0) {
        try {
          await attach.mutateAsync({ kind, keys: baseKeys });
        } catch (e) {
          // Mark all done jobs as failed if attach failed.
          setJobs((prev) =>
            prev.map((j) =>
              baseKeys.includes(j.id) || j.status === "done"
                ? {
                    ...j,
                    status: "error",
                    error:
                      e instanceof Error ? e.message : "could not attach",
                  }
                : j,
            ),
          );
        }
      }
    },
    [attach, kind, remainingSlots],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPT,
    disabled: disabled || remainingSlots <= 0,
    multiple: true,
  });

  return (
    <Stack spacing={1.5}>
      <Box
        {...getRootProps()}
        sx={{
          border: "2px dashed",
          borderColor: isDragActive ? "primary.main" : "divider",
          borderRadius: 2,
          p: 3,
          textAlign: "center",
          bgcolor: isDragActive ? "action.hover" : "transparent",
          cursor: disabled || remainingSlots <= 0 ? "not-allowed" : "pointer",
          opacity: disabled || remainingSlots <= 0 ? 0.5 : 1,
          transition: "all 0.15s",
        }}
      >
        <input {...getInputProps()} />
        <CloudUploadIcon sx={{ fontSize: 36, color: "text.secondary" }} />
        <Typography variant="body2" sx={{ mt: 1 }}>
          {remainingSlots <= 0
            ? "Photo limit reached"
            : isDragActive
              ? "Drop to upload"
              : `Drop ${kind} photos here, or click to choose (up to ${remainingSlots} more)`}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          JPEG, PNG, WebP — max 10 MB each
        </Typography>
      </Box>

      {jobs.length > 0 && (
        <Stack spacing={1}>
          {jobs.map((j) => (
            <Box key={j.id}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="caption" noWrap sx={{ maxWidth: 240 }}>
                  {j.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {j.status === "error"
                    ? `Failed: ${j.error}`
                    : j.status === "done"
                      ? "Done"
                      : `${Math.round(j.progress * 100)}%`}
                </Typography>
              </Stack>
              <LinearProgress
                variant={
                  j.status === "uploading" ? "determinate" : "determinate"
                }
                value={j.status === "error" ? 100 : j.progress * 100}
                color={j.status === "error" ? "error" : "primary"}
                sx={{ mt: 0.5 }}
              />
            </Box>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
