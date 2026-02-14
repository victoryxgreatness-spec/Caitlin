import { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../services/auth";
import { api } from "../services/api";
import type { CheckInHistory } from "../types";

export function ProfileScreen() {
  const { user, logout } = useAuth();
  const [history, setHistory] = useState<CheckInHistory[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    try {
      const checkins = (await api.getCheckInHistory()) as CheckInHistory[];
      setHistory(checkins);
    } catch {
      // Will show empty state
    }
  }

  if (!user) {
    return null; // Auth gate in navigator prevents this, but just in case
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.username}>{user.username}</Text>
          <Text style={styles.email}>{user.email}</Text>
        </View>
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

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9f9f9" },
  header: {
    backgroundColor: "#4CAF50",
    padding: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  username: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  email: { fontSize: 14, color: "#E8F5E9", marginTop: 2 },
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
  logoutButton: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    alignItems: "center",
  },
  logoutText: { fontSize: 16, color: "#888" },
});
