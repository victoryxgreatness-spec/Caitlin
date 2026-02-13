import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { api } from "../services/api";
import type { Achievement, UserAchievement } from "../types";

export function AchievementsScreen() {
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
  const [earned, setEarned] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadAchievements();
  }, []);

  async function loadAchievements() {
    try {
      const [all, mine] = await Promise.all([
        api.getAchievements() as Promise<Achievement[]>,
        api.getMyAchievements() as Promise<UserAchievement[]>,
      ]);
      setAllAchievements(all);
      setEarned(new Set(mine.map((ua) => ua.achievement.id)));
    } catch {
      // Handle error in future iteration
    }
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={allAchievements}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          const isEarned = earned.has(item.id);
          return (
            <View style={[styles.card, !isEarned && styles.locked]}>
              <View style={styles.cardHeader}>
                <Text style={styles.name}>
                  {isEarned ? item.name : "???"}
                </Text>
                {item.bonus_points > 0 && (
                  <Text style={styles.bonus}>+{item.bonus_points} bonus</Text>
                )}
              </View>
              <Text style={styles.description}>
                {isEarned ? item.description : "Keep exploring to unlock!"}
              </Text>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              Achievements loading...
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9f9f9" },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
  },
  locked: { opacity: 0.5, borderLeftColor: "#ccc" },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: { fontSize: 16, fontWeight: "bold", color: "#333" },
  bonus: { fontSize: 12, color: "#4CAF50", fontWeight: "600" },
  description: { fontSize: 14, color: "#666", marginTop: 4 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  emptyText: { fontSize: 16, color: "#888" },
});
