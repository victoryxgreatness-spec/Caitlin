/**
 * Device location service.
 *
 * Wraps expo-location for getting the user's current GPS coordinates.
 */

import * as ExpoLocation from "expo-location";

export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy: number | null;
}

export async function requestLocationPermission(): Promise<boolean> {
  const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
  return status === "granted";
}

export async function getCurrentLocation(): Promise<Coordinates> {
  const hasPermission = await requestLocationPermission();
  if (!hasPermission) {
    throw new Error(
      "Location permission denied. Touch Grass needs your location to check you in!"
    );
  }

  const location = await ExpoLocation.getCurrentPositionAsync({
    accuracy: ExpoLocation.Accuracy.High,
  });

  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    accuracy: location.coords.accuracy,
  };
}
