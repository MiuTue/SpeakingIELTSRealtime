import { Redirect, Tabs } from "expo-router";
import { SymbolView } from "expo-symbols";
import { authClient } from "@/lib/auth-client";
import { colors } from "@/theme";

const icons = {
  index: "house.fill",
  practice: "waveform.and.mic",
  history: "clock.arrow.circlepath",
  profile: "person.crop.circle"
} as const;

export default function TabLayout() {
  const { data: session, isPending } = authClient.useSession();
  if (!isPending && !session) return <Redirect href="/sign-in" />;

  return (
    <Tabs
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.navy,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.inkMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <SymbolView name={icons.index} tintColor={color} size={24} />
          )
        }}
      />
      <Tabs.Screen
        name="practice"
        options={{
          title: "Practice",
          tabBarIcon: ({ color }) => (
            <SymbolView name={icons.practice} tintColor={color} size={24} />
          )
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color }) => (
            <SymbolView name={icons.history} tintColor={color} size={24} />
          )
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <SymbolView name={icons.profile} tintColor={color} size={24} />
          )
        }}
      />
    </Tabs>
  );
}
