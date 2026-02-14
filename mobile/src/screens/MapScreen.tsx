import { useEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { getCurrentLocation } from "../services/location";
import { api } from "../services/api";
import { useAuth } from "../services/auth";
import type { NearbyLocation } from "../types";

export function MapScreen() {
  const { user } = useAuth();
  const [region, setRegion] = useState<Region | null>(null);
  const [nearbyLocations, setNearbyLocations] = useState<NearbyLocation[]>([]);
  const [selectedLocation, setSelectedLocation] =
    useState<NearbyLocation | null>(null);
  const [lastCheckin, setLastCheckin] = useState<{
    name: string;
    points: number;
    achievements: string[];
  } | null>(null);

  useEffect(() => {
    loadUserLocation();
  }, []);

  async function loadUserLocation() {
    try {
      const coords = await getCurrentLocation();
      const newRegion: Region = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
      setRegion(newRegion);

      const locations = (await api.getNearbyLocations(
        coords.latitude,
        coords.longitude
      )) as NearbyLocation[];
      setNearbyLocations(locations);
    } catch (error: any) {
      Alert.alert("Location Error", error.message);
    }
  }

  async function handleCheckIn(location: NearbyLocation) {
    try {
      const coords = await getCurrentLocation();
      const result = await api.checkIn(
        location.id,
        coords.latitude,
        coords.longitude
      );

      const checkin = result as any;
      setLastCheckin({
        name: location.name,
        points: checkin.points_awarded,
        achievements: checkin.new_achievements || [],
      });
      setSelectedLocation(null);

      // Auto-dismiss success card after 3 seconds
      setTimeout(() => setLastCheckin(null), 3000);
    } catch (error: any) {
      Alert.alert("Check-in Failed", error.message);
    }
  }

  if (!region) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Finding your location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Points counter at top */}
      {user && (
        <View style={styles.pointsBar}>
          <Text style={styles.pointsBarText}>
            {user.total_points} pts
          </Text>
        </View>
      )}

      <MapView
        style={styles.map}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton
      >
        {nearbyLocations.map((loc) => (
          <Marker
            key={loc.id}
            coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}
            title={loc.name}
            description={`${loc.point_value} pts`}
            pinColor="#4CAF50"
            onPress={() => {
              setSelectedLocation(loc);
              setLastCheckin(null);
            }}
          />
        ))}
      </MapView>

      {/* Success card after check-in */}
      {lastCheckin && (
        <View style={[styles.checkInCard, styles.successCard]}>
          <Text style={styles.successTitle}>Grass Touched!</Text>
          <Text style={styles.successPoints}>
            +{lastCheckin.points} points at {lastCheckin.name}
          </Text>
          {lastCheckin.achievements.length > 0 && (
            <Text style={styles.successAchievement}>
              Achievement unlocked: {lastCheckin.achievements.join(", ")}
            </Text>
          )}
        </View>
      )}

      {/* Location detail card */}
      {selectedLocation && !lastCheckin && (
        <View style={styles.checkInCard}>
          <Text style={styles.locationName}>{selectedLocation.name}</Text>
          <Text style={styles.locationMeta}>
            {selectedLocation.point_value} points ·{" "}
            {selectedLocation.distance_meters.toFixed(0)}m away
          </Text>
          {selectedLocation.description && (
            <Text style={styles.locationDesc}>
              {selectedLocation.description}
            </Text>
          )}
          <TouchableOpacity
            style={styles.checkInButton}
            onPress={() => handleCheckIn(selectedLocation)}
          >
            <Text style={styles.checkInButtonText}>Touch Grass Here</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { fontSize: 18, color: "#666" },
  pointsBar: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 10,
    backgroundColor: "#4CAF50",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  pointsBarText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  checkInCard: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  locationName: { fontSize: 20, fontWeight: "bold", color: "#333" },
  locationMeta: { fontSize: 14, color: "#4CAF50", marginTop: 4 },
  locationDesc: { fontSize: 14, color: "#666", marginTop: 8 },
  checkInButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 16,
    alignItems: "center",
  },
  checkInButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  successCard: { backgroundColor: "#E8F5E9", borderColor: "#4CAF50", borderWidth: 2 },
  successTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2E7D32",
    textAlign: "center",
  },
  successPoints: {
    fontSize: 16,
    color: "#388E3C",
    textAlign: "center",
    marginTop: 8,
  },
  successAchievement: {
    fontSize: 14,
    color: "#1B5E20",
    textAlign: "center",
    marginTop: 8,
    fontWeight: "600",
  },
});
