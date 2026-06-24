"use client";

import { useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGavel, faScaleBalanced, faRotateRight, faArrowRight, faBolt } from "@fortawesome/free-solid-svg-icons";
import { Banner, Empty, Skeleton, Hex, ExtLink, StatusChip } from "@/components/ui";
import { useTx } from "@/components/Tx";
import { useLoader } from "@/lib/hooks";
import { getOpenChallenges, getOpenAppeals, hasContract } from "@/lib/meshproof";
import { hostOf } from "@/lib/format";

type Tab = "challenges" | "appeals";

export default function DisputesPage() {
  const [tab, setTab] = useState<Tab>("challenges");
  const { run, busy, connected } = useTx();
  const challenges = useLoader(() => getOpenChallenges(60), []);
  const appeals = useLoader(() => getOpenAppeals(60), []);

  if (!hasContract()) return <Banner tone="warn" title="No contract configured">Set the contract address to view challenges.</Banner>;

  const resolveC = (id: string) => run("Resolve challenge", "resolve_challenge", [id]).then((h) => h && challenges.reload());
  const resolveA = (id: string) => run("Resolve appeal", "resolve_appeal", [id]).then((h) => h && appeals.reload());

  return (
    <div className="space-y-5">
      <div>
        <div className="label flex items-center gap-2"><FontAwesomeIcon icon={faScaleBalanced} /> Adjudication queue</div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Challenges &amp; appeals</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">Open challenges and appeals are re-adjudicated by the AI reviewer against the asset’s evidence.</p>
      </div>

      {!connected && <Banner tone="info" title="Read-only">Connect a wallet to resolve; anyone can trigger AI resolution.</Banner>}

      <div className="flex items-center justify-between border-b border-line">
        <div className="flex gap-1">
          {([["challenges", faGavel, challenges.data?.length ?? 0], ["appeals", faScaleBalanced, appeals.data?.length ?? 0]] as const).map(([t, icon, n]) => (
            <button key={t} type="button" onClick={() => setTab(t)} className={`-mb-px flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium capitalize ${tab === t ? "border-primary text-primary" : "border-transparent text-muted hover:text-text"}`}>
              <FontAwesomeIcon icon={icon} className="h-3.5 w-3.5" /> {t} <span className="mono text-xs opacity-70">{n}</span>
            </button>
          ))}
        </div>
        <button type="button" className="btn btn-ghost btn-xs" onClick={() => { challenges.reload(); appeals.reload(); }}><FontAwesomeIcon icon={faRotateRight} className="h-3 w-3" /> Refresh</button>
      </div>

      {tab === "challenges" ? (
        challenges.loading && !challenges.data ? <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div> :
        challenges.error ? <Banner tone="danger" title="Failed to load challenges" action={<button className="btn btn-ghost btn-xs" onClick={challenges.reload}>Retry</button>}>{challenges.error}</Banner> :
        (challenges.data?.length ?? 0) === 0 ? <Empty icon={faGavel} title="No open challenges" hint="Resolved challenges are recorded in each asset’s audit trail." /> :
        <div className="space-y-3">
          {challenges.data!.map((c) => (
            <div key={c.challengeId} className="panel space-y-2 p-4">
              <div className="flex items-center justify-between"><span className="text-sm font-semibold">Challenge #{c.challengeId} <span className="font-normal text-muted">· asset #{c.assetId} · review #{c.reviewId}</span></span><StatusChip status={c.status} kind="decision" /></div>
              <p className="text-sm text-muted">{c.reason}</p>
              {c.evidenceUrls.length > 0 && <div className="flex flex-wrap gap-2 text-xs">{c.evidenceUrls.map((u) => <ExtLink key={u} href={u}>{hostOf(u)}</ExtLink>)}</div>}
              <div className="flex items-center justify-between border-t border-line pt-2 text-xs text-muted">
                <span>by <Hex value={c.challenger} /></span>
                <div className="flex items-center gap-2"><Link href={`/asset/${c.assetId}`} className="text-primary hover:underline">asset #{c.assetId} <FontAwesomeIcon icon={faArrowRight} className="h-2.5 w-2.5" /></Link><button className="btn btn-primary btn-xs" disabled={busy} onClick={() => resolveC(c.challengeId)}><FontAwesomeIcon icon={faBolt} className="h-3 w-3" /> Resolve</button></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        appeals.loading && !appeals.data ? <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div> :
        appeals.error ? <Banner tone="danger" title="Failed to load appeals" action={<button className="btn btn-ghost btn-xs" onClick={appeals.reload}>Retry</button>}>{appeals.error}</Banner> :
        (appeals.data?.length ?? 0) === 0 ? <Empty icon={faScaleBalanced} title="No open appeals" hint="Appeals can be filed on rejected, revision, challenged or accepted reviews." /> :
        <div className="space-y-3">
          {appeals.data!.map((a) => (
            <div key={a.appealId} className="panel space-y-2 p-4">
              <div className="flex items-center justify-between"><span className="text-sm font-semibold">Appeal #{a.appealId} <span className="font-normal text-muted">· asset #{a.assetId} · review #{a.reviewId}</span></span><StatusChip status={a.status} kind="decision" /></div>
              <p className="text-sm text-muted">{a.reason}</p>
              {a.evidenceUrls.length > 0 && <div className="flex flex-wrap gap-2 text-xs">{a.evidenceUrls.map((u) => <ExtLink key={u} href={u}>{hostOf(u)}</ExtLink>)}</div>}
              <div className="flex items-center justify-between border-t border-line pt-2 text-xs text-muted">
                <span>by <Hex value={a.appellant} /></span>
                <div className="flex items-center gap-2"><Link href={`/asset/${a.assetId}`} className="text-primary hover:underline">asset #{a.assetId} <FontAwesomeIcon icon={faArrowRight} className="h-2.5 w-2.5" /></Link><button className="btn btn-primary btn-xs" disabled={busy} onClick={() => resolveA(a.appealId)}><FontAwesomeIcon icon={faBolt} className="h-3 w-3" /> Resolve</button></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
