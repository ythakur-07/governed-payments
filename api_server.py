"""
api_server.py — FastAPI wrapper exposing the 7 service boundaries to the operator console.

Equivalent to apps/orchestrator-api in nkhatu/control-architecture, but expanded with
read-side endpoints for the operator console (trust graph, approval queue, task explorer,
control plane summary).

Run from this directory:
    uvicorn api_server:app --reload --port 8000
"""
import os
from datetime import datetime, timedelta
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from control_plane import ControlPlane
from policy_engine import PolicyEngine
from capability_gateway import CapabilityGateway
from context_memory import ContextMemoryService
from provenance import ProvenanceService
from workflow_worker import WorkflowWorker
from orchestrator import OrchestratorAPI
from models import DelegationToken, TaskState


# ── Service wiring (single in-process instance) ───────────────────────────────

def _build_state():
    cp     = ControlPlane()
    pe     = PolicyEngine(cp)
    gw     = CapabilityGateway()
    ctx    = ContextMemoryService()
    prov   = ProvenanceService()
    worker = WorkflowWorker(ctx, prov, gw, pe)

    tokens = {
        "tok_agent_001": DelegationToken(
            token_id="tok_agent_001",
            principal="procurement-agent-v1",
            delegated_by="root-authorization-service",
            delegation_depth_remaining=2,
            spend_limit=500.00,
            spent=0.0,
            merchant_allowlist=["merchant_techsupplies", "merchant_cloudsvc"],
            currency_restriction="USD",
            valid_until=datetime.now() + timedelta(hours=24),
            reversal_window_hours=24,
        ),
        "tok_agent_002": DelegationToken(
            token_id="tok_agent_002",
            principal="procurement-agent-v1",
            delegated_by="root-authorization-service",
            delegation_depth_remaining=2,
            spend_limit=500.00,
            spent=0.0,
            merchant_allowlist=["merchant_techsupplies"],
            currency_restriction="USD",
            valid_until=datetime.now() + timedelta(hours=24),
            reversal_window_hours=24,
            revoked=True,
        ),
    }

    api = OrchestratorAPI(cp, pe, ctx, prov, worker, tokens)
    return {
        "cp": cp, "pe": pe, "gw": gw, "ctx": ctx, "prov": prov,
        "worker": worker, "tokens": tokens, "api": api,
    }


state = _build_state()


# ── FastAPI app ───────────────────────────────────────────────────────────────

app = FastAPI(title="Governed Payments — Operator Console API", version="0.1.0")

_default_origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
_env_origins = os.environ.get("CORS_ORIGINS", "")
_origins = [o.strip() for o in _env_origins.split(",") if o.strip()] if _env_origins else _default_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Helpers ────────────────────────────────────────────────────────────────────

def _serialize_snapshot(t):
    return {
        "task_id":          t.task_id,
        "state":            t.state.value,
        "amount":           t.amount,
        "currency":         t.currency,
        "sender_wallet":    t.sender_wallet,
        "receiver_wallet":  t.receiver_wallet,
        "merchant_id":      t.merchant_id,
        "merchant_name":    t.merchant_name,
        "initiated_by":     t.initiated_by,
        "agent":            t.agent,
        "token_id":         t.token_id,
        "idempotency_key":  t.idempotency_key,
        "approval_operator": t.approval_operator,
        "rail_instruction_id": t.rail_instruction_id,
        "beneficiary_status": t.beneficiary_status,
        "release_result":     t.release_result,
        "liability_owner":    t.liability_owner,
        "created_at":         t.created_at,
        "updated_at":         t.updated_at,
    }


def _serialize_token(tok: DelegationToken):
    return {
        "token_id":   tok.token_id,
        "principal":  tok.principal,
        "delegated_by": tok.delegated_by,
        "depth_remaining": tok.delegation_depth_remaining,
        "spend_limit": tok.spend_limit,
        "spent":       tok.spent,
        "remaining":   tok.remaining_authority(),
        "merchant_allowlist": tok.merchant_allowlist,
        "currency_restriction": tok.currency_restriction,
        "valid_until": tok.valid_until.isoformat(timespec="seconds"),
        "revoked":     tok.revoked,
    }


def _serialize_record(r):
    return {
        "record_id":  r.record_id,
        "task_id":    r.task_id,
        "record_type": r.record_type,
        "actor":      r.actor,
        "actor_type": r.actor_type,
        "data":       r.data,
        "created_at": r.created_at,
    }


# ── Control plane ─────────────────────────────────────────────────────────────

@app.get("/api/control-plane")
def get_control_plane():
    cp = state["cp"]
    snap = cp.snapshot()
    return {
        "version":     snap.version,
        "kill_switch": snap.kill_switch,
        "rail_controls": {
            "max_amount":              snap.rail_controls.max_amount,
            "approval_required_above": snap.rail_controls.approval_required_above,
            "supported_currencies":    snap.rail_controls.supported_currencies,
            "idempotency_window_secs": snap.rail_controls.idempotency_window_secs,
            "release_timeout_secs":    snap.rail_controls.release_timeout_secs,
        },
        "capabilities": [
            {
                "name":            c.name,
                "type":            c.type,
                "has_side_effect": c.has_side_effect,
                "idempotent":      c.idempotent,
                "description":     c.description,
            }
            for c in snap.capabilities
        ],
        "agents": [
            {
                "agent_id":    a.agent_id,
                "role":        a.role,
                "description": a.description,
                "actions":     a.actions,
            }
            for a in snap.agents
        ],
    }


class KillSwitchRequest(BaseModel):
    active: bool


@app.post("/api/control-plane/kill-switch")
def set_kill_switch(req: KillSwitchRequest):
    """Operator-driven toggle. Mutates the live snapshot in place."""
    state["cp"]._snapshot.kill_switch = req.active
    return {"kill_switch": state["cp"]._snapshot.kill_switch}


# ── Tokens / trust graph ──────────────────────────────────────────────────────

@app.get("/api/tokens")
def get_tokens():
    return [_serialize_token(t) for t in state["tokens"].values()]


@app.get("/api/trust-graph")
def get_trust_graph():
    """
    Assemble the delegation chain Root → Agent → Sub-Agent → Tool.
    Authority bars come from the delegation tokens (spent vs spend_limit).
    """
    cp = state["cp"]
    agents = cp.agents()
    capabilities = {c.name: c for c in cp.capabilities()}
    tokens = list(state["tokens"].values())

    parent_agents     = [a for a in agents if a.role == "parent"]
    delegated_agents  = [a for a in agents if a.role == "delegated"]

    # Map sub-agent action -> which capabilities it touches.
    # In this prototype the link is by name convention.
    SUBAGENT_TOOLS = {
        "validate_beneficiary": ["validate_beneficiary"],
        "route_approval":       [],   # routing only — does not call rail
    }

    def _agent_tools(agent):
        out = []
        for action in agent.actions:
            for tool_name in SUBAGENT_TOOLS.get(action, []):
                cap = capabilities.get(tool_name)
                if cap:
                    out.append({
                        "name":            cap.name,
                        "type":            cap.type,
                        "has_side_effect": cap.has_side_effect,
                        "idempotent":      cap.idempotent,
                    })
        return out

    # Parent agent tools = capabilities it uses directly (create + release)
    PARENT_TOOLS = ["create_instruction", "release_payment", "get_status"]

    return {
        "root": {
            "id":   "root-authorization-service",
            "type": "root",
            "label": "Root Authorization Service",
        },
        "principals": [
            {
                "id":     p,
                "type":   "principal",
                "label":  p,
                "tokens": [_serialize_token(tok) for tok in tokens if tok.principal == p],
            }
            for p in sorted({tok.principal for tok in tokens})
        ],
        "parent_agents": [
            {
                "agent_id":    a.agent_id,
                "role":        a.role,
                "description": a.description,
                "actions":     a.actions,
                "tools": [
                    {
                        "name":            capabilities[t].name,
                        "type":            capabilities[t].type,
                        "has_side_effect": capabilities[t].has_side_effect,
                        "idempotent":      capabilities[t].idempotent,
                    }
                    for t in PARENT_TOOLS if t in capabilities
                ],
                "sub_agents": [
                    {
                        "agent_id":    sa.agent_id,
                        "role":        sa.role,
                        "description": sa.description,
                        "actions":     sa.actions,
                        "tools":       _agent_tools(sa),
                    }
                    for sa in delegated_agents
                ],
            }
            for a in parent_agents
        ],
    }


# ── Tasks ─────────────────────────────────────────────────────────────────────

@app.get("/api/tasks")
def list_tasks():
    tasks = state["ctx"].list_tasks()
    return [_serialize_snapshot(t) for t in tasks]


@app.get("/api/tasks/awaiting-approval")
def list_awaiting_approval():
    tasks = [t for t in state["ctx"].list_tasks() if t.state == TaskState.AWAITING_APPROVAL]
    return [_serialize_snapshot(t) for t in tasks]


@app.get("/api/tasks/{task_id}")
def get_task(task_id: str):
    task = state["ctx"].get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
    evidence    = state["prov"].get_task_evidence(task_id)
    delegations = state["prov"].get_delegations(task_id)
    return {
        "snapshot":   _serialize_snapshot(task),
        "provenance": [_serialize_record(r) for r in evidence],
        "delegations": [
            {
                "work_id":          d.work_id,
                "task_id":          d.task_id,
                "parent_agent":     d.parent_agent,
                "delegated_agent":  d.delegated_agent,
                "action":           d.action,
                "request_envelope": d.request_envelope,
                "response_envelope": d.response_envelope,
                "status":           d.status.value,
                "created_at":       d.created_at,
                "completed_at":     d.completed_at,
            }
            for d in delegations
        ],
    }


class ApproveRequest(BaseModel):
    operator: str


@app.post("/api/tasks/{task_id}/approve")
def approve_task(task_id: str, req: ApproveRequest):
    task = state["ctx"].get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
    if task.state != TaskState.AWAITING_APPROVAL:
        raise HTTPException(
            status_code=409,
            detail=f"Task is in {task.state.value}, not awaiting_approval",
        )
    result = state["api"].resume_after_approval(task_id, operator=req.operator)
    return result


# ── Submit payment (so the console can seed scenarios) ────────────────────────

class SubmitPaymentRequest(BaseModel):
    amount:           float
    currency:         str
    sender_wallet:    str
    receiver_wallet:  str
    merchant_id:      str
    merchant_name:    str
    initiated_by:     str
    token_id:         str
    idempotency_key:  str


@app.post("/api/payments/submit")
def submit_payment(req: SubmitPaymentRequest):
    return state["api"].submit_payment(
        amount=req.amount,
        currency=req.currency,
        sender_wallet=req.sender_wallet,
        receiver_wallet=req.receiver_wallet,
        merchant_id=req.merchant_id,
        merchant_name=req.merchant_name,
        initiated_by=req.initiated_by,
        token_id=req.token_id,
        idempotency_key=req.idempotency_key,
    )


# ── Seeding helper (handy for first-load demo) ────────────────────────────────

@app.post("/api/seed")
def seed_demo():
    """Submit the three demo scenarios so the console has something to show."""
    api = state["api"]
    submitted = []

    submitted.append(api.submit_payment(
        amount=350.00, currency="USD",
        sender_wallet="wallet_corp_01",
        receiver_wallet="wallet_techsupplies_01",
        merchant_id="merchant_techsupplies",
        merchant_name="TechSupplies Inc.",
        initiated_by="user_yash",
        token_id="tok_agent_001",
        idempotency_key=f"idem_{datetime.now().timestamp()}_a",
    ))

    submitted.append(api.submit_payment(
        amount=600.00, currency="USD",
        sender_wallet="wallet_corp_01",
        receiver_wallet="wallet_techsupplies_01",
        merchant_id="merchant_techsupplies",
        merchant_name="TechSupplies Inc.",
        initiated_by="user_yash",
        token_id="tok_agent_001",
        idempotency_key=f"idem_{datetime.now().timestamp()}_b",
    ))

    submitted.append(api.submit_payment(
        amount=200.00, currency="USD",
        sender_wallet="wallet_corp_01",
        receiver_wallet="wallet_techsupplies_01",
        merchant_id="merchant_techsupplies",
        merchant_name="TechSupplies Inc.",
        initiated_by="user_yash",
        token_id="tok_agent_002",
        idempotency_key=f"idem_{datetime.now().timestamp()}_c",
    ))

    return {"seeded": submitted}


@app.get("/api/health")
def health():
    return {"ok": True, "version": state["cp"].version()}
