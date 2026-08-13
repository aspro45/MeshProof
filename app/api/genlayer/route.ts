import type { NextRequest } from "next/server";

const upstream = process.env.GENLAYER_RPC_UPSTREAM || "https://studio.genlayer.com/api";
const MAX_BODY_BYTES = 128 * 1024;
const CACHE_TTL_MS = 60_000;
const STALE_TTL_MS = 5 * 60_000;
const MAX_CACHE_ENTRIES = 200;
const ALLOWED_METHODS = new Set([
  "eth_blockNumber",
  "eth_call",
  "eth_chainId",
  "eth_getBalance",
  "eth_getCode",
  "eth_getTransactionByHash",
  "eth_getTransactionReceipt",
  "gen_call",
  "gen_getContractSchema",
  "gen_getTransactionStatus",
  "net_version",
  "web3_clientVersion",
]);

type CachedRpc = {
  bytes: Uint8Array;
  status: number;
  contentType: string;
  freshUntil: number;
  staleUntil: number;
};

const cache = new Map<string, CachedRpc>();
const inFlight = new Map<string, Promise<CachedRpc>>();
const delay = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const json = (value: unknown, status: number) => Response.json(value, {
  status,
  headers: {
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  },
});
const responseFrom = (entry: CachedRpc, cacheState: "HIT" | "MISS" | "STALE", requestId: unknown) => {
  let bytes = entry.bytes;
  if (entry.contentType.includes("json")) {
    try {
      const payload = JSON.parse(new TextDecoder().decode(entry.bytes)) as Record<string, unknown>;
      payload.id = requestId ?? null;
      bytes = new TextEncoder().encode(JSON.stringify(payload));
    } catch {}
  }
  return new Response(bytes.slice().buffer, {
  status: entry.status,
  headers: {
    "content-type": entry.contentType,
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    "x-meshproof-rpc-cache": cacheState,
  },
  });
};

async function fetchUpstream(body: string): Promise<CachedRpc> {
  let response: Response | undefined;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    response = await fetch(upstream, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      cache: "no-store",
    });
    if ((response.status !== 429 && response.status < 500) || attempt === 1) break;
    await delay(400);
  }
  const bytes = new Uint8Array(await response!.arrayBuffer());
  const now = Date.now();
  return {
    bytes,
    status: response!.status,
    contentType: response!.headers.get("content-type") || "application/json",
    freshUntil: now + CACHE_TTL_MS,
    staleUntil: now + STALE_TTL_MS,
  };
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE() {
  cache.clear();
  return json({ cleared: true }, 200);
}

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_BODY_BYTES) return json({ error: "request_too_large" }, 413);

  const body = await request.text();
  if (Buffer.byteLength(body, "utf8") > MAX_BODY_BYTES) return json({ error: "request_too_large" }, 413);

  let payload: { jsonrpc?: unknown; method?: unknown; params?: unknown; id?: unknown };
  try {
    payload = JSON.parse(body) as typeof payload;
  } catch {
    return json({ error: "invalid_json" }, 400);
  }
  if (Array.isArray(payload) || payload.jsonrpc !== "2.0" || typeof payload.method !== "string") {
    return json({ error: "invalid_json_rpc_request" }, 400);
  }
  if (!ALLOWED_METHODS.has(payload.method)) {
    return json({ jsonrpc: "2.0", id: payload.id ?? null, error: { code: -32601, message: "Method not allowed" } }, 403);
  }

  const cacheKey = JSON.stringify([payload.method, payload.params ?? []]);
  const now = Date.now();
  const cached = cache.get(cacheKey);
  if (cached && cached.freshUntil > now) return responseFrom(cached, "HIT", payload.id);

  let pending = inFlight.get(cacheKey);
  if (!pending) {
    pending = fetchUpstream(body);
    inFlight.set(cacheKey, pending);
  }

  try {
    const result = await pending;
    const text = new TextDecoder().decode(result.bytes);
    const isRpcError = /"error"\s*:/.test(text);
    if (result.status === 200 && !isRpcError) {
      if (cache.size >= MAX_CACHE_ENTRIES) cache.delete(cache.keys().next().value as string);
      cache.set(cacheKey, result);
      return responseFrom(result, "MISS", payload.id);
    }
    if (cached && cached.staleUntil > now && (result.status === 429 || result.status >= 500 || isRpcError)) {
      return responseFrom(cached, "STALE", payload.id);
    }
    return responseFrom(result, "MISS", payload.id);
  } finally {
    inFlight.delete(cacheKey);
  }
}
