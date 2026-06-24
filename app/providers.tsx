"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { useEffect, useState, type ReactNode } from "react";
import { RainbowKitProvider, connectorsForWallets, darkTheme } from "@rainbow-me/rainbowkit";
import { injectedWallet, walletConnectWallet } from "@rainbow-me/rainbowkit/wallets";
import { createConfig, http, WagmiProvider, type Config } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { studionetChain } from "@/lib/studionet";

export const WALLETCONNECT_PROJECT_ID = (process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "").trim();
type RainbowConfig = Config;

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [config, setConfig] = useState<RainbowConfig | null>(null);

  useEffect(() => {
    const walletList = [
      injectedWallet,
      ...(WALLETCONNECT_PROJECT_ID ? [walletConnectWallet] : []),
    ];

    const connectors = connectorsForWallets(
      [{ groupName: "MeshProof wallets", wallets: walletList }],
      {
        appName: "MeshProof",
        projectId: WALLETCONNECT_PROJECT_ID || "meshproof-local-dev",
      },
    );

    setConfig(createConfig({
      chains: [studionetChain],
      connectors,
      ssr: true,
      transports: {
        [studionetChain.id]: http(studionetChain.rpcUrls.default.http[0]),
      },
    }));
  }, []);

  if (!config) {
    return (
      <QueryClientProvider client={queryClient}>
        <div className="grid min-h-screen place-items-center bg-bg px-6 text-center text-sm text-muted">
          <div>
            <div className="mx-auto mb-3 h-2 w-28 overflow-hidden rounded-full bg-panel2">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-primary" />
            </div>
            Loading MeshProof inspection console
          </div>
        </div>
      </QueryClientProvider>
    );
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          initialChain={studionetChain}
          theme={darkTheme({ accentColor: "#38BDF8", accentColorForeground: "#05070A", borderRadius: "small", overlayBlur: "small" })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
