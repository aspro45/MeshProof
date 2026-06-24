export function truncateHex(v: string, lead = 6, tail = 4): string {
  if (!v) return "";
  return v.length <= lead + tail + 1 ? v : `${v.slice(0, lead)}…${v.slice(-tail)}`;
}

export function isHttpUrl(v: string): boolean {
  const s = v.trim();
  if (!/^https?:\/\//i.test(s)) return false;
  try { new URL(s); return true; } catch { return false; }
}

export function hostOf(u: string): string {
  try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; }
}

const EX = (process.env.NEXT_PUBLIC_GENLAYER_EXPLORER ?? "https://explorer-studio.genlayer.com").replace(/\/$/, "");
export const explorerTx = (h: string) => `${EX}/tx/${h}`;
export const explorerAddr = (a: string) => `${EX}/address/${a}`;
export const explorerContract = (a: string) => `${EX}/contracts/${a}`;
