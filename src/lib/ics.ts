import { nextOccurrenceYear, romeDateNow } from "@/lib/hours";

export interface EventDate {
  month: number;
  day: number;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Builds a `data:text/calendar` URI for an all-day event on the next occurrence of the given date(s). */
export function buildEventIcsUri(title: string, location: string, dates: EventDate[]): string {
  const now = romeDateNow();
  const next = dates
    .map((d) => ({ ...d, year: nextOccurrenceYear(d.month, d.day, now) }))
    .sort((a, b) => Date.UTC(a.year, a.month - 1, a.day) - Date.UTC(b.year, b.month - 1, b.day))[0];

  const start = `${next.year}${pad(next.month)}${pad(next.day)}`;
  const endDate = new Date(Date.UTC(next.year, next.month - 1, next.day + 1));
  const end = `${endDate.getUTCFullYear()}${pad(endDate.getUTCMonth() + 1)}${pad(endDate.getUTCDate())}`;
  const uid = `${start}-${title.replace(/[^a-z0-9]/gi, "")}@grandhotel.sm`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Grand Hotel San Marino//Concierge//IT",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTART;VALUE=DATE:${start}`,
    `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:${title}`,
    `LOCATION:${location}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return `data:text/calendar;charset=utf-8,${encodeURIComponent(lines.join("\r\n"))}`;
}
