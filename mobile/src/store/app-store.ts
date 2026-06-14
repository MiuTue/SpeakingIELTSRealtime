import { create } from "zustand";
import type {
  MobileBootstrap,
  MobileSessionSummary
} from "@speakielts/contracts";

type AppState = {
  bootstrap: MobileBootstrap | null;
  history: MobileSessionSummary[];
  setBootstrap: (bootstrap: MobileBootstrap | null) => void;
  setHistory: (history: MobileSessionSummary[]) => void;
  upsertSession: (session: MobileSessionSummary) => void;
  reset: () => void;
};

export const useAppStore = create<AppState>((set) => ({
  bootstrap: null,
  history: [],
  setBootstrap: (bootstrap) => set({ bootstrap }),
  setHistory: (history) => set({ history }),
  upsertSession: (session) =>
    set((state) => ({
      history: [
        session,
        ...state.history.filter((item) => item.id !== session.id)
      ]
    })),
  reset: () => set({ bootstrap: null, history: [] })
}));
