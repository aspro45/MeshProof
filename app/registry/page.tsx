"use client";

import { useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBoxesStacked, faRotateRight, faCube, faArrowRight, faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import { StatusChip, Banner, Empty, Skeleton, Hex, Copy, Stat } from "@/components/ui";
import { useLoader } from "@/lib/hooks";
import { getRecentAssets, getVerifiedAssets, getFlaggedAssets, getPublicStats, hasContract, CONTRACT } from "@/lib/meshproof";
import { DEPLOYMENT } from "@/lib/deployment";
import { explorerAddr, explorerContract, explorerTx, truncateHex } from "@/lib/format";
import type { Asset } from "@/lib/types";

type Filter = "recent" | "verified" | "flagged";

export default function RegistryPage() {
  const [filter, setFilter] = useState<Filter>("recent");
  const stats = useLoader(() => getPublicStats(), []);
  const assets = useLoader<Asset[]>(
    () => (filter === "verified" ? getVerifiedAssets(60) : filter === "flagged" ? getFlaggedAssets(60) : getRecentAssets(60)),
    [filter],
  );
  const contract = hasContract() ? CONTRACT : DEPLOYMENT.contractAddress;
  const list = assets.data ?? [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="label flex items-center gap-2"><FontAwesomeIcon icon={faBoxesStacked} /> Registry</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Asset registry</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">Browse registered 3D assets by provenance status.</p>
        </div>
        <button type="button" className="btn btn-ghost btn-xs" onClick={assets.reload}><FontAwesomeIcon icon={faRotateRight} className={`h-3 w-3 ${assets.loading ? "animate-spin" : ""}`} /> Refresh</button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Assets" value={stats.data?.assets ?? 0} tone="primary" />
        <Stat label="Verified" value={stats.data?.verifiedAssets ?? 0} tone="verified" />
        <Stat label="Flagged" value={stats.data?.flaggedAssets ?? 0} tone="danger" />
        <Stat label="Reviews" value={stats.data?.reviews ?? 0} />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {(["recent", "verified", "flagged"] as const).map((f) => (
          <button key={f} type="button" onClick={() => setFilter(f)} className={`btn btn-xs capitalize ${filter === f ? "btn-primary" : "btn-ghost"}`}>{f}</button>
        ))}
      </div>

      {!hasContract() && <Banner tone="warn" title="Frontend contract address not set">Showing the recorded deployment address below; set <span className="mono">NEXT_PUBLIC_CONTRACT_ADDRESS</span> for live reads.</Banner>}

      {assets.loading && !assets.data ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : assets.error ? (
        <Banner tone="danger" title="Failed to load assets" action={<button className="btn btn-ghost btn-xs" onClick={assets.reload}>Retry</button>}>{assets.error}</Banner>
      ) : list.length === 0 ? (
        <Empty icon={faBoxesStacked} title={`No ${filter} assets`} hint={filter === "recent" ? "Register the first asset to begin." : `No assets are currently ${filter}.`} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((a) => (
            <Link key={a.assetId} href={`/asset/${a.assetId}`} className="panel group flex flex-col gap-2 p-4 transition-colors hover:border-primary/40">
              <div className="flex items-start justify-between gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-md border border-line bg-panel2 text-primary"><FontAwesomeIcon icon={faCube} className="h-4 w-4" /></span>
                <StatusChip status={a.status} kind="asset" />
              </div>
              <div className="text-sm font-semibold text-text group-hover:text-primary">{a.title}</div>
              <div className="text-xs text-muted">{a.assetType} · {a.declaredLicense || "no declared license"}</div>
              <div className="mt-auto flex items-center justify-between border-t border-line pt-2 text-xs text-muted">
                <span>{a.reviewIds.length} reviews</span>
                <span className="inline-flex items-center gap-1 text-primary">Open <FontAwesomeIcon icon={faArrowRight} className="h-2.5 w-2.5" /></span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Contract status + smoke proof */}
      <section className="panel">
        <div className="border-b border-line p-3"><h2 className="text-sm font-semibold">Contract status &amp; on-chain smoke proof</h2></div>
        <div className="grid gap-3 p-4 sm:grid-cols-2">
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between"><span className="text-muted">Contract</span><Hex value={contract} kind="contract" lead={10} tail={8} /></div>
            <div className="flex items-center justify-between"><span className="text-muted">Network</span><span className="text-text">{DEPLOYMENT.network} · chain {DEPLOYMENT.chainId}</span></div>
            <div className="flex items-center justify-between"><span className="text-muted">Deployer</span><Hex value={DEPLOYMENT.deployer} /></div>
            <div className="flex items-center justify-between"><span className="text-muted">Deploy tx</span><Hex value={DEPLOYMENT.deployTxHash} kind="tx" /></div>
            <div className="flex items-center justify-between"><span className="text-muted">Faucet tx</span><Hex value={DEPLOYMENT.faucetTxHash} kind="tx" /></div>
            <a className="btn btn-ghost btn-xs mt-1" href={explorerContract(contract)} target="_blank" rel="noreferrer"><FontAwesomeIcon icon={faArrowUpRightFromSquare} className="h-3 w-3" /> Contract on explorer</a>
          </div>
          <div className="overflow-hidden rounded-md border border-line">
            <div className="border-b border-line bg-panel2 px-3 py-1.5 label">10 write methods · proven on-chain</div>
            <ul className="max-h-56 divide-y divide-line overflow-y-auto text-xs">
              {DEPLOYMENT.smoke.map((s) => (
                <li key={s.hash} className="flex items-center justify-between gap-2 px-3 py-2">
                  <span className="font-medium text-text">{s.label}</span>
                  <span className="flex items-center gap-1.5"><a href={explorerTx(s.hash)} target="_blank" rel="noreferrer" className="mono text-primary hover:underline">{truncateHex(s.hash, 8, 6)}</a><Copy value={s.hash} /></span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
