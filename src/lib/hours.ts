export type ServiceHours =
  | { type: "always" }
  | { type: "onrequest" }
  | { type: "ranges"; ranges: { open: string; close: string }[] };

export type ServiceStatus = "open" | "closed" | "inactive";

export interface StatusResult {
  status: ServiceStatus;
  /** HH:MM (Europe/Rome) of the next opening/closing transition, if relevant */
  time?: string;
}

export interface StatusLabels {
  open: string;
  closed: string;
  onRequest: string;
  closesAt: string;
  opensAt: string;
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** Current wall-clock time in Europe/Rome, regardless of device timezone. */
function romeMinutesNow(date: Date): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Rome",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return hour * 60 + minute;
}

/** Current date in Europe/Rome, regardless of device timezone. */
export function romeDateNow(date: Date = new Date()): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  return {
    year: Number(parts.find((p) => p.type === "year")?.value ?? "0"),
    month: Number(parts.find((p) => p.type === "month")?.value ?? "1"),
    day: Number(parts.find((p) => p.type === "day")?.value ?? "1"),
  };
}

/** Year of the next occurrence of a month/day, given today's Rome date. */
export function nextOccurrenceYear(month: number, day: number, now: { year: number; month: number; day: number }): number {
  if (month < now.month || (month === now.month && day < now.day)) {
    return now.year + 1;
  }
  return now.year;
}

export function getServiceStatus(hours: ServiceHours, date: Date = new Date()): StatusResult {
  if (hours.type === "always") return { status: "open" };
  if (hours.type === "onrequest") return { status: "inactive" };

  const now = romeMinutesNow(date);

  for (const range of hours.ranges) {
    if (now >= toMinutes(range.open) && now < toMinutes(range.close)) {
      return { status: "open", time: range.close };
    }
  }

  const nextOpen = hours.ranges
    .map((r) => r.open)
    .filter((open) => toMinutes(open) > now)
    .sort((a, b) => toMinutes(a) - toMinutes(b))[0];

  return { status: "closed", time: nextOpen ?? hours.ranges[0]?.open };
}
