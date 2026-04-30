"""
policy_engine.py — Deterministic policy decisions, external to the model.

Equivalent to apps/policy-engine in nkhatu/control-architecture.
Core architectural rule: the model may recommend, but policy decides.
Policy lives here — not in the orchestrator, not in the workflow worker.

OPA-aligned structure: each decision evaluates an input bundle against
policy rules and returns an explicit allow/deny/escalate with a policy artifact
that is persisted in provenance.
"""
from datetime import datetime
from models import DelegationToken, TaskSnapshot, PolicyDecision, PolicyDecisionType
from control_plane import ControlPlane


class PolicyEngine:
    """
    Deterministic intake and release decisioner.
    Reads thresholds and config from control_plane — never from local state.
    All decisions produce a PolicyArtifact that gets persisted in provenance.
    """

    def __init__(self, control_plane: ControlPlane):
        self._cp = control_plane

    def decide_intake(self, task: TaskSnapshot, token: DelegationToken) -> PolicyDecision:
        """
        Intake policy check — runs before the workflow starts.
        Evaluates: kill switch, token validity, spend authority, merchant allowlist,
        currency corridor, and rail threshold controls.
        """
        cp      = self._cp.snapshot()
        rails   = cp.rail_controls
        version = cp.version

        input_bundle = {
            "task_id":    task.task_id,
            "amount":     task.amount,
            "currency":   task.currency,
            "merchant":   task.merchant_id,
            "token_id":   token.token_id,
            "principal":  token.principal,
            "check_type": "intake",
        }

        # ── Rule 1: Kill switch ──────────────────────────────────────────────
        if not self._cp.is_live():
            return PolicyDecision(
                decision=PolicyDecisionType.DENY,
                reason="Kill switch active — no payments are processing",
                policy_artifact={**input_bundle, "rule": "kill_switch"},
                policy_version=version
            )

        # ── Rule 2: Token revocation ─────────────────────────────────────────
        if token.revoked:
            return PolicyDecision(
                decision=PolicyDecisionType.DENY,
                reason="Delegation token revoked — authority invalidated",
                policy_artifact={**input_bundle, "rule": "token_revoked"},
                policy_version=version
            )

        # ── Rule 3: Token expiry ─────────────────────────────────────────────
        if datetime.now() > token.valid_until:
            return PolicyDecision(
                decision=PolicyDecisionType.DENY,
                reason="Delegation token expired — time-bound authority elapsed",
                policy_artifact={**input_bundle, "rule": "token_expired"},
                policy_version=version
            )

        # ── Rule 4: Currency corridor ────────────────────────────────────────
        if task.currency not in rails.supported_currencies:
            return PolicyDecision(
                decision=PolicyDecisionType.DENY,
                reason=f"Currency {task.currency} not in supported corridors: {rails.supported_currencies}",
                policy_artifact={**input_bundle, "rule": "unsupported_currency"},
                policy_version=version
            )

        if task.currency != token.currency_restriction:
            return PolicyDecision(
                decision=PolicyDecisionType.DENY,
                reason=f"Token restricts to {token.currency_restriction}, task uses {task.currency}",
                policy_artifact={**input_bundle, "rule": "currency_mismatch"},
                policy_version=version
            )

        # ── Rule 5: Merchant allowlist (Article 3 — MDP) ────────────────────
        if task.merchant_id not in token.merchant_allowlist:
            return PolicyDecision(
                decision=PolicyDecisionType.DENY,
                reason=f"Merchant '{task.merchant_id}' not in delegation allowlist",
                policy_artifact={**input_bundle, "rule": "merchant_not_allowed"},
                policy_version=version
            )

        # ── Rule 6: Spend authority (Article 3 — MDP) ───────────────────────
        remaining = token.remaining_authority()
        if task.amount > remaining:
            return PolicyDecision(
                decision=PolicyDecisionType.DENY,
                reason=f"Amount ${task.amount:.2f} exceeds remaining authority ${remaining:.2f} of ${token.spend_limit:.2f}",
                policy_artifact={**input_bundle, "rule": "authority_exceeded", "remaining": remaining},
                policy_version=version
            )

        # ── Rule 7: Rail amount ceiling ──────────────────────────────────────
        if task.amount > rails.max_amount:
            return PolicyDecision(
                decision=PolicyDecisionType.DENY,
                reason=f"Amount ${task.amount:.2f} exceeds rail maximum ${rails.max_amount:.2f}",
                policy_artifact={**input_bundle, "rule": "rail_ceiling_exceeded"},
                policy_version=version
            )

        # ── Rule 8: Delegation depth (Article 3 — MDP) ──────────────────────
        if token.delegation_depth_remaining <= 0:
            return PolicyDecision(
                decision=PolicyDecisionType.DENY,
                reason="Delegation depth exhausted — MDP violated",
                policy_artifact={**input_bundle, "rule": "depth_exhausted"},
                policy_version=version
            )

        # ── Rule 9: Approval gate ────────────────────────────────────────────
        if task.amount > rails.approval_required_above:
            return PolicyDecision(
                decision=PolicyDecisionType.ALLOW,
                reason=f"Intake allowed. Amount ${task.amount:.2f} > ${rails.approval_required_above:.2f} threshold — operator approval required before release",
                policy_artifact={
                    **input_bundle,
                    "rule": "intake_allowed_approval_required",
                    "approval_threshold": rails.approval_required_above,
                },
                policy_version=version
            )

        # ── Allow ────────────────────────────────────────────────────────────
        return PolicyDecision(
            decision=PolicyDecisionType.ALLOW,
            reason=f"Intake allowed. Amount ${task.amount:.2f} within all thresholds",
            policy_artifact={**input_bundle, "rule": "intake_allowed"},
            policy_version=version
        )

    def decide_release(self, task: TaskSnapshot, token: DelegationToken) -> PolicyDecision:
        """
        Release policy check — runs just before capability_gateway.release_payment().
        Re-validates everything: revocation, state, approval. Nothing is assumed from intake.
        Article 3: authority is re-validated at every state transition, not just initiation.
        """
        version = self._cp.snapshot().version
        input_bundle = {
            "task_id":    task.task_id,
            "amount":     task.amount,
            "currency":   task.currency,
            "token_id":   token.token_id,
            "check_type": "release",
            "task_state": task.state.value,
        }

        # ── Rule 1: Token re-check at release ────────────────────────────────
        if token.revoked:
            return PolicyDecision(
                decision=PolicyDecisionType.DENY,
                reason="Token revoked between intake and release — authority invalidated at transition",
                policy_artifact={**input_bundle, "rule": "token_revoked_at_release"},
                policy_version=version
            )

        # ── Rule 2: Task must be in APPROVED state ───────────────────────────
        from models import TaskState
        if task.state != TaskState.APPROVED:
            return PolicyDecision(
                decision=PolicyDecisionType.DENY,
                reason=f"Release requires APPROVED state, task is in {task.state.value}",
                policy_artifact={**input_bundle, "rule": "state_not_approved"},
                policy_version=version
            )

        # ── Rule 3: Approval must be recorded ───────────────────────────────
        if not task.approval_operator:
            return PolicyDecision(
                decision=PolicyDecisionType.DENY,
                reason="No approval operator recorded — human approval required for release",
                policy_artifact={**input_bundle, "rule": "no_approval_recorded"},
                policy_version=version
            )

        # ── Rule 4: Beneficiary must be validated ────────────────────────────
        if task.beneficiary_status != "validated":
            return PolicyDecision(
                decision=PolicyDecisionType.DENY,
                reason=f"Beneficiary not validated (status: {task.beneficiary_status})",
                policy_artifact={**input_bundle, "rule": "beneficiary_not_validated"},
                policy_version=version
            )

        return PolicyDecision(
            decision=PolicyDecisionType.ALLOW,
            reason=f"Release allowed. Approval by '{task.approval_operator}', beneficiary validated",
            policy_artifact={
                **input_bundle,
                "rule": "release_allowed",
                "approved_by": task.approval_operator,
            },
            policy_version=version
        )
