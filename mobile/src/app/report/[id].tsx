import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { apiRequest } from "@/lib/api";
import { Card, EmptyState, Screen, uiStyles } from "@/components/ui";
import { colors, radius, spacing } from "@/theme";

type SkillFeedback = {
  band: number;
  feedback: string;
};

type Feedback = {
  estimated_band: number;
  concise_feedback: string;
  strengths: string[];
  next_step: string;
  target_band_advice: string;
  fluency_coherence: SkillFeedback;
  lexical_resource: SkillFeedback;
  grammar_range_accuracy: SkillFeedback;
  pronunciation: SkillFeedback & { note?: string };
  audio_analysis?: {
    status: string;
    summary: string;
  };
};

function getBandColors(band: number) {
  if (band >= 7.5) {
    return {
      bg: "#E6F6EC",
      text: colors.success,
      border: "#CCEED6"
    };
  }
  if (band >= 6.0) {
    return {
      bg: "#E6F0FA",
      text: "#17345F",
      border: "#CCDDF6"
    };
  }
  return {
    bg: "#FFF9E6",
    text: colors.warning,
    border: "#FFEFC6"
  };
}

export default function ReportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const data = await apiRequest<{
        session: { feedback: Feedback | null };
      }>(`/api/mobile/v1/sessions/${id}`);
      setFeedback(data.session.feedback);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!feedback) {
    return (
      <Screen>
        <EmptyState
          title="Report is not ready"
          message="Return to the session and retry scoring."
        />
      </Screen>
    );
  }

  const skills = [
    ["Fluency and coherence", feedback.fluency_coherence],
    ["Lexical resource", feedback.lexical_resource],
    ["Grammar range and accuracy", feedback.grammar_range_accuracy],
    ["Pronunciation", feedback.pronunciation]
  ] as const;

  return (
    <Screen>
      <View style={styles.scoreHeader}>
        <Text style={styles.eyebrow}>Estimated IELTS result</Text>
        <Card>
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreLabel}>OVERALL BAND</Text>
            <Text style={styles.scoreValue}>
              {feedback.estimated_band.toFixed(1)}
            </Text>
          </View>
        </Card>
      </View>

      <Card>
        <Text style={uiStyles.sectionTitle}>Summary</Text>
        <Text style={uiStyles.body}>{feedback.concise_feedback}</Text>
      </Card>

      {skills.map(([label, skill]) => {
        const bandColors = getBandColors(skill.band);
        return (
          <Card key={label}>
            <View style={styles.skillHeader}>
              <Text style={styles.skillLabel}>{label}</Text>
              <View
                style={[
                  styles.skillBadge,
                  {
                    backgroundColor: bandColors.bg,
                    borderColor: bandColors.border
                  }
                ]}
              >
                <Text style={[styles.skillBandText, { color: bandColors.text }]}>
                  {skill.band.toFixed(1)}
                </Text>
              </View>
            </View>
            <Text style={uiStyles.body}>{skill.feedback}</Text>
          </Card>
        );
      })}

      <Card>
        <Text style={uiStyles.sectionTitle}>What worked</Text>
        {feedback.strengths.map((strength) => (
          <Text key={strength} style={uiStyles.body}>
            • {strength}
          </Text>
        ))}
      </Card>
      <Card>
        <Text style={uiStyles.sectionTitle}>Your next step</Text>
        <Text style={uiStyles.body}>{feedback.next_step}</Text>
        <Text style={[uiStyles.body, styles.spacingTop]}>{feedback.target_band_advice}</Text>
      </Card>
      {feedback.audio_analysis ? (
        <Card>
          <Text style={uiStyles.sectionTitle}>Audio analysis</Text>
          <Text style={uiStyles.body}>
            {feedback.audio_analysis.status}: {feedback.audio_analysis.summary}
          </Text>
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background
  },
  scoreHeader: {
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
  scoreContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    gap: 4
  },
  scoreLabel: {
    color: colors.inkMuted,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1
  },
  scoreValue: {
    color: colors.primary,
    fontSize: 48,
    fontWeight: "900",
    letterSpacing: -1
  },
  skillHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md
  },
  skillLabel: {
    flex: 1,
    color: colors.ink,
    fontSize: 18,
    fontWeight: "700"
  },
  skillBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center"
  },
  skillBandText: {
    fontSize: 15,
    fontWeight: "800"
  },
  spacingTop: {
    marginTop: spacing.md
  }
});
