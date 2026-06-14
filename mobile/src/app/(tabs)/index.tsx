import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { SymbolView } from "expo-symbols";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing
} from "react-native-reanimated";
import type { MobileBootstrap, MobileSessionSummary } from "@speakielts/contracts";
import { apiRequest } from "@/lib/api";
import { readCache, writeCache } from "@/lib/cache";
import { registerDevice } from "@/lib/device";
import { useNetwork } from "@/hooks/use-network";
import { useAppStore } from "@/store/app-store";
import {
  Card,
  OfflineBanner,
  PrimaryButton,
  Screen,
  Title,
  uiStyles
} from "@/components/ui";
import { colors, radius, spacing } from "@/theme";

const BOOTSTRAP_CACHE_KEY = "bootstrap";

export default function HomeScreen() {
  const online = useNetwork();
  const bootstrap = useAppStore((state) => state.bootstrap);
  const setBootstrap = useAppStore((state) => state.setBootstrap);
  const history = useAppStore((state) => state.history);
  const setHistory = useAppStore((state) => state.setHistory);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const pulseAnim = useSharedValue(0.4);

  useEffect(() => {
    pulseAnim.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [pulseAnim]);

  const pulseStyle = useAnimatedStyle(() => {
    return {
      opacity: pulseAnim.value,
      transform: [{ scale: pulseAnim.value * 0.15 + 0.92 }]
    };
  });

  const load = useCallback(async () => {
    const cached = await readCache<MobileBootstrap>(BOOTSTRAP_CACHE_KEY);
    if (cached && !bootstrap) setBootstrap(cached);
    if (!online) return;

    try {
      const fresh = await apiRequest<MobileBootstrap>("/api/mobile/v1/bootstrap");
      setBootstrap(fresh);
      await writeCache(BOOTSTRAP_CACHE_KEY, fresh);
      void registerDevice().catch(() => undefined);
      setError("");

      const historyData = await apiRequest<{
        sessions: MobileSessionSummary[];
        nextCursor: string | null;
      }>("/api/mobile/v1/sessions?limit=6");
      setHistory(historyData.sessions);
      await writeCache("history", historyData.sessions);
    } catch {
      setError("Could not refresh your dashboard.");
    }
  }, [bootstrap, online, setBootstrap, setHistory]);

  useEffect(() => {
    void load();
  }, [load]);

  // Background polling while evaluation is running
  useEffect(() => {
    if (!bootstrap?.scoringSession) return;

    const interval = setInterval(async () => {
      if (!online) return;
      try {
        const fresh = await apiRequest<MobileBootstrap>("/api/mobile/v1/bootstrap");
        setBootstrap(fresh);
        await writeCache(BOOTSTRAP_CACHE_KEY, fresh);
        
        // If completed, reload history as well
        if (!fresh.scoringSession) {
          const historyData = await apiRequest<{
            sessions: MobileSessionSummary[];
            nextCursor: string | null;
          }>("/api/mobile/v1/sessions?limit=6");
          setHistory(historyData.sessions);
          await writeCache("history", historyData.sessions);
        }
      } catch (err) {
        console.error("Failed to poll bootstrap status:", err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [bootstrap?.scoringSession, online, setBootstrap, setHistory]);

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const scoreHistory = history
    .filter((s) => s.status === "COMPLETED" && s.finalBand !== null)
    .slice(0, 5)
    .reverse();

  const subSkills = bootstrap?.metrics.subSkills;

  return (
    <Screen>
      {!online ? <OfflineBanner /> : null}
      <Title eyebrow="Learner dashboard">
        Welcome back{bootstrap?.user.name ? `, ${bootstrap.user.name}` : ""}.
      </Title>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      
      <View style={styles.metricsRow}>
        <Metric
          label="Avg band"
          value={bootstrap?.metrics.avgBand?.toFixed(1) || bootstrap?.metrics.avgBand || "-"}
          icon="star.fill"
          iconColor="#D97706"
        />
        <Metric
          label="Sessions"
          value={bootstrap?.metrics.totalSessions ?? "-"}
          icon="waveform.circle.fill"
          iconColor={colors.primary}
        />
        <Metric
          label="Minutes"
          value={bootstrap?.metrics.totalSpeakingMinutes ?? "-"}
          icon="clock.fill"
          iconColor={colors.navy}
        />
      </View>

      {bootstrap?.scoringSession ? (
        <Card>
          <View style={styles.liveHeaderRow}>
            <Text style={uiStyles.sectionTitle}>Session Evaluation</Text>
            <View style={styles.scoringIndicatorContainer}>
              <Animated.View style={[styles.scoringDot, pulseStyle]} />
              <Text style={styles.scoringText}>Evaluating...</Text>
            </View>
          </View>
          <Text style={uiStyles.body}>
            We are analyzing your pronunciation, grammar, and vocabulary. This takes about 15-30 seconds.
          </Text>
          <Text style={styles.scoringSessionTopic}>
            Topic: {bootstrap.scoringSession.topic} ({bootstrap.scoringSession.mode.replace("_", " ")})
          </Text>
        </Card>
      ) : null}

      {bootstrap?.resumableSession ? (
        <Card>
          <View style={styles.liveHeaderRow}>
            <Text style={uiStyles.sectionTitle}>Continue practice</Text>
            <View style={styles.liveIndicatorContainer}>
              <Animated.View style={[styles.liveDot, pulseStyle]} />
              <Text style={styles.liveText}>RESUMABLE</Text>
            </View>
          </View>
          <Text style={uiStyles.body}>
            {bootstrap.resumableSession.mode.replace("_", " ")} ·{" "}
            {bootstrap.resumableSession.topic}
          </Text>
          <PrimaryButton
            disabled={!online}
            label="Resume live practice"
            onPress={() =>
              router.push(`/session/${bootstrap.resumableSession?.id}`)
            }
          />
        </Card>
      ) : !bootstrap?.scoringSession ? (
        <Card>
          <Text style={uiStyles.sectionTitle}>Your next speaking session</Text>
          <Text style={uiStyles.body}>
            Start with Part 1 for a short warm-up, or run a full test when you
            have a quiet room and stable connection.
          </Text>
          <PrimaryButton
            disabled={!online}
            label="Choose practice"
            onPress={() => router.push("/(tabs)/practice")}
          />
        </Card>
      ) : null}

      <Card>
        <Text style={uiStyles.sectionTitle}>Overall Progress</Text>
        {scoreHistory.length > 0 ? (
          <View style={styles.chartRow}>
            {scoreHistory.map((session) => (
              <View key={session.id} style={styles.chartCol}>
                <Text style={styles.chartValue}>{session.finalBand?.toFixed(1)}</Text>
                <View style={styles.chartBarContainer}>
                  <View 
                    style={[
                      styles.chartBar, 
                      { height: (session.finalBand ?? 0) * 12 }
                    ]} 
                  />
                </View>
                <Text numberOfLines={1} style={styles.chartLabel}>
                  {session.topic.length > 6 ? `${session.topic.substring(0, 5)}...` : session.topic}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={uiStyles.body}>Complete mock tests or practice to see your score trend.</Text>
        )}
      </Card>

      <Card>
        <Text style={uiStyles.sectionTitle}>Skill Profile</Text>
        {subSkills ? (
          <View style={styles.skillsContainer}>
            <SkillBar label="Fluency & Coherence" score={subSkills.fluency} />
            <SkillBar label="Lexical Resource" score={subSkills.lexical} />
            <SkillBar label="Grammatical Range" score={subSkills.grammar} />
            <SkillBar label="Pronunciation" score={subSkills.pronunciation} />
          </View>
        ) : (
          <Text style={uiStyles.body}>Detailed sub-skills will appear once you have completed evaluations.</Text>
        )}
      </Card>

      <Text
        accessibilityRole="button"
        onPress={() => void refresh()}
        style={styles.refresh}
      >
        {refreshing ? "Refreshing..." : "Refresh dashboard"}
      </Text>
    </Screen>
  );
}

function Metric({
  label,
  value,
  icon,
  iconColor
}: {
  label: string;
  value: string | number;
  icon: any;
  iconColor: string;
}) {
  return (
    <View style={styles.metricCard}>
      <View style={[styles.iconCircle, { backgroundColor: iconColor + "15" }]}>
        <SymbolView name={icon} tintColor={iconColor} size={18} />
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function SkillBar({ label, score }: { label: string; score: number }) {
  const percentage = (score / 9) * 100;
  return (
    <View style={styles.skillBarRow}>
      <View style={styles.skillBarInfo}>
        <Text style={styles.skillBarLabel}>{label}</Text>
        <Text style={styles.skillBarValue}>{score.toFixed(1)}</Text>
      </View>
      <View style={styles.skillTrack}>
        <View style={[styles.skillFill, { width: `${percentage}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  metricsRow: {
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    marginVertical: spacing.sm
  },
  metricCard: {
    flex: 1,
    minHeight: 116,
    backgroundColor: "rgba(255, 255, 255, 0.75)",
    borderColor: "rgba(255, 255, 255, 0.6)",
    borderWidth: 1.5,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs
  },
  metricLabel: {
    color: colors.inkMuted,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center"
  },
  metricValue: {
    color: colors.navy,
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center"
  },
  liveHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: spacing.xs
  },
  liveIndicatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFEFC6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.warning
  },
  liveText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.warning
  },
  scoringIndicatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EBF1FA",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill
  },
  scoringDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary
  },
  scoringText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.primary
  },
  scoringSessionTopic: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.ink,
    marginTop: spacing.xs
  },
  chartRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    height: 140,
    marginTop: spacing.md
  },
  chartCol: {
    alignItems: "center"
  },
  chartValue: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: 4
  },
  chartBarContainer: {
    height: 108,
    width: 16,
    backgroundColor: "rgba(0, 0, 0, 0.03)",
    borderRadius: 8,
    justifyContent: "flex-end"
  },
  chartBar: {
    width: "100%",
    backgroundColor: colors.primary,
    borderRadius: 8
  },
  chartLabel: {
    fontSize: 10,
    color: colors.inkMuted,
    marginTop: 6,
    maxWidth: 48,
    textAlign: "center"
  },
  skillsContainer: {
    gap: spacing.md,
    marginTop: spacing.xs
  },
  skillBarRow: {
    gap: 6
  },
  skillBarInfo: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  skillBarLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.ink
  },
  skillBarValue: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary
  },
  skillTrack: {
    height: 8,
    backgroundColor: "rgba(0, 0, 0, 0.03)",
    borderRadius: 4
  },
  skillFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 4
  },
  error: {
    color: colors.danger,
    fontSize: 14
  },
  refresh: {
    minHeight: 44,
    color: colors.primary,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "700",
    paddingTop: 12
  }
});
