"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCube, faPlus, faRotateRight, faChevronRight, faBoxesStacked, faMagnifyingGlassChart, faLink,
} from "@fortawesome/free-solid-svg-icons";
import { InspectorBay } from "@/components/InspectorBay";
import { ProvenanceGraph } from "@/components/ProvenanceGraph";
import { StatusChip, VerdictBadge, Banner, Empty, Skeleton, Stat, Hex, ExtLink } from "@/components/ui";
import { ListInput } from "@/components/inputs";
import { useTx } from "@/components/Tx";
import { useLoader } from "@/lib/hooks";
import {
  getPublicStats, getRecentAssets, getAsset, getAssetReviews, getOpenChallenges, hasContract,
} from "@/lib/meshproof";
import { isHttpUrl, hostOf } from "@/lib/format";
import { toneOf, type Asset } from "@/lib/types";

export default function InspectionPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const stats = useLoader(() => getPublicStats(), []);
  const assets = useLoader<Asset[]>(() => getRecentAssets(40), []);
  const list = useMemo(() => assets.data ?? [], [assets.data]);
  const selectedAsset = useMemo(() => list.find((a) => a.assetId === selected) ?? list[0], [list, selected]);
  const sid = selectedAsset?.assetId;

  const reviews = useLoader(() => (sid ? getAssetReviews(sid) : Promise.resolve([])), [sid]);
  const topReview = (reviews.data ?? [])[0];
  const tone = toneOf(topReview?.verdict, selectedAsset?.status);
  const openCh = useLoader(() => getOpenChallenges(10), []);

  if (!hasContract()) {
    return <Banner tone="warn" title="No contract configured">Set <span className="mono">NEXT_PUBLIC_CONTRACT_ADDRESS</span> in <span className="mono">.env.local</span> to load live assets.</Banner>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="label flex items-center gap-2"><FontAwesomeIcon icon={faCube} /> MeshProof</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Asset inspection bay</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">Register 3D assets, run AI provenance + license-risk reviews, and inspect the live risk scan.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setShowCreate((v) => !v)}>
          <FontAwesomeIcon icon={faPlus} className="h-3.5 w-3.5" /> Register asset
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.loading && !stats.data ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[76px]" />) :
          stats.error ? <div className="col-span-full"><Banner tone="danger" title="Could not load stats" action={<button className="btn btn-ghost btn-xs" onClick={stats.reload}>Retry</button>}>{stats.error}</Banner></div> :
          <>
            <Stat label="Assets" value={stats.data?.assets ?? 0} tone="primary" />
            <Stat label="Reviews" value={stats.data?.reviews ?? 0} />
            <Stat label="Verified" value={stats.data?.verifiedAssets ?? 0} tone="verified" />
            <Stat label="Flagged" value={stats.data?.flaggedAssets ?? 0} tone="danger" />
            <Stat label="Open disputes" value={(stats.data?.openChallenges ?? 0) + (stats.data?.openAppeals ?? 0)} tone="warning" />
            <Stat label="Audit" value={stats.data?.auditRecords ?? 0} />
          </>}
      </div>

      {showCreate && <RegisterAsset onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); assets.reload(); stats.reload(); }} />}

      {/* Inspection bay: left register hint / center 3D / right verdict */}
      <div className="grid gap-5 lg:grid-cols-[1fr_minmax(0,360px)]">
        <section className="panel p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="label">3D inspection - {selectedAsset ? `asset #${selectedAsset.assetId}` : "no asset"}</span>
            {selectedAsset && <StatusChip status={selectedAsset.status} kind="asset" />}
          </div>
          <InspectorBay tone={tone} height={380} />
        </section>

        <section className="space-y-3">
          {selectedAsset ? (
            <>
              <div className="panel space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0"><div className="truncate text-base font-semibold">{selectedAsset.title}</div><div className="text-xs text-muted">{selectedAsset.assetType}</div></div>
                  <StatusChip status={selectedAsset.status} kind="asset" />
                </div>
                <div className="text-xs text-muted">Creator <Hex value={selectedAsset.creator} /></div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <ExtLink href={selectedAsset.sourceUrl}><FontAwesomeIcon icon={faLink} className="h-2.5 w-2.5" /> source</ExtLink>
                  <ExtLink href={selectedAsset.licenseUrl}><FontAwesomeIcon icon={faLink} className="h-2.5 w-2.5" /> license</ExtLink>
                </div>
              </div>
              <div className="panel space-y-2 p-4">
                <div className="label">Latest review</div>
                {reviews.loading && !reviews.data ? <Skeleton className="h-16" /> :
                  !topReview ? <Empty icon={faMagnifyingGlassChart} title="No reviews yet" hint="Submit a provenance review to run the AI assessment." /> :
                  <>
                    <VerdictBadge verdict={topReview.verdict} prov={topReview.provenanceScore} risk={topReview.licenseRiskScore} />
                    {topReview.reviewSummary && <p className="text-sm text-muted">{topReview.reviewSummary}</p>}
                  </>}
              </div>
              <Link href={`/asset/${selectedAsset.assetId}`} className="btn btn-ghost w-full justify-center">Open asset #{selectedAsset.assetId} <FontAwesomeIcon icon={faChevronRight} className="h-3 w-3" /></Link>
            </>
          ) : (
            <div className="panel"><Empty icon={faBoxesStacked} title="No asset selected" hint="Register an asset or pick one below to inspect." /></div>
          )}
        </section>
      </div>

      {/* Bottom: recent assets + provenance graph + challenge queue */}
      <div className="grid gap-5 lg:grid-cols-[1fr_minmax(0,340px)]">
        <section className="panel">
          <div className="flex items-center justify-between border-b border-line p-3">
            <span className="label">Recent assets</span>
            <button type="button" className="btn btn-ghost btn-xs" onClick={assets.reload}><FontAwesomeIcon icon={faRotateRight} className={`h-3 w-3 ${assets.loading ? "animate-spin" : ""}`} /> Refresh</button>
          </div>
          <div className="divide-y divide-line">
            {assets.loading && !assets.data ? <div className="space-y-2 p-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div> :
              assets.error ? <div className="p-3"><Banner tone="danger" title="Failed to load assets" action={<button className="btn btn-ghost btn-xs" onClick={assets.reload}>Retry</button>}>{assets.error}</Banner></div> :
              list.length === 0 ? <Empty icon={faBoxesStacked} title="Empty registry" hint="Register the first asset to begin." /> :
              list.map((a) => (
                <button key={a.assetId} type="button" onClick={() => setSelected(a.assetId)} className={`flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-panel2/60 ${selectedAsset?.assetId === a.assetId ? "bg-panel2/50" : ""}`}>
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-line bg-panel2 text-primary"><FontAwesomeIcon icon={faCube} className="h-3 w-3" /></span>
                  <span className="min-w-0 flex-1"><span className="flex items-center gap-2"><span className="truncate text-sm font-medium">{a.title}</span><StatusChip status={a.status} kind="asset" /></span><span className="block truncate text-xs text-muted">{a.assetType}</span></span>
                  <FontAwesomeIcon icon={faChevronRight} className="h-3 w-3 text-muted" />
                </button>
              ))}
          </div>
        </section>

        <section className="panel p-3">
          <div className="mb-2 label">Open challenge queue</div>
          {openCh.loading && !openCh.data ? <Skeleton className="h-20" /> :
            (openCh.data?.length ?? 0) === 0 ? <Empty icon={faMagnifyingGlassChart} title="No open challenges" /> :
            <div className="space-y-2">
              {openCh.data!.slice(0, 5).map((c) => (
                <Link key={c.challengeId} href={`/asset/${c.assetId}`} className="block rounded-md border border-line bg-panel2 p-2.5 text-xs hover:border-primary/40">
                  <div className="flex items-center justify-between"><span className="font-semibold text-text">Challenge #{c.challengeId}</span><span className="text-muted">asset #{c.assetId}</span></div>
                  <p className="mt-0.5 line-clamp-2 text-muted">{c.reason}</p>
                </Link>
              ))}
            </div>}
        </section>
      </div>

      {selectedAsset && (reviews.data?.length ?? 0) >= 0 && (
        <section className="panel p-4">
          <div className="mb-2 label">Provenance graph · asset #{selectedAsset.assetId}</div>
          {reviews.loading && !reviews.data ? <Skeleton className="h-40" /> :
            <ProvenanceGraph asset={selectedAsset} reviews={reviews.data ?? []} challenges={[]} appeals={[]} />}
        </section>
      )}
    </div>
  );
}

/* ── register asset ── */
function RegisterAsset({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { run, busy, connected, wrongNetwork } = useTx();
  const [title, setTitle] = useState("");
  const [assetType, setAssetType] = useState("GLB/3D Model");
  const [sourceUrl, setSourceUrl] = useState("");
  const [licenseUrl, setLicenseUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [declared, setDeclared] = useState("");
  const [intended, setIntended] = useState("");
  const [meta, setMeta] = useState("");

  const valid = title.trim() && isHttpUrl(sourceUrl) && isHttpUrl(licenseUrl) && (!previewUrl.trim() || isHttpUrl(previewUrl));

  const submit = async () => {
    const h = await run("Register asset", "register_asset", [title.trim(), assetType.trim() || "Other", sourceUrl.trim(), licenseUrl.trim(), previewUrl.trim(), declared.trim(), intended.trim(), meta.trim()]);
    if (h) onCreated();
  };

  return (
    <div className="panel space-y-4 p-4">
      <div className="flex items-center justify-between"><h2 className="text-sm font-semibold">Register 3D asset</h2><button type="button" className="text-xs text-muted hover:text-text" onClick={onClose}>Cancel</button></div>
      {!connected && <Banner tone="warn" title="Connect a wallet">Use the Connect button to sign the registration.</Banner>}
      {connected && wrongNetwork && <Banner tone="warn" title="Wrong network">Switch to GenLayer Studionet; we’ll prompt automatically on submit.</Banner>}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block"><span className="label">Title</span><input className="field mt-1.5" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Open-source 3D sample asset" /></label>
        <label className="block"><span className="label">Asset type</span><input className="field mt-1.5" value={assetType} onChange={(e) => setAssetType(e.target.value)} placeholder="GLB/3D Model" /></label>
        <label className="block"><span className="label">Source URL</span><input className="field mt-1.5 mono" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://github.com/org/repo" /></label>
        <label className="block"><span className="label">License URL</span><input className="field mt-1.5 mono" value={licenseUrl} onChange={(e) => setLicenseUrl(e.target.value)} placeholder="https://github.com/org/repo/LICENSE" /></label>
        <label className="block"><span className="label">Preview URL (optional)</span><input className="field mt-1.5 mono" value={previewUrl} onChange={(e) => setPreviewUrl(e.target.value)} placeholder="https://example.org/preview" /></label>
        <label className="block"><span className="label">Declared license</span><input className="field mt-1.5" value={declared} onChange={(e) => setDeclared(e.target.value)} placeholder="MIT-style open source license" /></label>
        <label className="block sm:col-span-2"><span className="label">Intended use</span><input className="field mt-1.5" value={intended} onChange={(e) => setIntended(e.target.value)} placeholder="Use as reference for browser-based 3D demo" /></label>
        <label className="block sm:col-span-2"><span className="label">Metadata summary</span><textarea className="field mt-1.5 min-h-[70px]" value={meta} onChange={(e) => setMeta(e.target.value)} placeholder="Short description of the asset and its public evidence…" /></label>
      </div>
      <div className="flex items-center justify-end gap-2">
        <button type="button" className="btn btn-ghost" onClick={onClose}>Discard</button>
        <button type="button" className="btn btn-primary" disabled={!valid || busy} onClick={submit}>{busy ? "Submitting…" : "Register asset"}</button>
      </div>
    </div>
  );
}
