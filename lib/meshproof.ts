"use client";

import { createClient, createAccount } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus, type TransactionHash } from "genlayer-js/types";
import type { Asset, Review, Challenge, Appeal, Profile, AuditRecord, PublicStats } from "./types";

const FALLBACK_CONTRACT = "0x1170621c8BE2acD0A1792653E3B91196A93A9b3B";

export const CONTRACT = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? FALLBACK_CONTRACT).trim();
export const NETWORK = "Studionet";
const ACTIVE_CHAIN = studionet;
const GENLAYER_READ_RPC = typeof window === "undefined"
  ? "https://studio.genlayer.com/api"
  : `${window.location.origin}/api/genlayer`;
const ACTIVE_READ_CHAIN = {
  ...ACTIVE_CHAIN,
  rpcUrls: { ...ACTIVE_CHAIN.rpcUrls, default: { http: [GENLAYER_READ_RPC] } },
};

type GenLayerWalletProvider = {
  request: (request: { method: string; params?: unknown[] | Record<string, unknown> }) => Promise<unknown>;
};

function requireWalletProvider(): GenLayerWalletProvider {
  const provider = typeof window === "undefined" ? undefined : (window as unknown as { ethereum?: GenLayerWalletProvider }).ethereum;
  if (!provider) throw new Error("No injected wallet is available. Connect MetaMask through RainbowKit.");
  return provider;
}

async function ensureActiveNetwork(provider: GenLayerWalletProvider) {
  const chainId = "0xf22f";
  const rpcUrl = "https://studio.genlayer.com/api";
  const explorerUrl = "https://explorer-studio.genlayer.com";
  try {
    await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId }] });
  } catch (error) {
    const candidate = error as { code?: number; message?: string };
    if (candidate.code !== 4902 && !/unrecognized chain|unknown chain/i.test(candidate.message || "")) throw error;
    await provider.request({ method: "wallet_addEthereumChain", params: [{
      chainId,
      chainName: "GenLayer Studionet",
      nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
      rpcUrls: [rpcUrl],
      blockExplorerUrls: [explorerUrl],
    }] });
    await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId }] });
  }
}

export function hasContract(): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(CONTRACT);
}

const A = CONTRACT as `0x${string}`;

let _read: ReturnType<typeof createClient> | null = null;
function rc() {
  if (!_read) _read = createClient({ chain: ACTIVE_READ_CHAIN, account: createAccount() });
  return _read;
}

function parseObj<T>(raw: unknown): T | null {
  if (typeof raw !== "string" || !raw.trim() || raw.trim() === "{}") return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
}
function parseArr<T>(raw: unknown): T[] {
  if (typeof raw !== "string" || !raw.trim()) return [];
  try { const a = JSON.parse(raw); return Array.isArray(a) ? (a as T[]) : []; } catch { return []; }
}
async function call(fn: string, args: unknown[] = []) {
  if (!hasContract()) throw new Error("no_contract");
  return rc().readContract({ address: A, functionName: fn, args: args as never[] });
}

/* ── reads ── */
export const getPublicStats = async (): Promise<PublicStats | null> => parseObj<PublicStats>(await call("get_public_stats"));
export const getRecentAssets = async (limit = 40): Promise<Asset[]> => parseArr<Asset>(await call("get_recent_assets", [limit]));
export const getVerifiedAssets = async (limit = 40): Promise<Asset[]> => parseArr<Asset>(await call("get_verified_assets", [limit]));
export const getFlaggedAssets = async (limit = 40): Promise<Asset[]> => parseArr<Asset>(await call("get_flagged_assets", [limit]));
export const getAsset = async (id: string): Promise<Asset | null> => parseObj<Asset>(await call("get_asset", [id]));
export const getReview = async (id: string): Promise<Review | null> => parseObj<Review>(await call("get_review", [id]));
export const getChallenge = async (id: string): Promise<Challenge | null> => parseObj<Challenge>(await call("get_challenge", [id]));
export const getAppeal = async (id: string): Promise<Appeal | null> => parseObj<Appeal>(await call("get_appeal", [id]));
export const getProfile = async (addr: string): Promise<Profile | null> => parseObj<Profile>(await call("get_profile", [addr]));
export const getAssetReviews = async (id: string): Promise<Review[]> => parseArr<Review>(await call("get_asset_reviews", [id]));
export const getCreatorAssets = async (addr: string): Promise<Asset[]> => parseArr<Asset>(await call("get_creator_assets", [addr]));
export const getReviewerReviews = async (addr: string): Promise<Review[]> => parseArr<Review>(await call("get_reviewer_reviews", [addr]));
export const getOpenChallenges = async (limit = 50): Promise<Challenge[]> => parseArr<Challenge>(await call("get_open_challenges", [limit]));
export const getOpenAppeals = async (limit = 50): Promise<Appeal[]> => parseArr<Appeal>(await call("get_open_appeals", [limit]));
export const getAuditTrail = async (id: string): Promise<AuditRecord[]> => parseArr<AuditRecord>(await call("get_audit_trail", [id]));

/* ── writes (signed by the RainbowKit-connected injected wallet) ── */
function collectErrorMessages(error: unknown): string[] {
  const seen = new Set<unknown>();
  const messages: string[] = [];
  const visit = (value: unknown, depth = 0) => {
    if (!value || depth > 3 || seen.has(value)) return;
    if (typeof value === "string") {
      const clean = value.replace(/^execution reverted:?\s*/i, "").trim();
      if (clean && !messages.includes(clean)) messages.push(clean);
      return;
    }
    if (typeof value !== "object") return;
    seen.add(value);
    const row = value as Record<string, unknown>;
    for (const key of ["shortMessage", "reason", "details", "message"]) visit(row[key], depth + 1);
    for (const key of ["cause", "data", "error"]) visit(row[key], depth + 1);
  };
  visit(error);
  return messages;
}

export function formatError(error: unknown): string {
  const messages = collectErrorMessages(error);
  if (messages.length) return messages.join(" / ").slice(0, 600);
  try {
    const json = JSON.stringify(error);
    if (json && json !== "{}") return json.slice(0, 600);
  } catch {}
  return "Transaction failed. Check the wallet activity and retry.";
}

function isBusy(error: unknown): boolean {
  const message = formatError(error).toLowerCase();
  return message.includes("execution slots") || message.includes("server busy") || message.includes("busy");
}
export function busyMessage(error: unknown): string {
  if (isBusy(error)) return `${NETWORK} is busy (all execution slots occupied). Wait a moment and retry.`;
  return formatError(error);
}

export async function writeMethod(address: `0x${string}`, fn: string, args: unknown[]): Promise<`0x${string}`> {
  const provider = requireWalletProvider();
  await ensureActiveNetwork(provider);
  const client = createClient({ chain: ACTIVE_CHAIN, account: address, provider: provider as never });
  const hash = await client.writeContract({ address: A, functionName: fn, args: args as never[], value: 0n });
  return hash as `0x${string}`;
}
export async function waitAccepted(address: `0x${string}`, hash: `0x${string}`): Promise<void> {
  const client = createClient({ chain: ACTIVE_READ_CHAIN, account: createAccount() });
  await client.waitForTransactionReceipt({
    hash: hash as unknown as TransactionHash,
    status: TransactionStatus.ACCEPTED,
    interval: 5000,
    retries: 90,
  });
  if (typeof window !== "undefined") {
    await fetch("/api/genlayer", { method: "DELETE", cache: "no-store" }).catch(() => undefined);
  }
}
