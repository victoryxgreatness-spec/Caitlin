/**
 * API client for the Touch Grass backend.
 *
 * Replace BASE_URL with your actual server address when deploying.
 */

const BASE_URL = "http://localhost:8000";

let authToken: string | null = null;

export function setAuthToken(token: string) {
  authToken = token;
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

// Auth
export const api = {
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

  // Locations
  getNearbyLocations(latitude: number, longitude: number, radiusMeters = 5000) {
    return request(
      `/locations/nearby?latitude=${latitude}&longitude=${longitude}&radius_meters=${radiusMeters}`
    );
  },

  // Check-ins
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

  // Achievements
  getAchievements() {
    return request("/achievements/");
  },

  getMyAchievements() {
    return request("/achievements/mine");
  },
};
