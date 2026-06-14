import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SymbolView } from "expo-symbols";
import type { MobileSessionSummary } from "@speakielts/contracts";
import { colors, radius, spacing } from "@/theme";

export const SessionCard = memo(function SessionCard({
  session,
  onPress,
  onDelete
}: {
  session: MobileSessionSummary;
  onPress: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}) {
  const isCompleted = session.status === "COMPLETED";
  const statusLabel = isCompleted
    ? `Band ${session.finalBand?.toFixed(1) ?? session.finalBand}`
    : session.status === "ACTIVE"
      ? "In progress"
      : "Paused";

  const statusStyle = [
    styles.statusBadge,
    session.status === "COMPLETED" && styles.badgeCompleted,
    session.status === "ACTIVE" && styles.badgeActive,
    session.status === "PAUSED" && styles.badgePaused
  ];

  const statusTextStyle = [
    styles.statusText,
    session.status === "COMPLETED" && styles.statusTextCompleted,
    session.status === "ACTIVE" && styles.statusTextActive,
    session.status === "PAUSED" && styles.statusTextPaused
  ];

  const formattedDate = session.startedAt.split("T")[0];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${session.mode} ${session.topic}`}
      onPress={() => onPress(session.id, session.status)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.row}>
        <Text style={styles.mode}>{session.mode.replace("_", " ")}</Text>
        <View style={styles.badgeRow}>
          <View style={statusStyle}>
            <Text style={statusTextStyle}>{statusLabel}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Delete speaking session"
            onPress={(e) => {
              e.stopPropagation();
              onDelete(session.id);
            }}
            style={({ pressed }) => [
              styles.deleteButton,
              pressed && styles.deletePressed
            ]}
          >
            <SymbolView name="trash" tintColor={colors.inkMuted} size={15} />
          </Pressable>
        </View>
      </View>
      <Text numberOfLines={2} style={styles.topic}>
        {session.topic}
      </Text>
      <Text style={styles.meta}>
        {formattedDate} · {Math.round(session.durationSeconds / 60)} min
      </Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    minHeight: 120,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1.5,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2
  },
  pressed: {
    backgroundColor: colors.surfaceMuted,
    transform: [{ scale: 0.99 }]
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md
  },
  mode: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase"
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border
  },
  badgeCompleted: {
    backgroundColor: "#E6F6EC",
    borderColor: "#CCEED6"
  },
  badgeActive: {
    backgroundColor: "#E6F0FA",
    borderColor: "#CCDDF6"
  },
  badgePaused: {
    backgroundColor: "#FFF9E6",
    borderColor: "#FFEFC6"
  },
  statusText: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  statusTextCompleted: {
    color: colors.success
  },
  statusTextActive: {
    color: colors.navy
  },
  statusTextPaused: {
    color: colors.warning
  },
  topic: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 24
  },
  meta: {
    color: colors.inkMuted,
    fontSize: 13,
    fontWeight: "500"
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.03)"
  },
  deletePressed: {
    backgroundColor: "rgba(220, 38, 38, 0.15)",
    transform: [{ scale: 0.95 }]
  }
});
