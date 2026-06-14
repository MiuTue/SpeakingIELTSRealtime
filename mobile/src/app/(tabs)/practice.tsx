import { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { router } from "expo-router";
import { SymbolView } from "expo-symbols";
import type {
  MobileSessionSummary,
  PracticeMode,
  RealtimeVoice
} from "@speakielts/contracts";
import { apiRequest } from "@/lib/api";
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

const modes: Array<{ value: PracticeMode; label: string; detail: string }> = [
  { value: "PART1", label: "Part 1", detail: "Personal questions & warm-up" },
  { value: "PART2", label: "Part 2", detail: "Cue card & 2-minute long turn" },
  { value: "PART3", label: "Part 3", detail: "Abstract discussion & deep follow-up" },
  { value: "FULL_TEST", label: "Full test", detail: "Complete, standard exam flow" },
  { value: "CUSTOM", label: "Custom", detail: "Practice with your own topic" }
];

const topics: Record<PracticeMode, string[]> = {
  PART1: [
    "Random Topic",
    "Work or study",
    "Hometown",
    "Daily routine",
    "Music",
    "Food",
    "Travel",
    "Technology",
    "Weather",
    "Reading",
    "Sports",
    "Hobby or leisure time",
    "Holidays",
    "Friends",
    "Family",
    "Pets or animals",
    "Transportation",
    "Shopping",
    "Home or decoration"
  ],
  PART2: [
    "Random Topic",
    "Describe a person who inspired you",
    "Describe a place you would like to visit",
    "Describe a book you enjoyed",
    "Describe a useful skill you learned",
    "Describe a memorable journey",
    "Describe a piece of technology you use often",
    "Describe a time you solved a difficult problem",
    "Describe an event that changed your life",
    "Describe a traditional festival in your country",
    "Describe an interesting wild animal you saw",
    "Describe a business leader you admire",
    "Describe a gift you received that was special",
    "Describe a beautiful city you visited"
  ],
  PART3: [
    "Random Topic",
    "Education",
    "Society",
    "Technology",
    "Culture",
    "Environment",
    "Work",
    "Media",
    "Business and Career",
    "Festivals and Tourism",
    "Animals and Nature",
    "Family and Relationships",
    "Hobby and Health",
    "Shopping and Consumerism"
  ],
  FULL_TEST: ["Random Topics"],
  CUSTOM: []
};

const voices: RealtimeVoice[] = ["Aoede", "Kore", "Leda", "Orus", "Puck"];

function DropdownSelect<T extends string | number>({
  label,
  value,
  options,
  onSelect,
  formatLabel = (val) => String(val)
}: {
  label: string;
  value: T;
  options: T[];
  onSelect: (val: T) => void;
  formatLabel?: (val: T) => string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Choose ${label}`}
        onPress={() => setVisible(true)}
        style={({ pressed }) => [styles.dropdownButton, pressed && styles.dropdownPressed]}
      >
        <Text style={styles.dropdownValue}>{formatLabel(value)}</Text>
        <SymbolView name="chevron.down" tintColor={colors.inkMuted} size={15} />
      </Pressable>
      
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setVisible(false)}>
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <Pressable onPress={() => setVisible(false)} style={styles.closeBtn}>
                <SymbolView name="xmark.circle.fill" tintColor={colors.inkMuted} size={22} />
              </Pressable>
            </View>
            <ScrollView style={styles.modalList} contentContainerStyle={styles.modalListContent}>
              {options.map((opt) => {
                const isSelected = opt === value;
                return (
                  <Pressable
                    key={String(opt)}
                    onPress={() => {
                      onSelect(opt);
                      setVisible(false);
                    }}
                    style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                  >
                    <Text style={[styles.modalItemText, isSelected && styles.modalItemTextSelected]}>
                      {formatLabel(opt)}
                    </Text>
                    {isSelected && (
                      <SymbolView name="checkmark" tintColor={colors.primary} size={16} />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

export default function PracticeScreen() {
  const online = useNetwork();
  const defaultBand =
    useAppStore((state) => state.bootstrap?.user.targetBand) ?? 7;
  const upsertSession = useAppStore((state) => state.upsertSession);
  const [mode, setMode] = useState<PracticeMode>("PART1");
  const [topic, setTopic] = useState(topics.PART1[0]);
  const [customTopic, setCustomTopic] = useState("");
  const [targetBand, setTargetBand] = useState(defaultBand);
  const [voice, setVoice] = useState<RealtimeVoice>("Aoede");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focusCustom, setFocusCustom] = useState(false);
  const visibleTopics = useMemo(() => topics[mode], [mode]);

  const chooseMode = (nextMode: PracticeMode) => {
    setMode(nextMode);
    setTopic(topics[nextMode][0] ?? "");
  };

  async function start() {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest<{ session: MobileSessionSummary }>(
        "/api/mobile/v1/sessions",
        {
          method: "POST",
          body: JSON.stringify({
            mode,
            topic: mode === "CUSTOM" ? customTopic.trim() : topic,
            targetBand,
            voice
          })
        }
      );
      upsertSession(data.session);
      router.push(`/session/${data.session.id}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not start practice.");
    } finally {
      setLoading(false);
    }
  }

  const validTopic = mode !== "CUSTOM" || customTopic.trim().length > 0;

  return (
    <Screen>
      {!online ? <OfflineBanner /> : null}
      <Title eyebrow="Practice setup">Choose your speaking session.</Title>
      <View style={styles.modeGrid}>
        {modes.map((item) => {
          const isSelected = item.value === mode;
          return (
            <Pressable
              key={item.value}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              onPress={() => chooseMode(item.value)}
              style={[
                styles.mode,
                isSelected && styles.modeSelected
              ]}
            >
              <Text style={[styles.modeLabel, isSelected && styles.modeLabelSelected]}>
                {item.label}
              </Text>
              <Text style={styles.modeDetail}>{item.detail}</Text>
            </Pressable>
          );
        })}
      </View>
      <Card>
        <Text style={uiStyles.sectionTitle}>Topic</Text>
        {mode === "CUSTOM" ? (
          <TextInput
            value={customTopic}
            onChangeText={setCustomTopic}
            placeholder="For example: space exploration"
            placeholderTextColor={colors.inkMuted}
            style={[styles.input, focusCustom && styles.inputFocused]}
            onFocus={() => setFocusCustom(true)}
            onBlur={() => setFocusCustom(false)}
          />
        ) : (
          <DropdownSelect
            label="Select Topic"
            value={topic}
            options={visibleTopics}
            onSelect={setTopic}
          />
        )}
      </Card>
      <Card>
        <Text style={uiStyles.sectionTitle}>Target band</Text>
        <DropdownSelect
          label="Select Target Band"
          value={targetBand}
          options={[5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9]}
          onSelect={setTargetBand}
          formatLabel={(val) => `Band ${val.toFixed(1)}`}
        />
      </Card>
      <Card>
        <Text style={uiStyles.sectionTitle}>Examiner voice</Text>
        <DropdownSelect
          label="Select Examiner Voice"
          value={voice}
          options={voices}
          onSelect={setVoice}
        />
      </Card>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton
        disabled={!online || !validTopic}
        label="Start live session"
        loading={loading}
        onPress={() => void start()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  modeGrid: {
    gap: spacing.md
  },
  mode: {
    minHeight: 74,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.6)",
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    justifyContent: "center",
    gap: 4,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2
  },
  modeSelected: {
    borderColor: colors.primary,
    backgroundColor: "rgba(176, 24, 104, 0.06)",
    shadowColor: colors.primary,
    shadowOpacity: 0.05
  },
  modeLabel: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "700"
  },
  modeLabelSelected: {
    color: colors.primary
  },
  modeDetail: {
    color: colors.inkMuted,
    fontSize: 14
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
  dropdownButton: {
    minHeight: 52,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1
  },
  dropdownPressed: {
    backgroundColor: colors.surfaceMuted
  },
  dropdownValue: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "600"
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(18, 33, 58, 0.4)",
    justifyContent: "flex-end"
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    maxHeight: "70%",
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.navy
  },
  closeBtn: {
    padding: 4
  },
  modalList: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm
  },
  modalListContent: {
    paddingBottom: spacing.xl
  },
  modalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    marginVertical: 2
  },
  modalItemSelected: {
    backgroundColor: "rgba(176, 24, 104, 0.05)"
  },
  modalItemText: {
    fontSize: 16,
    color: colors.ink,
    fontWeight: "500"
  },
  modalItemTextSelected: {
    color: colors.primary,
    fontWeight: "700"
  },
  error: {
    color: colors.danger,
    fontSize: 14
  }
});
