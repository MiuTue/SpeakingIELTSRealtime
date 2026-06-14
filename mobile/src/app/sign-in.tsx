import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { Redirect, router } from "expo-router";
import { authClient } from "@/lib/auth-client";
import { Card, PrimaryButton, Screen, Title, uiStyles } from "@/components/ui";
import { colors, radius, spacing } from "@/theme";

export default function SignInScreen() {
  const { data: session } = authClient.useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focusEmail, setFocusEmail] = useState(false);
  const [focusPassword, setFocusPassword] = useState(false);

  if (session) return <Redirect href="/(tabs)" />;

  async function signIn() {
    setLoading(true);
    setError("");
    const result = await authClient.signIn.email({ email: email.trim(), password });
    setLoading(false);
    if (result.error) {
      setError(result.error.message || "Sign in failed.");
      return;
    }
    router.replace("/(tabs)");
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.flex}
    >
      <Screen>
        <View style={styles.hero}>
          <Title eyebrow="SpeakIELTS AI">Practice with a calmer examiner.</Title>
          <Text style={uiStyles.body}>
            Sign in with the same account you use on the web app.
          </Text>
        </View>
        <Card>
          <View style={styles.field}>
            <Text style={uiStyles.label}>Email</Text>
            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={colors.inkMuted}
              style={[styles.input, focusEmail && styles.inputFocused]}
              onFocus={() => setFocusEmail(true)}
              onBlur={() => setFocusEmail(false)}
            />
          </View>
          <View style={styles.field}>
            <Text style={uiStyles.label}>Password</Text>
            <TextInput
              autoCapitalize="none"
              autoComplete="current-password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              placeholder="At least 8 characters"
              placeholderTextColor={colors.inkMuted}
              style={[styles.input, focusPassword && styles.inputFocused]}
              onFocus={() => setFocusPassword(true)}
              onBlur={() => setFocusPassword(false)}
              onSubmitEditing={() => void signIn()}
            />
          </View>
          {error ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {error}
            </Text>
          ) : null}
          <PrimaryButton
            disabled={!email.trim() || password.length < 8}
            label="Sign in"
            loading={loading}
            onPress={() => void signIn()}
          />
          <Text
            accessibilityRole="link"
            onPress={() => router.push("/sign-up")}
            style={styles.link}
          >
            Create a new account
          </Text>
        </Card>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hero: {
    marginTop: spacing.xxl,
    gap: spacing.md
  },
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
  error: {
    color: colors.danger,
    fontSize: 14,
    lineHeight: 20
  },
  link: {
    minHeight: 44,
    color: colors.primary,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "700",
    paddingTop: 12
  }
});
