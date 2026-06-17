# AGENTIC OS V2 — Implementation Roadmap

This document outlines the transition from a task-orchestration UI to a full **Agent Runtime OS**.

## 0. Core Foundation & Model Upgrade
- **Model Switch**: Set `gemini-2.5-pro` as the default model in `planner.ts`, `evaluator.ts`, and `agent.ts`.
- **Base URL Update**: Ensure `z-ai-web-dev-sdk` is configured for optimal performance with Gemini.

## 1. Orchestration Mode Engine
- **Goal**: Support multiple execution patterns.
- **Modes**:
  - `Sequential`: Pipeline execution (A → B → C).
  - `Group`: Shared context with turn-taking.
  - `Hierarchical`: Manager agent assigning tasks to subordinates.
  - `Parallel`: Fan-out execution for speed.
- **UI**: "Execution Strategy" dropdown in the Agent Studio sidebar.

## 2. Reflection Loop System
- **Goal**: Autonomous quality control.
- **Behavior**: Implement a Generator → Critic loop that continues until `APPROVED` or `maxIterations` is reached.
- **UI**: "Self-Improve Output" toggle and a live iteration log showing the critique/fix cycle.

## 3. Agent Role System
- **Roles**: `planner`, `researcher`, `executor`, `critic`, `reviewer`.
- **Permissions**: Granular control over `read`, `write`, and `execute` actions.
- **UI**: Role-based color coding and badges on agent nodes; specialized config panels per role.

## 4. 3-Tier Memory Layer
- **Session Memory**: Transient data for the current run.
- **Persistent Memory**: Knowledge saved across different runs of the same agent.
- **Artifacts**: Managed storage for files, code snippets, and structured outputs.
- **UI**: "Memory Inspector" panel for real-time state debugging.

## 5. Tool + Verification Layer
- **Validation**: Implement `validator` functions for tool outputs (e.g., JSON schema checks, code test passes).
- **Status**: Visual indicators for `✅ Verified`, `❌ Failed`, and `⚠ Needs Review`.

## 6. Policy + Approval System
- **Risk Assessment**: Categorize actions as `low`, `medium`, or `high` risk.
- **Pause/Resume**: Automatically pause high-risk actions (like file writes or API deletions) for user approval.
- **UI**: "Approval Required" modal and a centralized Policy Dashboard.

## 7. Observability Timeline
- **Timeline**: A CI/CD-style visualization of the agent's life cycle.
- **Tracking**: Log latency, token usage, tool success rates, and failure points.

## 8. Parallel + Async Engine
- **Concurrency**: Support for `maxConcurrency` settings to speed up fan-out tasks.
- **Triggers**: Infrastructure for future cron and webhook-based autonomous starts.

## 9. Planner → Task Graph System
- **Decomposition**: The planner generates a structured `Task Graph` instead of a flat list.
- **Assignment**: Tasks are dynamically assigned to agents based on roles.
- **UI**: Visual graph view of active task dependencies.

## 10. System State Manager
- **Global States**: `idle`, `running`, `waiting_approval`, `error`, `completed`.
- **Visual Identity**: The animated logo serves as the heartbeat and state indicator of the OS.

---
*Plan created on April 20, 2026. Ready for Phase 1 implementation upon approval.*
