"use client";

import { useState, type ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCopy, faCheck, faArrowUpRightFromSquare, faCircleInfo, faTriangleExclamation,
  faCircleExclamation, faCircleCheck, faInbox,
} from "@fortawesome/free-solid-svg-icons";
import { truncateHex, explorerTx, explorerAddr } from "@/lib/format";

const ASSET: Record<string, string> = {
  draft: "border-line text-muted bg-panel2",
  registered: "border-primary/50 text-primary bg-primary/10",
  under_review: "border-primary/50 text-primary bg-primary/10",
  verified: "border-verified/50 text-verified bg-verified/10",
  flagged: "border-danger/50 text-danger bg-danger/10",
  challenged: "border-warning/50 text-warning bg-warning/10",
  appealed: "border-warning/50 text-warning bg-warning/10",
  retired: "border-line text-muted bg-panel2",
  archived: "border-line text-muted bg-panel2",
};
const REVIEW: Record<string, string> = {
  submitted: "border-line text-muted bg-panel2",
  assessed: "border-primary/50 text-primary bg-primary/10",
  accepted: "border-verified/50 text-verified bg-verified/10",
  revision_requested: "border-warning/50 text-warning bg-warning/10",
  rejected: "border-danger/50 text-danger bg-danger/10",
  challenged: "border-warning/50 text-warning bg-warning/10",
  appealed: "border-warning/50 text-warning bg-warning/10",
  finalized: "border-verified/50 text-verified bg-verified/10",
};
const DECISION: Record<string, string> = {
  open: "border-warning/50 text-warning bg-warning/10",
  upheld: "border-verified/50 text-verified bg-verified/10",
  dismissed: "border-muted/40 text-muted bg-panel2",
  accepted: "border-verified/50 text-verified bg-verified/10",
  denied: "border-danger/50 text-danger bg-danger/10",
};
const VERDICT: Record<string, string> = {
  verified: "border-verified/50 text-verified bg-verified/10",
  needs_review: "border-warning/50 text-warning bg-warning/10",
  high_risk: "border-danger/50 text-danger bg-danger/10",
  reject: "border-danger/50 text-danger bg-danger/10",
};

export function StatusChip({ status, kind }: { status: string; kind: "asset" | "review" | "decision" }) {
  const map = kind === "asset" ? ASSET : kind === "review" ? REVIEW : DECISION;
  const cls = map[status] ?? "border-line text-muted bg-panel2";
  return <span className={`chip ${cls}`}>{(status || "—").replace(/_/g, " ")}</span>;
}

export function VerdictBadge({ verdict, prov, risk }: { verdict?: string; prov?: number; risk?: number }) {
  const cls = VERDICT[verdict ?? ""] ?? "border-line text-muted bg-panel2";
  return (
    <span className={`chip ${cls}`}>
      {(verdict || "unreviewed").replace(/_/g, " ")}
      {typeof prov === "number" && prov > 0 ? <span className="mono opacity-80">· P{prov}</span> : null}
      {typeof risk === "number" && risk > 0 ? <span className="mono opacity-80">· R{risk}</span> : null}
    </span>
  );
}

export function Copy({ value, className = "" }: { value: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button" aria-label="Copy"
      className={`inline-grid h-6 w-6 place-items-center rounded text-muted transition-colors hover:bg-panel2 hover:text-text ${className}`}
      onClick={async () => { try { await navigator.clipboard.writeText(value); setDone(true); setTimeout(() => setDone(false), 1200); } catch {} }}
    >
      <FontAwesomeIcon icon={done ? faCheck : faCopy} className={`h-3 w-3 ${done ? "text-verified" : ""}`} />
    </button>
  );
}

export function Hex({ value, kind = "address", lead = 6, tail = 4 }: { value: string; kind?: "address" | "tx"; lead?: number; tail?: number }) {
  if (!value) return <span className="text-muted">—</span>;
  const href = kind === "tx" ? explorerTx(value) : explorerAddr(value);
  return (
    <span className="inline-flex items-center gap-1">
      <a href={href} target="_blank" rel="noreferrer" className="mono text-xs text-text/90 underline-offset-2 hover:text-primary hover:underline" title={value}>
        {truncateHex(value, lead, tail)}
      </a>
      <Copy value={value} />
    </span>
  );
}

export function ExtLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
      {children}<FontAwesomeIcon icon={faArrowUpRightFromSquare} className="h-2.5 w-2.5" />
    </a>
  );
}

type Tone = "info" | "warn" | "danger" | "ok";
const TONE: Record<Tone, { c: string; i: typeof faCircleInfo; ic: string }> = {
  info: { c: "border-primary/40 bg-primary/5", i: faCircleInfo, ic: "text-primary" },
  warn: { c: "border-warning/40 bg-warning/5", i: faTriangleExclamation, ic: "text-warning" },
  danger: { c: "border-danger/40 bg-danger/5", i: faCircleExclamation, ic: "text-danger" },
  ok: { c: "border-verified/40 bg-verified/5", i: faCircleCheck, ic: "text-verified" },
};
export function Banner({ tone = "info", title, children, action }: { tone?: Tone; title?: string; children?: ReactNode; action?: ReactNode }) {
  const t = TONE[tone];
  return (
    <div className={`flex items-start gap-3 rounded-md border p-3 text-sm ${t.c}`}>
      <FontAwesomeIcon icon={t.i} className={`mt-0.5 h-4 w-4 ${t.ic}`} />
      <div className="flex-1">{title && <div className="font-semibold text-text">{title}</div>}{children && <div className="text-muted">{children}</div>}</div>
      {action}
    </div>
  );
}

export function Empty({ icon, title, hint }: { icon?: typeof faInbox; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-line bg-panel2/40 px-6 py-12 text-center">
      <FontAwesomeIcon icon={icon ?? faInbox} className="h-6 w-6 text-muted/60" />
      <div className="text-sm font-semibold text-text">{title}</div>
      {hint && <div className="max-w-sm text-xs text-muted">{hint}</div>}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse2 rounded bg-line/40 ${className}`} />;
}

export function Stat({ label, value, tone }: { label: string; value: ReactNode; tone?: "primary" | "warning" | "danger" | "verified" }) {
  const c = tone === "warning" ? "text-warning" : tone === "danger" ? "text-danger" : tone === "verified" ? "text-verified" : tone === "primary" ? "text-primary" : "text-text";
  return (
    <div className="panel p-3.5">
      <div className="label">{label}</div>
      <div className={`mt-1 text-2xl font-semibold tabular-nums ${c}`}>{value}</div>
    </div>
  );
}
