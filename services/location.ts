import * as Location from 'expo-location';

export interface LocationSnapshot {
  latitude: number;
  longitude: number;
  accuracy: number | null;
}

export async function requestLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

export async function getCurrentLocation(): Promise<LocationSnapshot | null> {
  try {
    const granted = await requestLocationPermission();
    if (!granted) return null;

    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      accuracy: loc.coords.accuracy,
    };
  } catch {
    return null;
  }
}

/** Returns a compact string for the agent metadata, e.g. "37.7749,-122.4194" */
export async function getLocationString(): Promise<string | undefined> {
  const loc = await getCurrentLocation();
  if (!loc) return undefined;
  return `${loc.latitude.toFixed(6)},${loc.longitude.toFixed(6)}`;
}
