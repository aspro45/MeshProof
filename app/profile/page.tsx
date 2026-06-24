"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserShield, faMagnifyingGlass, faCube, faFileLines, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { ReputationChart } from "@/components/ReputationChart";
import { StatusChip, VerdictBadge, Banner, Empty, Skeleton, Hex, Stat } from "@/components/ui";
import { useLoader } from "@/lib/hooks";
import { getProfile, getReviewerReviews, getCreatorAssets, hasContract } from "@/lib/meshproof";

function repTier(score: number): { label: string; tone: "danger" | "warning" | "primary" | "verified" } {
  if (score < 80) return { label: "Probation", tone: "danger" };
  if (score < 120) return { label: "Standard", tone: "warning" };
  if (score < 300) return { label: "Trusted", tone: "primary" };
  return { label: "Authority", tone: "verified" };
}

export default function ProfilePage() {
  const { address } = useAccount();
  const [query, setQuery] = useState("");
  const [target, setTarget] = useState("");
  useEffect(() => { if (address && !target) { setTarget(address); setQuery(address); } }, [address, target]);

  const profile = useLoader(() => (target ? getProfile(target) : Promise.resolve(null)), [target]);
  const myReviews = useLoader(() => (target ? getReviewerReviews(target) : Promise.resolve([])), [target]);
  const myAssets = useLoader(() => (target ? getCreatorAssets(target) : Promise.resolve([])), [target]);

  if (!hasContract()) return <Banner tone="warn" title="No contract configured">Set the contract address to view profiles.</Banner>;

  const isValid = /^0x[0-9a-fA-F]{40}$/.test(query.trim());
  const p = profile.data;
  const tier = p ? repTier(p.reputationScore) : null;
  const toneClass = (t: string) => t === "danger" ? "text-danger" : t === "warning" ? "text-warning" : t === "verified" ? "text-verified" : "text-primary";
  const chipClass = (t: string) => t === "danger" ? "border-danger/50 text-danger bg-danger/10" : t === "warning" ? "border-warning/50 text-warning bg-warning/10" : t === "verified" ? "border-verified/50 text-verified bg-verified/10" : "border-primary/50 text-primary bg-primary/10";

  return (
    <div className="space-y-5">
      <div>
        <div className="label flex items-center gap-2"><FontAwesomeIcon icon={faUserShield} /> Reputation</div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Reviewer profile</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">On-chain reputation earned from accepted reviews, verified assets, and challenge/appeal outcomes.</p>
      </div>

      <div className="panel flex flex-wrap items-end gap-2 p-3">
        <label className="min-w-[260px] flex-1"><span className="label">Wallet address</span><input className="field mt-1.5 mono" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="0x…" /></label>
        <button type="button" className="btn btn-primary" disabled={!isValid} onClick={() => setTarget(query.trim())}><FontAwesomeIcon icon={faMagnifyingGlass} className="h-3.5 w-3.5" /> Look up</button>
        {address && <button type="button" className="btn btn-ghost" onClick={() => { setQuery(address); setTarget(address); }}>My profile</button>}
      </div>

      {!target ? <Empty icon={faUserShield} title="Enter an address" hint="Connect a wallet or paste an address to view its reputation." /> :
        profile.loading && !p ? <Skeleton className="h-40" /> :
        profile.error ? <Banner tone="danger" title="Failed to load profile" action={<button className="btn btn-ghost btn-xs" onClick={profile.reload}>Retry</button>}>{profile.error}</Banner> :
        !p ? <Empty title="No profile" /> :
        <>
          <div className="grid gap-3 lg:grid-cols-[minmax(0,300px)_1fr]">
            <div className="panel space-y-3 p-4">
              <div className="text-xs text-muted">Address</div>
              <Hex value={p.address} lead={10} tail={8} />
              <div className="flex items-end justify-between border-t border-line pt-3">
                <div><div className="label">Reputation</div><div className={`text-3xl font-semibold tabular-nums ${toneClass(tier!.tone)}`}>{p.reputationScore}</div></div>
                <span className={`chip ${chipClass(tier!.tone)}`}>{tier!.label}</span>
              </div>
              <div className="text-[11px] text-muted">Last activity tick {p.lastActivity}</div>
            </div>
            <div className="panel p-4"><div className="label mb-2">Activity breakdown</div><ReputationChart profile={p} /></div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Assets" value={p.assetsRegistered} tone="primary" />
            <Stat label="Reviews" value={p.reviewsSubmitted} />
            <Stat label="Accepted" value={p.reviewsAccepted} tone="verified" />
            <Stat label="Rejected" value={p.reviewsRejected} tone="danger" />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <section>
              <div className="mb-2 label flex items-center gap-2"><FontAwesomeIcon icon={faFileLines} /> Reviews submitted</div>
              {myReviews.loading && !myReviews.data ? <Skeleton className="h-24" /> :
                (myReviews.data?.length ?? 0) === 0 ? <Empty title="No reviews" /> :
                <div className="space-y-2">{myReviews.data!.slice(0, 8).map((r) => (
                  <Link key={r.reviewId} href={`/asset/${r.assetId}`} className="panel flex items-center justify-between gap-2 p-3 hover:bg-panel2/60">
                    <span className="min-w-0"><span className="text-sm font-medium">Review #{r.reviewId}</span><span className="block truncate text-xs text-muted">{r.claimSummary}</span></span>
                    <span className="flex shrink-0 items-center gap-2"><VerdictBadge verdict={r.verdict} /><StatusChip status={r.status} kind="review" /></span>
                  </Link>
                ))}</div>}
            </section>
            <section>
              <div className="mb-2 label flex items-center gap-2"><FontAwesomeIcon icon={faCube} /> Assets registered</div>
              {myAssets.loading && !myAssets.data ? <Skeleton className="h-24" /> :
                (myAssets.data?.length ?? 0) === 0 ? <Empty title="No assets" /> :
                <div className="space-y-2">{myAssets.data!.slice(0, 8).map((a) => (
                  <Link key={a.assetId} href={`/asset/${a.assetId}`} className="panel flex items-center justify-between gap-2 p-3 hover:bg-panel2/60">
                    <span className="min-w-0"><span className="text-sm font-medium">{a.title}</span><span className="block truncate text-xs text-muted">{a.assetType}</span></span>
                    <span className="flex shrink-0 items-center gap-2"><StatusChip status={a.status} kind="asset" /><FontAwesomeIcon icon={faArrowRight} className="h-3 w-3 text-muted" /></span>
                  </Link>
                ))}</div>}
            </section>
          </div>
        </>}
    </div>
  );
}
