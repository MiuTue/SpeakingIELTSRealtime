import type { PropsWithChildren, ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { colors, radius, spacing } from "@/theme";

export function Screen({
  children,
  scroll = true
}: PropsWithChildren<{ scroll?: boolean }>) {
  const content = <View style={styles.screenContent}>{children}</View>;
  return (
    <SafeAreaView style={styles.safe}>
      {scroll ? (
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.scrollContent}
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

export function Card({ children }: PropsWithChildren) {
  return <View style={styles.card}>{children}</View>;
}

export function Title({
  children,
  eyebrow
}: PropsWithChildren<{ eyebrow?: string }>) {
  return (
    <View style={styles.titleWrap}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text accessibilityRole="header" style={styles.title}>
        {children}
      </Text>
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
  accessibilityHint,
  icon
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  accessibilityHint?: string;
  icon?: ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryButton,
        pressed && styles.primaryPressed,
        (disabled || loading) && styles.disabled
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.white} />
      ) : (
        <>
          {icon}
          <Text style={styles.primaryLabel}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

export function SecondaryButton({
  label,
  onPress,
  disabled
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.secondaryButton,
        pressed && styles.secondaryPressed,
        disabled && styles.disabled
      ]}
    >
      <Text style={styles.secondaryLabel}>{label}</Text>
    </Pressable>
  );
}

export function OfflineBanner() {
  return (
    <View accessibilityRole="alert" style={styles.offline}>
      <Text style={styles.offlineText}>
        Offline. Cached history and settings are still available.
      </Text>
    </View>
  );
}

export function EmptyState({
  title,
  message
}: {
  title: string;
  message: string;
}) {
  return (
    <Card>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.body}>{message}</Text>
    </Card>
  );
}

export const uiStyles = StyleSheet.create({
  body: {
    color: colors.inkMuted,
    fontSize: 16,
    lineHeight: 24
  },
  label: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "600"
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "700"
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md
  }
});

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background
  },
  scrollContent: {
    flexGrow: 1
  },
  screenContent: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.lg
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.75)",
    borderColor: "rgba(255, 255, 255, 0.6)",
    borderWidth: 1.5,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2
  },
  titleWrap: {
    gap: spacing.xs,
    marginBottom: spacing.xs
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase"
  },
  title: {
    color: colors.ink,
    fontSize: 32,
    fontWeight: "700",
    lineHeight: 38,
    letterSpacing: -0.5
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4
  },
  primaryPressed: {
    backgroundColor: colors.primaryPressed,
    transform: [{ scale: 0.98 }]
  },
  primaryLabel: {
    color: colors.white,
    fontSize: 17,
    fontWeight: "700"
  },
  secondaryButton: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.6)",
    backgroundColor: "rgba(255, 255, 255, 0.65)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1
  },
  secondaryPressed: {
    backgroundColor: "rgba(255, 255, 255, 0.85)"
  },
  secondaryLabel: {
    color: colors.navy,
    fontSize: 16,
    fontWeight: "700"
  },
  disabled: {
    opacity: 0.5
  },
  offline: {
    minHeight: 44,
    backgroundColor: "#FFF2CC",
    borderRadius: radius.sm,
    justifyContent: "center",
    paddingHorizontal: spacing.md
  },
  offlineText: {
    color: colors.warning,
    fontSize: 14,
    fontWeight: "600"
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "700"
  },
  body: {
    color: colors.inkMuted,
    fontSize: 16,
    lineHeight: 24
  }
});
