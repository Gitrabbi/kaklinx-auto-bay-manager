import { describe, it, expect } from 'vitest';
import { normalizeGhanaPhone } from '@/app/api/admin/create-user/route';

// Mock the supabase admin client used at module scope
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: { admin: { createUser: vi.fn() } },
    from: () => ({
      insert: () => ({ then: () => {} }),
    }),
  }),
}));

describe('normalizeGhanaPhone', () => {
  it('returns a number with + prefix unchanged', () => {
    expect(normalizeGhanaPhone('+233501234567')).toBe('+233501234567');
  });

  it('converts a local 0-prefixed number to international format', () => {
    expect(normalizeGhanaPhone('0501234567')).toBe('+233501234567');
  });

  it('adds + prefix to a 233-prefixed number', () => {
    expect(normalizeGhanaPhone('233501234567')).toBe('+233501234567');
  });

  it('strips spaces from the phone number', () => {
    expect(normalizeGhanaPhone('050 123 4567')).toBe('+233501234567');
  });

  it('strips dashes from the phone number', () => {
    expect(normalizeGhanaPhone('050-123-4567')).toBe('+233501234567');
  });

  it('strips both spaces and dashes', () => {
    expect(normalizeGhanaPhone('050 - 123 - 4567')).toBe('+233501234567');
  });

  it('handles an already-formatted international number with spaces', () => {
    expect(normalizeGhanaPhone('+233 50 123 4567')).toBe('+233501234567');
  });

  it('returns a non-standard number as-is after cleaning', () => {
    expect(normalizeGhanaPhone('1234567890')).toBe('1234567890');
  });
});
