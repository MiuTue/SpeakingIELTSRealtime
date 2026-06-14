import { useEffect, useState } from "react";
import * as Network from "expo-network";

export function useNetwork() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    let mounted = true;

    const refresh = async () => {
      const state = await Network.getNetworkStateAsync();
      if (mounted) setOnline(Boolean(state.isConnected && state.isInternetReachable !== false));
    };
    void refresh();
    const subscription = Network.addNetworkStateListener((state) => {
      setOnline(Boolean(state.isConnected && state.isInternetReachable !== false));
    });

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return online;
}
