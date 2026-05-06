export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371e3;

  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) *
      Math.cos(φ2) *
      Math.sin(Δλ / 2) *
      Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function getCurrentLocation(): Promise<{
  latitude: number;
  longitude: number;
  accuracy?: number;
}> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation is not supported on this device/browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        let message = 'Unable to access your location.';

        if (error.code === error.PERMISSION_DENIED) {
          message =
            'Location permission was denied. Please allow location access in your browser settings.';
        }

        if (error.code === error.POSITION_UNAVAILABLE) {
          message =
            'Your location is currently unavailable. Turn on phone GPS/location and try outside or near a window.';
        }

        if (error.code === error.TIMEOUT) {
          message =
            'Location request timed out. Please turn on GPS/location and try again.';
        }

        reject(new Error(message));
      },
      {
        enableHighAccuracy: false,
        timeout: 30000,
        maximumAge: 60000,
      }
    );
  });
}
