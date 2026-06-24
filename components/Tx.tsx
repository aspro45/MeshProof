"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { useAccount, useSwitchChain } from "wagmi";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck, faCircleExclamation, faSpinner, faXmark, faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import { writeMethod, waitAccepted, busyMessage, hasContract } from "@/lib/meshproof";
import { CHAIN_ID } from "@/lib/studionet";
import { explorerTx, truncateHex } from "@/lib/format";

type ToastKind = "pending" | "ok" | "error";
interface Toast { id: number; kind: ToastKind; title: string; hash?: string; msg?: string }

const ToastCtx = createContext<{ push: (t: Omit<Toast, "id">) => number; update: (id: number, t: Partial<Toast>) => void } | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((t: Omit<Toast, "id">) => {
    const id = Date.now() + Math.random();
    setToasts((p) => [...p, { ...t, id }]);
    if (t.kind !== "pending") setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 7000);
    return id;
  }, []);
  const update = useCallback((id: number, patch: Partial<Toast>) => {
    setToasts((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    if (patch.kind && patch.kind !== "pending") setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 7000);
  }, []);
  const dismiss = (id: number) => setToasts((p) => p.filter((x) => x.id !== id));
  return (
    <ToastCtx.Provider value={{ push, update }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[min(92vw,360px)] flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} className="panel pointer-events-auto flex items-start gap-3 p-3 text-sm shadow-pop animate-fadeUp">
            <FontAwesomeIcon
              icon={t.kind === "ok" ? faCircleCheck : t.kind === "error" ? faCircleExclamation : faSpinner}
              className={`mt-0.5 h-4 w-4 ${t.kind === "ok" ? "text-verified" : t.kind === "error" ? "text-danger" : "animate-spin text-primary"}`}
            />
            <div className="flex-1">
              <div className="font-semibold text-text">{t.title}</div>
              {t.msg && <div className="mt-0.5 text-xs text-muted">{t.msg}</div>}
              {t.hash && (
                <a href={explorerTx(t.hash)} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                  <span className="mono">{truncateHex(t.hash, 8, 6)}</span><FontAwesomeIcon icon={faArrowUpRightFromSquare} className="h-2.5 w-2.5" />
                </a>
              )}
            </div>
            <button type="button" onClick={() => dismiss(t.id)} className="text-muted hover:text-text"><FontAwesomeIcon icon={faXmark} className="h-3.5 w-3.5" /></button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const c = useContext(ToastCtx);
  if (!c) throw new Error("ToastProvider missing");
  return c;
}

export interface TxState { busy: boolean; wrongNetwork: boolean; connected: boolean; address?: `0x${string}` }

export function useTx(onDone?: () => void) {
  const { address, isConnected, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { push, update } = useToast();
  const [busy, setBusy] = useState(false);
  const wrongNetwork = isConnected && chainId !== CHAIN_ID;

  const run = useCallback(
    async (label: string, fn: string, args: unknown[]): Promise<`0x${string}` | null> => {
      if (!hasContract()) { push({ kind: "error", title: "No contract configured", msg: "Set NEXT_PUBLIC_CONTRACT_ADDRESS." }); return null; }
      if (!isConnected || !address) { push({ kind: "error", title: "Connect a wallet first" }); return null; }
      if (chainId !== CHAIN_ID) {
        try { await switchChainAsync({ chainId: CHAIN_ID }); }
        catch { push({ kind: "error", title: "Wrong network", msg: "Switch to GenLayer Studionet to continue." }); return null; }
      }
      setBusy(true);
      const id = push({ kind: "pending", title: `${label}…`, msg: "Confirm in your wallet" });
      try {
        const hash = await writeMethod(address, fn, args);
        update(id, { title: `${label}: submitted`, msg: "Waiting for acceptance…", hash });
        await waitAccepted(address, hash);
        update(id, { kind: "ok", title: `${label}: accepted`, hash });
        onDone?.();
        return hash;
      } catch (e) {
        update(id, { kind: "error", title: `${label} failed`, msg: busyMessage(e) });
        return null;
      } finally { setBusy(false); }
    },
    [address, isConnected, chainId, switchChainAsync, push, update, onDone],
  );

  const state: TxState = { busy, wrongNetwork: !!wrongNetwork, connected: !!isConnected, address };
  return { run, ...state };
}
