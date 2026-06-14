import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { apiRequest } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { clearCache } from "@/lib/cache";
import { useNetwork } from "@/hooks/use-network";
import { useAppStore } from "@/store/app-store";
import {
  Card,
  OfflineBanner,
  PrimaryButton,
  Screen,
  SecondaryButton,
  Title,
  uiStyles
} from "@/components/ui";
import { colors, radius, spacing } from "@/theme";

export default function ProfileScreen() {
  const online = useNetwork();
  const bootstrap = useAppStore((state) => state.bootstrap);
  const setBootstrap = useAppStore((state) => state.setBootstrap);
  const reset = useAppStore((state) => state.reset);
  const [name, setName] = useState(bootstrap?.user.name ?? "");
  const [targetBand, setTargetBand] = useState(
    bootstrap?.user.targetBand ?? 7
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [focusName, setFocusName] = useState(false);

  useEffect(() => {
    if (bootstrap) {
      setName(bootstrap.user.name);
      setTargetBand(bootstrap.user.targetBand);
    }
  }, [bootstrap]);

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      const data = await apiRequest<{
        user: {
          id: string;
          name: string;
          email: string;
          targetBand: number;
        };
      }>("/api/mobile/v1/settings", {
        method: "PATCH",
        body: JSON.stringify({ name, targetBand })
      });
      if (bootstrap) {
        setBootstrap({ ...bootstrap, user: data.user });
      }
      setMessage("Settings saved.");
    } catch {
      setMessage("Settings could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    await authClient.signOut();
    await clearCache();
    reset();
    router.replace("/sign-in");
  }

  return (
    <Screen>
      {!online ? <OfflineBanner /> : null}
      <Title eyebrow="Account">Profile and settings.</Title>
      <Card>
        <View style={styles.field}>
          <Text style={uiStyles.label}>Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={colors.inkMuted}
            style={[styles.input, focusName && styles.inputFocused]}
            onFocus={() => setFocusName(true)}
            onBlur={() => setFocusName(false)}
          />
        </View>
        <View style={styles.field}>
          <Text style={uiStyles.label}>Target band</Text>
          <View style={styles.bandRow}>
            {[6, 6.5, 7, 7.5, 8, 8.5, 9].map((band) => {
              const isSelected = targetBand === band;
              return (
                <Pressable
                  key={band}
                  accessibilityRole="button"
                  onPress={() => setTargetBand(band)}
                  style={[
                    styles.bandButton,
                    isSelected && styles.bandButtonSelected
                  ]}
                >
                  <Text
                    style={[
                      styles.bandLabel,
                      isSelected && styles.bandLabelSelected
                    ]}
                  >
                    {band}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        {message ? <Text style={uiStyles.body}>{message}</Text> : null}
        <PrimaryButton
          disabled={!online || !name.trim()}
          label="Save settings"
          loading={saving}
          onPress={() => void save()}
        />
      </Card>
      <Card>
        <Text style={uiStyles.sectionTitle}>Audio privacy</Text>
        <Text style={uiStyles.body}>
          Candidate audio is private and scheduled for deletion after 24 hours.
          Transcripts and reports remain in your account history.
        </Text>
      </Card>
      <SecondaryButton label="Sign out" onPress={() => void signOut()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.sm
  },
  input: {
    minHeight: 52,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    color: colors.ink,
    fontSize: 16,
    paddingHorizontal: spacing.md
  },
  inputFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.white,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3
  },
  bandRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: 4
  },
  bandButton: {
    minWidth: 44,
    minHeight: 40,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.6)",
    backgroundColor: "rgba(255, 255, 255, 0.65)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1
  },
  bandButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2
  },
  bandLabel: {
    color: colors.navy,
    fontSize: 14,
    fontWeight: "700"
  },
  bandLabelSelected: {
    color: colors.white
  }
});
