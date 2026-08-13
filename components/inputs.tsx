"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faXmark } from "@fortawesome/free-solid-svg-icons";

export function ListInput({
  label, items, onChange, placeholder, max = 6, validate,
}: {
  label: string;
  items: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  max?: number;
  validate?: (v: string) => string | null;
}) {
  const [draft, setDraft] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const add = () => {
    const v = draft.trim();
    if (!v) return;
    if (items.length >= max) { setErr(`Maximum ${max} entries.`); return; }
    if (items.includes(v)) { setErr("Duplicate entry."); return; }
    const ve = validate?.(v);
    if (ve) { setErr(ve); return; }
    onChange([...items, v]); setDraft(""); setErr(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="label">{label}</span>
        <span className="text-[11px] text-muted">{items.length}/{max}</span>
      </div>
      <div className="mt-1.5 flex gap-2">
        <input className="field" value={draft} placeholder={placeholder}
          onChange={(e) => { setDraft(e.target.value); setErr(null); }}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} />
        <button type="button" className="btn btn-ghost" onClick={add} aria-label={`Add ${label}`}><FontAwesomeIcon icon={faPlus} className="h-3.5 w-3.5" /></button>
      </div>
      {err && <div className="mt-1 text-xs text-danger">{err}</div>}
      {items.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-2">
          {items.map((it, i) => (
            <li key={`${it}-${i}`} className="chip max-w-full border-line bg-panel2 text-text">
              <span className="truncate">{it}</span>
              <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-muted hover:text-danger" aria-label="Remove"><FontAwesomeIcon icon={faXmark} className="h-3 w-3" /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export interface EvidenceItem {
  url: string;
  digest: string;
}

export function EvidenceBundleInput({
  label, items, onChange, max = 6,
}: {
  label: string;
  items: EvidenceItem[];
  onChange: (next: EvidenceItem[]) => void;
  max?: number;
}) {
  const [url, setUrl] = useState("");
  const [digest, setDigest] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const add = () => {
    const cleanUrl = url.trim();
    const cleanDigest = digest.trim().toLowerCase().replace(/^sha256:/, "");
    if (items.length >= max) return setErr(`Maximum ${max} evidence items.`);
    if (!/^https?:\/\//i.test(cleanUrl)) return setErr("Evidence URL must use http(s).");
    if (!/^[0-9a-f]{64}$/.test(cleanDigest)) return setErr("Enter the 64-character SHA-256 digest of this evidence snapshot.");
    if (items.some((item) => item.url === cleanUrl || item.digest === `sha256:${cleanDigest}`)) return setErr("Duplicate URL or digest.");
    onChange([...items, { url: cleanUrl, digest: `sha256:${cleanDigest}` }]);
    setUrl("");
    setDigest("");
    setErr(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="label">{label}</span>
        <span className="text-[11px] text-muted">{items.length}/{max}</span>
      </div>
      <div className="mt-1.5 grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
        <input className="field mono" value={url} placeholder="https://source.example/record"
          onChange={(event) => { setUrl(event.target.value); setErr(null); }} />
        <input className="field mono" value={digest} placeholder="SHA-256 digest"
          onChange={(event) => { setDigest(event.target.value); setErr(null); }}
          onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); add(); } }} />
        <button type="button" className="btn btn-ghost" onClick={add} aria-label={`Add ${label}`}>
          <FontAwesomeIcon icon={faPlus} className="h-3.5 w-3.5" />
        </button>
      </div>
      <p className="mt-1 text-[11px] text-muted">Each digest commits the exact evidence version submitted for validator review.</p>
      {err && <div className="mt-1 text-xs text-danger">{err}</div>}
      {items.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {items.map((item, index) => (
            <li key={`${item.url}-${item.digest}`} className="flex min-w-0 items-center gap-2 rounded-md border border-line bg-panel2 px-2.5 py-2 text-xs">
              <span className="min-w-0 flex-1"><span className="block truncate text-text">{item.url}</span><span className="mono block truncate text-muted">{item.digest}</span></span>
              <button type="button" onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))} className="text-muted hover:text-danger" aria-label="Remove evidence">
                <FontAwesomeIcon icon={faXmark} className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
