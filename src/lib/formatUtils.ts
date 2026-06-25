/**
 * Shared formatting utilities for currency and numbers.
 */

/** Formats a numeric value as Ghana Cedi currency string (e.g. "GH₵ 12.50"). */
export function formatCurrency(value: number): string {
  return `GH₵ ${Number(value || 0).toFixed(2)}`;
}
