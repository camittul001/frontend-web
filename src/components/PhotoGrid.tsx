"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import ImageList from "@mui/material/ImageList";
import ImageListItem from "@mui/material/ImageListItem";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Button from "@mui/material/Button";
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import Tooltip from "@mui/material/Tooltip";
import { photoUrl } from "@/lib/api/media";
import { useDeletePhoto } from "@/lib/queries";

type Props = {
  initiativeId: string;
  keys: string[];
  /** When true, shows the delete affordance per tile. */
  canEdit: boolean;
};

export function PhotoGrid({ initiativeId, keys, canEdit }: Props) {
  const del = useDeletePhoto(initiativeId);
  const [confirmKey, setConfirmKey] = useState<string | null>(null);
  const [lightboxKey, setLightboxKey] = useState<string | null>(null);

  if (keys.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: "center", color: "text.secondary" }}>
        No photos yet.
      </Box>
    );
  }

  return (
    <>
      <ImageList cols={3} gap={8}>
        {keys.map((k) => (
          <ImageListItem key={k} sx={{ position: "relative" }}>
            <Box
              component="button"
              onClick={() => setLightboxKey(k)}
              sx={{
                p: 0,
                border: 0,
                background: "transparent",
                cursor: "pointer",
                width: "100%",
                aspectRatio: "1 / 1",
                overflow: "hidden",
                borderRadius: 1.5,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoUrl(k, "thumb")}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
                loading="lazy"
              />
            </Box>
            {canEdit && (
              <Tooltip title="Delete photo">
                <IconButton
                  size="small"
                  onClick={() => setConfirmKey(k)}
                  sx={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    bgcolor: "rgba(0,0,0,0.5)",
                    color: "white",
                    "&:hover": { bgcolor: "rgba(0,0,0,0.7)" },
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </ImageListItem>
        ))}
      </ImageList>

      <Dialog
        open={!!confirmKey}
        onClose={() => setConfirmKey(null)}
        maxWidth="xs"
      >
        <DialogTitle>Delete photo?</DialogTitle>
        <DialogContent>This permanently removes the image.</DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmKey(null)}>Cancel</Button>
          <Button
            color="error"
            disabled={del.isPending}
            onClick={async () => {
              if (!confirmKey) return;
              await del.mutateAsync(confirmKey);
              setConfirmKey(null);
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!lightboxKey}
        onClose={() => setLightboxKey(null)}
        maxWidth="lg"
        fullWidth
      >
        <DialogContent sx={{ p: 0, bgcolor: "black" }}>
          {lightboxKey && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl(lightboxKey, "full")}
              alt=""
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
