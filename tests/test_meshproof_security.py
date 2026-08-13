"""MeshProof V3 commitment, authorization, and concurrency tests."""

import hashlib
import json
from pathlib import Path


CONTRACT = str(Path(__file__).resolve().parents[1] / "contracts" / "MeshProof.py")


def _digest(label: str) -> str:
    return "sha256:" + hashlib.sha256(label.encode("utf-8")).hexdigest()


def _create_review(contract):
    asset_id = contract.register_asset(
        "Licensed production model",
        "GLB model",
        "https://example.com/models/chair.glb",
        _digest("chair.glb bytes v1"),
        "https://example.com/models/chair-source",
        "https://example.com/licenses/chair",
        "https://example.com/previews/chair",
        "CC-BY-4.0",
        "Product visualization in a commercial catalog",
        "A production model with an immutable source and license record.",
    )
    review_id = contract.submit_review(
        asset_id,
        "The model file, source record, and license identify the same production asset.",
        ["https://example.org/evidence/source-record"],
        [_digest("source record v1")],
    )
    return asset_id, review_id


def _lock_verified_assessment(contract, asset_id: str, review_id: str):
    review = json.loads(contract.get_review(review_id))
    review.update({
        "assessmentLocked": True,
        "assessmentVerdict": "verified",
        "assessmentProvenanceScore": 94,
        "assessmentLicenseRiskScore": 4,
        "assessmentSummary": "The committed model and evidence align.",
        "validatorEvidenceDigest": _digest("validator-fetched-snapshot"),
        "verdict": "verified",
        "provenanceScore": 94,
        "licenseRiskScore": 4,
        "reviewSummary": "The committed model and evidence align.",
        "sourceFindings": ["Model digest matches the preserved source record."],
        "licenseFindings": ["License evidence covers the intended use."],
        "riskFlags": [],
        "status": "accepted",
    })
    contract.reviews[int(review_id)] = json.dumps(review)
    asset = json.loads(contract.get_asset(asset_id))
    asset["status"] = "verified"
    contract.assets[int(asset_id)] = json.dumps(asset)


def test_assessment_is_bound_to_model_and_immutable_evidence_snapshot(deploy, direct_vm, direct_alice):
    direct_vm.sender = direct_alice
    contract = deploy(CONTRACT)
    asset_id, review_id = _create_review(contract)

    asset = json.loads(contract.get_asset(asset_id))
    review = json.loads(contract.get_review(review_id))
    commitment = json.loads(contract.get_review_commitment(review_id))

    assert asset["modelUrl"].endswith("chair.glb")
    assert asset["modelDigest"].startswith("sha256:")
    assert asset["assetCommitment"].startswith("sha256:")
    assert review["modelDigestSnapshot"] == asset["modelDigest"]
    assert review["assetCommitmentSnapshot"] == asset["assetCommitment"]
    assert review["evidenceSnapshotDigest"].startswith("sha256:")
    assert review["reviewCommitment"].startswith("sha256:")
    assert commitment["evidenceSnapshotDigest"] == review["evidenceSnapshotDigest"]


def test_digest_count_and_meaningful_evidence_are_enforced(deploy, direct_vm, direct_alice, direct_bob):
    direct_vm.sender = direct_alice
    contract = deploy(CONTRACT)
    asset_id, review_id = _create_review(contract)
    _lock_verified_assessment(contract, asset_id, review_id)

    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("reason_too_short"):
        contract.challenge_review(
            asset_id,
            review_id,
            "Too short",
            ["https://example.net/new-license"],
            [_digest("new license")],
        )
    with direct_vm.expect_revert("evidence_digest_count_mismatch"):
        contract.challenge_review(
            asset_id,
            review_id,
            "This filing explains a material conflict in the model license record.",
            ["https://example.net/new-license"],
            [],
        )
    with direct_vm.expect_revert("new_evidence_required"):
        contract.challenge_review(
            asset_id,
            review_id,
            "This filing explains a material conflict in the model license record.",
            ["https://example.net/new-license"],
            [_digest("source record v1")],
        )


def test_only_asset_creator_can_run_or_record_assessment(deploy, direct_vm, direct_alice, direct_bob):
    direct_vm.sender = direct_alice
    contract = deploy(CONTRACT)
    asset_id, review_id = _create_review(contract)

    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("record_operator_only"):
        contract.assess_review(asset_id, review_id)
    with direct_vm.expect_revert("record_operator_only"):
        contract.record_assessment_fallback(asset_id, review_id, "verified", 90, 5, "Unsafe override")


def test_appeal_is_restricted_to_affected_parties(deploy, direct_vm, direct_alice, direct_charlie):
    direct_vm.sender = direct_alice
    contract = deploy(CONTRACT)
    asset_id, review_id = _create_review(contract)
    _lock_verified_assessment(contract, asset_id, review_id)

    direct_vm.sender = direct_charlie
    with direct_vm.expect_revert("affected_party_only"):
        contract.file_appeal(
            asset_id,
            review_id,
            "I am unrelated to this model, review, and every challenge in its record.",
            ["https://example.net/unrelated"],
            [_digest("unrelated evidence")],
        )


def test_denied_appeal_preserves_verified_result_exactly(deploy, direct_vm, direct_alice):
    direct_vm.sender = direct_alice
    contract = deploy(CONTRACT)
    asset_id, review_id = _create_review(contract)
    _lock_verified_assessment(contract, asset_id, review_id)
    before_review = json.loads(contract.get_review(review_id))
    before_asset = json.loads(contract.get_asset(asset_id))

    appeal_id = contract.file_appeal(
        asset_id,
        review_id,
        "The affected creator requests review of a newly published attribution record.",
        ["https://example.net/attribution-update"],
        [_digest("attribution update v2")],
    )
    with direct_vm.expect_revert("open_filing_blocks_finalize"):
        contract.finalize_asset(asset_id)
    contract.record_appeal_resolution(
        appeal_id,
        "denied",
        "The appellant withdraws this filing after confirming the original record remains valid.",
    )

    after_review = json.loads(contract.get_review(review_id))
    after_asset = json.loads(contract.get_asset(asset_id))
    for field in [
        "verdict", "provenanceScore", "licenseRiskScore", "reviewSummary",
        "sourceFindings", "licenseFindings", "riskFlags", "status",
    ]:
        assert after_review[field] == before_review[field]
    assert after_asset["status"] == before_asset["status"] == "verified"
    assert contract.finalize_asset(asset_id) == review_id


def test_concurrent_challenges_keep_finalization_blocked_until_all_close(
    deploy, direct_vm, direct_alice, direct_bob, direct_charlie
):
    direct_vm.sender = direct_alice
    contract = deploy(CONTRACT)
    asset_id, review_id = _create_review(contract)
    _lock_verified_assessment(contract, asset_id, review_id)

    direct_vm.sender = direct_bob
    first = contract.challenge_review(
        asset_id,
        review_id,
        "The license page may not cover the exact geometry stored in the model digest.",
        ["https://example.net/license-conflict"],
        [_digest("license conflict evidence")],
    )
    direct_vm.sender = direct_charlie
    second = contract.challenge_review(
        asset_id,
        review_id,
        "The source archive contains a second authorship claim requiring independent review.",
        ["https://example.net/authorship-conflict"],
        [_digest("authorship conflict evidence")],
    )

    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("open_filing_blocks_finalize"):
        contract.finalize_asset(asset_id)

    direct_vm.sender = direct_bob
    contract.record_challenge_resolution(
        first,
        "dismissed",
        "The first challenger withdraws after the license scope was independently confirmed.",
    )
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("open_filing_blocks_finalize"):
        contract.finalize_asset(asset_id)
    assert json.loads(contract.get_review(review_id))["status"] == "challenged"

    direct_vm.sender = direct_charlie
    contract.record_challenge_resolution(
        second,
        "dismissed",
        "The second challenger withdraws after the authorship archive was independently confirmed.",
    )
    direct_vm.sender = direct_alice
    assert contract.finalize_asset(asset_id) == review_id
    assert json.loads(contract.get_asset(asset_id))["status"] == "verified"
