const UPSTREAM = process.env.GENLAYER_RPC_UPSTREAM ?? "https://studio.genlayer.com/api";
const MAX_ATTEMPTS = 5;
const REQUEST_TIMEOUT_MS = 25_000;
const delay = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const retryable = (status: number) => status === 429 || status >= 500;
const retryableRpcBody = (body: string) => {
  try {
    const parsed = JSON.parse(body) as { error?: unknown };
    const message = JSON.stringify(parsed.error || "").toLowerCase();
    return message.includes("server busy")
      || message.includes("execution slots")
      || message.includes("temporarily unavailable")
      || message.includes("too many requests");
  } catch {
    return false;
  }
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "invalid_json_rpc_request" }, { status: 400 });
  }
  if (!payload || typeof payload !== "object" || (payload as { jsonrpc?: unknown }).jsonrpc !== "2.0" || typeof (payload as { method?: unknown }).method !== "string") {
    return Response.json({ error: "invalid_json_rpc_request" }, { status: 400 });
  }
  let upstreamResponse: Response | undefined;
  let upstreamBody = "";
  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    upstreamResponse = undefined;
    upstreamBody = "";
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      upstreamResponse = await fetch(UPSTREAM, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
        cache: "no-store",
      });
      upstreamBody = await upstreamResponse.text();
      const shouldRetry = retryable(upstreamResponse.status) || retryableRpcBody(upstreamBody);
      if (!shouldRetry || attempt === MAX_ATTEMPTS - 1) break;
    } catch (error) {
      lastError = error;
      if (attempt === MAX_ATTEMPTS - 1) break;
    } finally {
      clearTimeout(timeout);
    }
    await delay(Math.min(400 * (2 ** attempt), 2_500));
  }
  if (!upstreamResponse) {
    return Response.json({
      error: "genlayer_upstream_unavailable",
      detail: lastError instanceof Error ? lastError.message : String(lastError),
    }, { status: 502 });
  }
  return new Response(upstreamBody, {
    status: upstreamResponse.status,
    headers: {
      "cache-control": "no-store",
      "content-type": upstreamResponse.headers.get("content-type") || "application/json",
    },
  });
}

export function GET() {
  return Response.json({ error: "method_not_allowed" }, { status: 405, headers: { allow: "POST" } });
}
