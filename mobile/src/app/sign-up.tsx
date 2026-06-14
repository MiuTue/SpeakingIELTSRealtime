import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { router } from "expo-router";
import { authClient } from "@/lib/auth-client";
import { Card, PrimaryButton, Screen, Title, uiStyles } from "@/components/ui";
import { colors, radius, spacing } from "@/theme";

export default function SignUpScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function signUp() {
    setLoading(true);
    setError("");
    const result = await authClient.signUp.email({
      name: name.trim(),
      email: email.trim(),
      password
    });
    setLoading(false);
    if (result.error) {
      setError(result.error.message || "Account creation failed.");
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
          <Title eyebrow="SpeakIELTS AI">Create your learner account.</Title>
          <Text style={uiStyles.body}>
            The same account works in the mobile and web applications.
          </Text>
        </View>
        <Card>
          <Field
            label="Name"
            value={name}
            onChangeText={setName}
            autoComplete="name"
          />
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
            autoComplete="new-password"
            secureTextEntry
          />
          {error ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {error}
            </Text>
          ) : null}
          <PrimaryButton
            disabled={!name.trim() || !email.trim() || password.length < 8}
            label="Create account"
            loading={loading}
            onPress={() => void signUp()}
          />
          <Text
            accessibilityRole="link"
            onPress={() => router.back()}
            style={styles.link}
          >
            Back to sign in
          </Text>
        </Card>
      </Screen>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  ...inputProps
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  autoCapitalize?: "none";
  autoComplete?: "name" | "email" | "new-password";
  keyboardType?: "email-address";
  secureTextEntry?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={uiStyles.label}>{label}</Text>
      <TextInput
        {...inputProps}
        placeholder={label}
        placeholderTextColor={colors.inkMuted}
        style={[styles.input, focused && styles.inputFocused]}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
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
