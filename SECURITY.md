# Security

MeshProof is a public frontend plus a public GenLayer contract. The repository should never contain operational wallet material.

## Secrets Policy

Do not commit:

- private keys
- seed phrases or mnemonics
- vault files
- `.env.local`
- dashboard exports containing wallet metadata
- deployment passwords or faucet automation logs

The deployed contract address, deployer address, explorer URLs, and transaction hashes are public blockchain metadata.

## Runtime Boundary

The application is a client-side Next.js dapp. Reads go to GenLayer Studionet through `genlayer-js`. Writes are initiated only after the user connects a wallet and confirms the transaction.

No server-side API route stores wallet data. No Vercel secret is required for the production deployment.

## Vercel Headers

`vercel.json` applies:

- `Strict-Transport-Security`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy`
- `Permissions-Policy`

## Reporting

Use a private GitHub security advisory for sensitive findings. Do not publish exploit details in a public issue before there is a fix.
