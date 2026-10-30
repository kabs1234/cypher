import type { Status, TermType } from '@/api/types';

const SECONDS_PER_MINUTE = 60;

export const STATUS_LABELS: Readonly<Record<Status, string>> = {
  draft: 'Unverified draft',
  verified: 'Verified',
};

export const TERM_TYPE_LABELS: Readonly<Record<TermType, string>> = {
  slang: 'Slang',
  person: 'Person',
  place: 'Place',
  event: 'Event',
  brand: 'Brand',
  religion: 'Religion',
  other: 'Other',
};

export function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
  const seconds = totalSeconds % SECONDS_PER_MINUTE;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function parseOptionalNumber(value: string | number): number | null {
  if (typeof value === 'number') {
    return value;
  }
  return value.trim() === '' ? null : Number(value);
}

export function formatReferenceCount(count: number): string {
  if (count === 0) {
    return 'No references yet';
  }
  return count === 1 ? '1 reference' : `${count} references`;
}

export function splitSources(sources: string): ReadonlyArray<string> {
  return sources
    .split('\n')
    .map((source) => source.trim())
    .filter(Boolean);
}

export function formatSourceLabel(source: string): string {
  try {
    const url = new URL(source);
    return decodeURIComponent(
      `${url.hostname.replace(/^www\./, '')}${url.pathname}`,
    );
  } catch {
    return source;
  }
}

export function splitParagraphs(text: string): ReadonlyArray<string> {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}
