/**
 * Demo mode — runs the entire app locally on the device.
 * No backend server needed. All data lives in memory.
 *
 * Set DEMO_MODE = true in api.ts to activate.
 */

import type {
  Achievement,
  CheckInHistory,
  CheckInResponse,
  LeaderboardEntry,
  NearbyLocation,
  User,
  UserAchievement,
} from "../types";

// ---- In-memory state ----

let demoUser: User | null = null;
let checkInHistory: CheckInHistory[] = [];
let earnedAchievementIds: Set<number> = new Set();
let nextCheckInId = 1;

// ---- Demo achievements ----

const ACHIEVEMENTS: Achievement[] = [
  {
    id: 1,
    name: "First Steps",
    description: "Complete your first check-in!",
    icon: "footprints",
    category: "general",
    requirement_type: "total_checkins",
    requirement_value: 1,
    bonus_points: 10,
  },
  {
    id: 2,
    name: "Getting Outside",
    description: "Check in at 3 different spots",
    icon: "sun",
    category: "general",
    requirement_type: "unique_locations",
    requirement_value: 3,
    bonus_points: 50,
  },
  {
    id: 3,
    name: "Grass Enthusiast",
    description: "Complete 5 total check-ins",
    icon: "seedling",
    category: "general",
    requirement_type: "total_checkins",
    requirement_value: 5,
    bonus_points: 100,
  },
  {
    id: 4,
    name: "Centurion",
    description: "Earn 100 total points",
    icon: "star",
    category: "general",
    requirement_type: "points_total",
    requirement_value: 100,
    bonus_points: 25,
  },
  {
    id: 5,
    name: "Park Ranger",
    description: "Check in at 3 parks",
    icon: "tree",
    category: "park",
    requirement_type: "category_checkins",
    requirement_value: 3,
    bonus_points: 75,
  },
  {
    id: 6,
    name: "High Roller",
    description: "Earn 500 total points",
    icon: "fire",
    category: "general",
    requirement_type: "points_total",
    requirement_value: 500,
    bonus_points: 100,
  },
];

// ---- Generate locations near the user ----

function generateNearbyLocations(
  lat: number,
  lng: number
): NearbyLocation[] {
  // Place demo spots within walking/short-driving distance of the user
  const spots = [
    { name: "Sunny Park", desc: "A nice green park nearby", cat: "park", pts: 30, dLat: 0.003, dLng: 0.002 },
    { name: "The Coffee Spot", desc: "Local coffee shop", cat: "business", pts: 15, dLat: -0.001, dLng: 0.004 },
    { name: "Riverside Walk", desc: "Scenic path along the water", cat: "park", pts: 35, dLat: 0.006, dLng: -0.003 },
    { name: "City Monument", desc: "Historic landmark downtown", cat: "monument", pts: 50, dLat: -0.005, dLng: -0.004 },
    { name: "The Town Square", desc: "Central gathering place", cat: "landmark", pts: 25, dLat: 0.001, dLng: -0.006 },
    { name: "Hilltop Overlook", desc: "Great view of the area", cat: "nature", pts: 60, dLat: 0.009, dLng: 0.007 },
    { name: "Community Garden", desc: "Touch real grass here", cat: "park", pts: 20, dLat: -0.002, dLng: 0.001 },
    { name: "Old Bridge", desc: "A bridge with character", cat: "landmark", pts: 30, dLat: 0.004, dLng: -0.008 },
  ];

  return spots.map((s, i) => {
    const spotLat = lat + s.dLat;
    const spotLng = lng + s.dLng;
    // Rough distance in meters (1 degree ≈ 111,000m)
    const dist = Math.sqrt(
      Math.pow(s.dLat * 111000, 2) + Math.pow(s.dLng * 111000 * Math.cos(lat * Math.PI / 180), 2)
    );

    return {
      id: i + 1,
      name: s.name,
      description: s.desc,
      latitude: spotLat,
      longitude: spotLng,
      point_value: s.pts,
      category: s.cat,
      created_at: new Date().toISOString(),
      distance_meters: Math.round(dist),
    };
  });
}

// Cache generated locations so they don't move between screens
let cachedLocations: NearbyLocation[] = [];

// ---- Check achievement logic ----

function checkNewAchievements(): string[] {
  if (!demoUser) return [];
  const newlyEarned: string[] = [];
  const uniqueLocations = new Set(checkInHistory.map((c) => c.location_name));

  for (const ach of ACHIEVEMENTS) {
    if (earnedAchievementIds.has(ach.id)) continue;

    let met = false;
    if (ach.requirement_type === "total_checkins") {
      met = checkInHistory.length >= ach.requirement_value;
    } else if (ach.requirement_type === "unique_locations") {
      met = uniqueLocations.size >= ach.requirement_value;
    } else if (ach.requirement_type === "points_total") {
      met = demoUser.total_points >= ach.requirement_value;
    } else if (ach.requirement_type === "category_checkins") {
      const catCount = cachedLocations
        .filter((l) => l.category === ach.category)
        .filter((l) => checkInHistory.some((c) => c.location_name === l.name))
        .length;
      met = catCount >= ach.requirement_value;
    }

    if (met) {
      earnedAchievementIds.add(ach.id);
      demoUser.total_points += ach.bonus_points;
      newlyEarned.push(ach.name);
    }
  }

  return newlyEarned;
}

// ---- Demo API (same interface as the real api) ----

export const demoApi = {
  register(username: string, email: string, _password: string) {
    demoUser = {
      id: 1,
      username,
      email,
      total_points: 0,
      created_at: new Date().toISOString(),
    };
    checkInHistory = [];
    earnedAchievementIds = new Set();
    return Promise.resolve(demoUser);
  },

  login(_username: string, _password: string) {
    return Promise.resolve({ access_token: "demo-token" });
  },

  getProfile() {
    return Promise.resolve(demoUser);
  },

  getLeaderboard(_limit = 20) {
    // The user plus some fake competition
    const board: LeaderboardEntry[] = [
      { username: "TouchGrassKing", total_points: 1250, rank: 1 },
      { username: "OutdoorVibes", total_points: 890, rank: 2 },
      { username: "ParkWalker", total_points: 720, rank: 3 },
      { username: "GreenThumb22", total_points: 485, rank: 4 },
      { username: "SunshineSeeker", total_points: 310, rank: 5 },
    ];

    // Insert the demo user at the right rank
    if (demoUser && demoUser.total_points > 0) {
      const entry: LeaderboardEntry = {
        username: demoUser.username,
        total_points: demoUser.total_points,
        rank: 0,
      };
      board.push(entry);
      board.sort((a, b) => b.total_points - a.total_points);
      board.forEach((e, i) => (e.rank = i + 1));
    }

    return Promise.resolve(board);
  },

  getNearbyLocations(latitude: number, longitude: number, _radiusMeters = 5000) {
    if (cachedLocations.length === 0) {
      cachedLocations = generateNearbyLocations(latitude, longitude);
    }
    return Promise.resolve(cachedLocations);
  },

  checkIn(locationId: number, _latitude: number, _longitude: number) {
    const location = cachedLocations.find((l) => l.id === locationId);
    if (!location) {
      return Promise.reject(new Error("Location not found"));
    }
    if (!demoUser) {
      return Promise.reject(new Error("Not logged in"));
    }

    // Award points (demo mode always succeeds — no distance check)
    const points = location.point_value;
    demoUser.total_points += points;

    const checkin: CheckInHistory = {
      id: nextCheckInId++,
      location_name: location.name,
      points_awarded: points,
      distance_meters: Math.round(Math.random() * 30 + 5), // fake 5-35m
      checked_in_at: new Date().toISOString(),
    };
    checkInHistory.unshift(checkin);

    // Check achievements
    const newAchievements = checkNewAchievements();

    const response: CheckInResponse = {
      id: checkin.id,
      location_id: locationId,
      location_name: location.name,
      distance_meters: checkin.distance_meters,
      points_awarded: points,
      checked_in_at: checkin.checked_in_at,
      new_achievements: newAchievements,
    };

    return Promise.resolve(response);
  },

  getCheckInHistory(_limit = 50) {
    return Promise.resolve(checkInHistory);
  },

  getAchievements() {
    return Promise.resolve(ACHIEVEMENTS);
  },

  getMyAchievements() {
    const earned: UserAchievement[] = ACHIEVEMENTS
      .filter((a) => earnedAchievementIds.has(a.id))
      .map((a) => ({ achievement: a, earned_at: new Date().toISOString() }));
    return Promise.resolve(earned);
  },
};
