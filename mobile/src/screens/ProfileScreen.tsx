import { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { api } from "../services/api";
import type { CheckInHistory, User } from "../types";

export function ProfileScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [history, setHistory] = useState<CheckInHistory[]>([]);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const [profile, checkins] = await Promise.all([
        api.getProfile() as Promise<User>,
        api.getCheckInHistory() as Promise<CheckInHistory[]>,
      ]);
      setUser(profile);
      setHistory(checkins);
    } catch {
      // User not logged in — show login prompt in a future iteration
    }
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.emoji}>🌱</Text>
        <Text style={styles.title}>Welcome to Touch Grass</Text>
        <Text style={styles.subtitle}>Sign in to track your adventures</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.username}>{user.username}</Text>
        <View style={styles.pointsBadge}>
          <Text style={styles.pointsValue}>{user.total_points}</Text>
          <Text style={styles.pointsLabel}>points</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Recent Check-ins</Text>
      <FlatList
        data={history}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.historyItem}>
            <View>
              <Text style={styles.historyName}>{item.location_name}</Text>
              <Text style={styles.historyDate}>
                {new Date(item.checked_in_at).toLocaleDateString()}
              </Text>
            </View>
            <Text style={styles.historyPoints}>+{item.points_awarded}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>
            No check-ins yet. Go touch some grass!
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9f9f9" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  emoji: { fontSize: 64, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: "bold", color: "#333" },
  subtitle: { fontSize: 16, color: "#888", marginTop: 8 },
  header: {
    backgroundColor: "#4CAF50",
    padding: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  username: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  pointsBadge: { alignItems: "center" },
  pointsValue: { fontSize: 28, fontWeight: "bold", color: "#fff" },
  pointsLabel: { fontSize: 12, color: "#E8F5E9" },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    padding: 16,
    paddingBottom: 8,
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
  },
  historyName: { fontSize: 16, fontWeight: "600", color: "#333" },
  historyDate: { fontSize: 12, color: "#888", marginTop: 2 },
  historyPoints: { fontSize: 18, fontWeight: "bold", color: "#4CAF50" },
  empty: { textAlign: "center", color: "#888", padding: 32 },
});
