import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  type AppStateStatus,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  Easing,
  interpolate,
  Extrapolation,
  useDerivedValue
} from "react-native-reanimated";
import { router, useLocalSearchParams } from "expo-router";
import { Buffer } from "buffer";
import type {
  MobileSessionSummary,
  SessionCheckpoint,
  SpeakingPart
} from "@speakielts/contracts";
import { apiRequest } from "@/lib/api";
import {
  MobileGeminiLiveClient,
  type LiveCallbacks
} from "@/lib/gemini-live";
import type { CandidateAudio } from "@/lib/audio";
import { PrimaryButton, SecondaryButton } from "@/components/ui";
import { colors, radius, spacing } from "@/theme";

type LiveStatus =
  | "ready"
  | "connecting"
  | "examiner_speaking"
  | "listening"
  | "candidate_speaking"
  | "paused"
  | "scoring"
  | "error";

type Turn = {
  clientTurnId: string;
  sequence: number;
  part: SpeakingPart;
  question: string;
  transcript: string;
  durationSeconds: number;
  audio?: CandidateAudio;
};

type SessionDetail = MobileSessionSummary & {
  voice: string;
  checkpoint: SessionCheckpoint | null;
  turns: Turn[];
  feedback: unknown;
};

type TokenResponse = {
  token: string;
  model: string;
  websocketUrl: string;
  expiresAt: string;
  setup: { setup: Record<string, unknown> };
};

const STATUS_COLORS: Record<LiveStatus, string> = {
  ready: "#F5F7FB",
  connecting: "#EBF1FA",
  examiner_speaking: "#E6EEFA",
  listening: "#F2E8FA",
  candidate_speaking: "#FAE6F2",
  paused: "#EEF1F6",
  scoring: "#E6F6EC",
  error: "#FDF0F0"
};

const STATUS_ACCENTS: Record<LiveStatus, string> = {
  ready: "#DCE3ED",
  connecting: "#17345F",
  examiner_speaking: "#17345F",
  listening: "#B01868",
  candidate_speaking: "#B01868",
  paused: "#60708A",
  scoring: "#18794E",
  error: "#C4322B"
};

export default function LiveSessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const clientRef = useRef<MobileGeminiLiveClient | null>(null);
  const connectRef = useRef<
    ((startExam?: boolean) => Promise<void>) | null
  >(null);
  const detailRef = useRef<SessionDetail | null>(null);
  const turnsRef = useRef<Turn[]>([]);
  const questionRef = useRef("");
  const intentionalDisconnectRef = useRef(false);
  const wasBackgroundedRef = useRef(false);
  const reconnectAttemptRef = useRef(0);
  const startedAtRef = useRef(Date.now());
  const connectingRef = useRef(false);
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [status, setStatus] = useState<LiveStatus>("ready");
  const [question, setQuestion] = useState("Ready when you are.");
  const [transcript, setTranscript] = useState("");
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState("");

  const volumeShared = useSharedValue(0);
  const statusColorShared = useSharedValue(STATUS_COLORS.ready);
  const accentColorShared = useSharedValue(STATUS_ACCENTS.ready);
  const breatheShared = useSharedValue(0);

  useEffect(() => {
    statusColorShared.value = withTiming(STATUS_COLORS[status], { duration: 600 });
    accentColorShared.value = withTiming(STATUS_ACCENTS[status], { duration: 600 });
  }, [status, statusColorShared, accentColorShared]);

  useEffect(() => {
    breatheShared.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
      -1,
      true
    );
  }, [breatheShared]);

  const smoothVolume = useDerivedValue(() => {
    return withSpring(volumeShared.value, {
      damping: 15,
      stiffness: 120,
      mass: 0.5
    });
  });

  const animatedBgStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: statusColorShared.value,
    };
  });

  const coreStyle = useAnimatedStyle(() => {
    const idleBreathe = ["listening", "candidate_speaking"].includes(status)
      ? breatheShared.value * 0.08
      : 0;
    const scale = 1 + smoothVolume.value * 0.2 + idleBreathe;
    return {
      transform: [{ scale }],
      backgroundColor: accentColorShared.value,
    };
  });

  const middleWaveStyle = useAnimatedStyle(() => {
    const scale = 1 + smoothVolume.value * 0.8;
    const opacity = interpolate(
      smoothVolume.value,
      [0, 1],
      [0.3, 0.08],
      Extrapolation.CLAMP
    );
    return {
      transform: [{ scale }],
      opacity,
      backgroundColor: accentColorShared.value,
    };
  });

  const outerWaveStyle = useAnimatedStyle(() => {
    const scale = 1 + smoothVolume.value * 1.5;
    const opacity = interpolate(
      smoothVolume.value,
      [0, 1],
      [0.15, 0.02],
      Extrapolation.CLAMP
    );
    return {
      transform: [{ scale }],
      opacity,
      backgroundColor: accentColorShared.value,
    };
  });

  const updateDetail = useCallback((value: SessionDetail) => {
    detailRef.current = value;
    setDetail(value);
    turnsRef.current = value.turns ?? [];
    setTurns(value.turns ?? []);
    const checkpointQuestion = value.checkpoint?.question;
    if (checkpointQuestion) {
      questionRef.current = checkpointQuestion;
      setQuestion(checkpointQuestion);
    }
  }, []);

  const loadSession = useCallback(async () => {
    if (!id) return null;
    const data = await apiRequest<{ session: SessionDetail }>(
      `/api/mobile/v1/sessions/${id}`
    );
    updateDetail(data.session);
    return data.session;
  }, [id, updateDetail]);

  useEffect(() => {
    void loadSession().catch(() => {
      setError("This speaking session could not be loaded.");
      setStatus("error");
    });
  }, [loadSession]);

  const persistCheckpoint = useCallback(
    async (nextStatus: "ACTIVE" | "PAUSED") => {
      const current = detailRef.current;
      if (!id || !current) return;
      const part = inferPart(current.mode, turnsRef.current.length);
      const checkpoint: SessionCheckpoint = {
        clientTurnId: turnsRef.current.at(-1)?.clientTurnId,
        sequence: turnsRef.current.length,
        part,
        question: questionRef.current,
        examinerTurnComplete: Boolean(questionRef.current),
        elapsedSeconds: Math.round((Date.now() - startedAtRef.current) / 1000),
        updatedAt: new Date().toISOString()
      };
      const data = await apiRequest<{ session: MobileSessionSummary }>(
        `/api/mobile/v1/sessions/${id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status: nextStatus,
            checkpoint,
            durationSeconds: checkpoint.elapsedSeconds,
            version: current.version
          })
        }
      );
      updateDetail({
        ...current,
        ...data.session,
        checkpoint,
        turns: turnsRef.current
      });
    },
    [id, updateDetail]
  );

  const uploadAudio = useCallback(
    async (turn: Turn) => {
      if (!id || !turn.audio) return;
      const bytes = Buffer.from(turn.audio.data, "base64");
      const provisioned = await apiRequest<{
        asset: { id: string };
        upload: {
          url: string;
          method: "PUT";
          headers: Record<string, string>;
        };
      }>(`/api/mobile/v1/sessions/${id}/audio-upload`, {
        method: "POST",
        body: JSON.stringify({
          clientTurnId: turn.clientTurnId,
          contentType: "audio/wav",
          byteCount: bytes.byteLength
        })
      });
      const response = await fetch(provisioned.upload.url, {
        method: "PUT",
        headers: provisioned.upload.headers,
        body: bytes as unknown as BodyInit
      });
      if (!response.ok) throw new Error("Audio upload failed");
      await apiRequest(`/api/mobile/v1/audio-assets/${provisioned.asset.id}`, {
        method: "PATCH",
        body: JSON.stringify({ byteCount: bytes.byteLength })
      });
    },
    [id]
  );

  const persistTurn = useCallback(
    async (turn: Turn) => {
      if (!id) return;
      await apiRequest(`/api/mobile/v1/sessions/${id}/turns`, {
        method: "POST",
        headers: { "Idempotency-Key": turn.clientTurnId },
        body: JSON.stringify(turn)
      });
      void uploadAudio(turn).catch(() => undefined);
      await persistCheckpoint("ACTIVE");
    },
    [id, persistCheckpoint, uploadAudio]
  );

  const scheduleReconnect = useCallback(() => {
    if (reconnectAttemptRef.current >= 3) {
      setStatus("error");
      setError("Connection was lost. Tap reconnect when your network is stable.");
      return;
    }
    const delay = 1000 * 2 ** reconnectAttemptRef.current;
    reconnectAttemptRef.current += 1;
    setTimeout(() => {
      if (!wasBackgroundedRef.current) void connectRef.current?.(false);
    }, delay);
  }, []);

  const callbacks = useCallback(
    (): LiveCallbacks => ({
      onConnected: () => {
        reconnectAttemptRef.current = 0;
        setError("");
      },
      onExaminerSpeaking: () => {
        setStatus("examiner_speaking");
        setTranscript("");
      },
      onExaminerTurn: (value) => {
        questionRef.current = value;
        setQuestion(value);
        setStatus("listening");
        void persistCheckpoint("ACTIVE").catch(() => undefined);
      },
      onListening: () => setStatus("listening"),
      onCandidateTranscript: (value) => {
        setTranscript(value);
        setStatus("candidate_speaking");
      },
      onCandidateTurn: (value, audio) => {
        const current = detailRef.current;
        if (!current || !id || !questionRef.current) return;
        const sequence = turnsRef.current.length;
        const turn: Turn = {
          clientTurnId: `${id}-${sequence}`,
          sequence,
          part: inferPart(current.mode, sequence),
          question: questionRef.current,
          transcript: value,
          durationSeconds: Math.max(
            1,
            Math.round((audio?.durationMs ?? 0) / 1000)
          ),
          audio
        };
        const nextTurns = [
          ...turnsRef.current.filter(
            (item) => item.clientTurnId !== turn.clientTurnId
          ),
          turn
        ];
        turnsRef.current = nextTurns;
        setTurns(nextTurns);
        setTranscript("");
        void persistTurn(turn).catch(() => {
          setError("Your answer is saved locally but has not synced yet.");
        });
      },
      onVolume: (val) => {
        volumeShared.value = val;
      },
      onDisconnected: () => {
        if (!intentionalDisconnectRef.current && !wasBackgroundedRef.current) {
          scheduleReconnect();
        }
      },
      onError: (cause) => {
        setError(cause.message);
        setStatus("error");
      }
    }),
    [id, persistCheckpoint, persistTurn, scheduleReconnect, volumeShared]
  );

  const connect = useCallback(
    async (startExam = false) => {
      if (!id || connectingRef.current) return;
      connectingRef.current = true;
      clientRef.current?.disconnect();
      clientRef.current = null;
      intentionalDisconnectRef.current = false;
      setStatus("connecting");
      setError("");
      try {
        const token = await apiRequest<TokenResponse>(
          `/api/mobile/v1/sessions/${id}/realtime-token`,
          { method: "POST" }
        );
        const client = new MobileGeminiLiveClient(callbacks());
        clientRef.current = client;
        await client.connect(token);
        if (startExam || !questionRef.current) client.startExam();
        else client.resumeListening();
      } catch (cause) {
        setStatus("error");
        setError(
          cause instanceof Error ? cause.message : "Could not connect live audio."
        );
      } finally {
        connectingRef.current = false;
      }
    },
    [callbacks, id]
  );

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  useEffect(() => {
    const onAppState = (next: AppStateStatus) => {
      if (next === "background" || next === "inactive") {
        if (clientRef.current) {
          wasBackgroundedRef.current = true;
          intentionalDisconnectRef.current = true;
          clientRef.current.disconnect();
          clientRef.current = null;
          setStatus("paused");
          void persistCheckpoint("PAUSED").catch(() => undefined);
        }
        return;
      }
      if (next === "active" && wasBackgroundedRef.current) {
        wasBackgroundedRef.current = false;
        void loadSession().then(() => connect(false));
      }
    };
    const subscription = AppState.addEventListener("change", onAppState);
    return () => {
      subscription.remove();
      intentionalDisconnectRef.current = true;
      clientRef.current?.disconnect();
    };
  }, [connect, loadSession, persistCheckpoint]);

  async function finish() {
    if (!id || !turnsRef.current.length) {
      setError("Complete at least one answer before ending the session.");
      return;
    }
    intentionalDisconnectRef.current = true;
    clientRef.current?.disconnect();
    clientRef.current = null;
    setStatus("scoring");
    setError("");
    try {
      await apiRequest(`/api/mobile/v1/sessions/${id}/evaluations`, {
        method: "POST",
        body: JSON.stringify({
          idempotencyKey: `evaluation-${id}`,
          turns: turnsRef.current.map((turn) => ({
            clientTurnId: turn.clientTurnId,
            part: turn.part,
            question: turn.question,
            transcript: turn.transcript,
            audio: turn.audio
          }))
        })
      });
      router.replace("/(tabs)");
    } catch (cause) {
      setStatus("error");
      setError(cause instanceof Error ? cause.message : "Scoring failed.");
    }
  }

  function confirmExit() {
    Alert.alert(
      "Leave live practice?",
      "The session will pause and can be resumed from Home.",
      [
        { text: "Stay", style: "cancel" },
        {
          text: "Pause and leave",
          onPress: () => {
            intentionalDisconnectRef.current = true;
            clientRef.current?.disconnect();
            void persistCheckpoint("PAUSED").finally(() => router.back());
          }
        }
      ]
    );
  }

  if (!detail) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const live = [
    "connecting",
    "examiner_speaking",
    "listening",
    "candidate_speaking"
  ].includes(status);

  return (
    <SafeAreaView style={styles.safe}>
      <Animated.View style={[styles.mainContainer, animatedBgStyle]}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Pause and close"
            hitSlop={12}
            onPress={confirmExit}
            style={styles.close}
          >
            <Text style={styles.closeLabel}>Close</Text>
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.mode}>{detail.mode.replace("_", " ")}</Text>
            <Text style={styles.status}>{statusLabel(status)}</Text>
          </View>
          <View style={styles.close} />
        </View>

        <View style={styles.content}>
          <View style={styles.examiner}>
            <Text style={styles.examinerLabel}>EXAMINER</Text>
            <Text accessibilityLiveRegion="polite" style={styles.question}>
              {status === "examiner_speaking"
                ? "Listening to the examiner..."
                : question}
            </Text>
          </View>

          <View style={styles.voiceArea}>
            <View style={styles.visualizerContainer}>
              <Animated.View style={[styles.pulseOuterWave, outerWaveStyle]} />
              <Animated.View style={[styles.pulseMiddleWave, middleWaveStyle]} />
              <Animated.View style={[styles.pulseInnerCore, coreStyle]} />
            </View>
            <Text style={styles.helper}>
              {status === "listening" || status === "candidate_speaking"
                ? "Speak naturally. The next question will follow after you finish."
                : status === "examiner_speaking"
                  ? "The microphone is paused while the examiner speaks."
                  : "Use a quiet room and keep the phone nearby."}
            </Text>
            {transcript ? <Text style={styles.transcript}>{transcript}</Text> : null}
            {error ? (
              <Text accessibilityRole="alert" style={styles.error}>
                {error}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.actions}>
          {!live && status !== "scoring" ? (
            <PrimaryButton
              label={turns.length || questionRef.current ? "Reconnect" : "Start exam"}
              onPress={() => void connect(!turns.length && !questionRef.current)}
            />
          ) : (
            <>
              <SecondaryButton
                disabled={status === "connecting" || status === "scoring"}
                label={muted ? "Unmute microphone" : "Mute microphone"}
                onPress={() => {
                  const next = !muted;
                  setMuted(next);
                  clientRef.current?.setMuted(next);
                }}
              />
              <PrimaryButton
                disabled={status === "connecting"}
                label="Finish and score"
                loading={status === "scoring"}
                onPress={() => void finish()}
              />
            </>
          )}
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

function inferPart(
  mode: MobileSessionSummary["mode"],
  sequence: number
): SpeakingPart {
  if (mode === "PART2") return "PART2";
  if (mode === "PART3") return "PART3";
  if (mode !== "FULL_TEST") return "PART1";
  if (sequence >= 7) return "PART3";
  if (sequence >= 6) return "PART2";
  return "PART1";
}

function statusLabel(status: LiveStatus) {
  const labels: Record<LiveStatus, string> = {
    ready: "Ready",
    connecting: "Connecting",
    examiner_speaking: "Examiner speaking",
    listening: "Listening",
    candidate_speaking: "You are speaking",
    paused: "Paused",
    scoring: "Building report",
    error: "Needs attention"
  };
  return labels[status];
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background
  },
  mainContainer: {
    flex: 1
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background
  },
  header: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg
  },
  close: {
    width: 64,
    minHeight: 44,
    justifyContent: "center"
  },
  closeLabel: {
    color: colors.navy,
    fontSize: 16,
    fontWeight: "600"
  },
  headerCenter: {
    flex: 1,
    alignItems: "center"
  },
  mode: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "700"
  },
  status: {
    color: colors.inkMuted,
    fontSize: 12
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    gap: spacing.xl
  },
  examiner: {
    backgroundColor: "rgba(255, 255, 255, 0.75)",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.sm,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2
  },
  examinerLabel: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1
  },
  question: {
    color: colors.ink,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "700"
  },
  voiceArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xl
  },
  visualizerContainer: {
    width: 160,
    height: 160,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: spacing.xl
  },
  pulseOuterWave: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70
  },
  pulseMiddleWave: {
    position: "absolute",
    width: 106,
    height: 106,
    borderRadius: 53
  },
  pulseInnerCore: {
    position: "absolute",
    width: 76,
    height: 76,
    borderRadius: 38,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4
  },
  helper: {
    maxWidth: 320,
    color: colors.inkMuted,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20
  },
  transcript: {
    maxWidth: 340,
    color: colors.ink,
    textAlign: "center",
    fontSize: 16,
    lineHeight: 24,
    backgroundColor: "rgba(255, 255, 255, 0.65)",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1
  },
  error: {
    maxWidth: 340,
    color: colors.danger,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20
  },
  actions: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.4)",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 8
  }
});
