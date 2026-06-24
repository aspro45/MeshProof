"use client";

import dynamic from "next/dynamic";
import type { RiskTone } from "@/lib/types";

// R3F cannot server-render — load the canvas only on the client.
const AssetInspector = dynamic(() => import("./AssetInspector").then((m) => m.AssetInspector), {
  ssr: false,
  loading: () => (
    <div className="grid h-full w-full place-items-center rounded-md border border-line bg-[#0a0f16] text-sm text-muted">
      Loading 3D inspector…
    </div>
  ),
});

export function InspectorBay({ tone = "neutral", height = 380 }: { tone?: RiskTone; height?: number }) {
  return (
    <div style={{ height }}>
      <AssetInspector tone={tone} height={height} />
    </div>
  );
}
