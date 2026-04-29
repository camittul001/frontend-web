// Wire shapes mirror frontend_mobile/lib/data/models/* — same JSON contract
// with the backend so data is consistent between web and mobile.

export type InitiativeCategory = "cleaning" | "repair" | "plantation" | "other";
export type InitiativeStatus = "open" | "inProgress" | "completed";
export type ParticipantRole = "host" | "cohost" | "participant";

export interface User {
  id: string;
  name: string;
  email: string;
  area: string | null;
  city: string | null;
  profileCompleted: boolean;
}

export interface Initiative {
  id: string;
  title: string;
  description: string;
  category: InitiativeCategory;
  lat: number;
  lng: number;
  status: InitiativeStatus;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string | null;
  updatedBy: string;
  updatedByName: string;
  scheduledAt: string | null;
  endAt: string | null;
  address: string | null;
  maxParticipants: number | null;
  tags: string[];
}

export interface Participant {
  id: string;
  userId: string;
  userName: string;
  initiativeId: string;
  role: ParticipantRole;
  joinedAt: string;
}

export interface Verification {
  id: string;
  userId: string;
  userName: string;
  initiativeId: string;
  timestamp: string;
}

export interface LeaderboardEntry {
  user: User;
  score: number;
  rank: number;
}

export const CATEGORY_LABEL: Record<InitiativeCategory, string> = {
  cleaning: "Cleaning",
  repair: "Repair",
  plantation: "Plantation",
  other: "Other",
};

export const STATUS_LABEL: Record<InitiativeStatus, string> = {
  open: "Open",
  inProgress: "In Progress",
  completed: "Completed",
};

export const ROLE_LABEL: Record<ParticipantRole, string> = {
  host: "Host",
  cohost: "Co-host",
  participant: "Participant",
};

// 'creator' is a legacy wire value (host/cohost rename).
export function normalizeRole(s: string | null | undefined): ParticipantRole {
  if (s === "host" || s === "creator") return "host";
  if (s === "cohost") return "cohost";
  return "participant";
}

export function normalizeStatus(
  s: string | null | undefined,
): InitiativeStatus {
  if (s === "inProgress") return "inProgress";
  if (s === "completed") return "completed";
  return "open";
}

export function normalizeCategory(
  s: string | null | undefined,
): InitiativeCategory {
  if (s === "cleaning") return "cleaning";
  if (s === "repair") return "repair";
  if (s === "plantation") return "plantation";
  return "other";
}
