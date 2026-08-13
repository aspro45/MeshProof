import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const skipDirs = new Set([".git", ".next", ".vercel", "node_modules", "__pycache__", ".pytest_cache"]);
const forbiddenNames = new Set([
  ".env",
  ".env.local",
  ".vault-password",
  "vault.enc.json",
  "wallets.json",
  "projects.json",
  "private-keys.json",
]);
const secretPatterns = [
  { name: "private key assignment", re: /\b(private[_ -]?key|wallet[_ -]?key)\s*[:=]\s*['"]?[0-9a-fx]/i },
  { name: "mnemonic assignment", re: /\b(mnemonic|seed[_ -]?phrase)\s*[:=]/i },
  { name: "vault password assignment", re: /\b(vault[_ -]?password|VAULT_PASSWORD)\s*[:=]/ },
  { name: "pem private key", re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { name: "local vault password literal", re: /gl-vault-[A-Za-z0-9-]+/ },
];
const findings = [];

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    const relative = path.relative(root, full).replaceAll("\\", "/");
    if (entry.isDirectory()) {
      if (!skipDirs.has(entry.name)) await walk(full);
      continue;
    }
    if (forbiddenNames.has(entry.name)) {
      findings.push(`${relative}: forbidden local-secret filename`);
      continue;
    }
    if ((await stat(full)).size > 1_500_000) continue;
    const text = await readFile(full, "utf8").catch(() => "");
    for (const pattern of secretPatterns) {
      if (pattern.re.test(text)) findings.push(`${relative}: ${pattern.name}`);
    }
  }
}

await walk(root);
if (findings.length) {
  console.error("Security scan failed:");
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}
console.log("Security scan passed: no private keys, mnemonics, vaults, or env secrets found.");
