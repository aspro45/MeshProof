import { defineChain } from "viem";

const RPC = process.env.NEXT_PUBLIC_GENLAYER_RPC ?? "https://studio.genlayer.com/api";
const EXPLORER = process.env.NEXT_PUBLIC_GENLAYER_EXPLORER ?? "https://explorer-studio.genlayer.com";
export const NETWORK_NAME = process.env.NEXT_PUBLIC_GENLAYER_NETWORK ?? "Studionet";
export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_GENLAYER_CHAIN_ID ?? 61999);

export const studionetChain = defineChain({
  id: CHAIN_ID,
  name: `GenLayer ${NETWORK_NAME}`,
  nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
  rpcUrls: { default: { http: [RPC] }, public: { http: [RPC] } },
  blockExplorers: { default: { name: "Studionet Explorer", url: EXPLORER } },
  testnet: true,
});
