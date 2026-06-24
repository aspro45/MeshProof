import { defineChain } from "viem";

const RPC = process.env.NEXT_PUBLIC_GENLAYER_RPC ?? "https://studio.genlayer.com/api";
const EXPLORER = process.env.NEXT_PUBLIC_GENLAYER_EXPLORER ?? "https://explorer-studio.genlayer.com";
export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_GENLAYER_CHAIN_ID ?? 61999);

/** GenLayer Studionet as a viem/wagmi custom chain (used by RainbowKit). */
export const studionetChain = defineChain({
  id: CHAIN_ID,
  name: "GenLayer Studionet",
  nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
  rpcUrls: { default: { http: [RPC] }, public: { http: [RPC] } },
  blockExplorers: { default: { name: "Studio Explorer", url: EXPLORER } },
  testnet: true,
});
