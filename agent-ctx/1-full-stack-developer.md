---
Task ID: 1
Agent: full-stack-developer
Task: Phase 1 - Team API routes and run route orchestration integration

Work Log:
- Created /src/app/api/team/create/route.ts — POST endpoint to create a team with optional agent linking, validates mode and agentIds, returns team with agents
- Created /src/app/api/team/list/route.ts — GET endpoint to list all teams with agent count and agent details, ordered by creation date descending
- Created /src/app/api/team/get/route.ts — GET endpoint to get a team by ID query param, returns team with full agent details
- Created /src/app/api/team/run/route.ts — POST endpoint to start team orchestration, builds TeamConfig via buildTeamConfig, creates AgentRun record, runs orchestrator asynchronously, emits orchestration_start/orchestration_complete/done events, handles errors and updates run status
- Created /src/app/api/team/stop/route.ts — POST endpoint to stop a team orchestration via getOrchestrator().stop(teamId)
- Created /src/app/api/team/update/route.ts — PATCH endpoint to update team config (name, mode, maxConcurrency, terminationType, terminationValue, sharedContext), re-links agents if agentIds provided
- Updated /src/app/api/agent/run/route.ts — Added orchestration support: if agent's orchestrationMode is not "single", uses buildTeamFromAgent and getOrchestrator().run() instead of runAgent; single mode preserves existing behavior; emits orchestration_start/orchestration_complete events for orchestrated runs
- Verified lint passes with 0 errors (only 2 pre-existing warnings in unrelated file)
- Verified database is in sync with Prisma schema

Stage Summary:
- All 6 team API endpoints operational (create, list, get, run, stop, update)
- Agent run route supports both single-agent (runAgent) and orchestrated modes (getOrchestrator)
- Team run route properly integrates with existing event system and orchestrator
- Proper error handling and DB status updates on all orchestration paths
