import { NextRequest, NextResponse } from "next/server";

const upstream = process.env.GENLAYER_RPC_UPSTREAM ?? "https://studio.genlayer.com/api";
const retryable = (status: number) => status === 429 || status >= 500;
const delay = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export async function POST(request: NextRequest) {
  const body = await request.text();
  let upstreamResponse: Response | undefined;
  let lastError: unknown;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      upstreamResponse = await fetch(upstream, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
        cache: "no-store",
      });
      if (!retryable(upstreamResponse.status) || attempt === 3) break;
    } catch (error) {
      lastError = error;
      if (attempt === 3) break;
    }
    await delay(300 * (attempt + 1));
  }

  if (!upstreamResponse) {
    return NextResponse.json(
      {
        error: "genlayer_upstream_unavailable",
        detail: lastError instanceof Error ? lastError.message : String(lastError),
      },
      { status: 502 },
    );
  }

  return new NextResponse(await upstreamResponse.text(), {
    status: upstreamResponse.status,
    headers: { "content-type": upstreamResponse.headers.get("content-type") ?? "application/json" },
  });
}
