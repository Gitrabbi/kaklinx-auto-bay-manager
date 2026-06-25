import { describe, it, expect, vi, afterEach } from 'vitest';
import { calculateDistanceMeters, getCurrentLocation } from '@/lib/locationUtils';

describe('calculateDistanceMeters', () => {
  it('returns 0 for the same point', () => {
    expect(calculateDistanceMeters(0, 0, 0, 0)).toBe(0);
  });

  it('calculates distance between two known points (Accra to Kumasi ~250km)', () => {
    // Accra: 5.6037, -0.1870  |  Kumasi: 6.6885, -1.6244
    const distance = calculateDistanceMeters(5.6037, -0.187, 6.6885, -1.6244);
    // Approx 190-200km by Haversine (straight line, not road distance)
    expect(distance).toBeGreaterThan(180_000);
    expect(distance).toBeLessThan(210_000);
  });

  it('calculates short distances accurately', () => {
    // Two points ~111m apart (0.001 degrees latitude at equator)
    const distance = calculateDistanceMeters(0, 0, 0.001, 0);
    expect(distance).toBeGreaterThan(100);
    expect(distance).toBeLessThan(120);
  });

  it('is symmetric (a->b == b->a)', () => {
    const d1 = calculateDistanceMeters(5.6037, -0.187, 6.6885, -1.6244);
    const d2 = calculateDistanceMeters(6.6885, -1.6244, 5.6037, -0.187);
    expect(d1).toBeCloseTo(d2, 5);
  });

  it('handles antipodal points (max distance ~20000km)', () => {
    const distance = calculateDistanceMeters(0, 0, 0, 180);
    expect(distance).toBeGreaterThan(20_000_000);
    expect(distance).toBeLessThan(20_100_000);
  });

  it('handles negative latitudes and longitudes', () => {
    // Cape Town: -33.9249, 18.4241  |  Buenos Aires: -34.6037, -58.3816
    const distance = calculateDistanceMeters(-33.9249, 18.4241, -34.6037, -58.3816);
    // Approx 6900km
    expect(distance).toBeGreaterThan(6_800_000);
    expect(distance).toBeLessThan(7_000_000);
  });
});

describe('getCurrentLocation', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects when window is undefined (server-side)', async () => {
    const windowSpy = vi.spyOn(globalThis, 'window', 'get');
    windowSpy.mockReturnValue(undefined as unknown as Window & typeof globalThis);

    await expect(getCurrentLocation()).rejects.toThrow('Geolocation is not supported');
  });

  it('rejects when geolocation is not available', async () => {
    Object.defineProperty(globalThis.navigator, 'geolocation', {
      value: undefined,
      configurable: true,
    });

    await expect(getCurrentLocation()).rejects.toThrow('Geolocation is not supported');
  });

  it('resolves with coordinates on success', async () => {
    const mockPosition = {
      coords: {
        latitude: 5.6037,
        longitude: -0.187,
        accuracy: 10,
      },
    };

    const mockGetCurrentPosition = vi.fn((success) => {
      success(mockPosition);
    });

    Object.defineProperty(globalThis.navigator, 'geolocation', {
      value: { getCurrentPosition: mockGetCurrentPosition },
      configurable: true,
    });

    const result = await getCurrentLocation();
    expect(result).toEqual({
      latitude: 5.6037,
      longitude: -0.187,
      accuracy: 10,
    });
  });

  it('rejects with permission denied message', async () => {
    const mockGetCurrentPosition = vi.fn((_success, error) => {
      error({ code: 1, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 });
    });

    Object.defineProperty(globalThis.navigator, 'geolocation', {
      value: { getCurrentPosition: mockGetCurrentPosition },
      configurable: true,
    });

    await expect(getCurrentLocation()).rejects.toThrow('Location permission was denied');
  });

  it('rejects with position unavailable message', async () => {
    const mockGetCurrentPosition = vi.fn((_success, error) => {
      error({ code: 2, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 });
    });

    Object.defineProperty(globalThis.navigator, 'geolocation', {
      value: { getCurrentPosition: mockGetCurrentPosition },
      configurable: true,
    });

    await expect(getCurrentLocation()).rejects.toThrow('location is currently unavailable');
  });

  it('rejects with timeout message', async () => {
    const mockGetCurrentPosition = vi.fn((_success, error) => {
      error({ code: 3, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 });
    });

    Object.defineProperty(globalThis.navigator, 'geolocation', {
      value: { getCurrentPosition: mockGetCurrentPosition },
      configurable: true,
    });

    await expect(getCurrentLocation()).rejects.toThrow('Location request timed out');
  });
});
