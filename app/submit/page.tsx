"use client";

import { useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilePen, faCircleCheck, faArrowRight, faCube } from "@fortawesome/free-solid-svg-icons";
import { InspectorBay } from "@/components/InspectorBay";
import { StatusChip, Banner, Empty, Skeleton, ExtLink } from "@/components/ui";
import { ListInput } from "@/components/inputs";
import { useTx } from "@/components/Tx";
import { useLoader } from "@/lib/hooks";
import { getRecentAssets, hasContract } from "@/lib/meshproof";
import { isHttpUrl, hostOf } from "@/lib/format";
import { toneOf } from "@/lib/types";

export default function SubmitReviewPage() {
  const { run, busy, connected, wrongNetwork } = useTx();
  const assets = useLoader(() => getRecentAssets(60), []);
  const [assetId, setAssetId] = useState("");
  const [claim, setClaim] = useState("");
  const [urls, setUrls] = useState<string[]>([]);
  const [done, setDone] = useState<string | null>(null);

  const list = (assets.data ?? []).filter((a) => ["registered", "under_review", "verified", "flagged", "challenged", "appealed"].includes(a.status));
  const selected = list.find((a) => a.assetId === assetId);
  const valid = !!selected && claim.trim().length > 0 && urls.length > 0;

  const submit = async () => {
    if (!selected) return;
    const h = await run("Submit review", "submit_review", [selected.assetId, claim.trim(), urls]);
    if (h) { setDone(selected.assetId); setClaim(""); setUrls([]); assets.reload(); }
  };

  if (!hasContract()) return <Banner tone="warn" title="No contract configured">Set the contract address to submit reviews.</Banner>;

  return (
    <div className="space-y-5">
      <div>
        <div className="label flex items-center gap-2"><FontAwesomeIcon icon={faFilePen} /> Reviewer intake</div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Submit a provenance review</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">Provide a claim and evidence for a registered asset. The AI reviewer reads each source live and scores provenance + license risk.</p>
      </div>

      {!connected && <Banner tone="warn" title="Connect a wallet">Connect your wallet to submit a review.</Banner>}
      {connected && wrongNetwork && <Banner tone="warn" title="Wrong network">Switch to GenLayer Studionet — we’ll prompt on submit.</Banner>}
      {done && <Banner tone="ok" title="Review submitted" action={<Link className="btn btn-ghost btn-xs" href={`/asset/${done}`}>Open asset <FontAwesomeIcon icon={faArrowRight} className="h-3 w-3" /></Link>}>It now awaits AI assessment on asset #{done}.</Banner>}

      <div className="grid gap-5 lg:grid-cols-[1fr_minmax(0,360px)]">
        <div className="panel space-y-4 p-4">
          <div>
            <span className="label">Target asset</span>
            {assets.loading && !assets.data ? <Skeleton className="mt-1.5 h-10" /> :
              assets.error ? <div className="mt-1.5"><Banner tone="danger" title="Failed to load assets" action={<button className="btn btn-ghost btn-xs" onClick={assets.reload}>Retry</button>}>{assets.error}</Banner></div> :
              list.length === 0 ? <div className="mt-1.5"><Empty title="No reviewable assets" hint="Register an asset first." /></div> :
              <select className="field mt-1.5" value={assetId} onChange={(e) => setAssetId(e.target.value)}>
                <option value="">Select an asset…</option>
                {list.map((a) => <option key={a.assetId} value={a.assetId}>#{a.assetId} — {a.title}</option>)}
              </select>}
          </div>

          <label className="block">
            <span className="label">Claim summary</span>
            <textarea className="field mt-1.5 min-h-[120px]" value={claim} onChange={(e) => setClaim(e.target.value)} maxLength={2000} placeholder="Summarize the provenance claim and what the evidence shows…" />
            <span className="mt-1 block text-right text-[11px] text-muted">{claim.length}/2000</span>
          </label>

          <ListInput label="Evidence URLs (required, max 6)" items={urls} onChange={setUrls} placeholder="https://github.com/org/repo" max={6} validate={(v) => (isHttpUrl(v) ? null : "Must be an http(s) URL.")} />

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted">{valid ? <span className="inline-flex items-center gap-1 text-verified"><FontAwesomeIcon icon={faCircleCheck} className="h-3 w-3" /> Ready</span> : "Select an asset, add a claim and at least one URL."}</span>
            <button type="button" className="btn btn-primary" disabled={!valid || busy} onClick={submit}>{busy ? "Submitting…" : "Submit review"}</button>
          </div>
        </div>

        <div className="space-y-3">
          {selected ? (
            <>
              <div className="panel p-3"><div className="mb-2 flex items-center justify-between"><span className="label">Asset preview</span><StatusChip status={selected.status} kind="asset" /></div><InspectorBay tone={toneOf(undefined, selected.status)} height={220} /></div>
              <div className="panel space-y-2 p-4">
                <div className="text-sm font-semibold">{selected.title}</div>
                <div className="text-xs text-muted">{selected.assetType} · {selected.declaredLicense || "no declared license"}</div>
                <div className="flex flex-wrap gap-2 text-xs"><ExtLink href={selected.sourceUrl}>{hostOf(selected.sourceUrl)}</ExtLink><ExtLink href={selected.licenseUrl}>{hostOf(selected.licenseUrl)}</ExtLink></div>
              </div>
            </>
          ) : (
            <div className="panel"><Empty icon={faCube} title="Pick an asset" hint="Select an asset to preview and review." /></div>
          )}
        </div>
      </div>
    </div>
  );
}
