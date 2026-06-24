export type AssetStatus =
  | "draft" | "registered" | "under_review" | "verified" | "flagged" | "challenged" | "appealed" | "retired" | "archived";
export type ReviewStatus =
  | "submitted" | "assessed" | "accepted" | "revision_requested" | "rejected" | "challenged" | "appealed" | "finalized";
export type Verdict = "" | "verified" | "needs_review" | "high_risk" | "reject";
export type ChallengeStatus = "open" | "upheld" | "dismissed";
export type AppealStatus = "open" | "accepted" | "denied";

export interface Asset {
  assetId: string;
  creator: string;
  title: string;
  assetType: string;
  sourceUrl: string;
  licenseUrl: string;
  previewUrl: string;
  declaredLicense: string;
  intendedUse: string;
  metadataSummary: string;
  status: AssetStatus;
  createdAt: number;
  reviewIds: string[];
  challengeIds: string[];
  appealIds: string[];
  auditTrailIds: string[];
  selectedReviewId: string;
}

export interface Review {
  reviewId: string;
  assetId: string;
  reviewer: string;
  claimSummary: string;
  evidenceUrls: string[];
  provenanceScore: number;
  licenseRiskScore: number;
  verdict: Verdict;
  reviewSummary: string;
  sourceFindings: string[];
  licenseFindings: string[];
  riskFlags: string[];
  status: ReviewStatus;
  createdAt: number;
  rawReviewJson: string;
  challengeIds: string[];
  appealIds: string[];
}

export interface Challenge {
  challengeId: string;
  assetId: string;
  reviewId: string;
  challenger: string;
  reason: string;
  evidenceUrls: string[];
  status: ChallengeStatus;
  reviewJson: string;
  createdAt: number;
}

export interface Appeal {
  appealId: string;
  assetId: string;
  reviewId: string;
  appellant: string;
  reason: string;
  evidenceUrls: string[];
  status: AppealStatus;
  reviewJson: string;
  createdAt: number;
}

export interface Profile {
  address: string;
  assetsRegistered: number;
  reviewsSubmitted: number;
  reviewsAccepted: number;
  reviewsRejected: number;
  challengesWon: number;
  challengesLost: number;
  appealsWon: number;
  appealsLost: number;
  reputationScore: number;
  lastActivity: number;
}

export interface AuditRecord {
  auditId: string;
  action: string;
  actor: string;
  assetId: string;
  reviewId: string;
  challengeId: string;
  appealId: string;
  summary: string;
  statusAfter: string;
  at: number;
}

export interface PublicStats {
  assets: number;
  reviews: number;
  challenges: number;
  appeals: number;
  verifiedAssets: number;
  flaggedAssets: number;
  openChallenges: number;
  openAppeals: number;
  auditRecords: number;
  clock: number;
}

/** Risk tone for the 3D shader + chips, derived from a review verdict. */
export type RiskTone = "verified" | "review" | "risk" | "neutral";
export function toneOf(verdict?: string, status?: string): RiskTone {
  if (verdict === "verified" || status === "verified") return "verified";
  if (verdict === "high_risk" || verdict === "reject" || status === "flagged") return "risk";
  if (verdict === "needs_review" || status === "under_review") return "review";
  return "neutral";
}
