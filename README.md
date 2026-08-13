# MeshProof

MeshProof is an onchain provenance and licensing review desk for production 3D assets. A registration commits the actual model URL and SHA-256 digest alongside its source, license, preview, intended use, and metadata. Reviews, challenges, appeals, and finalization remain attached to that immutable asset identity.

[Live application](https://meshproof-github.vercel.app) | [Studionet contract](https://explorer-studio.genlayer.com/address/0x1170621c8BE2acD0A1792653E3B91196A93A9b3B)

## What Is Verified

- Each asset has an `assetCommitment` derived from its model URL, model digest, and registration manifest.
- Each review stores a canonical evidence snapshot containing URL and SHA-256 pairs.
- GenLayer assessment is bound to the asset commitment, model digest, submitted evidence digest, and a deterministic assessment-input digest.
- Challenge and appeal evidence must be non-empty, digest-addressed, and distinct from the original review evidence.
- Appeals are limited to the asset creator, the reviewer, or a challenger attached to that review.
- A denied or withdrawn appeal restores the exact pre-appeal verdict, scores, findings, flags, and lifecycle status.
- Finalization is blocked while any challenge or appeal remains open and requires a validator-locked assessment.

## Canonical Deployment

| Field | Value |
| --- | --- |
| Network | GenLayer Studionet (`61999`) |
| Contract | [`0x1170621c...A93A9b3B`](https://explorer-studio.genlayer.com/address/0x1170621c8BE2acD0A1792653E3B91196A93A9b3B) |
| Source | [`contracts/MeshProof.py`](contracts/MeshProof.py) |
| Source SHA-256 | `4052182ceb9c26f28bc721b0e1b0f218ad22ccc7c4ab3a20293c0c622866879c` |
| Deploy transaction | [`0x7aa16352...2288e544`](https://explorer-studio.genlayer.com/tx/0x7aa163522e7906643da35fbf23c8cfd57dd44a39cd6dd28e974360142288e544) |
| Deployment manifest | [`deployment.json`](deployment.json) |

`contract.config.json`, `deployment.json`, the frontend fallback address, and the source hash all identify this same deployment.

## Verified Lifecycle

The committed smoke record uses a Khronos GLB with independently computed SHA-256 values for the model and every evidence item.

| Action | Finalized transaction |
| --- | --- |
| Register model commitment | [`0xf52c97b8...89ac3723`](https://explorer-studio.genlayer.com/tx/0xf52c97b8642e39dc6b76ca139127536d7adc685d85a1eb1ac540671f89ac3723) |
| Submit evidence snapshot | [`0x7d7b7035...320d20ef`](https://explorer-studio.genlayer.com/tx/0x7d7b703502ec829196e4355b02091febd967a4724f025a7b7f29b39e320d20ef) |
| Run GenLayer assessment | [`0xa0faa83c...6244125`](https://explorer-studio.genlayer.com/tx/0xa0faa83cb1adf459eeb738549b5c146a8bb54a19bc8d2def3258501ae6244125) |
| Open challenge | [`0xe4468259...e6f22069`](https://explorer-studio.genlayer.com/tx/0xe446825925f1bc06fa43db8f5ce51a7b46c40cba14b9ad7cda4bb23ae6f22069) |
| Close challenge | [`0x346a0a21...17832b8b`](https://explorer-studio.genlayer.com/tx/0x346a0a218e0a700856791709de7cfdafa84b3e13c8523be012ede12617832b8b) |
| File affected-party appeal | [`0x870a779d...dfe24ede`](https://explorer-studio.genlayer.com/tx/0x870a779d95b0d96ebb0c4a60b583ddd7824ed9bfaf4e01304b3526cddfe24ede) |
| Deny appeal and preserve result | [`0x73581a96...a9df609d`](https://explorer-studio.genlayer.com/tx/0x73581a9696185f89df0f6ab18ce26517ffe0f0d952b7652f22dbf0c9a9df609d) |
| Finalize asset | [`0xf56b15b3...33730b4a`](https://explorer-studio.genlayer.com/tx/0xf56b15b319374f1223e24f4b1ebdb947dc7e16ecf459744d49da6e3433730b4a) |

## Application

The Next.js client provides RainbowKit wallet access, model registration, evidence-digest inputs, review execution, dispute actions, lifecycle reads, a 3D inspection bay, and explorer-linked transaction feedback. Contract reads use the app's same-origin `/api/genlayer` relay to avoid browser CORS failures; wallet writes remain signed by the connected wallet.

```bash
npm install
npm run dev
```

Open `http://localhost:4800`.

## Verification

```bash
python -m pytest tests/test_meshproof_security.py -q
npm run security:check
npm run build
```

The focused GenVM suite covers immutable model/evidence commitments, meaningful evidence requirements, assessment authorization, affected-party appeal permissions, exact denied-appeal state restoration, and concurrent challenge/finalization behavior.

## Security

The repository contains public addresses and transaction hashes only. Wallet private keys, encrypted vaults, local environment files, deployment tokens, and Vercel state are excluded. See [`SECURITY.md`](SECURITY.md).
