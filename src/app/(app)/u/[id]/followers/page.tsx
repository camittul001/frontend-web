"use client";

import { use } from "react";
import Link from "next/link";
import {
  Avatar,
  Box,
  Button,
  Card,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import { useFollowers } from "@/lib/queries";

export default function FollowersListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const q = useFollowers(id);
  const items = (q.data?.pages ?? []).flatMap((p) => p.items);

  return (
    <Stack spacing={2}>
      <Typography variant="h6" fontWeight={700}>
        Followers
      </Typography>
      <Card>
        <List>
          {items.map((u) => (
            <ListItemButton
              key={u.id}
              component={Link}
              href={`/u/${u.id}`}
            >
              <ListItemAvatar>
                <Avatar>{(u.name || "?").charAt(0).toUpperCase()}</Avatar>
              </ListItemAvatar>
              <ListItemText primary={u.name || "Anonymous"} />
            </ListItemButton>
          ))}
        </List>
        {items.length === 0 && !q.isLoading && (
          <Box sx={{ p: 3, textAlign: "center" }}>
            <Typography color="text.secondary">No followers yet.</Typography>
          </Box>
        )}
        {q.hasNextPage && (
          <Box sx={{ p: 2, textAlign: "center" }}>
            <Button
              onClick={() => q.fetchNextPage()}
              disabled={q.isFetchingNextPage}
            >
              {q.isFetchingNextPage ? "Loading…" : "Load more"}
            </Button>
          </Box>
        )}
      </Card>
    </Stack>
  );
}
