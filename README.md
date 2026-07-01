# MeshProof

3D asset provenance, license review and risk scoring on GenLayer.

MeshProof is the only app in this set built as a richer product surface: a Next.js interface with wallet connection, a 3D inspection bay and a contract that tracks asset registration, AI review, challenge, appeal and finalization. It is aimed at marketplaces and teams that need to prove where an asset came from before using it.

## Product Links

- Live app: https://meshproof-github.vercel.app
- Repository: https://github.com/aspro45/MeshProof
- Contract explorer: https://explorer-studio.genlayer.com/contracts/0xf684Ab541b8a340D74E79c17d56a06F6d3cb983b

## System Map

| Layer | Detail |
| --- | --- |
| Frontend | Next.js app with RainbowKit, wagmi/viem wallet flow and an R3F-style inspection scene |
| Contract | `contracts/MeshProof.py` |
| Network | GenLayer Studionet, chain ID `61999` |
| Contract address | `0xf684Ab541b8a340D74E79c17d56a06F6d3cb983b` |
| Deploy tx | [`0x4023aac9...0e559b`](https://explorer-studio.genlayer.com/tx/0x4023aac9d766675e9eed502a338edfb152dc3392187f52fffaad4990840e559b) |
| Deployed | 2026-06-22T14:39:42.171Z |

## Contract Capabilities

The 32,877 byte contract exposes asset, review, challenge, appeal and profile reads. The core lifecycle is:

```text
register asset -> submit review -> GenLayer assessment -> challenge -> appeal -> final asset status
```

Useful reads include `get_asset`, `get_review`, `get_challenge`, `get_appeal`, `get_profile`, `get_recent_assets`, `get_verified_assets` and `get_flagged_assets`.

## Finalized Contract Actions

| Method | Transaction |
| --- | --- |
| `register_asset` | [0x14e943cf...51e577](https://explorer-studio.genlayer.com/tx/0x14e943cf6bca9217c10beefb440f8e4d527f6aed768d92adbc1e3b0fa451e577) |
| `submit_review` | [0x192d9934...64d55b](https://explorer-studio.genlayer.com/tx/0x192d99349686f0575f2eef97e578f6a32e0e8fa35e48ff90451321e22964d55b) |
| `assess_review` | [0x0c5b53ba...07709e](https://explorer-studio.genlayer.com/tx/0x0c5b53baea5b92695fcd5686eb7d3bf0579783f3279098fa324b90ee6b07709e) |
| `challenge_review` | [0xe99eba2f...2d5f19](https://explorer-studio.genlayer.com/tx/0xe99eba2fcbf6390a12833fad96fae806eefcb742fb7f6278e0d9c3d8b72d5f19) |
| `file_appeal` | [0xa23bd4de...9e422a](https://explorer-studio.genlayer.com/tx/0xa23bd4de0d096020f9ae55f0b9763111574de4cff6b163ce1dec3942cf9e422a) |
| `resolve_challenge` | [0x184c63f9...e470bd](https://explorer-studio.genlayer.com/tx/0x184c63f97a1467ef95218569ae2afea9c975f629056073a4f2fe97769fe470bd) |
| `resolve_appeal` | [0x070c12f7...224c6b](https://explorer-studio.genlayer.com/tx/0x070c12f7927cc8d2e832f037e2aacd7f7b6c56209fbfbe8de6037e92cd224c6b) |
| `finalize_asset` | [0x98e2ab8b...cb5658](https://explorer-studio.genlayer.com/tx/0x98e2ab8bea84c17b1be1f8e2aaf036b9925094b6ef70259d6d676aa413cb5658) |

## Local Development

```bash
npm install
npm run dev
```

Open the localhost URL printed by Next.js.

## Publishing And Secrets

The public repo should include source, deployment metadata and UI assets only. Do not publish private keys, wallet vaults, `.env.local`, Vercel project state or local dashboard files. Use environment variables through the hosting provider when a deployment needs them.
