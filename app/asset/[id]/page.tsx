"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft, faCube, faMagnifyingGlassChart, faGavel, faScaleBalanced, faCircleCheck,
  faPowerOff, faBoxArchive, faRotateRight, faFileLines, faClockRotateLeft, faLink, faDiagramProject,
} from "@fortawesome/free-solid-svg-icons";
import { InspectorBay } from "@/components/InspectorBay";
import { ProvenanceGraph } from "@/components/ProvenanceGraph";
import { AuditTimeline } from "@/components/AuditTimeline";
import { StatusChip, VerdictBadge, Banner, Empty, Skeleton, Hex, ExtLink } from "@/components/ui";
import { ListInput } from "@/components/inputs";
import { useTx } from "@/components/Tx";
import { useLoader } from "@/lib/hooks";
import { getAsset, getAssetReviews, getAuditTrail, getOpenChallenges, getOpenAppeals, hasContract } from "@/lib/meshproof";
import { hostOf, isHttpUrl } from "@/lib/format";
import { toneOf, type Review } from "@/lib/types";

type Tab = "reviews" | "graph" | "audit";

export default function AssetDetailPage() {
  const id = String(useParams().id);
  const [tab, setTab] = useState<Tab>("reviews");
  const { run, busy, address } = useTx();

  const asset = useLoader(() => getAsset(id), [id]);
  const reviews = useLoader(() => getAssetReviews(id), [id]);
  const audit = useLoader(() => getAuditTrail(id), [id]);
  const challenges = useLoader(() => getOpenChallenges(80), []);
  const appeals = useLoader(() => getOpenAppeals(80), []);

  const reloadAll = () => { asset.reload(); reviews.reload(); audit.reload(); challenges.reload(); appeals.reload(); };
  const a = asset.data;
  const isCreator = !!address && !!a && a.creator.toLowerCase() === address.toLowerCase();
  const top = (reviews.data ?? [])[0];
  const tone = toneOf(top?.verdict, a?.status);
  const assetChallenges = (challenges.data ?? []).filter((c) => c.assetId === id);
  const assetAppeals = (appeals.data ?? []).filter((p) => p.assetId === id);

  if (!hasContract()) return <Banner tone="warn" title="No contract configured">Set the contract address to view this asset.</Banner>;

  return (
    <div className="space-y-5">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted hover:text-text"><FontAwesomeIcon icon={faArrowLeft} className="h-3 w-3" /> Inspection bay</Link>

      {asset.loading && !a ? <Skeleton className="h-28" /> :
        asset.error ? <Banner tone="danger" title="Failed to load asset" action={<button className="btn btn-ghost btn-xs" onClick={asset.reload}>Retry</button>}>{asset.error}</Banner> :
        !a ? <Empty title={`Asset #${id} not found`} hint="It may not exist on this contract." /> :
        <>
          <div className="grid gap-5 lg:grid-cols-[1fr_minmax(0,380px)]">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="label flex items-center gap-2"><FontAwesomeIcon icon={faCube} /> Asset #{a.assetId} · {a.assetType}</div>
                  <h1 className="mt-1 text-2xl font-semibold tracking-tight">{a.title}</h1>
                  <p className="mt-1 max-w-2xl text-sm text-muted">{a.metadataSummary}</p>
                </div>
                <StatusChip status={a.status} kind="asset" />
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                <span>Creator <Hex value={a.creator} /></span>
                <span>Declared <span className="text-text">{a.declaredLicense || "—"}</span></span>
                <span>Selected review <span className="mono text-text">{a.selectedReviewId || "none"}</span></span>
              </div>
              <div className="flex flex-wrap gap-3 text-xs">
                <ExtLink href={a.sourceUrl}><FontAwesomeIcon icon={faLink} className="h-2.5 w-2.5" /> {hostOf(a.sourceUrl)} (source)</ExtLink>
                <ExtLink href={a.licenseUrl}><FontAwesomeIcon icon={faLink} className="h-2.5 w-2.5" /> {hostOf(a.licenseUrl)} (license)</ExtLink>
                {a.previewUrl && <ExtLink href={a.previewUrl}><FontAwesomeIcon icon={faLink} className="h-2.5 w-2.5" /> {hostOf(a.previewUrl)} (preview)</ExtLink>}
              </div>
              {a.intendedUse && <div className="text-xs text-muted">Intended use: <span className="text-text">{a.intendedUse}</span></div>}
            </div>

            <div className="space-y-3">
              <div className="panel p-3"><div className="mb-2 label">3D preview</div><InspectorBay tone={tone} height={240} /></div>
              {isCreator && (
                <div className="panel space-y-2 p-3">
                  <div className="label">Creator controls</div>
                  <div className="flex flex-wrap gap-2">
                    {!["draft", "registered", "retired", "archived"].includes(a.status) && a.reviewIds.length > 0 && <button className="btn btn-primary btn-xs" disabled={busy} onClick={() => run("Finalize asset", "finalize_asset", [a.assetId]).then((h) => h && reloadAll())}><FontAwesomeIcon icon={faCircleCheck} className="h-3 w-3" /> Finalize</button>}
                    {!["draft", "retired", "archived"].includes(a.status) && <button className="btn btn-ghost btn-xs" disabled={busy} onClick={() => run("Retire asset", "retire_asset", [a.assetId]).then((h) => h && reloadAll())}><FontAwesomeIcon icon={faPowerOff} className="h-3 w-3" /> Retire</button>}
                    {(a.status === "retired" || a.selectedReviewId) && a.status !== "archived" && <button className="btn btn-ghost btn-xs" disabled={busy} onClick={() => run("Archive asset", "archive_asset", [a.assetId]).then((h) => h && reloadAll())}><FontAwesomeIcon icon={faBoxArchive} className="h-3 w-3" /> Archive</button>}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between border-b border-line">
            <div className="flex gap-1">
              {([["reviews", faFileLines, reviews.data?.length ?? 0], ["graph", faDiagramProject, 0], ["audit", faClockRotateLeft, audit.data?.length ?? 0]] as const).map(([t, icon, n]) => (
                <button key={t} type="button" onClick={() => setTab(t)} className={`-mb-px flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium capitalize ${tab === t ? "border-primary text-primary" : "border-transparent text-muted hover:text-text"}`}>
                  <FontAwesomeIcon icon={icon} className="h-3.5 w-3.5" /> {t}{t !== "graph" ? <span className="mono text-xs opacity-70">{n}</span> : null}
                </button>
              ))}
            </div>
            <button type="button" className="btn btn-ghost btn-xs" onClick={reloadAll}><FontAwesomeIcon icon={faRotateRight} className="h-3 w-3" /> Refresh</button>
          </div>

          {tab === "reviews" && <ReviewsTab assetId={id} reviews={reviews.data} loading={reviews.loading} error={reviews.error} reload={reviews.reload} onAction={reloadAll} run={run} busy={busy} />}
          {tab === "graph" && (
            <div className="panel p-4">
              {reviews.loading && !reviews.data ? <Skeleton className="h-48" /> : <ProvenanceGraph asset={a} reviews={reviews.data ?? []} challenges={assetChallenges} appeals={assetAppeals} />}
            </div>
          )}
          {tab === "audit" && (
            audit.loading && !audit.data ? <Skeleton className="h-40" /> :
            (audit.data?.length ?? 0) === 0 ? <Empty icon={faClockRotateLeft} title="No audit records" /> :
            <div className="panel p-4"><AuditTimeline records={audit.data!} /></div>
          )}
        </>}
    </div>
  );
}

function ReviewsTab({
  assetId, reviews, loading, error, reload, onAction, run, busy,
}: {
  assetId: string; reviews?: Review[]; loading: boolean; error: string | null; reload: () => void;
  onAction: () => void; run: ReturnType<typeof useTx>["run"]; busy: boolean;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [mode, setMode] = useState<"challenge" | "appeal" | null>(null);
  const [reason, setReason] = useState("");
  const [urls, setUrls] = useState<string[]>([]);

  if (loading && !reviews) return <div className="space-y-2">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>;
  if (error) return <Banner tone="danger" title="Failed to load reviews" action={<button className="btn btn-ghost btn-xs" onClick={reload}>Retry</button>}>{error}</Banner>;
  if (!reviews || reviews.length === 0) return <Empty icon={faFileLines} title="No reviews yet" hint="Submit a provenance review from the Submit page." />;

  const start = (rid: string, m: "challenge" | "appeal") => { setOpenId(rid); setMode(m); setReason(""); setUrls([]); };
  const submit = async (r: Review) => {
    const fn = mode === "challenge" ? "challenge_review" : "file_appeal";
    const label = mode === "challenge" ? "Challenge review" : "File appeal";
    const h = await run(label, fn, [assetId, r.reviewId, reason.trim(), urls]);
    if (h) { setOpenId(null); setMode(null); onAction(); }
  };

  return (
    <div className="space-y-3">
      {reviews.map((r) => (
        <div key={r.reviewId} className="panel p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">Review #{r.reviewId}</span>
                <StatusChip status={r.status} kind="review" />
                <VerdictBadge verdict={r.verdict} prov={r.provenanceScore} risk={r.licenseRiskScore} />
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-muted">{r.claimSummary}</p>
              <div className="mt-1 text-xs text-muted">reviewer <Hex value={r.reviewer} /></div>
            </div>
          </div>

          {(r.sourceFindings.length > 0 || r.licenseFindings.length > 0) && (
            <div className="mt-2 grid gap-2 text-xs sm:grid-cols-2">
              {r.sourceFindings.length > 0 && <div><div className="label">Source findings</div><ul className="mt-1 list-disc pl-4 text-muted">{r.sourceFindings.slice(0, 4).map((f, i) => <li key={i}>{f}</li>)}</ul></div>}
              {r.licenseFindings.length > 0 && <div><div className="label">License findings</div><ul className="mt-1 list-disc pl-4 text-muted">{r.licenseFindings.slice(0, 4).map((f, i) => <li key={i}>{f}</li>)}</ul></div>}
            </div>
          )}
          {r.reviewSummary && <p className="mt-2 text-xs text-muted">{r.reviewSummary}</p>}
          {r.evidenceUrls.length > 0 && <div className="mt-2 flex flex-wrap gap-2 text-xs">{r.evidenceUrls.map((u) => <ExtLink key={u} href={u}>{hostOf(u)}</ExtLink>)}</div>}

          <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
            {["submitted", "revision_requested"].includes(r.status) && <button className="btn btn-primary btn-xs" disabled={busy} onClick={() => run("Assess review", "assess_review", [assetId, r.reviewId]).then((h) => h && onAction())}><FontAwesomeIcon icon={faMagnifyingGlassChart} className="h-3 w-3" /> Run AI assessment</button>}
            {["assessed", "accepted", "revision_requested", "rejected", "finalized"].includes(r.status) && <button className="btn btn-ghost btn-xs" disabled={busy} onClick={() => start(r.reviewId, "challenge")}><FontAwesomeIcon icon={faGavel} className="h-3 w-3" /> Challenge</button>}
            {["rejected", "revision_requested", "challenged", "accepted"].includes(r.status) && <button className="btn btn-ghost btn-xs" disabled={busy} onClick={() => start(r.reviewId, "appeal")}><FontAwesomeIcon icon={faScaleBalanced} className="h-3 w-3" /> Appeal</button>}
          </div>

          {openId === r.reviewId && mode && (
            <div className="mt-3 space-y-3 rounded-md border border-line bg-panel2/50 p-3">
              <div className="text-sm font-semibold capitalize">{mode} review #{r.reviewId}</div>
              <label className="block"><span className="label">Reason</span><textarea className="field mt-1.5 min-h-[72px]" value={reason} onChange={(e) => setReason(e.target.value)} placeholder={mode === "challenge" ? "Why is this assessment wrong?" : "Why should this be reconsidered?"} /></label>
              <ListInput label="Evidence URLs" items={urls} onChange={setUrls} placeholder="https://source.example/evidence" max={6} validate={(v) => (isHttpUrl(v) ? null : "Must be an http(s) URL.")} />
              <div className="flex justify-end gap-2">
                <button className="btn btn-ghost btn-xs" onClick={() => { setOpenId(null); setMode(null); }}>Cancel</button>
                <button className="btn btn-primary btn-xs" disabled={busy || !reason.trim()} onClick={() => submit(r)}>{busy ? "Submitting…" : `Submit ${mode}`}</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
