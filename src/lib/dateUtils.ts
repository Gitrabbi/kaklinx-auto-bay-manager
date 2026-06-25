/**
 * Shared date/time utility functions used across the application.
 */

/** Returns today's date as an ISO string (YYYY-MM-DD). */
export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

/** Returns the current hour (0–23). */
export function currentHour(): number {
  return new Date().getHours();
}

/** Formats an ISO timestamp to a date string (YYYY-MM-DD). Returns fallback if input is empty. */
export function formatDate(value?: string, fallback = ''): string {
  if (!value) return fallback;
  return new Date(value).toISOString().split('T')[0];
}

/** Formats an ISO timestamp to a localized time string (HH:MM). Returns fallback if input is empty. */
export function formatTime(value?: string, fallback = ''): string {
  if (!value) return fallback;
  return new Date(value).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Calculates hours between two ISO timestamps. Returns 0 if inputs are invalid or end <= start. */
export function calculateHours(start?: string, end?: string): number {
  if (!start || !end) return 0;
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (e <= s) return 0;
  return (e - s) / (1000 * 60 * 60);
}
