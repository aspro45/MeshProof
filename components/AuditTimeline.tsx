"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus, faFileLines, faMagnifyingGlassChart, faGavel, faScaleBalanced,
  faCircleCheck, faBoxArchive, faPowerOff, faCircleDot,
} from "@fortawesome/free-solid-svg-icons";
import type { AuditRecord } from "@/lib/types";
import { Hex } from "./ui";

const ICON: Record<string, typeof faPlus> = {
  register_asset: faPlus,
  submit_review: faFileLines,
  assess_review: faMagnifyingGlassChart,
  challenge_review: faGavel,
  resolve_challenge: faGavel,
  file_appeal: faScaleBalanced,
  resolve_appeal: faScaleBalanced,
  finalize_asset: faCircleCheck,
  retire_asset: faPowerOff,
  archive_asset: faBoxArchive,
};

export function AuditTimeline({ records }: { records: AuditRecord[] }) {
  const ref = useRef<HTMLOListElement>(null);
  const sorted = [...records].sort((a, b) => Number(a.at) - Number(b.at));

  useEffect(() => {
    if (!ref.current) return;
    const items = ref.current.querySelectorAll("li");
    gsap.fromTo(items, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.28, stagger: 0.04, ease: "power1.out" });
  }, [records]);

  return (
    <ol ref={ref} className="relative ml-2 space-y-4 border-l border-line pl-5">
      {sorted.map((r) => (
        <li key={r.auditId} className="relative">
          <span className="absolute -left-[27px] grid h-5 w-5 place-items-center rounded-full border border-line bg-panel2 text-primary">
            <FontAwesomeIcon icon={ICON[r.action] ?? faCircleDot} className="h-2.5 w-2.5" />
          </span>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm font-semibold text-text">{r.action.replace(/_/g, " ")}</span>
            <span className="chip border-line bg-panel2 text-muted">{r.statusAfter.replace(/_/g, " ")}</span>
            <span className="mono text-[11px] text-muted">tick {r.at}</span>
          </div>
          {r.summary && <div className="mt-0.5 text-xs text-muted">{r.summary}</div>}
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted">
            by <Hex value={r.actor} lead={6} tail={4} />
            {r.reviewId && <span>· review #{r.reviewId}</span>}
            {r.challengeId && <span>· challenge #{r.challengeId}</span>}
            {r.appealId && <span>· appeal #{r.appealId}</span>}
          </div>
        </li>
      ))}
    </ol>
  );
}
