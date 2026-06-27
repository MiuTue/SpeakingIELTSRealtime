import { ActivityIndicator, Dimensions, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { Redirect, router } from "expo-router";
import { SymbolView } from "expo-symbols";
import type { SFSymbol } from "sf-symbols-typescript";
import Animated, {
  type SharedValue,
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolation,
  interpolateColor
} from "react-native-reanimated";
import { authClient } from "@/lib/auth-client";
import { PrimaryButton, SecondaryButton } from "@/components/ui";
import { colors, spacing } from "@/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const SLIDES = [
  {
    id: "slide1",
    eyebrow: "PRACTICE ROOM",
    title: "Realtime AI Examiner",
    desc: "Speak naturally in a low-latency environment with a simulated examiner that listens and adapts.",
    icon: "waveform.and.mic",
    iconColor: colors.primary
  },
  {
    id: "slide2",
    eyebrow: "SMART EVALUATION",
    title: "Instant Band Scoring",
    desc: "Get immediate feedback on grammar, vocabulary, pronunciation, and estimated band score.",
    icon: "sparkles",
    iconColor: "#D97706"
  },
  {
    id: "slide3",
    eyebrow: "ANALYTICS FEED",
    title: "Detailed Progress Tracking",
    desc: "Monitor speaking minutes, past sessions, and track your target band progression.",
    icon: "chart.xyaxis.line",
    iconColor: colors.navy
  }
];

export default function Index() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (session) {
    return <Redirect href="/(tabs)" />;
  }

  return <OnboardingContent session={session} />;
}

function OnboardingContent({ session }: { session: { user: { id: string } } | null }) {
  const scrollX = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    }
  });

  const animatedBgStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      scrollX.value,
      [0, SCREEN_WIDTH, SCREEN_WIDTH * 2],
      ["#F2E8FA", "#FAE6F2", "#EBF1FA"]
    );
    return {
      backgroundColor
    };
  });

  return (
    <SafeAreaView style={styles.safe}>
      <Animated.View style={[styles.container, animatedBgStyle]}>
        <View style={styles.topLogo}>
          <View style={styles.logoIconContainer}>
            <SymbolView name="waveform.and.mic" tintColor={colors.white} size={18} />
          </View>
          <Text style={styles.logoText}>SpeakIELTS AI</Text>
        </View>

        <Animated.ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          contentContainerStyle={styles.scrollContainer}
        >
          {SLIDES.map((slide) => (
            <View key={slide.id} style={[styles.slide, { width: SCREEN_WIDTH }]}>
              <View style={[styles.iconContainer, { backgroundColor: slide.iconColor + "15" }]}>
              <SymbolView name={slide.icon as SFSymbol} tintColor={slide.iconColor} size={64} />
              </View>
              <Text style={styles.eyebrow}>{slide.eyebrow}</Text>
              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.desc}>{slide.desc}</Text>
            </View>
          ))}
        </Animated.ScrollView>

        <View style={styles.indicatorContainer}>
          {SLIDES.map((_, index) => (
            <IndicatorDot key={index} index={index} scrollX={scrollX} />
          ))}
        </View>

        <View style={styles.bottomActions}>
          {session ? (
            <PrimaryButton
              label="Go to dashboard"
              onPress={() => router.replace("/(tabs)")}
            />
          ) : (
            <>
              <PrimaryButton
                label="Create account"
                onPress={() => router.push("/sign-up")}
              />
              <View style={styles.spacer} />
              <SecondaryButton
                label="Sign in"
                onPress={() => router.push("/sign-in")}
              />
            </>
          )}
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

function IndicatorDot({ index, scrollX }: { index: number; scrollX: SharedValue<number> }) {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH
    ];

    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.8, 1.2, 0.8],
      Extrapolation.CLAMP
    );

    const width = interpolate(
      scrollX.value,
      inputRange,
      [8, 22, 8],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.4, 1.0, 0.4],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale }],
      width,
      opacity
    };
  });

  return (
    <Animated.View style={[styles.indicatorDot, animatedStyle]} />
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F5F7FB"
  },
  container: {
    flex: 1,
    justifyContent: "space-between"
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F7FB"
  },
  topLogo: {
    paddingTop: spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm
  },
  logoIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3
  },
  logoText: {
    fontSize: 20,
    fontWeight: "900",
    color: colors.navy,
    letterSpacing: -0.5
  },
  scrollContainer: {
    alignItems: "center"
  },
  slide: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xxl,
    gap: spacing.md
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: 1.5,
    textTransform: "uppercase"
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.ink,
    textAlign: "center",
    lineHeight: 34,
    letterSpacing: -0.5
  },
  desc: {
    fontSize: 15,
    color: colors.inkMuted,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 290
  },
  indicatorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginBottom: spacing.xl
  },
  indicatorDot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.navy
  },
  bottomActions: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl
  },
  spacer: {
    height: spacing.md
  }
});
