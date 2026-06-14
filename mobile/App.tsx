import { ExpoRoot } from "expo-router";
import type { RequireContext } from "expo-router/build/types";

declare const require: {
  context: (
    path: string,
    deep?: boolean,
    filter?: RegExp
  ) => RequireContext;
};

export default function App() {
  return <ExpoRoot context={require.context("./src/app")} />;
}
