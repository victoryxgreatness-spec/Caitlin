/**
 * Secure token storage using expo-secure-store.
 *
 * Stores the JWT token in the device's secure keychain (iOS) or
 * encrypted SharedPreferences (Android) so users stay logged in.
 */

import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "touch_grass_auth_token";

export async function saveToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function loadToken(): Promise<string | null> {
  return await SecureStore.getItemAsync(TOKEN_KEY);
}

export async function deleteToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
