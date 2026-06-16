# Meridian API Reference

> Complete REST API documentation for Agent Studio OS — 49 REST endpoints across 14 route groups

---

## Base URL
- Development: `http://localhost:3000/api`
- Production: `https://your-domain.com/api`

## Authentication
✅ Session-based authentication integrated via NextAuth.js.
Protected routes require a valid session; public routes include `/api/auth/*` and `/api/health`.

---

## Table of Contents

1. [Agent Management](#agent-management) (11 endpoints)
2. [Team Orchestration](#team-orchestration) (8 endpoints)
3. [Template Management](#template-management) (5 endpoints)
4. [Policy & Governance](#policy--governance) (4 endpoints)
5. [Approval Management](#approval-management) (2 endpoints)
6. [Memory Management](#memory-management) (3 endpoints)
7. [Artifact Management](#artifact-management) (2 endpoints)
8. [Metrics & Observability](#metrics--observability) (2 endpoints)
9. [Timeline Events](#timeline-events) (1 endpoint)
10. [Audit Logs](#audit-logs) (1 endpoint)
11. [Tools Registry](#tools-registry) (1 endpoint)
12. [Trigger Management](#trigger-management) (5 endpoints)
13. [Task Graph](#task-graph) (5 endpoints)
14. [Hermes Causal DAG](#hermes-causal-dag) (3 endpoints)
15. [Provider Status](#provider-status) (1 endpoint)

---

## Agent Management

### POST /api/agent/create
Create a new agent with complete configuration.

**Request Body:**
```json
{
  "name": "Research Agent",
  "goal": "Research quantum computing topics",
  "personality": "analytical and thorough",
  "tools": ["search", "write", "browser"],
  "role": "researcher",
  "model": "gemini-2.5-pro",
  "maxSteps": 10,
  "autoRun": true,
  "outputFormat": "markdown",
  "orchestrationMode": "single",
  "maxConcurrency": 3,
  "reflectionEnabled": false,
  "reflectionMaxIter": 3,
  "reflectionCriteria": "APPROVED",
  "shortTermMemory": true,
  "longTermMemory": false,
  "teamId": null,
  "graphData": null
}
```

**Required:** `name`, `goal`  
**Defaults:** personality="helpful assistant", tools=["search","write"], maxSteps=10

**Response:** `200 OK`
```json
{
  "id": "cm1x2y3z4",
  "name": "Research Agent",
  "goal": "Research quantum computing topics",
  "personality": "analytical and thorough",
  "tools": ["search", "write", "browser"],
  "role": "researcher",
  "model": "gemini-2.5-pro",
  "orchestrationMode": "single",
  "maxConcurrency": 3,
  "reflectionEnabled": false,
  "reflectionMaxIter": 3,
  "reflectionCriteria": "APPROVED",
  "shortTermMemory": true,
  "longTermMemory": false,
  "maxSteps": 10,
  "autoRun": true,
  "outputFormat": "markdown",
  "teamId": null,
  "graphData": null,
  "createdAt": "2026-06-16T04:00:00.000Z"
}
```

---

### GET /api/agent/list
List all agents with run counts.

**Response:** `200 OK`
```json
[
  {
    "id": "cm1x2y3z4",
    "name": "Research Agent",
    "goal": "Research quantum computing topics",
    "personality": "analytical and thorough",
    "tools": ["search", "write", "browser"],
    "role": "researcher",
    "model": "gemini-2.5-pro",
    "orchestrationMode": "single",
    "maxConcurrency": 3,
    "reflectionEnabled": false,
    "reflectionMaxIter": 3,
    "reflectionCriteria": "APPROVED",
    "shortTermMemory": true,
    "longTermMemory": false,
    "maxSteps": 10,
    "autoRun": true,
    "outputFormat": "markdown",
    "teamId": null,
    "graphData": null,
    "runCount": 5,
    "createdAt": "2026-06-16T04:00:00.000Z",
    "updatedAt": "2026-06-16T05:30:00.000Z"
  }
]
```

---

### PATCH /api/agent/update
Update an agent's configuration or graph data.

**Request Body:**
```json
{
  "id": "cm1x2y3z4",
  "name": "Updated Research Agent",
  "goal": "Research quantum computing and AI",
  "tools": ["search", "write", "browser", "code"],
  "maxSteps": 15
}
```

**Required:** `id`  
**Optional:** Any agent configuration field

**Response:** `200 OK` (same structure as create)

---

### DELETE /api/agent/delete?id={agentId}
Delete an agent (cascade deletes runs and steps).

**Query Parameters:**
- `id` (required): Agent ID to delete

**Response:** `200 OK`
```json
{
  "success": true,
  "deleted": "cm1x2y3z4"
}
```

---

### POST /api/agent/run
Start an agent execution run.

**Request Body:**
```json
{
  "agentId": "cm1x2y3z4",
  "goal": "optional goal override"
}
```

**Required:** `agentId`

**Response:** `200 OK`
```json
{
  "runId": "run_abc123xyz",
  "agentId": "cm1x2y3z4",
  "status": "running",
  "startedAt": "2026-06-16T06:00:00.000Z"
}
```

---

### POST /api/agent/stop
Stop a running agent.

**Request Body:**
```json
{
  "runId": "run_abc123xyz"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "runId": "run_abc123xyz",
  "status": "stopped"
}
```

---

### GET /api/agent/stream?runId={runId}
Server-Sent Events (SSE) stream for real-time agent execution events.

**Query Parameters:**
- `runId` (required): Run ID from /api/agent/run

**Response:** `text/event-stream`

**Event Types:**
- `status`: Run lifecycle changes (running, completed, failed, stopped)
- `thinking`: LLM processing indicator
- `plan`: Next action decision
- `action`: Tool execution started
- `result`: Tool execution completed
- `reflection`: Critic-generator iteration
- `policy`: Policy check result
- `error`: Error occurred
- `done`: Run completed

**Example Event:**
```
event: plan
data: {"step":1,"tool":"search","reasoning":"Need to search for quantum computing info"}

event: result
data: {"step":1,"output":"Found 10 results...","success":true}
```

---

### GET /api/agent/runs?agentId={agentId}
Get all runs for a specific agent.

**Query Parameters:**
- `agentId` (required): Agent ID

**Response:** `200 OK`
```json
[
  {
    "id": "run_abc123xyz",
    "agentId": "cm1x2y3z4",
    "status": "completed",
    "result": "Research completed successfully",
    "totalSteps": 8,
    "totalTokens": 1250,
    "totalLatencyMs": 5400,
    "startedAt": "2026-06-16T06:00:00.000Z",
    "completedAt": "2026-06-16T06:05:00.000Z"
  }
]
```

---

## Team Orchestration

### POST /api/team/create
Create a new multi-agent team with orchestration configuration.

**Request Body:**
```json
{
  "name": "Research Team",
  "mode": "sequential",
  "maxConcurrency": 3,
  "terminationType": "max_steps",
  "terminationValue": 20,
  "sharedContext": true,
  "agentIds": ["agent1", "agent2", "agent3"]
}
```

**Required:** `name`  
**Defaults:** mode="sequential", maxConcurrency=3, sharedContext=true

**Valid Modes:** `sequential`, `group`, `hierarchical`, `parallel`

**Response:** `200 OK`
```json
{
  "id": "team_xyz789",
  "name": "Research Team",
  "mode": "sequential",
  "maxConcurrency": 3,
  "terminationType": "max_steps",
  "terminationValue": 20,
  "sharedContext": true,
  "agentIds": ["agent1", "agent2", "agent3"],
  "createdAt": "2026-06-16T06:00:00.000Z"
}
```

---

### GET /api/team/list
List all teams.

**Response:** `200 OK` (array of team objects)

---

### GET /api/team/get?id={teamId}
Get a specific team with full agent details.

**Query Parameters:**
- `id` (required): Team ID

**Response:** `200 OK`
```json
{
  "id": "team_xyz789",
  "name": "Research Team",
  "mode": "sequential",
  "maxConcurrency": 3,
  "agents": [
    { "id": "agent1", "name": "Researcher", "role": "researcher" },
    { "id": "agent2", "name": "Analyzer", "role": "executor" }
  ],
  "createdAt": "2026-06-16T06:00:00.000Z"
}
```

---

### PATCH /api/team/update
Update a team's configuration.

**Request Body:**
```json
{
  "id": "team_xyz789",
  "name": "Updated Research Team",
  "mode": "parallel",
  "agentIds": ["agent1", "agent2", "agent3", "agent4"]
}
```

**Required:** `id`

**Response:** `200 OK` (updated team object)

---

### POST /api/team/run
Start a team orchestration run.

**Request Body:**
```json
{
  "teamId": "team_xyz789",
  "goal": "Research and analyze quantum computing applications"
}
```

**Required:** `teamId`

**Response:** `200 OK`
```json
{
  "runId": "run_team_abc",
  "teamId": "team_xyz789",
  "status": "running",
  "mode": "sequential",
  "agentCount": 3
}
```

---

### POST /api/team/stop
Stop a running team orchestration.

**Request Body:**
```json
{
  "runId": "run_team_abc"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "runId": "run_team_abc",
  "status": "stopped"
}
```

---

## Template Management

### POST /api/template/create
Save an agent configuration as a reusable template.

**Request Body:**
```json
{
  "name": "Research Agent Template",
  "description": "Standard research agent with browser and search tools",
  "category": "research",
  "config": {
    "personality": "analytical and thorough",
    "tools": ["search", "write", "browser"],
    "role": "researcher",
    "model": "gemini-2.5-pro",
    "maxSteps": 15
  }
}
```

**Required:** `name`, `config`

**Response:** `200 OK`
```json
{
  "id": "template_abc123",
  "name": "Research Agent Template",
  "description": "Standard research agent with browser and search tools",
  "category": "research",
  "config": {...},
  "createdAt": "2026-06-16T06:00:00.000Z"
}
```

---

### GET /api/template/list
List all available templates.

**Response:** `200 OK` (array of template objects)

---

### GET /api/template/get?id={templateId}
Get a specific template.

**Query Parameters:**
- `id` (required): Template ID

**Response:** `200 OK` (template object)

---

### DELETE /api/template/delete?id={templateId}
Delete a template.

**Query Parameters:**
- `id` (required): Template ID to delete

**Response:** `200 OK`
```json
{
  "success": true,
  "deleted": "template_abc123"
}
```

---

### POST /api/template/instantiate
Create a new agent from a template with optional overrides.

**Request Body:**
```json
{
  "templateId": "template_abc123",
  "name": "My Research Agent",
  "goal": "Research AI safety topics",
  "overrides": {
    "maxSteps": 20,
    "tools": ["search", "write", "browser", "code"]
  }
}
```

**Required:** `templateId`, `name`, `goal`

**Response:** `200 OK` (newly created agent object)

---

## Policy & Governance

### POST /api/policy/create
Create a policy rule to control agent behavior.

**Request Body:**
```json
{
  "name": "Block Code Execution for Reviewers",
  "action": "block",
  "priority": 90,
  "enabled": true,
  "conditions": {
    "tool": ["execute_code"],
    "role": ["reviewer"]
  }
}
```

**Required:** `name`, `action`, `conditions`  
**Defaults:** priority=50, enabled=true

**Valid Actions:** `allow`, `block`, `ask_user`, `shadow`

**Response:** `200 OK`
```json
{
  "id": "policy_xyz",
  "name": "Block Code Execution for Reviewers",
  "action": "block",
  "priority": 90,
  "enabled": true,
  "conditions": {...},
  "createdAt": "2026-06-16T06:00:00.000Z"
}
```

---

### GET /api/policy/list
List all policy rules (sorted by priority DESC).

**Response:** `200 OK` (array of policy objects)

---

### PATCH /api/policy/update
Update a policy rule.

**Request Body:**
```json
{
  "id": "policy_xyz",
  "enabled": false,
  "priority": 80
}
```

**Required:** `id`

**Response:** `200 OK` (updated policy object)

---

### DELETE /api/policy/delete?id={policyId}
Delete a policy rule.

**Query Parameters:**
- `id` (required): Policy ID to delete

**Response:** `200 OK`
```json
{
  "success": true,
  "deleted": "policy_xyz"
}
```

---

## Approval Management

### GET /api/approval/list?status={status}
List approval requests (for human-in-the-loop workflows).

**Query Parameters:**
- `status` (optional): Filter by status (`pending`, `approved`, `denied`)

**Response:** `200 OK`
```json
[
  {
    "id": "approval_123",
    "agentId": "agent1",
    "runId": "run_abc",
    "tool": "execute_code",
    "input": {"code": "print('hello')"},
    "status": "pending",
    "requestedAt": "2026-06-16T06:00:00.000Z"
  }
]
```

---

### POST /api/approval/respond
Respond to an approval request.

**Request Body:**
```json
{
  "id": "approval_123",
  "decision": "approved",
  "reason": "Code looks safe"
}
```

**Required:** `id`, `decision`  
**Valid Decisions:** `approved`, `denied`

**Response:** `200 OK`
```json
{
  "success": true,
  "id": "approval_123",
  "decision": "approved",
  "respondedAt": "2026-06-16T06:05:00.000Z"
}
```

---

## Memory Management

### POST /api/memory/set
Set a memory value in a specific tier.

**Request Body:**
```json
{
  "agentId": "agent1",
  "key": "user_preferences",
  "value": {"theme": "dark", "language": "en"},
  "tier": "persistent",
  "runId": "run_abc"
}
```

**Required:** `agentId`, `key`, `value`, `tier`  
**Valid Tiers:** `session`, `persistent`, `artifact`

**Response:** `200 OK`
```json
{
  "success": true,
  "key": "user_preferences",
  "tier": "persistent"
}
```

---

### GET /api/memory/get?agentId={agentId}&key={key}&tier={tier}
Retrieve a memory value.

**Query Parameters:**
- `agentId` (required): Agent ID
- `key` (required): Memory key
- `tier` (optional): Memory tier (defaults to searching all tiers)

**Response:** `200 OK`
```json
{
  "key": "user_preferences",
  "value": {"theme": "dark", "language": "en"},
  "tier": "persistent",
  "agentId": "agent1",
  "createdAt": "2026-06-16T06:00:00.000Z"
}
```

---

### GET /api/memory/list?agentId={agentId}&tier={tier}
List all memory entries for an agent.

**Query Parameters:**
- `agentId` (required): Agent ID
- `tier` (optional): Filter by tier

**Response:** `200 OK` (array of memory entry objects)

---

## Artifact Management

### GET /api/artifacts/list?agentId={agentId}
List all artifacts (generated files, documents, code) for an agent.

**Query Parameters:**
- `agentId` (required): Agent ID

**Response:** `200 OK`
```json
[
  {
    "id": "artifact_abc",
    "agentId": "agent1",
    "name": "research_report.md",
    "type": "document",
    "runId": "run_xyz",
    "metadata": {"wordCount": 1500},
    "createdAt": "2026-06-16T06:00:00.000Z"
  }
]
```

---

### GET /api/artifacts/get?agentId={agentId}&name={name}
Get a specific artifact by name.

**Query Parameters:**
- `agentId` (required): Agent ID
- `name` (required): Artifact name

**Response:** `200 OK`
```json
{
  "id": "artifact_abc",
  "agentId": "agent1",
  "name": "research_report.md",
  "type": "document",
  "content": "# Research Report\n\n...",
  "metadata": {"wordCount": 1500},
  "createdAt": "2026-06-16T06:00:00.000Z"
}
```

---

## Metrics & Observability

### GET /api/metrics/run?runId={runId}
Get metrics for a specific agent run.

**Query Parameters:**
- `runId` (required): Run ID

**Response:** `200 OK`
```json
{
  "runId": "run_abc",
  "totalTokens": 1250,
  "totalLatencyMs": 5400,
  "stepCount": 8,
  "toolUsage": {
    "search": 3,
    "write": 2,
    "browser": 2,
    "finish": 1
  },
  "verificationResults": {
    "passed": 7,
    "failed": 1
  }
}
```

---

### GET /api/metrics/system
Get system-wide metrics.

**Response:** `200 OK`
```json
{
  "totalRuns": 150,
  "completedRuns": 140,
  "failedRuns": 8,
  "activeRuns": 2,
  "totalAgents": 25,
  "totalTokensUsed": 185000,
  "avgLatencyMs": 4200,
  "avgStepsPerRun": 9.2,
  "errorRate": 0.053
}
```

---

## Timeline Events

### GET /api/timeline?runId={runId}
Get fine-grained timeline events for a run.

**Query Parameters:**
- `runId` (required): Run ID

**Response:** `200 OK`
```json
[
  {
    "id": "event_1",
    "runId": "run_abc",
    "type": "run_start",
    "timestamp": "2026-06-16T06:00:00.000Z",
    "data": {}
  },
  {
    "id": "event_2",
    "runId": "run_abc",
    "type": "llm_call",
    "timestamp": "2026-06-16T06:00:01.200Z",
    "data": {"tokens": 150, "duration": 1200}
  }
]
```

---

## Audit Logs

### GET /api/audit/list?agentId={agentId}&limit={limit}
Get immutable audit log entries for policy checks and approvals.

**Query Parameters:**
- `agentId` (optional): Filter by agent ID
- `limit` (optional): Max entries to return (default: 100)

**Response:** `200 OK`
```json
[
  {
    "id": "audit_1",
    "agentId": "agent1",
    "runId": "run_abc",
    "action": "execute_code",
    "outcome": "ask_user",
    "riskLevel": "medium",
    "details": {...},
    "timestamp": "2026-06-16T06:00:00.000Z"
  }
]
```

---

## Tools Registry

### GET /api/tools/list
List all available tools with descriptions and risk levels.

**Response:** `200 OK`
```json
[
  {
    "name": "search",
    "description": "Search the web using ZAI Web Search API",
    "riskLevel": "low",
    "requiresApproval": false
  },
  {
    "name": "execute_code",
    "description": "Execute code with optional verification",
    "riskLevel": "medium",
    "requiresApproval": true
  }
]
```

---

## Trigger Management

### POST /api/trigger/create
Create a scheduled or event-based trigger for agent execution.

**Request Body:**
```json
{
  "name": "Daily Research Summary",
  "agentId": "agent1",
  "type": "schedule",
  "schedule": "0 9 * * *",
  "enabled": true,
  "config": {
    "goal": "Generate daily research summary"
  }
}
```

**Required:** `name`, `agentId`, `type`  
**Valid Types:** `schedule`, `webhook`, `event`

**Response:** `200 OK`
```json
{
  "id": "trigger_abc",
  "name": "Daily Research Summary",
  "agentId": "agent1",
  "type": "schedule",
  "schedule": "0 9 * * *",
  "enabled": true,
  "createdAt": "2026-06-16T06:00:00.000Z"
}
```

---

### GET /api/trigger/list?agentId={agentId}
List all triggers (optionally filtered by agent).

**Query Parameters:**
- `agentId` (optional): Filter by agent ID

**Response:** `200 OK` (array of trigger objects)

---

### PATCH /api/trigger/update
Update a trigger.

**Request Body:**
```json
{
  "id": "trigger_abc",
  "enabled": false,
  "schedule": "0 10 * * *"
}
```

**Required:** `id`

**Response:** `200 OK` (updated trigger object)

---

### DELETE /api/trigger/delete?id={triggerId}
Delete a trigger.

**Query Parameters:**
- `id` (required): Trigger ID

**Response:** `200 OK`
```json
{
  "success": true,
  "deleted": "trigger_abc"
}
```

---

### POST /api/trigger/execute
Manually execute a trigger.

**Request Body:**
```json
{
  "id": "trigger_abc"
}
```

**Required:** `id`

**Response:** `200 OK`
```json
{
  "success": true,
  "runId": "run_triggered_xyz",
  "triggerId": "trigger_abc"
}
```

---

## Task Graph

### POST /api/task-graph/create
Create a visual workflow DAG (directed acyclic graph).

**Request Body:**
```json
{
  "name": "Research Workflow",
  "description": "Multi-step research and analysis workflow",
  "nodes": [
    {"id": "node1", "type": "agent", "agentId": "agent1", "position": {"x": 0, "y": 0}},
    {"id": "node2", "type": "agent", "agentId": "agent2", "position": {"x": 200, "y": 0}}
  ],
  "edges": [
    {"id": "edge1", "source": "node1", "target": "node2"}
  ]
}
```

**Required:** `name`, `nodes`, `edges`

**Response:** `200 OK`
```json
{
  "id": "graph_abc",
  "name": "Research Workflow",
  "description": "Multi-step research and analysis workflow",
  "nodes": [...],
  "edges": [...],
  "createdAt": "2026-06-16T06:00:00.000Z"
}
```

---

### GET /api/task-graph/list
List all task graphs.

**Response:** `200 OK` (array of task graph objects)

---

### GET /api/task-graph/get?id={graphId}
Get a specific task graph.

**Query Parameters:**
- `id` (required): Graph ID

**Response:** `200 OK` (task graph object)

---

### PATCH /api/task-graph/update
Update a task graph.

**Request Body:**
```json
{
  "id": "graph_abc",
  "name": "Updated Research Workflow",
  "nodes": [...],
  "edges": [...]
}
```

**Required:** `id`

**Response:** `200 OK` (updated task graph object)

---

### DELETE /api/task-graph/delete?id={graphId}
Delete a task graph.

**Query Parameters:**
- `id` (required): Graph ID

**Response:** `200 OK`
```json
{
  "success": true,
  "deleted": "graph_abc"
}
```

---

## Hermes Causal DAG

### POST /api/hermes/run
Start a new Hermes causal execution run with event-sourced kernel.

**Request Body:**
```json
{
  "goal": "Research quantum computing applications",
  "agentId": "agent1",
  "agentName": "Research Agent",
  "agentRole": "researcher",
  "agentTools": ["search", "write", "browser"],
  "maxTransitions": 10
}
```

**Required:** `goal`  
**Defaults:** maxTransitions=10, agentRole="general", agentTools=["search","write","code","browser"]

**Response:** `200 OK`
```json
{
  "runId": "hermes-1718524800000",
  "status": "running",
  "goal": "Research quantum computing applications"
}
```

---

### POST /api/hermes/stop
Stop a running Hermes execution.

**Request Body:**
```json
{
  "runId": "hermes-1718524800000"
}
```

**Required:** `runId`

**Response:** `200 OK`
```json
{
  "success": true,
  "runId": "hermes-1718524800000"
}
```

---

### GET /api/hermes/state?runId={runId}
Get the current causal graph state, frontier, and event log.

**Query Parameters:**
- `runId` (required): Hermes run ID

**Response:** `200 OK`
```json
{
  "runId": "hermes-1718524800000",
  "status": "running",
  "graph": {
    "nodes": [
      {
        "id": "event_1",
        "type": "MODEL",
        "tier": "MODEL",
        "eventType": "AGENT_PROPOSED",
        "timestamp": "2026-06-16T06:00:00.000Z",
        "parents": [],
        "children": ["event_2"]
      }
    ],
    "edges": [
      {"source": "event_1", "target": "event_2"}
    ]
  },
  "frontier": {
    "eventIds": ["event_5", "event_6"],
    "visitedCount": 5,
    "visitableCount": 2,
    "totalEvents": 7
  },
  "events": [
    {
      "id": "event_1",
      "type": "AGENT_PROPOSED",
      "tier": "MODEL",
      "timestamp": "2026-06-16T06:00:00.000Z",
      "data": {...}
    }
  ],
  "config": {
    "goal": "Research quantum computing applications",
    "maxTransitions": 10
  }
}
```

---

## Provider Status

### GET /api/providers/status
Get AI LLM router status and telemetry (ε-Greedy Q-learning heatmap).

**Response:** `200 OK`
```json
{
  "providers": [
    {
      "name": "gemini-2.5-pro",
      "available": true,
      "avgLatency": 1200,
      "requestCount": 150,
      "errorRate": 0.02
    }
  ],
  "qTable": {
    "research": {"gemini-2.5-pro": 0.85, "gpt-4o": 0.82},
    "code": {"gemini-2.5-pro": 0.78, "gpt-4o": 0.88}
  },
  "epsilon": 0.1,
  "exploreCount": 15,
  "exploitCount": 135
}
```

---

## Error Responses

All endpoints return consistent error responses:

### 400 Bad Request
```json
{
  "error": "Validation error message"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error message"
}
```

---

## Rate Limiting
✅ Rate limiting active via Upstash Redis (with in-memory fallback for local development).
- API routes: 100 requests/minute per IP
- Agent execution/high-traffic routes: 10 requests/minute

---

## Pagination
For list endpoints that return large datasets, pagination will be added in Phase 7:
- Query parameters: `?page=1&limit=50`
- Response includes: `total`, `page`, `limit`, `hasMore`

---

## Versioning
Current version: **v1** (no version prefix in URL)  
Future versions will use: `/api/v2/...`

---

**Total Endpoints:** 49  
**Last Updated:** 2026-06-16  
**Status:** ✅ Complete documentation

