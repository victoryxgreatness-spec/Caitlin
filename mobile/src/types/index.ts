/** Core types shared across the mobile app. */

export interface User {
  id: number;
  username: string;
  email: string;
  total_points: number;
  created_at: string;
}

export interface Location {
  id: number;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  point_value: number;
  category: string;
  created_at: string;
}

export interface NearbyLocation extends Location {
  distance_meters: number;
}

export interface CheckInResponse {
  id: number;
  location_id: number;
  location_name: string;
  distance_meters: number;
  points_awarded: number;
  checked_in_at: string;
  new_achievements: string[];
}

export interface CheckInHistory {
  id: number;
  location_name: string;
  points_awarded: number;
  distance_meters: number;
  checked_in_at: string;
}

export interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string | null;
  category: string;
  requirement_type: string;
  requirement_value: number;
  bonus_points: number;
}

export interface UserAchievement {
  achievement: Achievement;
  earned_at: string;
}

export interface LeaderboardEntry {
  username: string;
  total_points: number;
  rank: number;
}
