import Constants from 'expo-constants';

// Where the API lives:
// 1. EXPO_PUBLIC_API_URL from mobile/.env (to try another server without changing app.json), or
// 2. "apiUrl" in app.json → expo.extra (the cloud server on Render), or
// 3. if both are empty, the same computer that runs `npx expo start`, port 4000
function detectApiUrl() {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '');
  const fromAppJson = Constants.expoConfig?.extra?.apiUrl;
  if (fromAppJson) return fromAppJson.replace(/\/$/, '');
  const hostUri = Constants.expoConfig?.hostUri; // e.g. "192.168.1.5:8081"
  if (hostUri) return `http://${hostUri.split(':')[0]}:4000`;
  return 'http://localhost:4000';
}

export const API_URL = detectApiUrl();

// Centre of Astana and the bounds the server accepts
export const ASTANA = { lat: 51.1282, lng: 71.4304 };
export const BOUNDS = { minLat: 51.0, maxLat: 51.3, minLng: 71.2, maxLng: 71.7 };
export const insideAstana = (lat, lng) =>
  lat >= BOUNDS.minLat && lat <= BOUNDS.maxLat && lng >= BOUNDS.minLng && lng <= BOUNDS.maxLng;
