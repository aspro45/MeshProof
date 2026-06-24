"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { Asset, Review, Challenge, Appeal } from "@/lib/types";

interface Node { id: string; label: string; col: number; y: number; color: string; sub: string }
interface Link { s: string; t: string }

const COLORS: Record<string, string> = {
  asset: "#38BDF8", verified: "#22C55E", flagged: "#EF4444", review: "#38BDF8",
  challenge: "#F59E0B", appeal: "#F59E0B", neutral: "#8B9AA8",
};

/** D3 layered node-link graph of an asset's provenance relations. */
export function ProvenanceGraph({ asset, reviews, challenges, appeals }: { asset: Asset; reviews: Review[]; challenges: Challenge[]; appeals: Appeal[] }) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const W = 720, H = Math.max(180, 70 + Math.max(reviews.length, 1) * 64);
    const colX = [80, W / 2, W - 120];

    const nodes: Node[] = [];
    const links: Link[] = [];
    const assetColor = asset.status === "verified" ? COLORS.verified : asset.status === "flagged" ? COLORS.flagged : COLORS.asset;
    nodes.push({ id: `a${asset.assetId}`, label: `Asset #${asset.assetId}`, col: 0, y: H / 2, color: assetColor, sub: asset.status });

    const n = Math.max(reviews.length, 1);
    reviews.forEach((r, i) => {
      const y = (H / (n + 1)) * (i + 1);
      const rc = r.verdict === "verified" ? COLORS.verified : (r.verdict === "high_risk" || r.verdict === "reject") ? COLORS.flagged : COLORS.review;
      nodes.push({ id: `r${r.reviewId}`, label: `Review #${r.reviewId}`, col: 1, y, color: rc, sub: r.verdict || r.status });
      links.push({ s: `a${asset.assetId}`, t: `r${r.reviewId}` });
      const kids = [
        ...challenges.filter((c) => c.reviewId === r.reviewId).map((c) => ({ id: `c${c.challengeId}`, label: `Challenge #${c.challengeId}`, color: COLORS.challenge, sub: c.status })),
        ...appeals.filter((a) => a.reviewId === r.reviewId).map((a) => ({ id: `p${a.appealId}`, label: `Appeal #${a.appealId}`, color: COLORS.appeal, sub: a.status })),
      ];
      kids.forEach((k, j) => {
        nodes.push({ ...k, col: 2, y: y - (kids.length - 1) * 22 + j * 44 });
        links.push({ s: `r${r.reviewId}`, t: k.id });
      });
    });

    const byId = new Map(nodes.map((nd) => [nd.id, nd]));
    const svg = d3.select(el).attr("viewBox", `0 0 ${W} ${H}`).attr("width", "100%").attr("height", H);
    svg.selectAll("*").remove();

    svg.append("g").selectAll("path").data(links).join("path")
      .attr("d", (l) => {
        const s = byId.get(l.s)!, t = byId.get(l.t)!;
        const x1 = colX[s.col], x2 = colX[t.col], mx = (x1 + x2) / 2;
        return `M${x1},${s.y} C${mx},${s.y} ${mx},${t.y} ${x2},${t.y}`;
      })
      .attr("fill", "none").attr("stroke", "#263241").attr("stroke-width", 1.5);

    const g = svg.append("g").selectAll("g").data(nodes).join("g").attr("transform", (d) => `translate(${colX[d.col]},${d.y})`);
    g.append("circle").attr("r", (d) => (d.col === 0 ? 9 : 6)).attr("fill", "#070b11").attr("stroke", (d) => d.color).attr("stroke-width", 2.5);
    g.append("text").attr("x", (d) => (d.col === 2 ? 11 : -11)).attr("y", -2).attr("text-anchor", (d) => (d.col === 2 ? "start" : "end")).attr("fill", "#E6EDF3").attr("font-size", 11).text((d) => d.label);
    g.append("text").attr("x", (d) => (d.col === 2 ? 11 : -11)).attr("y", 11).attr("text-anchor", (d) => (d.col === 2 ? "start" : "end")).attr("fill", "#8B9AA8").attr("font-size", 9).text((d) => (d.sub || "").replace(/_/g, " "));
  }, [asset, reviews, challenges, appeals]);

  return <svg ref={ref} role="img" aria-label="Provenance graph" />;
}
