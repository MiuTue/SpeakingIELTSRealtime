import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View
} from "react-native";
import { router } from "expo-router";
import type { MobileSessionSummary } from "@speakielts/contracts";
import { apiRequest } from "@/lib/api";
import { readCache, writeCache } from "@/lib/cache";
import { useNetwork } from "@/hooks/use-network";
import { useAppStore } from "@/store/app-store";
import { SessionCard } from "@/components/session-card";
import { EmptyState, OfflineBanner } from "@/components/ui";
import { colors, radius, spacing } from "@/theme";

const HISTORY_CACHE_KEY = "history";

export default function HistoryScreen() {
  const online = useNetwork();
  const history = useAppStore((state) => state.history);
  const setHistory = useAppStore((state) => state.setHistory);
  const [loading, setLoading] = useState(!history.length);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const cached = await readCache<MobileSessionSummary[]>(HISTORY_CACHE_KEY);
    const currentHistory = useAppStore.getState().history;
    if (cached?.length && !currentHistory.length) setHistory(cached);
    if (!online) {
      setLoading(false);
      return;
    }
    try {
      const data = await apiRequest<{
        sessions: MobileSessionSummary[];
        nextCursor: string | null;
      }>("/api/mobile/v1/sessions?limit=30");
      setHistory(data.sessions);
      await writeCache(HISTORY_CACHE_KEY, data.sessions);
    } catch (error) {
      console.error("Failed to load history:", error);
    } finally {
      setLoading(false);
    }
  }, [online, setHistory]);

  useEffect(() => {
    void load();
  }, [load]);

  const handlePress = useCallback((id: string, status: string) => {
    if (status === "COMPLETED") {
      router.push(`/report/${id}`);
    } else {
      router.push(`/session/${id}`);
    }
  }, []);

  const handleDelete = useCallback((id: string) => {
    if (!online) {
      Alert.alert("Connection error", "You must be online to delete speaking history.");
      return;
    }

    Alert.alert(
      "Delete practice history?",
      "This will permanently delete this session and its feedback report. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await apiRequest(`/api/mobile/v1/sessions/${id}`, {
                method: "DELETE"
              });
              
              // Update local state and cache
              const updatedHistory = history.filter((item) => item.id !== id);
              setHistory(updatedHistory);
              await writeCache(HISTORY_CACHE_KEY, updatedHistory);
              
              // Refresh bootstrap cache to sync dashboard averages
              const freshBootstrap = await apiRequest<any>("/api/mobile/v1/bootstrap");
              useAppStore.getState().setBootstrap(freshBootstrap);
              await writeCache("bootstrap", freshBootstrap);
            } catch (error) {
              Alert.alert("Deletion failed", "Could not delete this session. Please try again.");
              console.error("Failed to delete speaking history:", error);
            }
          }
        }
      ]
    );
  }, [history, online, setHistory]);

  const renderItem = useCallback(
    ({ item }: { item: MobileSessionSummary }) => (
      <SessionCard
        session={item}
        onPress={handlePress}
        onDelete={handleDelete}
      />
    ),
    [handlePress, handleDelete]
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <FlatList
      data={history}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={5}
      removeClippedSubviews={true}
      ListHeaderComponent={
        <View style={styles.headerContainer}>
          {!online ? <OfflineBanner /> : null}
          <Text style={styles.eyebrow}>LOGS</Text>
          <Text accessibilityRole="header" style={styles.title}>
            Practice history
          </Text>
        </View>
      }
      ListEmptyComponent={
        <EmptyState
          title="No sessions yet"
          message="Your completed and paused speaking sessions will appear here."
        />
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            void load().finally(() => setRefreshing(false));
          }}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background
  },
  content: {
    flexGrow: 1,
    padding: spacing.lg,
    backgroundColor: colors.background
  },
  headerContainer: {
    marginBottom: spacing.md,
    gap: 4
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: spacing.md
  },
  title: {
    color: colors.ink,
    fontSize: 32,
    fontWeight: "700",
    lineHeight: 38,
    letterSpacing: -0.5,
    marginBottom: spacing.xs
  },
  separator: {
    height: spacing.md
  }
});
