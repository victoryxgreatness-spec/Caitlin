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
import type { NearbyLocation } from "../types";

export function MapScreen() {
  const [region, setRegion] = useState<Region | null>(null);
  const [nearbyLocations, setNearbyLocations] = useState<NearbyLocation[]>([]);
  const [selectedLocation, setSelectedLocation] =
    useState<NearbyLocation | null>(null);

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

      // Fetch nearby locations from the API
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
      let message = `+${checkin.points_awarded} points at ${location.name}!`;
      if (checkin.new_achievements?.length > 0) {
        message += `\n\nNew achievement: ${checkin.new_achievements.join(", ")}`;
      }

      Alert.alert("Checked In!", message);
      setSelectedLocation(null);
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
            description={`${loc.point_value} pts — ${loc.distance_meters.toFixed(0)}m away`}
            pinColor="#4CAF50"
            onPress={() => setSelectedLocation(loc)}
          />
        ))}
      </MapView>

      {selectedLocation && (
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
});
