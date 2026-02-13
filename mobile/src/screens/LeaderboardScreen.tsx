import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { api } from "../services/api";
import type { LeaderboardEntry } from "../types";

export function LeaderboardScreen() {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  async function loadLeaderboard() {
    try {
      const data = (await api.getLeaderboard()) as LeaderboardEntry[];
      setLeaders(data);
    } catch {
      // Handle error in future iteration
    }
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={leaders}
        keyExtractor={(item) => item.username}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text
              style={[
                styles.rank,
                item.rank <= 3 && styles.topRank,
              ]}
            >
              #{item.rank}
            </Text>
            <Text style={styles.username}>{item.username}</Text>
            <Text style={styles.points}>{item.total_points} pts</Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              No one's on the board yet. Be the first to touch grass!
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9f9f9" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
  },
  rank: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#888",
    width: 50,
  },
  topRank: { color: "#4CAF50" },
  username: { flex: 1, fontSize: 16, fontWeight: "600", color: "#333" },
  points: { fontSize: 16, fontWeight: "bold", color: "#4CAF50" },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  emptyText: { fontSize: 16, color: "#888", textAlign: "center" },
});
