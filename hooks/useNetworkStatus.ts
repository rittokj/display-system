import * as Network from "expo-network";
import { useEffect, useState, useRef } from "react";

export default function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const isConnectedRef = useRef<boolean | null>(null);

  useEffect(() => {
    const checkNetwork = async () => {
      const status = await Network.getNetworkStateAsync();
      const connected = status.isConnected && status.isInternetReachable;
      setIsConnected(connected);
      isConnectedRef.current = connected;
    };

    checkNetwork();

    const subscription = Network.addNetworkStateListener((state) => {
      const connected = state.isConnected && state.isInternetReachable;
      setIsConnected(connected);
      isConnectedRef.current = connected;
    });

    return () => subscription && subscription.remove();
  }, []);

  return { isConnected, isConnectedRef };
}
