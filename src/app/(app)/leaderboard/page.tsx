"use client";

import {
  Avatar,
  Box,
  Card,
  CardContent,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useLeaderboard } from "@/lib/queries";
import { useAuth } from "@/store/auth";
import { EmptyState } from "@/components/EmptyState";

export default function LeaderboardPage() {
  const me = useAuth((s) => s.user);
  const { data, isLoading } = useLeaderboard();
  const theme = useTheme();
  const isCompact = useMediaQuery(theme.breakpoints.down("sm"));

  if (isLoading) {
    return (
      <Stack spacing={1.5}>
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} variant="rounded" height={56} />
        ))}
      </Stack>
    );
  }
  const entries = data ?? [];
  if (entries.length === 0) {
    return <EmptyState title="No scores yet" />;
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h5" fontWeight={700}>
        Leaderboard
      </Typography>

      {isCompact ? (
        <Stack spacing={1}>
          {entries.map((e) => {
            const isMe = e.user.id === me?.id;
            return (
              <Card key={e.user.id} sx={isMe ? { borderColor: "primary.main" } : undefined}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Typography
                      variant="h6"
                      fontWeight={700}
                      sx={{ width: 40 }}
                    >
                      #{e.rank}
                    </Typography>
                    <Avatar sx={{ bgcolor: "secondary.main" }}>
                      {(e.user.name || "?").slice(0, 1).toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography fontWeight={600} noWrap>
                        {e.user.name || "Unnamed"}{" "}
                        {isMe && (
                          <Box component="span" color="primary.main">
                            (you)
                          </Box>
                        )}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {e.user.city ?? ""}
                      </Typography>
                    </Box>
                    <Typography variant="h6" fontWeight={700} color="primary">
                      {e.score}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      ) : (
        <Card>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Rank</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>City</TableCell>
                <TableCell align="right">Score</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {entries.map((e) => {
                const isMe = e.user.id === me?.id;
                return (
                  <TableRow
                    key={e.user.id}
                    sx={isMe ? { bgcolor: "action.selected" } : undefined}
                  >
                    <TableCell>#{e.rank}</TableCell>
                    <TableCell>
                      {e.user.name || "Unnamed"}
                      {isMe && (
                        <Box component="span" color="primary.main" ml={1}>
                          (you)
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>{e.user.city ?? ""}</TableCell>
                    <TableCell align="right">
                      <strong>{e.score}</strong>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </Stack>
  );
}
