/**
 * API client for the Touch Grass backend.
 *
 * DEMO_MODE = true  -> Runs everything locally on the phone (no server needed)
 * DEMO_MODE = false -> Connects to the real backend server
 */

import { demoApi } from "./demo";

// ============================================================
// Flip this to false when you have the real backend running
export const DEMO_MODE = true;
// ============================================================

const BASE_URL = "http://localhost:8000";

let authToken: string | null = null;

export function setAuthToken(token: string) {
  authToken = token;
}

export function clearAuthToken() {
  authToken = null;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

// Real API (talks to the FastAPI backend)
const realApi = {
  register(username: string, email: string, password: string) {
    return request("/users/register", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    });
  },

  login(username: string, password: string) {
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);

    return request<{ access_token: string }>("/users/login", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    });
  },

  getProfile() {
    return request("/users/me");
  },

  getLeaderboard(limit = 20) {
    return request(`/users/leaderboard?limit=${limit}`);
  },

  getNearbyLocations(latitude: number, longitude: number, radiusMeters = 5000) {
    return request(
      `/locations/nearby?latitude=${latitude}&longitude=${longitude}&radius_meters=${radiusMeters}`
    );
  },

  checkIn(locationId: number, latitude: number, longitude: number) {
    return request("/checkins/", {
      method: "POST",
      body: JSON.stringify({
        location_id: locationId,
        user_latitude: latitude,
        user_longitude: longitude,
      }),
    });
  },

  getCheckInHistory(limit = 50) {
    return request(`/checkins/history?limit=${limit}`);
  },

  getAchievements() {
    return request("/achievements/");
  },

  getMyAchievements() {
    return request("/achievements/mine");
  },
};

// Export whichever API is active
export const api = DEMO_MODE ? demoApi : realApi;
