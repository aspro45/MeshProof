/** Canonical public deployment facts. No secrets are stored here. */
export const DEPLOYMENT = {
  network: "GenLayer Studionet",
  chainId: 61999,
  deployer: "0xA05AA086Df4A965BDE54801CedbCED287e05ddc2",
  contractAddress: "0x1170621c8BE2acD0A1792653E3B91196A93A9b3B",
  canonicalSource: "contracts/MeshProof.py",
  sourceSha256: "4052182ceb9c26f28bc721b0e1b0f218ad22ccc7c4ab3a20293c0c622866879c",
  deployTxHash: "0x7aa163522e7906643da35fbf23c8cfd57dd44a39cd6dd28e974360142288e544",
  faucetTxHash: "0x7ba729067533d8a7c2d64e59f886a09bb96e60b3a370fdcb71a27683081f81b5",
  smoke: [
    { label: "register_asset", hash: "0xf52c97b8642e39dc6b76ca139127536d7adc685d85a1eb1ac540671f89ac3723" },
    { label: "submit_review", hash: "0x7d7b703502ec829196e4355b02091febd967a4724f025a7b7f29b39e320d20ef" },
    { label: "assess_review", hash: "0xa0faa83cb1adf459eeb738549b5c146a8bb54a19bc8d2def3258501ae6244125" },
    { label: "challenge_review", hash: "0xe446825925f1bc06fa43db8f5ce51a7b46c40cba14b9ad7cda4bb23ae6f22069" },
    { label: "withdraw challenge", hash: "0x346a0a218e0a700856791709de7cfdafa84b3e13c8523be012ede12617832b8b" },
    { label: "file_appeal", hash: "0x870a779d95b0d96ebb0c4a60b583ddd7824ed9bfaf4e01304b3526cddfe24ede" },
    { label: "deny appeal / preserve result", hash: "0x73581a9696185f89df0f6ab18ce26517ffe0f0d952b7652f22dbf0c9a9df609d" },
    { label: "finalize_asset", hash: "0xf56b15b319374f1223e24f4b1ebdb947dc7e16ecf459744d49da6e3433730b4a" },
  ],
} as const;
