import type { Obligation } from "@/lib/schemas/analysis";

const CRLF = "\r\n";
/** RFC 5545 limits content lines to 75 octets, excluding the line break. */
const MAX_LINE_OCTETS = 75;
const PRODUCT_ID = "-//ClauseWise//Obligations//EN";

/**
 * Escapes a TEXT value per RFC 5545: backslash, semicolon, comma and newlines.
 * @param value - raw text.
 */
export function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/**
 * Folds a content line at 75 octets, continuing with CRLF and a single space, without
 * splitting multi-byte characters.
 * @param line - one unfolded content line.
 */
export function foldIcsLine(line: string): string {
  const encoder = new TextEncoder();
  const parts: string[] = [];
  let current = "";
  let octets = 0;
  for (const char of line) {
    const size = encoder.encode(char).length;
    const limit = parts.length === 0 ? MAX_LINE_OCTETS : MAX_LINE_OCTETS - 1;
    if (octets + size > limit) {
      parts.push(current);
      current = "";
      octets = 0;
    }
    current += char;
    octets += size;
  }
  parts.push(current);
  return parts.join(`${CRLF} `);
}

const compactDate = (isoDate: string) => isoDate.replace(/-/g, "");

function nextDay(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

function utcStamp(now: Date): string {
  return now
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

/**
 * Builds an iCalendar file with one all-day event per obligation that has an absolute date.
 * Obligations with only relative deadlines cannot be placed on a calendar and are skipped.
 * @param obligations - verified obligations.
 * @param documentTitle - used in each event summary.
 * @param now - timestamp for DTSTAMP, injectable for tests.
 * @returns VCALENDAR text with CRLF line endings.
 */
export function buildIcs(
  obligations: readonly Obligation[],
  documentTitle: string,
  now = new Date(),
): string {
  const events = obligations
    .filter((item): item is Obligation & { dueDate: string } => item.dueDate !== null)
    .flatMap((item) => [
      "BEGIN:VEVENT",
      `UID:${item.id}-${compactDate(item.dueDate)}@clausewise`,
      `DTSTAMP:${utcStamp(now)}`,
      `DTSTART;VALUE=DATE:${compactDate(item.dueDate)}`,
      `DTEND;VALUE=DATE:${compactDate(nextDay(item.dueDate))}`,
      `SUMMARY:${escapeIcsText(`${item.party}: ${item.action}`)}`,
      `DESCRIPTION:${escapeIcsText(
        `${documentTitle}\nDeadline: ${item.deadline}\nIf missed: ${item.consequence}\nFrom the document: "${item.evidence.quote}"`,
      )}`,
      "END:VEVENT",
    ]);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:${PRODUCT_ID}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...events,
    "END:VCALENDAR",
  ];
  return lines.map(foldIcsLine).join(CRLF) + CRLF;
}
