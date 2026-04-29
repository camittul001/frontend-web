// Wire shapes mirror frontend_mobile/lib/data/models/* — same JSON contract
// with the backend so data is consistent between web and mobile.

export type InitiativeCategory =
  | "cleaning"
  | "repair"
  | "plantation"
  | "educational"
  | "training"
  | "awareness"
  | "health_camp"
  | "blood_donation"
  | "skill_workshop"
  | "other";
export type InitiativeMode = "in_person" | "online" | "hybrid";
export type InitiativeStatus =
  | "draft"
  | "open"
  | "inProgress"
  | "completed"
  | "confirmed"
  | "cancelled";
export type ParticipantRole = "host" | "cohost" | "participant" | "waitlisted";
export type PhotoKind = "before" | "after";

export interface TimelineEntry {
  at: string;
  byId: string;
  byName: string;
  from: InitiativeStatus;
  to: InitiativeStatus;
  reason?: string | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  area: string | null;
  city: string | null;
  profileCompleted: boolean;
}

export interface AddressComponents {
  city?: string;
  locality?: string;
  sublocality?: string;
  postalCode?: string;
  state?: string;
  country?: string;
}

export interface Sponsor {
  name: string;
  logoKey: string;
  websiteUrl?: string;
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
  placeId: string | null;
  formattedAddress: string | null;
  addressComponents: AddressComponents | null;
  mode: InitiativeMode | null;
  meetingLink: string | null;
  agenda: string | null;
  requirements: string | null;
  targetAudience: string | null;
  certificateOnCompletion: boolean;
  organizingEntity: string | null;
  waitlistEnabled: boolean;
  maxParticipants: number | null;
  tags: string[];
  beforePhotos: string[];
  afterPhotos: string[];
  sponsors: Sponsor[];
  participantCount: number;
  startedAt: string | null;
  completedAt: string | null;
  confirmedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  timeline: TimelineEntry[];
}

// Trimmed shape returned by GET /initiatives/showcase — what the
// home-page carousel card needs, nothing more. Full story data lives
// on InitiativeStory.
export interface ShowcaseItem {
  id: string;
  title: string;
  category: InitiativeCategory;
  createdBy: string;
  createdByName: string;
  completedAt: string | null;
  confirmedAt: string | null;
  beforePhoto: string | null;
  afterPhoto: string | null;
  sponsors: Sponsor[];
  participantCount: number;
  addressComponents: AddressComponents | null;
  formattedAddress: string | null;
}

export interface ShowcasePage {
  items: ShowcaseItem[];
  cursor: string | null;
  // Set when the requested city had too few rows and the API filled
  // the rest with other-city rows. The carousel surfaces this with a
  // subtle "Showing nationwide" label so the user knows.
  backfilled: boolean;
  city: string | null;
}

// Full payload from GET /initiatives/{id}/story — public, no auth.
// Equivalent to Initiative minus host-only edit fields.
export interface InitiativeStory {
  id: string;
  title: string;
  description: string;
  category: InitiativeCategory;
  status: InitiativeStatus;
  createdBy: string;
  createdByName: string;
  scheduledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  confirmedAt: string | null;
  address: string | null;
  formattedAddress: string | null;
  addressComponents: AddressComponents | null;
  tags: string[];
  beforePhotos: string[];
  afterPhotos: string[];
  sponsors: Sponsor[];
  timeline: TimelineEntry[];
  participantCount: number;
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

export type ProfileVisibility = "public" | "private";

export interface UserProfile {
  id: string;
  name: string;
  area: string | null;
  city: string | null;
  profileVisibility: ProfileVisibility;
  followersCount: number;
  followingCount: number;
  hostedCount: number;
  participatedCount: number;
  verifiedCount: number;
  isSelf: boolean;
  isFollowedByMe: boolean;
  isFollowingMe: boolean;
}

export interface FollowListEntry {
  id: string;
  name: string;
  createdAt: string;
}

export interface PageResponse<T> {
  items: T[];
  cursor: string | null;
}

export type FeedAudience = "nearby" | "following" | "trending";

export const CATEGORY_LABEL: Record<InitiativeCategory, string> = {
  cleaning: "Cleaning",
  repair: "Repair",
  plantation: "Plantation",
  educational: "Educational",
  training: "Training",
  awareness: "Awareness",
  health_camp: "Health Camp",
  blood_donation: "Blood Donation",
  skill_workshop: "Skill Workshop",
  other: "Other",
};

export const STATUS_LABEL: Record<InitiativeStatus, string> = {
  draft: "Draft",
  open: "Open",
  inProgress: "In Progress",
  completed: "Completed",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
};

export const ROLE_LABEL: Record<ParticipantRole, string> = {
  host: "Host",
  cohost: "Co-host",
  participant: "Participant",
  waitlisted: "Waitlisted",
};

export const SESSION_CATEGORIES: InitiativeCategory[] = [
  "educational",
  "training",
  "awareness",
  "health_camp",
  "blood_donation",
  "skill_workshop",
];

export const REGISTRATION_CATEGORIES: InitiativeCategory[] = [
  "educational",
  "training",
];

export function isSessionCategory(category: InitiativeCategory): boolean {
  return SESSION_CATEGORIES.includes(category);
}

export function getParticipationLabel(category: InitiativeCategory): string {
  return REGISTRATION_CATEGORIES.includes(category) ? "Register" : "Join initiative";
}

// 'creator' is a legacy wire value (host/cohost rename).
export function normalizeRole(s: string | null | undefined): ParticipantRole {
  if (s === "host" || s === "creator") return "host";
  if (s === "cohost") return "cohost";
  if (s === "waitlisted") return "waitlisted";
  return "participant";
}

export function normalizeStatus(
  s: string | null | undefined,
): InitiativeStatus {
  if (s === "draft") return "draft";
  if (s === "inProgress") return "inProgress";
  if (s === "completed") return "completed";
  if (s === "confirmed") return "confirmed";
  if (s === "cancelled") return "cancelled";
  return "open";
}

export function normalizeCategory(
  s: string | null | undefined,
): InitiativeCategory {
  if (s === "cleaning") return "cleaning";
  if (s === "repair") return "repair";
  if (s === "plantation") return "plantation";
  if (s === "educational") return "educational";
  if (s === "training") return "training";
  if (s === "awareness") return "awareness";
  if (s === "health_camp") return "health_camp";
  if (s === "blood_donation") return "blood_donation";
  if (s === "skill_workshop") return "skill_workshop";
  return "other";
}
