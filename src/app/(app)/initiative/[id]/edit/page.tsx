"use client";

import { use } from "react";
import { Box, CircularProgress } from "@mui/material";
import { InitiativeForm } from "@/components/InitiativeForm";
import { useInitiative } from "@/lib/queries";

export default function EditInitiativePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data, isLoading } = useInitiative(id);

  if (isLoading || !data) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }
  return <InitiativeForm mode="edit" initial={data} />;
}
