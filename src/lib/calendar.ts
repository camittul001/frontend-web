import { CATEGORY_LABEL, type Initiative } from "@/types";

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function formatUtcStamp(value: Date): string {
  return [
    value.getUTCFullYear(),
    pad(value.getUTCMonth() + 1),
    pad(value.getUTCDate()),
    "T",
    pad(value.getUTCHours()),
    pad(value.getUTCMinutes()),
    pad(value.getUTCSeconds()),
    "Z",
  ].join("");
}

function escapeIcs(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function buildDescription(initiative: Initiative): string {
  const blocks = [initiative.description.trim()];

  if (initiative.agenda?.trim()) {
    blocks.push(`Agenda\n${initiative.agenda.trim()}`);
  }
  if (initiative.requirements?.trim()) {
    blocks.push(`Requirements\n${initiative.requirements.trim()}`);
  }
  if (initiative.targetAudience?.trim()) {
    blocks.push(`Target audience\n${initiative.targetAudience.trim()}`);
  }
  if (initiative.organizingEntity?.trim()) {
    blocks.push(`Organized by\n${initiative.organizingEntity.trim()}`);
  }
  if (initiative.meetingLink?.trim()) {
    blocks.push(`Meeting link\n${initiative.meetingLink.trim()}`);
  }

  return blocks.filter(Boolean).join("\n\n");
}

export function buildInitiativeIcs(initiative: Initiative): string {
  if (!initiative.scheduledAt) {
    throw new Error("A scheduled start time is required to export a calendar file.");
  }

  const start = new Date(initiative.scheduledAt);
  if (Number.isNaN(start.getTime())) {
    throw new Error("The scheduled start time is invalid.");
  }

  const end = initiative.endAt ? new Date(initiative.endAt) : new Date(start.getTime() + 60 * 60 * 1000);
  const location = initiative.address ?? initiative.organizingEntity ?? null;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Area 2 Nation//Initiative//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${escapeIcs(`${initiative.id}@area2nation`)}`,
    `DTSTAMP:${formatUtcStamp(new Date())}`,
    `DTSTART:${formatUtcStamp(start)}`,
    `DTEND:${formatUtcStamp(end)}`,
    `SUMMARY:${escapeIcs(initiative.title)}`,
    `DESCRIPTION:${escapeIcs(buildDescription(initiative))}`,
    `CATEGORIES:${escapeIcs(CATEGORY_LABEL[initiative.category])}`,
  ];

  if (location) {
    lines.push(`LOCATION:${escapeIcs(location)}`);
  }
  if (initiative.meetingLink) {
    lines.push(`URL:${escapeIcs(initiative.meetingLink)}`);
  }
  if (initiative.organizingEntity) {
    lines.push(`X-AREA2NATION-ORGANIZER:${escapeIcs(initiative.organizingEntity)}`);
  }

  lines.push(
    "BEGIN:VALARM",
    "TRIGGER:-PT30M",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeIcs(`Reminder: ${initiative.title}`)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  );

  return `${lines.join("\r\n")}\r\n`;
}

export function downloadInitiativeIcs(initiative: Initiative): void {
  const blob = new Blob([buildInitiativeIcs(initiative)], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${initiative.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "initiative"}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}