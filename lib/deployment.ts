/** Static deployment facts (public hashes only). */
export const DEPLOYMENT = {
  network: "GenLayer Studionet",
  chainId: 61999,
  deployer: "0xA05AA086Df4A965BDE54801CedbCED287e05ddc2",
  contractAddress: "0xf684Ab541b8a340D74E79c17d56a06F6d3cb983b",
  deployTxHash: "0x4023aac9d766675e9eed502a338edfb152dc3392187f52fffaad4990840e559b",
  faucetTxHash: "0x7ba729067533d8a7c2d64e59f886a09bb96e60b3a370fdcb71a27683081f81b5",
  smoke: [
    { label: "register_asset", hash: "0x14e943cf6bca9217c10beefb440f8e4d527f6aed768d92adbc1e3b0fa451e577" },
    { label: "submit_review", hash: "0x192d99349686f0575f2eef97e578f6a32e0e8fa35e48ff90451321e22964d55b" },
    { label: "assess_review (verified/98/5)", hash: "0x0c5b53baea5b92695fcd5686eb7d3bf0579783f3279098fa324b90ee6b07709e" },
    { label: "challenge_review", hash: "0xe99eba2fcbf6390a12833fad96fae806eefcb742fb7f6278e0d9c3d8b72d5f19" },
    { label: "file_appeal", hash: "0xa23bd4de0d096020f9ae55f0b9763111574de4cff6b163ce1dec3942cf9e422a" },
    { label: "resolve_challenge (dismissed)", hash: "0x184c63f97a1467ef95218569ae2afea9c975f629056073a4f2fe97769fe470bd" },
    { label: "resolve_appeal (denied)", hash: "0x070c12f7927cc8d2e832f037e2aacd7f7b6c56209fbfbe8de6037e92cd224c6b" },
    { label: "finalize_asset (verified)", hash: "0x98e2ab8bea84c17b1be1f8e2aaf036b9925094b6ef70259d6d676aa413cb5658" },
    { label: "retire_asset", hash: "0xaeea38c433c6e2aebab860ae8b010bc8489839a3a1de76e1dc85157c7b02f9b8" },
    { label: "archive_asset", hash: "0x47620e869f1ed9875e05602dfc2b75b34008a23638cb136afdda4cf8c0ef597a" },
  ],
} as const;
